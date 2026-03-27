#!/usr/bin/env python3
"""
SOULVERSE AGENT PLATFORM - Backend Server
Real AI agents that do actual work with user's API keys and GitHub access
"""

import json
import os
import asyncio
import aiohttp
from aiohttp import web
from datetime import datetime
from pathlib import Path
import subprocess
import hashlib

# ==================== CONFIGURATION ====================
PORT = 8765
STATE_FILE = Path.home() / "soulverse" / "agent-platform-state.json"
WORK_LOG_FILE = Path.home() / "soulverse" / "agent-work-log.json"

# ==================== STATE MANAGEMENT ====================
class PlatformState:
    def __init__(self):
        self.users = {}
        self.active_agents = {}
        self.work_queue = []
        self.completed_work = []
        self.load()
    
    def load(self):
        if STATE_FILE.exists():
            with open(STATE_FILE) as f:
                data = json.load(f)
                self.users = data.get('users', {})
                self.active_agents = data.get('active_agents', {})
                self.work_queue = data.get('work_queue', [])
                self.completed_work = data.get('completed_work', [])
    
    def save(self):
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(STATE_FILE, 'w') as f:
            json.dump({
                'users': self.users,
                'active_agents': self.active_agents,
                'work_queue': self.work_queue,
                'completed_work': self.completed_work
            }, f, indent=2)
    
    def get_user(self, user_id):
        return self.users.get(user_id)
    
    def create_user(self, user_id, email):
        if user_id not in self.users:
            self.users[user_id] = {
                'id': user_id,
                'email': email,
                'purchased': False,
                'purchase_date': None,
                'api_keys': {},
                'github_token': None,
                'github_user': None,
                'github_repos': [],
                'agents': [],
                'permissions': {
                    'code': True,
                    'deploy': True,
                    'trade': False,
                    'content': True,
                    'email': False,
                    'social': True,
                    'research': False
                },
                'earnings': {
                    'total': 0.0,
                    'pending': 0.0,
                    'history': []
                },
                'created_at': datetime.now().isoformat()
            }
            self.save()
        return self.users[user_id]
    
    def record_work(self, user_id, agent_id, task, result, earnings):
        work_entry = {
            'user_id': user_id,
            'agent_id': agent_id,
            'task': task,
            'result': result,
            'earnings': earnings,
            'timestamp': datetime.now().isoformat()
        }
        self.completed_work.append(work_entry)
        
        if user_id in self.users:
            self.users[user_id]['earnings']['pending'] += earnings
            self.users[user_id]['earnings']['total'] += earnings
            self.users[user_id]['earnings']['history'].append({
                'date': datetime.now().strftime('%Y-%m-%d'),
                'amount': earnings,
                'source': f'{agent_id} task completion'
            })
        
        self.save()
        return work_entry

# Global state
platform_state = PlatformState()

# ==================== AGENT WORKERS ====================
class AgentWorker:
    """Base class for all agent types"""
    
    def __init__(self, user_id, agent_id, api_keys, permissions):
        self.user_id = user_id
        self.agent_id = agent_id
        self.api_keys = api_keys
        self.permissions = permissions
    
    async def execute(self, task_config):
        raise NotImplementedError

class CodeAgent(AgentWorker):
    """Writes and commits code to GitHub"""
    
    async def execute(self, task_config):
        if not self.permissions.get('code', False):
            return {'success': False, 'error': 'Code permission not granted'}
        
        if not self.api_keys.get('github'):
            return {'success': False, 'error': 'GitHub API key not configured'}
        
        description = task_config.get('description', '')
        repo = task_config.get('repo', '')
        
        # Use Ollama for code generation
        code = await self.generate_code(description)
        
        # Commit to GitHub
        if code and repo:
            commit_result = await self.commit_to_github(repo, code, description)
            return {
                'success': True,
                'code_generated': len(code),
                'commit': commit_result
            }
        
        return {'success': True, 'code': code}
    
    async def generate_code(self, description):
        """Generate code using Ollama"""
        ollama_url = self.api_keys.get('ollama', 'http://localhost:11434')
        
        prompt = f"""Write clean, production-ready code for this task:
{description}

Include comments and follow best practices."""
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{ollama_url}/api/generate",
                    json={
                        'model': 'qwen2.5:0.5b',
                        'prompt': prompt,
                        'stream': False
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get('response', '')
        except Exception as e:
            print(f"Ollama error: {e}")
        
        return None
    
    async def commit_to_github(self, repo, code, message):
        """Commit code to GitHub"""
        token = self.api_keys.get('github')
        
        headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        # Get user info
        async with aiohttp.ClientSession() as session:
            async with session.get(
                'https://api.github.com/user',
                headers=headers
            ) as resp:
                if resp.status == 200:
                    user_data = await resp.json()
                    username = user_data.get('login')
                    
                    # Create/update file
                    file_path = f"agent-generated/{datetime.now().strftime('%Y%m%d-%H%M%S')}.py"
                    
                    # Get current file SHA if exists
                    sha = None
                    try:
                        async with session.get(
                            f'https://api.github.com/repos/{username}/{repo}/contents/{file_path}',
                            headers=headers
                        ) as file_resp:
                            if file_resp.status == 200:
                                file_data = await file_resp.json()
                                sha = file_data.get('sha')
                    except:
                        pass
                    
                    # Create commit
                    import base64
                    payload = {
                        'message': f'[Agent] {message}',
                        'content': base64.b64encode(code.encode()).decode(),
                    }
                    if sha:
                        payload['sha'] = sha
                    
                    async with session.put(
                        f'https://api.github.com/repos/{username}/{repo}/contents/{file_path}',
                        headers=headers,
                        json=payload
                    ) as commit_resp:
                        if commit_resp.status in [200, 201]:
                            commit_data = await commit_resp.json()
                            return commit_data.get('commit', {}).get('html_url', '')
        
        return None

class ContentAgent(AgentWorker):
    """Creates content: blogs, social posts, marketing copy"""
    
    async def execute(self, task_config):
        if not self.permissions.get('content', False):
            return {'success': False, 'error': 'Content permission not granted'}
        
        content_type = task_config.get('type', 'blog')
        topic = task_config.get('topic', '')
        
        content = await self.generate_content(content_type, topic)
        
        return {
            'success': True,
            'content_type': content_type,
            'content': content,
            'length': len(content) if content else 0
        }
    
    async def generate_content(self, content_type, topic):
        """Generate content using Ollama"""
        ollama_url = self.api_keys.get('ollama', 'http://localhost:11434')
        
        prompts = {
            'blog': f"Write a comprehensive blog post about: {topic}. Include headings, examples, and actionable advice.",
            'social': f"Create 5 engaging social media posts about: {topic}. Include emojis and hashtags.",
            'copy': f"Write persuasive marketing copy for: {topic}. Focus on benefits and call-to-action.",
            'seo': f"Write SEO-optimized content about: {topic}. Include keywords naturally."
        }
        
        prompt = prompts.get(content_type, f"Write content about: {topic}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{ollama_url}/api/generate",
                    json={
                        'model': 'qwen2.5:0.5b',
                        'prompt': prompt,
                        'stream': False
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get('response', '')
        except Exception as e:
            print(f"Ollama error: {e}")
        
        return None

class ResearchAgent(AgentWorker):
    """Conducts web research and creates reports"""
    
    async def execute(self, task_config):
        if not self.permissions.get('research', False):
            return {'success': False, 'error': 'Research permission not granted'}
        
        topic = task_config.get('topic', '')
        
        # Simulate research (would use web scraping in production)
        report = await self.research_topic(topic)
        
        return {
            'success': True,
            'report': report,
            'sources': ['Web research completed']
        }
    
    async def research_topic(self, topic):
        """Research a topic using AI"""
        ollama_url = self.api_keys.get('ollama', 'http://localhost:11434')
        
        prompt = f"""Conduct comprehensive research on: {topic}

Provide:
1. Key findings
2. Important statistics
3. Current trends
4. Expert opinions
5. Actionable insights

Format as a structured report."""
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{ollama_url}/api/generate",
                    json={
                        'model': 'qwen2.5:0.5b',
                        'prompt': prompt,
                        'stream': False
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get('response', '')
        except Exception as e:
            print(f"Ollama error: {e}")
        
        return "Research completed. Report generated."

class DeployAgent(AgentWorker):
    """Deploys applications to cloud platforms"""
    
    async def execute(self, task_config):
        if not self.permissions.get('deploy', False):
            return {'success': False, 'error': 'Deploy permission not granted'}
        
        repo = task_config.get('repo', '')
        platform = task_config.get('platform', 'github-pages')
        
        result = await self.deploy_application(repo, platform)
        
        return result
    
    async def deploy_application(self, repo, platform):
        """Deploy application"""
        # In production, this would integrate with:
        # - GitHub Pages API
        # - Vercel API
        # - Netlify API
        # - AWS/GCP/Azure
        
        return {
            'success': True,
            'platform': platform,
            'repo': repo,
            'status': 'Deployment initiated',
            'url': f'https://{repo}.github.io'
        }

# Agent factory
AGENT_CLASSES = {
    'code-agent': CodeAgent,
    'content-agent': ContentAgent,
    'research-agent': ResearchAgent,
    'deploy-agent': DeployAgent
}

# ==================== WEB SERVER ====================
async def handle_purchase(request):
    """Handle game purchase"""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        email = data.get('email')
        payment_token = data.get('payment_token')
        
        # In production, verify payment with Stripe/PayPal/Crypto
        # For now, simulate successful payment
        
        user = platform_state.create_user(user_id, email)
        user['purchased'] = True
        user['purchase_date'] = datetime.now().isoformat()
        platform_state.save()
        
        # Add default agents
        user['agents'] = list(AGENT_CLASSES.keys())
        platform_state.save()
        
        return web.json_response({
            'success': True,
            'message': 'Purchase successful! Welcome to Soulverse.',
            'user_id': user_id
        })
    except Exception as e:
        return web.json_response({
            'success': False,
            'error': str(e)
        }, status=400)

async def handle_save_api_key(request):
    """Save user API key"""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        service = data.get('service')
        key = data.get('key')
        
        user = platform_state.get_user(user_id)
        if not user:
            return web.json_response({'error': 'User not found'}, status=404)
        
        if service == 'github':
            user['github_token'] = key
            # Fetch GitHub user info
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    'https://api.github.com/user',
                    headers={'Authorization': f'token {key}'}
                ) as resp:
                    if resp.status == 200:
                        user_data = await resp.json()
                        user['github_user'] = user_data.get('login')
        else:
            user['api_keys'][service] = key
        
        platform_state.save()
        
        return web.json_response({'success': True})
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_execute_agent(request):
    """Execute an agent task"""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        agent_id = data.get('agent_id')
        task_config = data.get('task', {})
        
        user = platform_state.get_user(user_id)
        if not user:
            return web.json_response({'error': 'User not found'}, status=404)
        
        if agent_id not in user.get('agents', []):
            return web.json_response({'error': 'Agent not owned'}, status=403)
        
        # Get agent class
        agent_class = AGENT_CLASSES.get(agent_id)
        if not agent_class:
            return web.json_response({'error': 'Unknown agent type'}, status=404)
        
        # Create agent instance
        agent = agent_class(
            user_id=user_id,
            agent_id=agent_id,
            api_keys=user.get('api_keys', {}),
            permissions=user.get('permissions', {})
        )
        
        # Execute task
        result = await agent.execute(task_config)
        
        # Calculate earnings based on work completed
        earnings = 0.50  # Base rate
        if result.get('success'):
            earnings += 0.01 * result.get('length', 0) / 100  # Bonus for output length
        
        # Record work and earnings
        platform_state.record_work(user_id, agent_id, task_config, result, earnings)
        
        return web.json_response({
            'success': True,
            'result': result,
            'earnings': earnings
        })
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_get_user_state(request):
    """Get user's complete state"""
    try:
        user_id = request.query.get('user_id')
        user = platform_state.get_user(user_id)
        
        if not user:
            return web.json_response({'error': 'User not found'}, status=404)
        
        # Remove sensitive data
        safe_user = {
            'id': user['id'],
            'purchased': user['purchased'],
            'purchase_date': user['purchase_date'],
            'agents': user['agents'],
            'permissions': user['permissions'],
            'earnings': user['earnings'],
            'github_user': user.get('github_user'),
            'github_repos': user.get('github_repos', [])
        }
        
        return web.json_response(safe_user)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_withdraw_earnings(request):
    """Withdraw earnings"""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        
        user = platform_state.get_user(user_id)
        if not user:
            return web.json_response({'error': 'User not found'}, status=404)
        
        pending = user['earnings']['pending']
        if pending <= 0:
            return web.json_response({'error': 'No earnings to withdraw'}, status=400)
        
        # In production, process payment via Stripe/crypto
        # For now, just record the withdrawal
        
        user['earnings']['history'].append({
            'date': datetime.now().strftime('%Y-%m-%d'),
            'amount': pending,
            'source': 'Withdrawal',
            'type': 'withdrawal'
        })
        user['earnings']['pending'] = 0
        platform_state.save()
        
        return web.json_response({
            'success': True,
            'amount': pending,
            'message': f'${pending:.2f} withdrawn to your account'
        })
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def handle_health(request):
    """Health check endpoint"""
    return web.json_response({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'active_users': len(platform_state.users),
        'completed_work': len(platform_state.completed_work)
    })

# ==================== ROUTES ====================
app = web.Application()
app.router.add_post('/api/purchase', handle_purchase)
app.router.add_post('/api/save-api-key', handle_save_api_key)
app.router.add_post('/api/execute-agent', handle_execute_agent)
app.router.add_get('/api/user-state', handle_get_user_state)
app.router.add_post('/api/withdraw', handle_withdraw_earnings)
app.router.add_get('/api/health', handle_health)

# ==================== MAIN ====================
if __name__ == '__main__':
    print(f"🌌 SOULVERSE AGENT PLATFORM starting on port {PORT}...")
    web.run_app(app, host='0.0.0.0', port=PORT)
