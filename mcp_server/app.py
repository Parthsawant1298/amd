# mcp_server/app.py - SMART AI CALENDAR
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
from dateutil import parser
import pytz
import pymongo
from bson import ObjectId

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise Exception("MONGODB_URI environment variable is required")

mongo_client = pymongo.MongoClient(MONGODB_URI)
db = mongo_client.get_database()
users_collection = db.users

# Store active AI agents in memory
AGENTS = {}
agents_lock = threading.Lock()

def get_user_by_id(user_id):
    """Get user from MongoDB directly"""
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if user:
            user['id'] = str(user['_id'])
            return user
        return None
    except Exception as e:
        print(f"Error getting user by ID: {e}")
        return None

class SmartCalendarAI:
    def __init__(self, user_data):
        self.user_id = str(user_data['id'])
        self.name = user_data['name']
        self.email = user_data['email']
        self.timezone = user_data['timezone']
        
        if user_data.get('aiAgent', {}).get('agentId'):
            self.agent_id = user_data['aiAgent']['agentId']
        else:
            self.agent_id = f"agent_{self.user_id}_{uuid.uuid4().hex[:8]}"
        
        self.status = user_data.get('aiAgent', {}).get('status', 'created')
        self.calendar_connected = user_data['googleCalendar'].get('connected', False)
        
        # Get calendar credentials
        self.calendar_credentials = None
        if self.calendar_connected:
            google_cal = user_data.get('googleCalendar', {})
            if google_cal.get('accessToken') and google_cal.get('refreshToken'):
                self.calendar_credentials = {
                    'accessToken': google_cal['accessToken'],
                    'refreshToken': google_cal['refreshToken']
                }
        
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY')
        self.model = "google/gemini-flash-1.5"
        
        print(f"🧠 Smart Calendar AI loaded for {self.name}")
    
    def get_calendar_service(self):
        """Get Google Calendar service"""
        if not self.calendar_connected or not self.calendar_credentials:
            return None
        
        try:
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
            
            return build('calendar', 'v3', credentials=creds)
        except Exception as e:
            print(f"Calendar service error: {e}")
            return None
    
    def execute_calendar_action(self, action_data):
        """Execute the calendar action from AI analysis"""
        service = self.get_calendar_service()
        if not service:
            return "❌ Calendar not connected"
        
        try:
            action = action_data.get('action')
            
            if action == 'create_event':
                title = action_data.get('title', 'New Event')
                start_time = action_data.get('start_time')
                duration = action_data.get('duration', 1)
                description = action_data.get('description', '')
                
                # Parse start time
                if isinstance(start_time, str):
                    user_tz = pytz.timezone(self.timezone)
                    try:
                        dt = parser.parse(start_time, fuzzy=True)
                        if dt.tzinfo is None:
                            dt = user_tz.localize(dt)
                        start_time = dt
                    except:
                        start_time = datetime.now(user_tz) + timedelta(hours=1)
                
                end_time = start_time + timedelta(hours=duration)
                
                event = {
                    'summary': title,
                    'description': description,
                    'start': {
                        'dateTime': start_time.isoformat(),
                        'timeZone': self.timezone,
                    },
                    'end': {
                        'dateTime': end_time.isoformat(),
                        'timeZone': self.timezone,
                    },
                }
                
                created_event = service.events().insert(calendarId='primary', body=event).execute()
                return f"✅ Created '{title}' for {start_time.strftime('%B %d at %I:%M %p')}"
            
            elif action == 'list_events':
                days = action_data.get('days', 7)
                now = datetime.utcnow()
                time_max = now + timedelta(days=days)
                
                events_result = service.events().list(
                    calendarId='primary',
                    timeMin=now.isoformat() + 'Z',
                    timeMax=time_max.isoformat() + 'Z',
                    maxResults=20,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                if events:
                    response = "📅 **Your upcoming events:**\n\n"
                    for event in events:
                        start = event['start'].get('dateTime', event['start'].get('date'))
                        title = event.get('summary', 'No Title')
                        try:
                            if 'T' in start:
                                dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                                time_str = dt.strftime("%b %d at %I:%M %p")
                            else:
                                dt = datetime.fromisoformat(start)
                                time_str = dt.strftime("%b %d")
                        except:
                            time_str = start
                        response += f"• **{title}** - {time_str}\n"
                    return response
                else:
                    return "📅 No upcoming events found."
            
            elif action == 'delete_event':
                search_query = action_data.get('search_query', '')
                
                # Search for events to delete
                events_result = service.events().list(
                    calendarId='primary',
                    q=search_query,
                    maxResults=10,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                if events:
                    event = events[0]  # Delete first match
                    title = event.get('summary', 'Unknown Event')
                    service.events().delete(calendarId='primary', eventId=event['id']).execute()
                    return f"🗑️ Deleted '{title}'"
                else:
                    return f"🔍 No events found matching '{search_query}'"
            
            elif action == 'search_events':
                query = action_data.get('query', '')
                days_range = action_data.get('days_range', 30)
                
                now = datetime.utcnow()
                time_min = now - timedelta(days=days_range)
                time_max = now + timedelta(days=days_range)
                
                events_result = service.events().list(
                    calendarId='primary',
                    timeMin=time_min.isoformat() + 'Z',
                    timeMax=time_max.isoformat() + 'Z',
                    q=query,
                    maxResults=10,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                if events:
                    response = f"🔍 **Found {len(events)} events matching '{query}':**\n\n"
                    for event in events:
                        start = event['start'].get('dateTime', event['start'].get('date'))
                        title = event.get('summary', 'No Title')
                        response += f"• **{title}** - {start}\n"
                    return response
                else:
                    return f"🔍 No events found matching '{query}'"
            
            else:
                return f"❌ Unknown action: {action}"
                
        except Exception as e:
            print(f"Calendar action error: {e}")
            return f"❌ Failed to execute calendar action: {str(e)}"
    
    def analyze_with_ai(self, user_message):
        """Use AI to analyze user intent and extract calendar action"""
        
        analysis_prompt = f"""You are a smart calendar assistant AI. Analyze the user's message and extract the calendar action they want.

User timezone: {self.timezone}
Current time: {datetime.now().strftime('%Y-%m-%d %H:%M')}

RESPOND ONLY WITH VALID JSON in this exact format:

For CREATE requests:
{{"action": "create_event", "title": "Meeting Title", "start_time": "2025-07-12 14:00", "duration": 1, "description": "Optional description"}}

For LIST/VIEW requests:
{{"action": "list_events", "days": 7}}

For DELETE requests:
{{"action": "delete_event", "search_query": "meeting keywords"}}

For SEARCH requests:
{{"action": "search_events", "query": "search terms", "days_range": 30}}

Parse dates intelligently:
- "tomorrow" = {(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}
- "next week" = {(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')}
- "today at 3 PM" = {datetime.now().strftime('%Y-%m-%d')} 15:00

User message: "{user_message}"

Respond with ONLY the JSON, no other text:"""

        try:
            headers = {
                "Authorization": f"Bearer {self.openrouter_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [{"role": "user", "content": analysis_prompt}],
                "temperature": 0.1,
                "max_tokens": 200
            }
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['choices'][0]['message']['content'].strip()
                
                # Extract JSON from response
                try:
                    # Remove any markdown formatting
                    if '```' in ai_response:
                        ai_response = ai_response.split('```')[1]
                        if ai_response.startswith('json'):
                            ai_response = ai_response[4:]
                    
                    action_data = json.loads(ai_response)
                    return action_data
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    print(f"AI response: {ai_response}")
                    return None
            else:
                print(f"OpenRouter error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"AI analysis error: {e}")
            return None
    
    def chat(self, message):
        """Main chat interface - AI analyzes then executes"""
        if not self.calendar_connected:
            return "❌ Please connect your Google Calendar first to use calendar features."
        
        try:
            # Step 1: AI analyzes the user's intent
            action_data = self.analyze_with_ai(message)
            
            if action_data:
                # Step 2: Execute the calendar action
                result = self.execute_calendar_action(action_data)
                return result
            else:
                # Fallback: Simple AI chat
                return "I couldn't understand that calendar request. Could you try rephrasing it? For example: 'Schedule a meeting tomorrow at 2 PM' or 'What do I have this week?'"
                
        except Exception as e:
            print(f"Chat error: {e}")
            return "I encountered an error. Please try again."
    
    def to_dict(self):
        """Convert agent to dictionary"""
        return {
            'agentId': self.agent_id,
            'userId': self.user_id,
            'name': self.name,
            'email': self.email,
            'timezone': self.timezone,
            'status': self.status,
            'calendarConnected': self.calendar_connected,
            'createdAt': self.created_at if hasattr(self, 'created_at') else datetime.now().isoformat()
        }

def get_or_create_agent(user_id):
    """Get existing agent or create new one"""
    with agents_lock:
        if user_id in AGENTS:
            return AGENTS[user_id]
        
        user_data = get_user_by_id(user_id)
        if user_data:
            agent = SmartCalendarAI(user_data)
            AGENTS[user_id] = agent
            return agent
        
        return None

@app.route('/create-agent', methods=['POST'])
def create_agent():
    """Create AI agent"""
    try:
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Missing userId'}), 400
        
        agent = get_or_create_agent(user_id)
        
        if agent:
            return jsonify({
                'success': True,
                'agentId': agent.agent_id,
                'message': f'Smart Calendar AI ready for {agent.name}'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create agent'}), 500
        
    except Exception as e:
        print(f"Error creating agent: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat_with_agent():
    """Chat with AI agent"""
    try:
        data = request.json
        user_id = data.get('userId')
        message = data.get('message')
        
        if not user_id or not message:
            return jsonify({'success': False, 'error': 'Missing userId or message'}), 400
        
        # Get fresh user data
        user_data = get_user_by_id(user_id)
        if user_data:
            agent = SmartCalendarAI(user_data)
            AGENTS[user_id] = agent
            
            response = agent.chat(message)
            
            return jsonify({
                'success': True,
                'response': response,
                'agentId': agent.agent_id
            })
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'success': False, 'error': 'Failed to process message'}), 500

@app.route('/connect-calendar', methods=['POST'])
def connect_calendar():
    """Connect Google Calendar"""
    try:
        data = request.json
        user_id = data.get('userId')
        calendar_credentials = data.get('credentials')
        
        if not user_id or not calendar_credentials:
            return jsonify({'success': False, 'error': 'Missing data'}), 400
        
        with agents_lock:
            if user_id in AGENTS:
                agent = AGENTS[user_id]
                agent.calendar_credentials = calendar_credentials
                agent.calendar_connected = True
                
                return jsonify({
                    'success': True,
                    'message': 'Smart Calendar AI activated!'
                })
        
        return jsonify({'success': False, 'error': 'Agent not found'}), 404
            
    except Exception as e:
        print(f"Calendar connection error: {e}")
        return jsonify({'success': False, 'error': 'Failed to connect calendar'}), 500

@app.route('/agent-status/<user_id>', methods=['GET'])
def get_agent_status(user_id):
    """Get agent status"""
    try:
        user_data = get_user_by_id(user_id)
        
        if user_data:
            agent = SmartCalendarAI(user_data)
            AGENTS[user_id] = agent
            
            return jsonify({
                'success': True,
                'agent': agent.to_dict()
            })
        
        return jsonify({'success': False, 'error': 'Agent not found'}), 404
        
    except Exception as e:
        print(f"Status error: {e}")
        return jsonify({'success': False, 'error': 'Failed to get status'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check"""
    try:
        with agents_lock:
            active_agents = len(AGENTS)
        
        try:
            users_collection.find_one()
            mongodb_status = "connected"
        except:
            mongodb_status = "disconnected"
        
        return jsonify({
            'status': 'healthy',
            'activeAgents': active_agents,
            'mongodb': mongodb_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

if __name__ == '__main__':
    print("🧠 Starting SMART Calendar AI...")
    print(f"🔑 OpenRouter: {'✅' if os.getenv('OPENROUTER_API_KEY') else '❌'}")
    print(f"📧 Google OAuth: {'✅' if os.getenv('GOOGLE_CLIENT_ID') else '❌'}")
    print(f"🗄️ MongoDB: {'✅' if os.getenv('MONGODB_URI') else '❌'}")
    
    print("\n🎯 HOW IT WORKS:")
    print("1. You type ANY calendar request")
    print("2. AI analyzes your intent")
    print("3. Executes calendar action")
    print("4. Confirms what it did")
    print("\n💬 EXAMPLE:")
    print("You: 'Schedule quarterly review with John next Tuesday 3 PM'")
    print("AI: ✅ Created 'Quarterly Review' for July 16 at 3:00 PM")
    print("\n🚀 NO FIXED PROMPTS - JUST TALK NATURALLY!")
    
    app.run(host='0.0.0.0', port=5000, debug=False)