// Database models and repositories for easier data access

import { databaseService } from '../database';
import {
  User,
  Project,
  NewsArticle,
  DirectorNotes,
  Script,
  Shot,
  SoundNotes,
  Prompt,
  Comment,
  Conversation,
  Message,
  PersonaContext,
  PersonaType,
  APIResponse
} from '../../shared/types';

/**
 * User Repository - handles user-related database operations
 */
export class UserRepository {
  /**
   * Create a new user
   */
  static async create(userData: Omit<User, 'id' | 'created_at'>): Promise<APIResponse<User>> {
    return await databaseService.createUser(userData);
  }

  /**
   * Get user by ID
   */
  static async findById(id: string): Promise<APIResponse<User>> {
    return await databaseService.getUserById(id);
  }

  /**
   * Get user by email (for authentication)
   */
  static async findByEmail(email: string): Promise<User | null> {
    return await databaseService.getUserByEmail(email);
  }

  /**
   * Check if email is already taken
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Get all users with a specific role
   */
  static async findByRole(role: PersonaType): Promise<User[]> {
    const db = databaseService.getDatabase();
    const stmt = db.prepare('SELECT * FROM Users WHERE role = ? ORDER BY name ASC');
    const rows = stmt.all(role) as any[];

    return rows.map(row => ({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
      password_hash: undefined // Don't return password hashes
    }));
  }
}

/**
 * Project Repository - handles project-related database operations
 */
export class ProjectRepository {
  /**
   * Create a new project
   */
  static async create(projectData: Omit<Project, 'id' | 'created_at'>): Promise<APIResponse<Project>> {
    return await databaseService.createProject(projectData);
  }

  /**
   * Get project by ID
   */
  static async findById(id: string): Promise<APIResponse<Project>> {
    return await databaseService.getProjectById(id);
  }

  /**
   * Get all projects for a user
   */
  static async findByUser(userId: string): Promise<APIResponse<Project[]>> {
    return await databaseService.getProjectsForUser(userId);
  }

  /**
   * Update project status
   */
  static async updateStatus(projectId: string, status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'): Promise<APIResponse<boolean>> {
    try {
      const db = databaseService.getDatabase();
      const stmt = db.prepare('UPDATE Projects SET status = ? WHERE id = ?');
      const result = stmt.run(status, projectId);

      return {
        success: result.changes > 0,
        data: result.changes > 0,
        error: result.changes === 0 ? 'Project not found' : undefined,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update project status: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get project with all related content (full project data)
   */
  static async getFullProject(projectId: string): Promise<any> {
    try {
      const db = databaseService.getDatabase();
      
      // Get project
      const projectResult = await this.findById(projectId);
      if (!projectResult.success || !projectResult.data) {
        return null;
      }

      const project = projectResult.data;

      // Get news articles
      const newsStmt = db.prepare('SELECT * FROM NewsArticles WHERE associated_project = ?');
      const newsArticles = newsStmt.all(projectId);

      // Get director notes
      const notesStmt = db.prepare('SELECT * FROM DirectorNotes WHERE project_id = ? ORDER BY created_at DESC');
      const directorNotes = notesStmt.all(projectId);

      // Get scripts
      const scriptsStmt = db.prepare('SELECT * FROM Scripts WHERE project_id = ? ORDER BY created_at DESC');
      const scripts = scriptsStmt.all(projectId);

      return {
        ...project,
        newsArticles,
        directorNotes,
        scripts
      };
    } catch (error) {
      console.error('Failed to get full project:', error);
      return null;
    }
  }
}

/**
 * Conversation Repository - handles LLM conversation data
 */
export class ConversationRepository {
  /**
   * Create a new conversation
   */
  static async create(conversationData: Omit<Conversation, 'id' | 'created_at'>): Promise<APIResponse<Conversation>> {
    return await databaseService.createConversation(conversationData);
  }

  /**
   * Add message to conversation
   */
  static async addMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<APIResponse<Message>> {
    return await databaseService.addMessage(messageData);
  }

  /**
   * Get conversation messages
   */
  static async getMessages(conversationId: string): Promise<APIResponse<Message[]>> {
    return await databaseService.getConversationMessages(conversationId);
  }

  /**
   * Get active conversations for a project
   */
  static async getActiveConversations(projectId: string): Promise<Conversation[]> {
    try {
      const db = databaseService.getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM Conversations 
        WHERE project_id = ? AND status = 'ACTIVE' 
        ORDER BY updated_at DESC
      `);
      const rows = stmt.all(projectId) as any[];

      return rows.map(row => ({
        ...row,
        participant_personas: JSON.parse(row.participant_personas),
        created_at: new Date(row.created_at),
        updated_at: row.updated_at ? new Date(row.updated_at) : undefined
      }));
    } catch (error) {
      console.error('Failed to get active conversations:', error);
      return [];
    }
  }

  /**
   * Close/complete a conversation
   */
  static async closeConversation(conversationId: string): Promise<boolean> {
    try {
      const db = databaseService.getDatabase();
      const stmt = db.prepare('UPDATE Conversations SET status = "COMPLETED" WHERE id = ?');
      const result = stmt.run(conversationId);
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to close conversation:', error);
      return false;
    }
  }
}

/**
 * Content Repository - handles scripts, shots, etc.
 */
export class ContentRepository {
  /**
   * Create director notes
   */
  static async createDirectorNotes(notesData: Omit<DirectorNotes, 'id' | 'created_at'>): Promise<APIResponse<DirectorNotes>> {
    return await databaseService.createDirectorNotes(notesData);
  }

  /**
   * Get director notes for a project
   */
  static async getDirectorNotes(projectId: string): Promise<DirectorNotes[]> {
    try {
      const db = databaseService.getDatabase();
      const stmt = db.prepare('SELECT * FROM DirectorNotes WHERE project_id = ? ORDER BY version DESC');
      const rows = stmt.all(projectId) as any[];

      return rows.map(row => ({
        ...row,
        created_at: new Date(row.created_at),
        updated_at: row.updated_at ? new Date(row.updated_at) : undefined
      }));
    } catch (error) {
      console.error('Failed to get director notes:', error);
      return [];
    }
  }

  /**
   * Create a script
   */
  static async createScript(scriptData: Omit<Script, 'id' | 'created_at'>): Promise<APIResponse<Script>> {
    try {
      const db = databaseService.getDatabase();
      const script: Script = {
        id: require('crypto').randomUUID(),
        ...scriptData,
        created_at: new Date()
      };

      const stmt = db.prepare(`
        INSERT INTO Scripts (id, project_id, director_notes_id, outline, content, status, version, ai_generated, persona_source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        script.id,
        script.project_id,
        script.director_notes_id,
        script.outline,
        script.content,
        script.status,
        script.version,
        scriptData.ai_generated || false,
        scriptData.persona_source || null,
        script.created_at.toISOString()
      );

      return {
        success: true,
        data: script,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create script: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get shots with validation for 8-second rule
   */
  static async getShotsForScript(scriptId: string): Promise<Shot[]> {
    try {
      const db = databaseService.getDatabase();
      const stmt = db.prepare('SELECT * FROM Shots WHERE script_id = ? ORDER BY panel_number ASC');
      const rows = stmt.all(scriptId) as any[];

      // Validate 8-second rule
      const invalidShots = rows.filter(shot => shot.length_seconds > 8);
      if (invalidShots.length > 0) {
        console.warn(`Warning: Found ${invalidShots.length} shots exceeding 8-second limit`);
      }

      return rows.map(row => ({
        ...row,
        created_at: new Date(row.created_at),
        updated_at: row.updated_at ? new Date(row.updated_at) : undefined
      }));
    } catch (error) {
      console.error('Failed to get shots:', error);
      return [];
    }
  }
}

/**
 * Analytics Repository - for reporting and metrics
 */
export class AnalyticsRepository {
  /**
   * Get project statistics
   */
  static async getProjectStats(projectId: string): Promise<any> {
    try {
      const db = databaseService.getDatabase();

      // Count various entities
      const stats = {
        newsArticles: db.prepare('SELECT COUNT(*) as count FROM NewsArticles WHERE associated_project = ?').get(projectId),
        directorNotes: db.prepare('SELECT COUNT(*) as count FROM DirectorNotes WHERE project_id = ?').get(projectId),
        scripts: db.prepare('SELECT COUNT(*) as count FROM Scripts WHERE project_id = ?').get(projectId),
        conversations: db.prepare('SELECT COUNT(*) as count FROM Conversations WHERE project_id = ?').get(projectId),
        messages: db.prepare(`
          SELECT COUNT(*) as count FROM Messages m 
          JOIN Conversations c ON m.conversation_id = c.id 
          WHERE c.project_id = ?
        `).get(projectId)
      };

      // Get shot statistics if there are scripts
      const scriptsResult = stats.scripts as any;
      if (scriptsResult && scriptsResult.count > 0) {
        (stats as any).shots = db.prepare(`
          SELECT COUNT(*) as count FROM Shots s
          JOIN Scripts sc ON s.script_id = sc.id
          WHERE sc.project_id = ?
        `).get(projectId);

        (stats as any).totalDuration = db.prepare(`
          SELECT SUM(length_seconds) as total FROM Shots s
          JOIN Scripts sc ON s.script_id = sc.id
          WHERE sc.project_id = ?
        `).get(projectId);
      }

      return stats;
    } catch (error) {
      console.error('Failed to get project stats:', error);
      return {};
    }
  }

  /**
   * Get AI generation statistics
   */
  static async getAIStats(projectId: string): Promise<any> {
    try {
      const db = databaseService.getDatabase();

      const aiStats = {
        aiGeneratedScripts: db.prepare(`
          SELECT COUNT(*) as count FROM Scripts WHERE project_id = ? AND ai_generated = 1
        `).get(projectId),
        
        aiGeneratedShots: db.prepare(`
          SELECT COUNT(*) as count FROM Shots s
          JOIN Scripts sc ON s.script_id = sc.id
          WHERE sc.project_id = ? AND s.ai_generated = 1
        `).get(projectId),

        prompts: db.prepare(`
          SELECT COUNT(*) as count FROM Prompts pr
          JOIN Shots s ON pr.shot_id = s.id
          JOIN Scripts sc ON s.script_id = sc.id
          WHERE sc.project_id = ?
        `).get(projectId),

        completedVideos: db.prepare(`
          SELECT COUNT(*) as count FROM Prompts pr
          JOIN Shots s ON pr.shot_id = s.id
          JOIN Scripts sc ON s.script_id = sc.id
          WHERE sc.project_id = ? AND pr.generation_status = 'COMPLETED'
        `).get(projectId)
      };

      return aiStats;
    } catch (error) {
      console.error('Failed to get AI stats:', error);
      return {};
    }
  }
}