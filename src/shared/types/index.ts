// Core data types for the Satirical Video Production Platform

export type PersonaType = 
  | 'PROJECT_DIRECTOR'
  | 'CREATIVE_STRATEGIST' 
  | 'BAFFLING_BROADCASTER'
  | 'SATIRICAL_SCREENWRITER'
  | 'CINEMATIC_STORYBOARDER'
  | 'SOUNDSCAPE_ARCHITECT'
  | 'VIDEO_PROMPT_ENGINEER';

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type SatiricalContextType = 'ANIMAL_LIBERATION' | 'ENVIRONMENTAL' | 'GENERAL' | 'CUSTOM';

export interface SatiricalContext {
  type: SatiricalContextType;
  name: string;
  description: string;
  ethicalFramework: string;
  keyPrinciples: string[];
  commonTargets: string[];
  preferredTerminology: { avoid: string; prefer: string; reason: string }[];
  satiricalApproaches: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string; // Optional for security reasons
  role: PersonaType;
  created_at: Date;
  updated_at?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  created_by: string; // User ID
  assigned_personas: PersonaType[];
  satirical_context?: SatiricalContext;
  satirical_format?: SatiricalFormat;
  created_at: Date;
  updated_at?: Date;
}

export interface NewsArticle {
  id: string;
  title: string;
  source?: string;
  url?: string;
  content: string;
  processing_notes?: string;
  uploaded_by: string; // User ID
  project_id: string; // Project ID
  file_name?: string; // Original filename if uploaded as file
  file_type?: string; // MIME type if uploaded as file
  created_at: Date;
  updated_at?: Date;
}

// Creative Strategy Types
export type CreativeStrategyStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'NEEDS_REVISION';
export type SatiricalTone = 'SUBTLE' | 'OVERT' | 'ABSURDIST' | 'DRY_WIT' | 'SATIRICAL_NEWS';
export type TargetAudience = 'GENERAL' | 'POLITICAL_SATIRE' | 'SOCIAL_COMMENTARY' | 'MILLENNIAL' | 'GEN_Z';
export type SatiricalFormat = 'NEWS_PARODY' | 'VOX_POP' | 'MORNING_TV_INTERVIEW' | 'MOCKUMENTARY' | 'SOCIAL_MEDIA' | 'SKETCH_COMEDY' | 'SATIRICAL_ARTICLE' | 'PANEL_SHOW' | 'COMMERCIAL_PARODY' | 'REALITY_TV_PARODY';

export interface SatiricalAngle {
  angle_type: 'IRONY' | 'EXAGGERATION' | 'PARODY' | 'SUBVERSION';
  description: string;
  key_elements: string[];
}

export interface CharacterArchetype {
  name: string;
  role: string;
  satirical_traits: string[];
  visual_description?: string;
}

export interface CreativeStrategy {
  id: string;
  project_id: string;
  director_notes_id?: string; // Links to DirectorNotes if generated from there
  
  // Core Strategy Elements
  creative_concept: string;
  satirical_angles: SatiricalAngle[];
  target_audience: TargetAudience;
  tone: SatiricalTone;
  satirical_format?: SatiricalFormat;
  
  // Content Framework
  key_themes: string[];
  character_archetypes: CharacterArchetype[];
  visual_style_guide: {
    color_palette?: string;
    cinematography_notes?: string;
    overall_aesthetic?: string;
  };
  
  // Validation Schema
  validation_criteria: {
    theme_consistency: boolean;
    character_coherence: boolean;
    satirical_effectiveness: boolean;
    technical_feasibility: boolean;
  };
  
  // Metadata
  status: CreativeStrategyStatus;
  version: number;
  generated_by_persona?: PersonaType;
  created_by: string; // User ID
  approved_by?: string; // User ID
  created_at: Date;
  updated_at?: Date;
}

export interface DirectorNotes {
  id: string;
  project_id: string;
  creative_strategy_id?: string; // Links to CreativeStrategy
  summary: string;
  satirical_hook: string;
  characters: string;
  visual_concepts: string;
  status: 'DRAFT' | 'APPROVED';
  version: number;
  created_at: Date;
  updated_at?: Date;
}

export interface Script {
  id: string;
  project_id: string;
  director_notes_id: string;
  outline?: string;
  content: string;
  status: 'DRAFT' | 'APPROVED';
  version: number;
  ai_generated?: boolean;
  persona_source?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Storyboard {
  id: string;
  project_id: string;
  script_id: string;
  visual_concept?: string;
  shots: Shot[];
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED';
  version: number;
  created_by: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Shot {
  id: string;
  script_id: string;
  panel_number: number;
  length_seconds: number; // Must be <= 8
  camera_angle: string;
  character_action: string;
  lighting_mood: string;
  dialogue_narration?: string;
  visual_style: string;
  created_at: Date;
  updated_at?: Date;
}

export interface SoundNotes {
  id: string;
  shot_id: string;
  ambient_foley?: string;
  specific_sfx?: string;
  broadcast_audio?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Prompt {
  id: string;
  shot_id: string;
  generated_prompt_text: string;
  ai_model: string; // e.g., 'Veo3'
  generated_video_url?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Comment {
  id: string;
  target_entity_id: string;
  target_entity_type: string; // 'script', 'shot', 'director_notes', etc.
  comment_text: string;
  author: string; // User ID
  created_at: Date;
}

// LLM Integration Types
export interface Conversation {
  id: string;
  project_id: string;
  participant_personas: PersonaType[];
  status: 'ACTIVE' | 'COMPLETED';
  created_at: Date;
  updated_at?: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_persona: PersonaType | 'USER';
  message_content: string;
  message_type: 'TEXT' | 'STRUCTURED_OUTPUT';
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface PersonaContext {
  id: string;
  persona_type: PersonaType;
  project_id: string;
  system_prompt: string;
  context_data: Record<string, any>;
  conversation_history: string[];
  last_active: Date;
  created_at: Date;
  updated_at?: Date;
}

// Unified Shot Brief for AI Prompt Generation
export interface UnifiedShotBrief {
  shot: Shot;
  sound_notes?: SoundNotes;
  script_context: {
    dialogue: string;
    narrative_context: string;
  };
  character_consistency: {
    character_descriptions: Record<string, string>;
    visual_continuity_notes: string;
  };
  technical_constraints: {
    duration_seconds: number;
    visual_style: string;
    camera_specifications: string;
  };
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface LLMGenerationRequest {
  persona: PersonaType;
  prompt: string;
  context?: Record<string, any>;
  schema?: object; // For structured output
}

export interface LLMGenerationResponse {
  content: string;
  structured_data?: Record<string, any>;
  persona: PersonaType;
  timestamp: Date;
}