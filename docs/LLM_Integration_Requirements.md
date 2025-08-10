# LLM Integration Requirements for Persona AI Assistance

## Overview

The Satirical Video Production Platform requires extensive LLM integration to power the 7 specialized personas as AI agents. This document addresses the critical gap in the original documentation regarding how personas function as AI assistants rather than manual user interfaces.

## Critical Gap Identified

The original PRD and Project Plan describe detailed persona workflows and "collaborative brainstorming" but fail to specify how these personas will actually function as AI agents. The documentation mentions:

- "Collaborative brainstorming interface" 
- "Feedback and approval workflows"
- "Creative Strategist brainstorming and critique"
- "Baffling Broadcaster generating satirical commentary"

**But lacks technical specification for the LLM integration required to make this possible.**

## Required LLM Integration Architecture

### 1. Persona AI Agent System

Each of the 7 personas must be implemented as AI agents with:

#### Core LLM Components:
- **System Prompts**: Custom prompts defining personality, expertise, communication style
- **Context Management**: Awareness of project data, conversation history, other persona outputs
- **Structured Generation**: Ability to generate content adhering to predefined schemas
- **Multi-Agent Coordination**: Capability to participate in discussions with other personas

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