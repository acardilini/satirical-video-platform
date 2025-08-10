import { ipcMain } from 'electron';
import { databaseService } from '../database/database';
import { AuthService } from '../services/auth';
import { UserRepository, ProjectRepository, ConversationRepository } from '../database/models';
import { generateId, validateShotDuration, sanitizeInput } from '../shared/utils';

/**
 * Setup all IPC handlers for main-renderer communication
 */
export function setupIPCHandlers() {
  
  // ========== AUTHENTICATION HANDLERS ==========
  
  ipcMain.handle('auth-register', async (event, userData) => {
    try {
      return await AuthService.register(userData);
    } catch (error) {
      console.error('Register IPC handler failed:', error);
      return {
        success: false,
        error: `Registration failed: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('auth-login', async (event, email, password) => {
    try {
      return await AuthService.login({ email, password });
    } catch (error) {
      console.error('Login IPC handler failed:', error);
      return {
        success: false,
        error: `Login failed: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('auth-verify-token', async (event, token) => {
    try {
      const decoded = AuthService.verifyToken(token);
      return {
        success: !!decoded,
        data: decoded,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: `Token verification failed: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('auth-refresh-token', async (event, token) => {
    try {
      return await AuthService.refreshToken(token);
    } catch (error) {
      console.error('Refresh token IPC handler failed:', error);
      return {
        success: false,
        error: `Token refresh failed: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('auth-get-current-user', async (event, token) => {
    try {
      return await AuthService.getCurrentUser(token);
    } catch (error) {
      console.error('Get current user IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get current user: ${error}`,
        timestamp: new Date()
      };
    }
  });

  // ========== DATABASE HANDLERS ==========

  // User operations
  ipcMain.handle('db-create-user', async (event, userData) => {
    try {
      return await UserRepository.create(userData);
    } catch (error) {
      console.error('Create user IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to create user: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-authenticate-user', async (event, email, password) => {
    try {
      return await AuthService.login({ email, password });
    } catch (error) {
      console.error('Authenticate user IPC handler failed:', error);
      return {
        success: false,
        error: `Authentication failed: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-get-user', async (event, id) => {
    try {
      return await UserRepository.findById(id);
    } catch (error) {
      console.error('Get user IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get user: ${error}`,
        timestamp: new Date()
      };
    }
  });

  // Project operations
  ipcMain.handle('db-create-project', async (event, projectData) => {
    try {
      return await databaseService.createProject(projectData);
    } catch (error) {
      console.error('Create project IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to create project: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-get-projects', async (event, userId) => {
    try {
      return await databaseService.getProjectsForUser(userId);
    } catch (error) {
      console.error('Get projects IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get projects: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-get-project', async (event, id) => {
    try {
      return await databaseService.getProjectById(id);
    } catch (error) {
      console.error('Get project IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get project: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-update-project', async (event, id, data) => {
    try {
      // For Phase 0, implement basic status update
      if (data.status) {
        return await ProjectRepository.updateStatus(id, data.status);
      }
      return {
        success: false,
        error: 'Update operation not implemented yet',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Update project IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to update project: ${error}`,
        timestamp: new Date()
      };
    }
  });

  // News Article operations
  ipcMain.handle('db-create-article', async (event, articleData) => {
    try {
      return await databaseService.createNewsArticle(articleData);
    } catch (error) {
      console.error('Create article IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to create article: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-upload-article-file', async (event, fileData) => {
    try {
      return await databaseService.uploadNewsArticleFile(fileData);
    } catch (error) {
      console.error('Upload article file IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to upload article file: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-get-articles-by-project', async (event, projectId) => {
    try {
      return await databaseService.getNewsArticlesByProject(projectId);
    } catch (error) {
      console.error('Get articles by project IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get articles: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-get-article', async (event, id) => {
    try {
      return await databaseService.getNewsArticleById(id);
    } catch (error) {
      console.error('Get article IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get article: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-delete-article', async (event, id) => {
    try {
      return await databaseService.deleteNewsArticle(id);
    } catch (error) {
      console.error('Delete article IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to delete article: ${error}`,
        timestamp: new Date()
      };
    }
  });

  // Director Notes operations
  ipcMain.handle('db-create-director-notes', async (event, notesData) => {
    try {
      return await databaseService.createDirectorNotes(notesData);
    } catch (error) {
      console.error('Create director notes IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to create director notes: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-get-director-notes', async (event, projectId) => {
    try {
      const db = databaseService.getDatabase();
      const stmt = db.prepare('SELECT * FROM DirectorNotes WHERE project_id = ? ORDER BY created_at DESC');
      const notes = stmt.all(projectId) as any[];
      
      return {
        success: true,
        data: notes.map((note: any) => ({
          ...note,
          created_at: new Date(note.created_at),
          updated_at: note.updated_at ? new Date(note.updated_at) : undefined
        })),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Get director notes IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get director notes: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-update-director-notes', async (event, id, data) => {
    try {
      const db = databaseService.getDatabase();
      const stmt = db.prepare(`
        UPDATE DirectorNotes 
        SET summary = ?, satirical_hook = ?, characters = ?, visual_concepts = ?, status = ?
        WHERE id = ?
      `);
      
      const result = stmt.run(
        data.summary,
        data.satirical_hook,
        data.characters,
        data.visual_concepts,
        data.status,
        id
      );

      return {
        success: result.changes > 0,
        data: result.changes > 0,
        error: result.changes === 0 ? 'Director notes not found' : undefined,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Update director notes IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to update director notes: ${error}`,
        timestamp: new Date()
      };
    }
  });

  // ========== LLM HANDLERS (Placeholder for Phase 0) ==========

  ipcMain.handle('llm-generate-response', async (event, persona, prompt, context) => {
    // Placeholder implementation for Phase 0
    return {
      success: false,
      error: 'LLM integration not yet implemented (Phase 0)',
      timestamp: new Date()
    };
  });

  ipcMain.handle('llm-generate-structured', async (event, persona, prompt, schema) => {
    // Placeholder implementation for Phase 0
    return {
      success: false,
      error: 'LLM structured generation not yet implemented (Phase 0)',
      timestamp: new Date()
    };
  });

  ipcMain.handle('llm-create-conversation', async (event, projectId, personas) => {
    try {
      return await ConversationRepository.create({
        project_id: projectId,
        participant_personas: personas,
        status: 'ACTIVE'
      });
    } catch (error) {
      console.error('Create conversation IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to create conversation: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('llm-add-message', async (event, conversationId, message) => {
    try {
      return await ConversationRepository.addMessage({
        conversation_id: conversationId,
        ...message
      });
    } catch (error) {
      console.error('Add message IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to add message: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('llm-get-conversation', async (event, conversationId) => {
    try {
      return await ConversationRepository.getMessages(conversationId);
    } catch (error) {
      console.error('Get conversation IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get conversation: ${error}`,
        timestamp: new Date()
      };
    }
  });

  // ========== FILE HANDLERS ==========

  ipcMain.handle('file-save', async (event, filepath, content) => {
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filepath, content, 'utf8');
      return true;
    } catch (error) {
      console.error('File save failed:', error);
      return false;
    }
  });

  ipcMain.handle('file-read', async (event, filepath) => {
    try {
      const fs = require('fs').promises;
      const content = await fs.readFile(filepath, 'utf8');
      return content;
    } catch (error) {
      console.error('File read failed:', error);
      throw error;
    }
  });

  ipcMain.handle('file-select', async (event) => {
    // Will implement file dialog in Phase 1
    return '';
  });

  // ========== UTILITY HANDLERS ==========

  ipcMain.handle('util-generate-id', async (event) => {
    return generateId();
  });

  ipcMain.handle('util-validate-duration', async (event, seconds) => {
    return validateShotDuration(seconds);
  });

  ipcMain.handle('util-sanitize', async (event, input) => {
    return sanitizeInput(input);
  });

  // ========== DATABASE TESTING HANDLER ==========
  
  ipcMain.handle('db-test-connection', async (event) => {
    try {
      return await databaseService.testConnection();
    } catch (error) {
      console.error('Database test failed:', error);
      return {
        success: false,
        error: `Database test failed: ${error}`,
        timestamp: new Date()
      };
    }
  });

  console.log('IPC handlers setup completed');
}