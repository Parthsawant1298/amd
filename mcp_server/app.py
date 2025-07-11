# mcp_server/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
import requests
import json
import threading

load_dotenv()

app = Flask(__name__)
CORS(app)

# Store active AI agents - using a thread-safe approach with persistence
AGENTS = {}
agents_lock = threading.Lock()

# Simple file-based persistence to survive server restarts
import json
import os

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
                json.dump(agents_data, f, indent=2)
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
                    agent = SimpleAIAgent(
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

class SimpleAIAgent:
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
        self.model = "meta-llama/llama-3.1-8b-instruct:free"
        
        self.system_prompt = f"""
You are {name}'s personal AI assistant. You can help with:
- Managing their Google Calendar
- Scheduling meetings
- Checking availability
- Calendar analysis
- General productivity tasks

User info:
- Name: {name}
- Email: {email}
- Timezone: {timezone}

Be helpful, professional, and proactive. If asked about calendar functionality and the calendar is not connected, remind the user to connect their Google Calendar first.
"""
        
        print(f"🤖 AI Agent created: {self.agent_id} for {name}")
    
    def chat(self, message):
        """Chat with the AI agent"""
        try:
            # Prepare messages
            messages = [
                {"role": "system", "content": self.system_prompt},
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
                return "Sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment."
                
        except requests.exceptions.Timeout:
            return "Sorry, my response is taking too long. Please try again."
        except Exception as e:
            print(f"Chat error: {e}")
            return "Sorry, I encountered an error while processing your message."
    
    def connect_calendar(self, calendar_credentials):
        """Connect Google Calendar via MCP"""
        try:
            # Store calendar credentials
            self.calendar_credentials = calendar_credentials
            self.calendar_connected = True
            self.status = "calendar_connected"
            
            print(f"📅 Calendar connected for {self.agent_id}")
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
            agent = SimpleAIAgent(user_id, name, email, timezone)
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
        agent = SimpleAIAgent(user_id, name, email, timezone)
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
        
        # Handle calendar-related queries
        if any(keyword in message.lower() for keyword in ['calendar', 'meeting', 'schedule', 'appointment']):
            if agent.calendar_connected:
                response = agent.chat(message + "\n\nNote: I have access to your calendar and can help with scheduling.")
            else:
                response = "I'd love to help with your calendar! Please connect your Google Calendar first from your dashboard so I can access your events and help you schedule meetings."
        else:
            response = agent.chat(message)
        
        return jsonify({
            'success': True,
            'response': response,
            'agentId': agent.agent_id
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
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
            'openrouter_configured': bool(os.getenv('OPENROUTER_API_KEY'))
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
    print("🚀 Starting Flask MCP Server...")
    print(f"🔑 OpenRouter API Key: {'✅ Set' if os.getenv('OPENROUTER_API_KEY') else '❌ Missing'}")
    
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