# Satirical Video Production Platform

A comprehensive desktop application for creating satirical video content using AI-powered personas. The platform features 6 specialized AI agents that collaborate with users to transform news articles into engaging satirical videos optimized for AI video generation.

## 🤖 AI Agent System

The platform's core feature is its **6 specialized AI personas** that act as intelligent assistants throughout the creative process:

### The Six AI Agents

| Agent | Icon | Expertise | Role |
|-------|------|-----------|------|
| **Creative Strategist** | 🎯 | Satirical strategy & brainstorming | Analyzes news articles and develops creative concepts |
| **Baffling Broadcaster** | 📺 | Character creation | Creates out-of-touch presenter personas |
| **Satirical Screenwriter** | ✍️ | Script writing | Crafts cynical dialogue and scene structures |
| **Cinematic Storyboarder** | 🎬 | Visual storytelling | Plans shots and visual compositions |
| **Soundscape Architect** | 🎵 | Audio design | Designs sound effects and audio elements |
| **Video Prompt Engineer** | 🤖 | AI optimization | Creates video generation prompts for Veo3 |

### AI Provider Support

**Multi-Provider LLM Integration:**
- 🔥 **OpenAI** - GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- 🔥 **Anthropic** - Claude 3 Sonnet, Haiku, Opus
- 🆕 **Google Gemini** - Gemini 1.5 Pro, Flash, Pro
- 🏠 **Local LLMs** - Llama 2, Mistral, Ollama support

### Modern Chat Interface

Each AI agent features a **modern conversational interface** inspired by Claude and ChatGPT:
- Real-time typing indicators
- Conversation history and context persistence  
- Suggested prompts specific to each agent
- Per-agent model and provider configuration
- Error handling with clear setup guidance

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd satirical-video-platform
npm install
```

### 2. Configure AI Providers
Copy the example environment file and add your API keys:
```bash
cp .env.example .env
```

Edit `.env` with your preferred AI provider:
```bash
# Choose: openai, anthropic, gemini, or local
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here

# Or use Gemini:
# LLM_PROVIDER=gemini  
# GEMINI_API_KEY=your_gemini_key_here
```

### 3. Run the Application
```bash
npm run build
npm start
```

### 4. Configure AI Providers & Agents
1. **Setup API Keys Once:** Use the global settings to configure your AI provider API keys
2. **Per-Agent Model Selection:** Each agent can then select which model to use from your configured providers
3. **Test & Chat:** Test connections and start conversations with your specialized AI agents!

**Quick Fix for AI Configuration Issues:**
If you encounter "agent not properly configured" errors:
1. Set environment variables in `.env` as a fallback
2. Or use Global API Settings in the app (Settings → Global API Settings)
3. Each agent can then be individually configured with specific models

## 📱 Core Features

- **Project Management** - Organize satirical video projects
- **News Article Analysis** - Upload and analyze news articles for satirical potential
- **AI-Powered Creative Strategy** - Collaborative brainstorming with Creative Strategist agent
- **Modern Chat Interface** - Conversational UI for all AI agent interactions
- **Multi-Agent Workflow** - Each persona specializes in different aspects of video production
- **Context Persistence** - Agents remember conversations and project details
- **Streamlined Configuration** - Set up API keys once, select models per agent
- **Global API Management** - Central configuration for all AI providers

## 🛠️ Tech Stack

- **Frontend**: TypeScript, HTML5, CSS3
- **Backend**: Electron (Node.js)
- **Database**: SQLite with TypeScript models
- **AI Integration**: Multi-provider LLM support (OpenAI, Anthropic, Gemini, Local)
- **Architecture**: Modern MVC with service layer

## 📚 Documentation

- [LLM Integration Requirements](docs/LLM_Integration_Requirements.md) - Complete technical architecture
- [Detailed PRD](docs/prd/) - Product requirements and persona specifications
- [Project Plan](docs/project_plan/) - Development roadmap and implementation phases

## 🎯 Use Cases

Perfect for:
- **Content Creators** - Generate satirical video concepts from news articles
- **Comedy Writers** - Collaborate with AI to develop satirical content  
- **Video Producers** - Plan comprehensive satirical video productions
- **Social Commentary** - Transform current events into engaging satirical content

## 🤝 AI-Human Collaboration

The platform emphasizes **human-AI collaboration** rather than full automation:
- Humans provide creative direction and final approval
- AI agents offer specialized expertise and creative suggestions
- Iterative refinement through natural conversation
- Context-aware recommendations based on project goals

## 🔧 Configuration Workflow

**Simplified Setup Process:**
1. **Global API Setup** - Configure API keys for OpenAI, Anthropic, Gemini, or Local LLMs once
2. **Agent Configuration** - Each AI agent selects from your available models
3. **Intelligent Recommendations** - System suggests optimal models per agent role
4. **Ready to Chat** - Start conversations immediately with properly configured agents
