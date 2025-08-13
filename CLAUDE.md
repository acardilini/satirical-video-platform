# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Satirical Video Production Platform (SVPP) is a desktop application designed to streamline collaborative creation of AI-generated satirical videos. The platform serves multiple specialized personas working together to transform news articles into satirical video content through AI video generation (primarily Veo3).

## Architecture

This is currently a planning/documentation-only repository containing:
- Product Requirements Document (PRD) with comprehensive technical specifications
- Detailed project implementation plan 
- User personas and workflow definitions

**Planned Technical Stack:**
- **Frontend/Desktop**: Electron (HTML/CSS/JavaScript)
- **Database**: SQLite (embedded, local-first)
- **Storage**: Local file system for media assets
- **External Integration**: Veo3 AI Video Generation API

## Key Personas & Workflow

The application serves 7 specialized personas in sequential workflow:

1. **Project Director** - Oversees entire process, manages approvals
2. **Creative Strategist** - Creates Director's Notes from news articles
3. **Baffling Broadcaster** - Generates satirical voiceover content
4. **Satirical Screenwriter** - Writes video scripts
5. **Cinematic Storyboarder** - Creates visual storyboards (8-second shot limit)
6. **Soundscape Architect** - Designs sound for each shot
7. **Video Prompt Engineer** - Generates AI prompts for Veo3

## Critical Technical Constraints

- **8-second maximum** per video shot (AI generation limitation)
- **Local-first architecture** - all data stored locally
- **Structured data schemas** required for all persona outputs
- **Unified Shot Brief** aggregates all creative inputs for AI prompt generation
- **Dual AI Integration** - LLM API for persona assistance + Veo3 API for video generation

## Data Model Structure

Core entities: User → Project → NewsArticle → DirectorNotes → Script → Shot → (SoundNotes + Prompt)

All creative outputs must adhere to predefined schemas to ensure proper AI prompt generation.

## Development Phases

### Phase 0: Foundation & Architecture (2-3 weeks)
**Goal:** Technical foundation and development environment
- Electron + TypeScript setup
- SQLite database schema implementation  
- Internal API/service layer architecture
- JSON Schema validation framework
- Basic authentication and role management
- Initial Project Director dashboard (promoted to P1)

**Critical Commands:**
```bash
npm init -y
npm install electron typescript @types/node --save-dev
npm install sqlite3 ajv  # Database and validation
```

### Phase 1: Core Workflow Implementation (6-8 weeks) 
**Goal:** Complete persona workflow from news article to AI prompts

**Module Development Order:**
1. Project Management & News Article Ingestion
2. Creative Strategy (Director's Notes with schema validation)
3. Script Development (with basic character management)
4. Visual Design (Storyboard + 8-second validation) 
5. Sound Design (Shot-specific audio notes)
6. **Unified Shot Brief Aggregator** (most critical backend component)
7. Prompt Generation Engine (Veo3-optimized)

**Key Implementation Notes:**
- Schema-driven validation at every step
- Real-time 8-second constraint enforcement
- Character consistency tracking throughout
- Approval workflows integrated from start

### Phase 2: Integration & Polish (4-5 weeks)
**Goal:** External integrations and enhanced UX
- **LLM API integration** for persona AI assistance (Claude, GPT-4, etc.)
- **Veo3 API integration** (asynchronous processing)
- **Multi-agent conversation system** for persona collaboration
- Version control and history management
- Enhanced Project Director oversight dashboard
- Performance optimization (<2 second response times)
- Security hardening and encrypted storage

### Phase 3: Testing & Deployment (3-4 weeks)
**Goal:** Production readiness
- Comprehensive testing strategy (unit, integration, E2E)
- Performance validation (<5 second startup)
- Security penetration testing
- Application packaging and distribution setup

## LLM Integration Architecture

### Persona AI Assistance
Each of the 7 personas requires LLM integration to function as AI agents:
- **Custom system prompts** defining personality, expertise, and communication style
- **Context awareness** of project data and conversation history
- **Structured output generation** adhering to predefined schemas
- **Inter-agent collaboration** for discussions and feedback

### Dual AI Integration Required
1. **LLM API** (Claude/GPT-4/Gemini) for:
   - Persona AI assistance and content generation
   - Multi-agent conversations and collaboration
   - Structured creative output generation
   
2. **Veo3 API** for:
   - Final video generation from aggregated prompts
   - Asynchronous video processing

### Technical Implementation
```
User ↔ Persona Agent (LLM) ↔ Structured Output ↔ Database
                ↓
    Conversation History & Context Management
                ↓  
    Inter-Agent Discussions & Collaborative Refinement
```

## LLM-Optimized Development Approach

- **Strict Data Schemas**: All persona inputs use JSON Schema validation
- **Modular Architecture**: Clear separation with internal API layer
- **Async Patterns**: Essential for both LLM and Veo3 API integration
- **Character Consistency**: Persistent identifiers and naming conventions
- **Conversation Management**: Context preservation across persona interactions

## Security & Compliance

- Local data encryption at rest
- Secure API key storage (platform-specific mechanisms)
- Role-based access control per persona
- HTTPS for external API communications

## Success Metrics

- Time to prompt generation: <48 hours
- Feature adoption: >80% for core modules  
- AI video edit rate: <10% requiring significant post-production
- Application startup time: <5 seconds

## Documentation References

- `/docs/prd/Detailed Desktop App PRD - Satirical Video Production Platform.md` - Complete technical specifications
- `/docs/project_plan/Desktop App Project Plan - Satirical Video Production Platform.md` - Implementation roadmap
- `/docs/prd/personas_detailed/` - Detailed persona specifications
- `/docs/LLM_Integration_Requirements.md` - **CRITICAL**: LLM integration architecture for persona AI agents
- When changes are being made to the CSS the build process isn't being properly copied to the dist folder. This means that I'm often spending time to make this point every time there is a change or fix. Please make sure this is checked when updating CSS.