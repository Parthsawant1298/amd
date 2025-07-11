# mcp_server/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

# Store active AI agents
AGENTS = {}

class SimpleAIAgent:
    def __init__(self, user_id, name, email, timezone):
        self.agent_id = f"agent_{user_id}_{uuid.uuid4().hex[:8]}"
        self.user_id = user_id
        self.name = name
        self.email = email
        self.timezone = timezone
        self.status = "created"
        self.calendar_connected = False
        self.conversation_history = []
        
        # OpenRouter configuration
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY')
        self.model = "meta-llama/llama-3.1-8b-instruct:free"
        
        self.system_prompt = f"""
You are {name}'s personal AI assistant. You can help with:
- Managing their Google Calendar
- Scheduling meetings
- Checking availability
- Calendar analysis

User info:
- Name: {name}
- Email: {email}
- Timezone: {timezone}

Be helpful, professional, and proactive.
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
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                
                # Save conversation
                self.conversation_history.extend([
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": ai_response}
                ])
                
                return ai_response
            else:
                return "Sorry, I'm having trouble connecting right now."
                
        except Exception as e:
            print(f"Chat error: {e}")
            return "Sorry, I encountered an error."
    
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

@app.route('/create-agent', methods=['POST'])
def create_agent():
    """Create AI agent for employee"""
    try:
        data = request.json
        user_id = data['userId']
        name = data['name']
        email = data['email']
        timezone = data['timezone']
        
        # Create agent
        agent = SimpleAIAgent(user_id, name, email, timezone)
        AGENTS[user_id] = agent
        
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
        user_id = data['userId']
        message = data['message']
        
        if user_id not in AGENTS:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404
        
        agent = AGENTS[user_id]
        
        # Handle calendar-related queries
        if 'calendar' in message.lower():
            if agent.calendar_connected:
                response = agent.chat(message + "\n\nNote: I have access to your calendar and can help with scheduling.")
            else:
                response = "I'd love to help with your calendar! Please connect your Google Calendar first so I can access your events and help you schedule meetings."
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
            'error': str(e)
        }), 500

@app.route('/connect-calendar', methods=['POST'])
def connect_calendar():
    """Connect Google Calendar to employee's agent"""
    try:
        data = request.json
        user_id = data['userId']
        calendar_credentials = data['credentials']
        
        if user_id not in AGENTS:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404
        
        agent = AGENTS[user_id]
        success = agent.connect_calendar(calendar_credentials)
        
        if success:
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
            'error': str(e)
        }), 500

@app.route('/agent-status/<user_id>', methods=['GET'])
def get_agent_status(user_id):
    """Get agent status for employee"""
    try:
        if user_id not in AGENTS:
            return jsonify({
                'success': False,
                'error': 'Agent not found'
            }), 404
        
        agent = AGENTS[user_id]
        
        return jsonify({
            'success': True,
            'agent': {
                'agentId': agent.agent_id,
                'status': agent.status,
                'calendarConnected': agent.calendar_connected,
                'name': agent.name,
                'email': agent.email,
                'conversationLength': len(agent.conversation_history)
            }
        })
        
    except Exception as e:
        print(f"Status error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'activeAgents': len(AGENTS),
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting Flask MCP Server...")
    print(f"🔑 OpenRouter API Key: {'✅ Set' if os.getenv('OPENROUTER_API_KEY') else '❌ Missing'}")
    app.run(host='0.0.0.0', port=5000, debug=True)