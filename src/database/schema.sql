-- Satirical Video Production Platform Database Schema
-- SQLite Database Schema for local-first architecture

-- Users table - stores all personas and project directors
CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
        'PROJECT_DIRECTOR',
        'CREATIVE_STRATEGIST', 
        'BAFFLING_BROADCASTER',
        'SATIRICAL_SCREENWRITER',
        'CINEMATIC_STORYBOARDER',
        'SOUNDSCAPE_ARCHITECT',
        'VIDEO_PROMPT_ENGINEER'
    )),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table - main project container
CREATE TABLE IF NOT EXISTS Projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_by TEXT NOT NULL,
    assigned_personas TEXT, -- JSON array of persona types
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(id)
);

-- News Articles table - source material for satirical content
CREATE TABLE IF NOT EXISTS NewsArticles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT,
    content TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    associated_project TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES Users(id),
    FOREIGN KEY (associated_project) REFERENCES Projects(id) ON DELETE CASCADE
);

-- Director Notes table - core creative brief
CREATE TABLE IF NOT EXISTS DirectorNotes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    satirical_hook TEXT NOT NULL,
    characters TEXT NOT NULL,
    visual_concepts TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
);

-- Scripts table - the video script content
CREATE TABLE IF NOT EXISTS Scripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    director_notes_id TEXT NOT NULL,
    outline TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED')),
    version INTEGER NOT NULL DEFAULT 1,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    persona_source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (director_notes_id) REFERENCES DirectorNotes(id)
);

-- Shots table - individual video segments
CREATE TABLE IF NOT EXISTS Shots (
    id TEXT PRIMARY KEY,
    script_id TEXT NOT NULL,
    panel_number INTEGER NOT NULL,
    length_seconds REAL NOT NULL CHECK (length_seconds > 0 AND length_seconds <= 8), -- 8-second constraint
    camera_angle TEXT NOT NULL,
    character_action TEXT NOT NULL,
    lighting_mood TEXT NOT NULL,
    dialogue_narration TEXT,
    visual_style TEXT NOT NULL,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    persona_source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (script_id) REFERENCES Scripts(id) ON DELETE CASCADE
);

-- Sound Notes table - audio design for each shot
CREATE TABLE IF NOT EXISTS SoundNotes (
    id TEXT PRIMARY KEY,
    shot_id TEXT NOT NULL,
    ambient_foley TEXT,
    specific_sfx TEXT,
    broadcast_audio TEXT,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    persona_source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shot_id) REFERENCES Shots(id) ON DELETE CASCADE
);

-- Prompts table - AI-optimized text prompts for video generation
CREATE TABLE IF NOT EXISTS Prompts (
    id TEXT PRIMARY KEY,
    shot_id TEXT NOT NULL,
    generated_prompt_text TEXT NOT NULL,
    ai_model TEXT NOT NULL DEFAULT 'Veo3',
    generated_video_url TEXT,
    generation_status TEXT DEFAULT 'PENDING' CHECK (generation_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    persona_source TEXT DEFAULT 'VIDEO_PROMPT_ENGINEER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shot_id) REFERENCES Shots(id) ON DELETE CASCADE
);

-- Comments table - collaborative feedback and discussion
CREATE TABLE IF NOT EXISTS Comments (
    id TEXT PRIMARY KEY,
    target_entity_id TEXT NOT NULL,
    target_entity_type TEXT NOT NULL CHECK (target_entity_type IN (
        'project', 'news_article', 'director_notes', 'script', 'shot', 'sound_notes', 'prompt'
    )),
    comment_text TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author) REFERENCES Users(id)
);

-- LLM Integration Tables for Persona AI Assistance

-- Conversations table - manages multi-agent discussions
CREATE TABLE IF NOT EXISTS Conversations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    participant_personas TEXT NOT NULL, -- JSON array of persona types
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
);

-- Messages table - individual messages in conversations
CREATE TABLE IF NOT EXISTS Messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_persona TEXT NOT NULL, -- Can be persona type or 'USER'
    message_content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'STRUCTURED_OUTPUT')),
    metadata TEXT, -- JSON metadata for structured outputs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES Conversations(id) ON DELETE CASCADE
);

-- Persona Context table - maintains AI agent context and state
CREATE TABLE IF NOT EXISTS PersonaContext (
    id TEXT PRIMARY KEY,
    persona_type TEXT NOT NULL,
    project_id TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    context_data TEXT, -- JSON object with persona-specific context
    conversation_history TEXT, -- JSON array of recent conversation IDs
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    UNIQUE(persona_type, project_id) -- One context per persona per project
);

-- Indexes for performance optimization

-- User and authentication indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);

-- Project-related indexes
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON Projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON Projects(status);

-- Content workflow indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_project ON NewsArticles(associated_project);
CREATE INDEX IF NOT EXISTS idx_director_notes_project ON DirectorNotes(project_id);
CREATE INDEX IF NOT EXISTS idx_scripts_project ON Scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_shots_script ON Shots(script_id);
CREATE INDEX IF NOT EXISTS idx_sound_notes_shot ON SoundNotes(shot_id);
CREATE INDEX IF NOT EXISTS idx_prompts_shot ON Prompts(shot_id);

-- Comment system indexes
CREATE INDEX IF NOT EXISTS idx_comments_target ON Comments(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON Comments(author);

-- LLM integration indexes
CREATE INDEX IF NOT EXISTS idx_conversations_project ON Conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON Messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON Messages(sender_persona);
CREATE INDEX IF NOT EXISTS idx_persona_context_project ON PersonaContext(project_id);
CREATE INDEX IF NOT EXISTS idx_persona_context_type ON PersonaContext(persona_type);

-- Timestamp indexes for chronological queries
CREATE INDEX IF NOT EXISTS idx_projects_created ON Projects(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created ON Messages(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_created ON Comments(created_at);

-- Update triggers to maintain updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON Users
    BEGIN
        UPDATE Users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
    AFTER UPDATE ON Projects
    BEGIN
        UPDATE Projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_director_notes_timestamp 
    AFTER UPDATE ON DirectorNotes
    BEGIN
        UPDATE DirectorNotes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_scripts_timestamp 
    AFTER UPDATE ON Scripts
    BEGIN
        UPDATE Scripts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_shots_timestamp 
    AFTER UPDATE ON Shots
    BEGIN
        UPDATE Shots SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_sound_notes_timestamp 
    AFTER UPDATE ON SoundNotes
    BEGIN
        UPDATE SoundNotes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_prompts_timestamp 
    AFTER UPDATE ON Prompts
    BEGIN
        UPDATE Prompts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_conversations_timestamp 
    AFTER UPDATE ON Conversations
    BEGIN
        UPDATE Conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_persona_context_timestamp 
    AFTER UPDATE ON PersonaContext
    BEGIN
        UPDATE PersonaContext SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;