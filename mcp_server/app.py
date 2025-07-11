# mcp_server/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime, timedelta
import requests
import json
import threading
import traceback
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

load_dotenv()

app = Flask(__name__)
CORS(app)

# Store active AI agents - using a thread-safe approach with persistence
AGENTS = {}
agents_lock = threading.Lock()

# Simple file-based persistence to survive server restarts
AGENTS_FILE = 'agents_data.json'

def save_agents_to_file():
    """Save agents to file for persistence"""
    try:
        with agents_lock:
            agents_data = {}
            for user_id, agent in AGENTS.items():
                agents_data[user_id] = {
                    'user_id': agent.user_id,
                    'name': agent.name,
                    'email': agent.email,
                    'timezone': agent.timezone,
                    'agent_id': agent.agent_id,
                    'status': agent.status,
                    'calendar_connected': agent.calendar_connected,
                    'created_at': agent.created_at,
                    'conversation_history': agent.conversation_history[-10:]  # Keep last 10 messages
                }
            
            with open(AGENTS_FILE, 'w') as f:
                json.dump(agents_data, f, indent=2, default=str)
            print(f"💾 Saved {len(agents_data)} agents to file")
    except Exception as e:
        print(f"Failed to save agents to file: {e}")

def load_agents_from_file():
    """Load agents from file on startup"""
    try:
        if os.path.exists(AGENTS_FILE):
            with open(AGENTS_FILE, 'r') as f:
                agents_data = json.load(f)
            
            with agents_lock:
                for user_id, data in agents_data.items():
                    agent = EnhancedAIAgent(
                        data['user_id'],
                        data['name'], 
                        data['email'],
                        data['timezone']
                    )
                    agent.agent_id = data['agent_id']
                    agent.status = data['status']
                    agent.calendar_connected = data['calendar_connected']
                    agent.created_at = data['created_at']
                    agent.conversation_history = data.get('conversation_history', [])
                    AGENTS[user_id] = agent
            
            print(f"📁 Loaded {len(agents_data)} agents from file")
            return True
    except Exception as e:
        print(f"Failed to load agents from file: {e}")
    return False

class EnhancedAIAgent:
    def __init__(self, user_id, name, email, timezone):
        self.agent_id = f"agent_{user_id}_{uuid.uuid4().hex[:8]}"
        self.user_id = user_id
        self.name = name
        self.email = email
        self.timezone = timezone
        self.status = "created"
        self.calendar_connected = False
        self.calendar_credentials = None
        self.conversation_history = []
        self.created_at = datetime.now().isoformat()
        
        # OpenRouter configuration
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY')
        self.model = "google/gemini-flash-1.5"
        
        self.system_prompt = f"""
You are {name}'s personal AI assistant. You can help with:

📅 CALENDAR MANAGEMENT:
- Checking calendar events and availability
- Scheduling new meetings
- Rescheduling existing events
- Finding free time slots
- Calendar analysis and insights

🎯 PRODUCTIVITY TASKS:
- Task organization and reminders
- Time management advice
- Meeting preparation
- Follow-up tracking

👤 USER INFO:
- Name: {name}
- Email: {email}
- Timezone: {timezone}

IMPORTANT GUIDELINES:
- Be helpful, professional, and proactive
- Always confirm details before creating calendar events
- If calendar isn't connected, guide user to connect it first
- Keep responses concise but informative
- Use emojis sparingly for better readability

Current calendar status: {"✅ Connected" if self.calendar_connected else "❌ Not Connected"}
"""
        
        print(f"🤖 AI Agent created: {self.agent_id} for {name}")
    
    def get_calendar_events(self, days_ahead=7):
        """Get upcoming calendar events"""
        if not self.calendar_connected or not self.calendar_credentials:
            return []
        
        try:
            # Build calendar service
            creds = Credentials(
                token=self.calendar_credentials.get('accessToken'),
                refresh_token=self.calendar_credentials.get('refreshToken'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=os.getenv('GOOGLE_CLIENT_ID'),
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET')
            )
            
            # Refresh token if needed
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                # Update stored credentials
                self.calendar_credentials['accessToken'] = creds.token
            
            service = build('calendar', 'v3', credentials=creds)
            
            # Get events for the next week
            now = datetime.utcnow()
            time_max = now + timedelta(days=days_ahead)
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=now.isoformat() + 'Z',
                timeMax=time_max.isoformat() + 'Z',
                maxResults=20,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            return events
            
        except Exception as e:
            print(f"Calendar error: {e}")
            return []
    
    def create_calendar_event(self, title, start_time, end_time, description=None):
        """Create a new calendar event"""
        if not self.calendar_connected or not self.calendar_credentials:
            return False, "Calendar not connected"
        
        try:
            # Build calendar service
            creds = Credentials(
                token=self.calendar_credentials.get('accessToken'),
                refresh_token=self.calendar_credentials.get('refreshToken'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=os.getenv('GOOGLE_CLIENT_ID'),
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET')
            )
            
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                self.calendar_credentials['accessToken'] = creds.token
            
            service = build('calendar', 'v3', credentials=creds)
            
            event = {
                'summary': title,
                'description': description or f'Created by AI Assistant for {self.name}',
                'start': {
                    'dateTime': start_time,
                    'timeZone': self.timezone,
                },
                'end': {
                    'dateTime': end_time,
                    'timeZone': self.timezone,
                },
            }
            
            event = service.events().insert(calendarId='primary', body=event).execute()
            return True, f"Event created: {event.get('htmlLink')}"
            
        except Exception as e:
            print(f"Calendar event creation error: {e}")
            return False, f"Failed to create event: {str(e)}"
    
    def chat(self, message):
        """Chat with the AI agent"""
        try:
            # Handle calendar-specific queries
            calendar_context = ""
            if any(keyword in message.lower() for keyword in ['calendar', 'meeting', 'schedule', 'appointment', 'free', 'busy', 'available']):
                if self.calendar_connected:
                    events = self.get_calendar_events()
                    if events:
                        calendar_context = f"\n\nCURRENT CALENDAR EVENTS:\n"
                        for event in events[:5]:  # Show next 5 events
                            start = event['start'].get('dateTime', event['start'].get('date'))
                            calendar_context += f"- {event.get('summary', 'No title')}: {start}\n"
                    else:
                        calendar_context = "\n\nYour calendar appears to be free for the next week."
                else:
                    calendar_context = "\n\nNOTE: Calendar not connected. Please connect your Google Calendar to access schedule information."
            
            # Prepare messages
            messages = [
                {"role": "system", "content": self.system_prompt + calendar_context},
                *self.conversation_history[-10:],  # Keep last 10 messages
                {"role": "user", "content": message}
            ]
            
            # Call OpenRouter
            headers = {
                "Authorization": f"Bearer {self.openrouter_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                
                # Save conversation
                self.conversation_history.extend([
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": ai_response}
                ])
                
                # Keep conversation history manageable
                if len(self.conversation_history) > 20:
                    self.conversation_history = self.conversation_history[-20:]
                
                # Auto-save to file after chat
                try:
                    save_agents_to_file()
                except:
                    pass  # Don't fail chat if save fails
                
                return ai_response
            else:
                print(f"OpenRouter API error: {response.status_code} - {response.text}")
                return "I'm experiencing some technical difficulties right now. Please try again in a moment."
                
        except requests.exceptions.Timeout:
            return "My response is taking longer than expected. Please try again."
        except Exception as e:
            print(f"Chat error: {e}")
            print(traceback.format_exc())
            return "I encountered an error while processing your message. Please try again."
    
    def connect_calendar(self, calendar_credentials):
        """Connect Google Calendar via MCP"""
        try:
            # Store calendar credentials
            self.calendar_credentials = calendar_credentials
            self.calendar_connected = True
            self.status = "calendar_connected"
            
            # Test the connection by trying to fetch events
            try:
                events = self.get_calendar_events(1)  # Just check 1 day ahead
                print(f"📅 Calendar connected for {self.agent_id} - Found {len(events)} upcoming events")
            except Exception as e:
                print(f"Calendar connection test failed: {e}")
            
            return True
        except Exception as e:
            print(f"Calendar connection error: {e}")
            return False
    
    def to_dict(self):
        """Convert agent to dictionary for JSON serialization"""
        return {
            'agentId': self.agent_id,
            'userId': self.user_id,
            'name': self.name,
            'email': self.email,
            'timezone': self.timezone,
            'status': self.status,
            'calendarConnected': self.calendar_connected,
            'conversationLength': len(self.conversation_history),
            'createdAt': self.created_at
        }

def get_or_create_agent(user_id, name=None, email=None, timezone=None):
    """Get existing agent or create new one if not exists"""
    with agents_lock:
        if user_id in AGENTS:
            return AGENTS[user_id]
        elif name and email and timezone:
            # Create new agent
            agent = EnhancedAIAgent(user_id, name, email, timezone)
            AGENTS[user_id] = agent
            return agent
        else:
            return None

@app.route('/create-agent', methods=['POST'])
def create_agent():
    """Create AI agent for employee"""
    try:
        data = request.json
        user_id = data.get('userId')
        name = data.get('name')
        email = data.get('email')
        timezone = data.get('timezone')
        
        if not all([user_id, name, email, timezone]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: userId, name, email, timezone'
            }), 400
        
        # Check if agent already exists
        with agents_lock:
            if user_id in AGENTS:
                agent = AGENTS[user_id]
                return jsonify({
                    'success': True,
                    'agentId': agent.agent_id,
                    'status': agent.status,
                    'message': f'AI Agent already exists for {name}'
                })
        
        # Create new agent
        agent = EnhancedAIAgent(user_id, name, email, timezone)
        with agents_lock:
            AGENTS[user_id] = agent
        
        # Save to file for persistence
        save_agents_to_file()
        
        return jsonify({
            'success': True,
            'agentId': agent.agent_id,
            'status': agent.status,
            'message': f'AI Agent created for {name}'
        })
        
    except Exception as e:
        print(f"Error creating agent: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/chat', methods=['POST'])
def chat_with_agent():
    """Chat with employee's AI agent"""
    try:
        data = request.json
        user_id = data.get('userId')
        message = data.get('message')
        
        if not user_id or not message:
            return jsonify({
                'success': False,
                'error': 'Missing userId or message'
            }), 400
        
        # Get or try to find agent
        with agents_lock:
            agent = AGENTS.get(user_id)
        
        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found. Please ensure your AI agent is created first.'
            }), 404
        
        response = agent.chat(message)
        
        return jsonify({
            'success': True,
            'response': response,
            'agentId': agent.agent_id
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Failed to process chat message'
        }), 500

@app.route('/connect-calendar', methods=['POST'])
def connect_calendar():
    """Connect Google Calendar to employee's agent"""
    try:
        data = request.json
        user_id = data.get('userId')
        calendar_credentials = data.get('credentials')
        
        if not user_id or not calendar_credentials:
            return jsonify({
                'success': False,
                'error': 'Missing userId or credentials'
            }), 400
        
        # Get agent
        with agents_lock:
            agent = AGENTS.get(user_id)
        
        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found. Please ensure your AI agent is created first.'
            }), 404
        
        success = agent.connect_calendar(calendar_credentials)
        
        if success:
            # Save to file for persistence
            save_agents_to_file()
            
            return jsonify({
                'success': True,
                'message': 'Calendar connected successfully',
                'status': agent.status
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to connect calendar'
            }), 500
            
    except Exception as e:
        print(f"Calendar connection error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Failed to connect calendar'
        }), 500

@app.route('/agent-status/<user_id>', methods=['GET'])
def get_agent_status(user_id):
    """Get agent status for employee"""
    try:
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Missing user ID'
            }), 400
        
        # Get agent
        with agents_lock:
            agent = AGENTS.get(user_id)
        
        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found',
                'agent': None
            }), 404
        
        return jsonify({
            'success': True,
            'agent': agent.to_dict()
        })
        
    except Exception as e:
        print(f"Status error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get agent status'
        }), 500

@app.route('/disconnect-calendar', methods=['POST'])
def disconnect_calendar():
    """Disconnect Google Calendar from employee's agent"""
    try:
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Missing userId'
            }), 400
        
        # Get agent
        with agents_lock:
            agent = AGENTS.get(user_id)
        
        if not agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404
        
        # Disconnect calendar
        agent.calendar_credentials = None
        agent.calendar_connected = False
        agent.status = "created"
        
        # Save to file for persistence
        save_agents_to_file()
        
        print(f"📅 Calendar disconnected for {agent.agent_id}")
        
        return jsonify({
            'success': True,
            'message': 'Calendar disconnected successfully',
            'status': agent.status
        })
        
    except Exception as e:
        print(f"Calendar disconnection error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Failed to disconnect calendar'
        }), 500

@app.route('/agents', methods=['GET'])
def list_agents():
    """List all active agents"""
    try:
        with agents_lock:
            agents_list = [agent.to_dict() for agent in AGENTS.values()]
        
        return jsonify({
            'success': True,
            'agents': agents_list,
            'count': len(agents_list)
        })
        
    except Exception as e:
        print(f"List agents error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to list agents'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        with agents_lock:
            active_agents = len(AGENTS)
            agent_statuses = {}
            for user_id, agent in AGENTS.items():
                agent_statuses[user_id] = {
                    'status': agent.status,
                    'calendar_connected': agent.calendar_connected
                }
        
        return jsonify({
            'status': 'healthy',
            'activeAgents': active_agents,
            'agentStatuses': agent_statuses,
            'timestamp': datetime.now().isoformat(),
            'openrouter_configured': bool(os.getenv('OPENROUTER_API_KEY')),
            'google_oauth_configured': bool(os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET'))
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(405)
def method_not_allowed_error(error):
    return jsonify({
        'success': False,
        'error': 'Method not allowed'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("🚀 Starting Enhanced Flask MCP Server...")
    print(f"🔑 OpenRouter API Key: {'✅ Set' if os.getenv('OPENROUTER_API_KEY') else '❌ Missing'}")
    print(f"📧 Google OAuth: {'✅ Configured' if os.getenv('GOOGLE_CLIENT_ID') else '❌ Missing'}")
    
    # Load existing agents from file
    load_agents_from_file()
    
    print("📋 Available endpoints:")
    print("  POST /create-agent - Create new AI agent")
    print("  POST /chat - Chat with AI agent")
    print("  POST /connect-calendar - Connect calendar to agent")
    print("  GET /agent-status/<user_id> - Get agent status")
    print("  GET /agents - List all agents")
    print("  GET /health - Health check")
    
    app.run(host='0.0.0.0', port=5000, debug=True)