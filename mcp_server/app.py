# mcp_server/app.py - ENHANCED WITH BOSS AI AGENT & A2A COMMUNICATION
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
bosses_collection = db.bosses

# Store active AI agents in memory
AGENTS = {}  # Employee agents
BOSS_AGENTS = {}  # Boss agents
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

def get_boss_by_id(boss_id):
    """Get boss from MongoDB directly"""
    try:
        boss = bosses_collection.find_one({'_id': ObjectId(boss_id)})
        if boss:
            boss['id'] = str(boss['_id'])
            return boss
        return None
    except Exception as e:
        print(f"Error getting boss by ID: {e}")
        return None

def get_all_users_with_timezone():
    """Get all users with their timezones for boss agent filtering"""
    try:
        users = list(users_collection.find({}, {'_id': 1, 'name': 1, 'email': 1, 'timezone': 1, 'aiAgent': 1}))
        for user in users:
            user['id'] = str(user['_id'])
        return users
    except Exception as e:
        print(f"Error getting users: {e}")
        return []

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
            
            elif action == 'check_availability':
                # Check if employee is free at specific time
                check_time = action_data.get('check_time')
                duration = action_data.get('duration', 1)
                
                if isinstance(check_time, str):
                    user_tz = pytz.timezone(self.timezone)
                    try:
                        dt = parser.parse(check_time, fuzzy=True)
                        if dt.tzinfo is None:
                            dt = user_tz.localize(dt)
                        check_time = dt
                    except:
                        return "❌ Invalid time format"
                
                end_time = check_time + timedelta(hours=duration)
                
                events_result = service.events().list(
                    calendarId='primary',
                    timeMin=check_time.isoformat(),
                    timeMax=end_time.isoformat(),
                    singleEvents=True
                ).execute()
                
                events = events_result.get('items', [])
                if events:
                    return f"BUSY - {len(events)} conflicts found"
                else:
                    return "FREE - Available"
            
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

For AVAILABILITY CHECK (from boss):
{{"action": "check_availability", "check_time": "2025-07-12 14:00", "duration": 1}}

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

class BossAI:
    """Boss AI Agent for team management"""
    def __init__(self, boss_data):
        self.boss_id = str(boss_data['id'])
        self.name = boss_data['name']
        self.email = boss_data['email']
        self.timezone = boss_data['timezone']
        self.company = boss_data['company']
        self.position = boss_data['position']
        
        if boss_data.get('bossAgent', {}).get('agentId'):
            self.agent_id = boss_data['bossAgent']['agentId']
        else:
            self.agent_id = f"boss_agent_{self.boss_id}_{uuid.uuid4().hex[:8]}"
        
        self.status = boss_data.get('bossAgent', {}).get('status', 'created')
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY')
        self.model = "google/gemini-flash-1.5"
        
        print(f"👑 Boss AI loaded for {self.name} at {self.company}")
    
    def get_timezone_category(self, timezone_str):
        """Determine if timezone is day/night based on current time"""
        try:
            tz = pytz.timezone(timezone_str)
            current_time = datetime.now(tz)
            hour = current_time.hour
            
            # Simple day/night logic
            if 6 <= hour <= 18:
                return "day"
            else:
                return "night"
        except:
            return "day"  # Default to day
    
    def filter_employees_by_timezone(self, required_time_str):
        """Filter employees based on timezone requirements"""
        try:
            # Parse the required time to determine if it's day or night
            dt = parser.parse(required_time_str, fuzzy=True)
            hour = dt.hour
            
            if 6 <= hour <= 18:
                required_category = "day"
            else:
                required_category = "night"
            
            # Get all users
            all_users = get_all_users_with_timezone()
            
            # Filter by timezone category
            suitable_employees = []
            for user in all_users:
                if user.get('aiAgent', {}).get('status') == 'calendar_connected':
                    user_category = self.get_timezone_category(user['timezone'])
                    if user_category == required_category:
                        suitable_employees.append(user)
            
            return suitable_employees
        except Exception as e:
            print(f"Timezone filtering error: {e}")
            return []
    
    def send_a2a_message(self, employee_user_id, message):
        """Send A2A message to employee agent"""
        try:
            # Get fresh user data
            user_data = get_user_by_id(employee_user_id)
            if not user_data:
                return "Employee not found"
            
            # Create/get employee agent
            if employee_user_id not in AGENTS:
                agent = SmartCalendarAI(user_data)
                AGENTS[employee_user_id] = agent
            else:
                agent = AGENTS[employee_user_id]
            
            # Send message to employee agent
            response = agent.chat(message)
            return response
        except Exception as e:
            print(f"A2A message error: {e}")
            return f"Error communicating with employee: {str(e)}"
    
    def analyze_boss_request(self, message):
        """Analyze boss request using AI"""
        analysis_prompt = f"""You are a Boss AI assistant. Analyze the boss's request and determine the action needed.

Boss: {self.name} at {self.company}
Boss timezone: {self.timezone}
Current time: {datetime.now().strftime('%Y-%m-%d %H:%M')}

RESPOND ONLY WITH VALID JSON:

For TASK ASSIGNMENT requests:
{{"action": "assign_task", "task_title": "Task description", "target_time": "2025-07-12 14:00", "duration": 1}}

For TEAM STATUS requests:
{{"action": "team_status"}}

For EMPLOYEE AVAILABILITY requests:
{{"action": "check_team_availability", "target_time": "2025-07-12 14:00", "duration": 1}}

Boss message: "{message}"

Respond with ONLY the JSON:"""

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
                
                try:
                    if '```' in ai_response:
                        ai_response = ai_response.split('```')[1]
                        if ai_response.startswith('json'):
                            ai_response = ai_response[4:]
                    
                    action_data = json.loads(ai_response)
                    return action_data
                except json.JSONDecodeError as e:
                    print(f"Boss JSON decode error: {e}")
                    return None
            else:
                print(f"Boss OpenRouter error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Boss AI analysis error: {e}")
            return None
    
    def execute_boss_action(self, action_data):
        """Execute boss action through A2A communication"""
        try:
            action = action_data.get('action')
            
            if action == 'assign_task':
                task_title = action_data.get('task_title', 'New Task')
                target_time = action_data.get('target_time')
                duration = action_data.get('duration', 1)
                
                # Step 1: Filter employees by timezone
                suitable_employees = self.filter_employees_by_timezone(target_time)
                
                if not suitable_employees:
                    return "❌ No employees available in the required timezone"
                
                # Step 2: Check availability of suitable employees
                available_employees = []
                for employee in suitable_employees:
                    check_message = f"Check availability for {target_time} duration {duration} hours"
                    response = self.send_a2a_message(employee['id'], check_message)
                    
                    if "FREE" in response:
                        available_employees.append(employee)
                
                if not available_employees:
                    return f"❌ All {len(suitable_employees)} employees in the required timezone are busy at {target_time}"
                
                # Step 3: Assign task to first available employee
                selected_employee = available_employees[0]
                assign_message = f"Create event '{task_title}' on {target_time} for {duration} hour(s) - Assigned by Boss {self.name}"
                
                response = self.send_a2a_message(selected_employee['id'], assign_message)
                
                return f"✅ Task assigned to {selected_employee['name']} ({selected_employee['email']})\n📅 {response}"
            
            elif action == 'team_status':
                all_users = get_all_users_with_timezone()
                
                if not all_users:
                    return "❌ No employees found"
                
                status_report = f"👥 **Team Status Report for {self.company}**\n\n"
                
                total_employees = len(all_users)
                active_agents = len([u for u in all_users if u.get('aiAgent', {}).get('status') == 'calendar_connected'])
                
                status_report += f"📊 **Overview:**\n"
                status_report += f"• Total Employees: {total_employees}\n"
                status_report += f"• Active AI Agents: {active_agents}\n"
                status_report += f"• Calendar Integration: {(active_agents/total_employees*100):.1f}%\n\n"
                
                status_report += f"📋 **Employee Details:**\n"
                for user in all_users:
                    agent_status = user.get('aiAgent', {}).get('status', 'not_created')
                    status_emoji = "✅" if agent_status == 'calendar_connected' else "⚠️"
                    status_report += f"{status_emoji} **{user['name']}** ({user['timezone']}) - {agent_status}\n"
                
                return status_report
            
            elif action == 'check_team_availability':
                target_time = action_data.get('target_time')
                duration = action_data.get('duration', 1)
                
                suitable_employees = self.filter_employees_by_timezone(target_time)
                
                if not suitable_employees:
                    return f"❌ No employees in suitable timezone for {target_time}"
                
                availability_report = f"📅 **Team Availability for {target_time}**\n\n"
                
                available_count = 0
                busy_count = 0
                
                for employee in suitable_employees:
                    check_message = f"Check availability for {target_time} duration {duration} hours"
                    response = self.send_a2a_message(employee['id'], check_message)
                    
                    if "FREE" in response:
                        availability_report += f"✅ **{employee['name']}** - Available\n"
                        available_count += 1
                    else:
                        availability_report += f"❌ **{employee['name']}** - Busy\n"
                        busy_count += 1
                
                availability_report += f"\n📊 **Summary:** {available_count} available, {busy_count} busy"
                return availability_report
            
            else:
                return f"❌ Unknown boss action: {action}"
                
        except Exception as e:
            print(f"Boss action error: {e}")
            return f"❌ Failed to execute boss action: {str(e)}"
    
    def chat(self, message):
        """Boss chat interface"""
        try:
            # Step 1: Analyze boss request
            action_data = self.analyze_boss_request(message)
            
            if action_data:
                # Step 2: Execute boss action
                result = self.execute_boss_action(action_data)
                return result
            else:
                return "I can help you with team management tasks. Try: 'Assign task at 2 PM tomorrow' or 'Check team status' or 'Who is available at 3 PM?'"
                
        except Exception as e:
            print(f"Boss chat error: {e}")
            return "I encountered an error. Please try again."
    
    def to_dict(self):
        """Convert boss agent to dictionary"""
        return {
            'agentId': self.agent_id,
            'bossId': self.boss_id,
            'name': self.name,
            'email': self.email,
            'company': self.company,
            'position': self.position,
            'timezone': self.timezone,
            'status': self.status,
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

def get_or_create_boss_agent(boss_id):
    """Get existing boss agent or create new one"""
    with agents_lock:
        if boss_id in BOSS_AGENTS:
            return BOSS_AGENTS[boss_id]
        
        boss_data = get_boss_by_id(boss_id)
        if boss_data:
            boss_agent = BossAI(boss_data)
            BOSS_AGENTS[boss_id] = boss_agent
            return boss_agent
        
        return None

# EMPLOYEE AGENT ROUTES
@app.route('/create-agent', methods=['POST'])
def create_agent():
    """Create AI agent for employee"""
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
    """Chat with employee AI agent"""
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

@app.route('/agent-status/<user_id>', methods=['GET'])
def get_agent_status(user_id):
    """Get employee agent status"""
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

# BOSS AGENT ROUTES
@app.route('/create-boss-agent', methods=['POST'])
def create_boss_agent():
    """Create AI agent for boss"""
    try:
        data = request.json
        boss_id = data.get('bossId')
        
        if not boss_id:
            return jsonify({'success': False, 'error': 'Missing bossId'}), 400
        
        boss_agent = get_or_create_boss_agent(boss_id)
        
        if boss_agent:
            return jsonify({
                'success': True,
                'agentId': boss_agent.agent_id,
                'message': f'Boss AI ready for {boss_agent.name} at {boss_agent.company}'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create boss agent'}), 500
        
    except Exception as e:
        print(f"Error creating boss agent: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/boss-chat', methods=['POST'])
def chat_with_boss_agent():
    """Chat with boss AI agent"""
    try:
        data = request.json
        boss_id = data.get('bossId')
        message = data.get('message')
        
        if not boss_id or not message:
            return jsonify({'success': False, 'error': 'Missing bossId or message'}), 400
        
        # Get fresh boss data
        boss_data = get_boss_by_id(boss_id)
        if boss_data:
            boss_agent = BossAI(boss_data)
            BOSS_AGENTS[boss_id] = boss_agent
            
            response = boss_agent.chat(message)
            
            return jsonify({
                'success': True,
                'response': response,
                'agentId': boss_agent.agent_id
            })
        else:
            return jsonify({'success': False, 'error': 'Boss not found'}), 404
        
    except Exception as e:
        print(f"Boss chat error: {e}")
        return jsonify({'success': False, 'error': 'Failed to process boss message'}), 500

@app.route('/boss-agent-status/<boss_id>', methods=['GET'])
def get_boss_agent_status(boss_id):
    """Get boss agent status"""
    try:
        boss_data = get_boss_by_id(boss_id)
        
        if boss_data:
            boss_agent = BossAI(boss_data)
            BOSS_AGENTS[boss_id] = boss_agent
            
            return jsonify({
                'success': True,
                'agent': boss_agent.to_dict()
            })
        
        return jsonify({'success': False, 'error': 'Boss agent not found'}), 404
        
    except Exception as e:
        print(f"Boss status error: {e}")
        return jsonify({'success': False, 'error': 'Failed to get boss status'}), 500

# SHARED ROUTES
@app.route('/connect-calendar', methods=['POST'])
def connect_calendar():
    """Connect Google Calendar for employee"""
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

@app.route('/disconnect-calendar', methods=['POST'])
def disconnect_calendar():
    """Disconnect Google Calendar for employee"""
    try:
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'Missing userId'}), 400
        
        with agents_lock:
            if user_id in AGENTS:
                agent = AGENTS[user_id]
                agent.calendar_credentials = None
                agent.calendar_connected = False
                
                return jsonify({
                    'success': True,
                    'message': 'Calendar disconnected'
                })
        
        return jsonify({'success': True, 'message': 'Calendar disconnected (agent not found)'}), 200
            
    except Exception as e:
        print(f"Calendar disconnection error: {e}")
        return jsonify({'success': False, 'error': 'Failed to disconnect calendar'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check"""
    try:
        with agents_lock:
            active_agents = len(AGENTS)
            active_boss_agents = len(BOSS_AGENTS)
        
        try:
            users_collection.find_one()
            bosses_collection.find_one()
            mongodb_status = "connected"
        except:
            mongodb_status = "disconnected"
        
        return jsonify({
            'status': 'healthy',
            'activeEmployeeAgents': active_agents,
            'activeBossAgents': active_boss_agents,
            'mongodb': mongodb_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/a2a-test', methods=['POST'])
def test_a2a_communication():
    """Test A2A communication between boss and employee agents"""
    try:
        data = request.json
        boss_id = data.get('bossId')
        employee_id = data.get('employeeId')
        test_message = data.get('message', 'Check availability for tomorrow at 2 PM')
        
        if not boss_id or not employee_id:
            return jsonify({'success': False, 'error': 'Missing bossId or employeeId'}), 400
        
        # Get boss agent
        boss_agent = get_or_create_boss_agent(boss_id)
        if not boss_agent:
            return jsonify({'success': False, 'error': 'Boss agent not found'}), 404
        
        # Send A2A message
        response = boss_agent.send_a2a_message(employee_id, test_message)
        
        return jsonify({
            'success': True,
            'boss_agent': boss_agent.name,
            'employee_response': response,
            'test_message': test_message
        })
        
    except Exception as e:
        print(f"A2A test error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🧠 Starting ENHANCED MCP Server with Boss AI & A2A Communication...")
    print(f"🔑 OpenRouter: {'✅' if os.getenv('OPENROUTER_API_KEY') else '❌'}")
    print(f"📧 Google OAuth: {'✅' if os.getenv('GOOGLE_CLIENT_ID') else '❌'}")
    print(f"🗄️ MongoDB: {'✅' if os.getenv('MONGODB_URI') else '❌'}")
    
    print("\n👑 BOSS AI FEATURES:")
    print("1. Boss gives command: 'Assign task at 2 PM tomorrow'")
    print("2. Boss AI filters employees by timezone")
    print("3. Checks availability via A2A with employee agents")
    print("4. Assigns task to available employee")
    print("5. Employee agent creates calendar event")
    
    print("\n🤖 EMPLOYEE AI FEATURES:")
    print("1. Natural language calendar management")
    print("2. A2A communication with Boss AI")
    print("3. Availability checking")
    print("4. Automatic task assignment")
    
    print("\n🔄 A2A COMMUNICATION FLOW:")
    print("Boss AI ↔ Employee AI Agents")
    print("- Timezone filtering")
    print("- Availability checking") 
    print("- Task assignment")
    print("- Calendar integration")
    
    app.run(host='0.0.0.0', port=5000, debug=False)