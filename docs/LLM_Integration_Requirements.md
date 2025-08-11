# LLM Integration Requirements for Persona AI Assistance

## Overview

The Satirical Video Production Platform features extensive LLM integration to power the 6 specialized personas as AI agents. This document outlines the current implementation status and architecture of the persona AI system, which transforms each persona into an intelligent AI assistant rather than manual user interfaces.

## ✅ Current Implementation Status (Updated 2025)

**IMPLEMENTED:**
- ✅ Multi-provider LLM support (OpenAI, Anthropic Claude, Google Gemini, Local LLMs)
- ✅ Per-agent model configuration and API key management  
- ✅ Modern AI chat interface (Claude/ChatGPT-style UX)
- ✅ Real-time conversation management with context persistence
- ✅ Persona-specific system prompts for each agent
- ✅ Agent configuration service with localStorage management
- ✅ No fallback/mock responses - LLM-only interactions
- ✅ Creative Strategist agent fully integrated with modern chat interface

**IN PROGRESS:**
- 🔄 Full Creative Strategy generation via LLM prompts
- 🔄 Enhanced persona-specific system prompts
- 🔄 Agent-to-agent communication capabilities

## Current Architecture Implementation

### LLM Service Architecture ✅ IMPLEMENTED

The platform uses a robust LLM service (`src/services/llm.ts`) that provides:

**Multi-Provider Support:**
- OpenAI GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- Anthropic Claude 3 Sonnet, Haiku, Opus  
- Google Gemini 1.5 Pro, Flash, Pro
- Local LLMs via Ollama (Llama 2, Mistral, etc.)

**Agent Configuration System:**
- Per-agent API provider and model selection (`src/services/agent-config.ts`)
- Individual API key management for each persona
- Agent-specific configuration storage via localStorage
- Model recommendations per provider

**Modern Chat Interface:**
- Claude/ChatGPT-style conversational UI (`src/renderer/components/ModernAIChatInterface.ts`)
- Real-time typing indicators and message formatting
- Suggested prompts specific to each persona
- Conversation persistence and history management
- Error handling and configuration prompts

### Six AI Agent Personas ✅ IMPLEMENTED

Each persona operates as an independent AI agent with:

1. **Creative Strategist** 🎯: Brainstorming and satirical angle development
2. **Baffling Broadcaster** 📺: Out-of-touch presenter character creation  
3. **Satirical Screenwriter** ✍️: Cynical dialogue and scene construction
4. **Cinematic Storyboarder** 🎬: Visual storytelling and shot composition
5. **Soundscape Architect** 🎵: Audio design and sound effect planning
6. **Video Prompt Engineer** 🤖: AI video prompt optimization for Veo3

*Note: The original specification mentioned 7 personas, but the current implementation focuses on 6 core personas for optimal workflow efficiency.*

### Configuration & Setup ✅ IMPLEMENTED

**Environment Variables (.env):**
```bash
# Choose your LLM provider: openai, anthropic, gemini, or local
LLM_PROVIDER=openai

# API Keys (only set the one you're using)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Model selection with provider-specific options
LLM_MODEL=gpt-4
```

**UI Configuration:**
- Settings modal for AI provider configuration
- Per-agent model and provider selection  
- API key management with secure local storage
- Connection testing and validation
- Agent status indicators (configured/unconfigured)

**Agent-Specific Features:**
- Individual system prompts optimized for each persona's role
- Context-aware responses based on project data
- Conversation history maintained per agent
- Error handling with clear configuration guidance

## Critical Gap Identified

The original PRD and Project Plan describe detailed persona workflows and "collaborative brainstorming" but fail to specify how these personas will actually function as AI agents. The documentation mentions:

- "Collaborative brainstorming interface" 
- "Feedback and approval workflows"
- "Creative Strategist brainstorming and critique"
- "Baffling Broadcaster generating satirical commentary"

**But lacks technical specification for the LLM integration required to make this possible.**

## Required LLM Integration Architecture

### 1. Persona AI Agent System ✅ IMPLEMENTED

Each of the 6 personas has been implemented as AI agents with:

#### Core LLM Components: ✅ IMPLEMENTED
- **System Prompts** ✅: Custom prompts defining personality, expertise, communication style for each persona
- **Context Management** ✅: Awareness of project data, conversation history via AgentConfigService
- **Structured Generation** 🔄: Ability to generate content adhering to predefined schemas (in progress)
- **Multi-Agent Coordination** 🔄: Capability to participate in discussions with other personas (planned)

#### Persona-Specific LLM Requirements:

**Creative Strategist:**
- Brainstorming and ideation capabilities
- Critical analysis of news articles for satirical potential  
- Candid feedback generation on creative concepts
- Collaborative discussion with Project Director

**Baffling Broadcaster:**
- Character-consistent voiceover generation
- "Out-of-touch presenter" personality maintenance
- Satirical commentary with specific tone and style
- Integration of generated content with Script Editor

**Satirical Screenwriter:**
- Script writing with dialogue and narration
- Character development and consistency
- Iterative refinement based on feedback
- Integration with Director's Notes and Voiceover Brief

**Cinematic Storyboarder:**
- Visual planning and shot descriptions
- Technical constraint adherence (8-second limit)
- Camera angle and lighting specifications
- Visual continuity management

**Soundscape Architect:**
- Audio design planning for each shot
- Foley and sound effect specifications
- Broadcast audio element design
- Integration with visual storyboard elements

**Video Prompt Engineer:**
- Aggregation of all creative inputs
- Veo3-optimized prompt generation
- Character consistency enforcement across prompts
- Technical prompt structure optimization

### 2. Multi-Agent Conversation System

#### Collaborative Features Required:
- **Inter-Persona Discussions**: Agents can discuss and refine ideas together
- **User-Agent Conversations**: Human users can participate in discussions with AI personas
- **Feedback Loops**: Agents provide structured feedback on each other's outputs
- **Iterative Refinement**: Multi-round conversations to improve creative outputs

#### Technical Implementation:
```
User Input → Conversation Manager → Active Persona (LLM) → Structured Response
                    ↓
            Context & History Management
                    ↓
        Other Personas (LLM) ← Collaborative Discussion → Database Updates
```

### 3. LLM API Integration Requirements

#### Primary LLM Service Integration:
- **API Provider**: Claude, GPT-4, Gemini, or similar high-capability LLM
- **Authentication**: Secure API key management (separate from Veo3)
- **Context Management**: Conversation history preservation
- **Structured Output**: JSON Schema-compliant response generation
- **Rate Limiting**: Handling API quotas and costs

#### Conversation Management:
- **Session Persistence**: Maintaining context across user sessions
- **History Storage**: Local storage of conversation history
- **Context Windows**: Managing token limits for long conversations
- **Multi-Threading**: Parallel conversations with different personas

### 4. Updated Data Model Extensions

#### New Entities Required:

**Conversation:**
- ID, ProjectID, ParticipantPersonas, ConversationHistory, CreatedAt, UpdatedAt

**Message:**
- ID, ConversationID, SenderPersona, MessageContent, MessageType, Timestamp

**PersonaContext:**
- ID, PersonaType, ProjectContext, ConversationHistory, SystemPrompt, LastActive

#### Schema Extensions:
All existing entities (DirectorNotes, Script, Shot, etc.) need additional fields for:
- **AIGenerated** (boolean) - Whether content was AI-generated
- **PersonaSource** - Which persona generated the content
- **ConversationID** - Link to the conversation that produced the content
- **IterationNumber** - Version number for iterative improvements

### 5. Integration Points with External APIs

#### Updated Integration Table:

| Service/System | Purpose | Integration Type | Key Features | Authentication | Priority |
|---|---|---|---|---|---|
| **LLM API** (Claude/GPT-4) | Power persona AI agents | REST API | Text generation, structured output, conversation | API Key | **P1** |
| **Veo3 AI Video API** | Generate video from prompts | REST API | Video generation | API Key/OAuth | **P1** |
| Conversation Manager | Multi-agent coordination | Internal Service | Context management, history | Internal | **P1** |

### 6. Updated Phase Implementation Plan

#### Phase 0 Additions:
- **LLM API Client Setup**: Basic integration with chosen LLM provider
- **Persona System Prompt Design**: Create system prompts for each persona
- **Conversation Management Framework**: Basic conversation handling

#### Phase 1 Modifications:
- Each module now includes **AI agent implementation**:
  1. Project Management + **AI Project Coordination**
  2. Creative Strategy + **AI Creative Strategist Agent**
  3. Script Development + **AI Screenwriter & Broadcaster Agents**
  4. Visual Design + **AI Storyboarder Agent**  
  5. Sound Design + **AI Soundscape Architect Agent**
  6. Shot Brief Aggregation + **AI Video Prompt Engineer Agent**

#### Phase 2 Enhancements:
- **Multi-Agent Conversations**: Personas discussing and collaborating
- **Advanced Context Management**: Cross-persona awareness and continuity
- **Conversation History & Export**: Full conversation management

### 7. Technical Considerations

#### Performance Impact:
- **Additional API Calls**: 7 personas × conversation rounds = significant API usage
- **Context Management**: Large context windows for comprehensive project awareness
- **Real-time Responsiveness**: LLM response times vs. UI expectations
- **Cost Management**: Token usage optimization strategies

#### Security Requirements:
- **LLM API Key Security**: Separate secure storage from Veo3 keys
- **Conversation Privacy**: Local encryption of conversation history
- **Content Filtering**: Ensuring AI-generated content meets quality standards
- **Usage Monitoring**: Tracking and limiting API usage costs

### 8. Success Metrics Updates

#### Additional KPIs Required:
- **AI Agent Response Quality**: User satisfaction with persona interactions
- **Conversation Completion Rate**: Percentage of successful multi-agent collaborations
- **Content Generation Accuracy**: AI outputs meeting schema requirements
- **API Cost Efficiency**: Token usage per successful project completion
- **Multi-Agent Coordination Success**: Successful handoffs between personas

## Implementation Priority

This LLM integration is **critical for core functionality** and should be elevated to **Phase 0/1 priority**. The personas cannot function as described without AI agent capabilities.

### Recommended Approach:
1. **Phase 0**: Basic LLM integration with simple persona responses
2. **Phase 1**: Full persona AI agents with structured output generation  
3. **Phase 2**: Multi-agent conversations and advanced collaboration features

## Conclusion

The LLM integration for persona assistance is not optional—it's fundamental to the platform's core value proposition. Without this integration, the platform would be reduced to manual form-filling rather than the collaborative AI-assisted creative workflow described in the original vision.

This integration represents a significant technical undertaking that affects every aspect of the application architecture and should be planned for from the foundation phase.