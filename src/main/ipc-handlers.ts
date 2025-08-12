import { ipcMain } from 'electron';
import { databaseService } from '../database/database';
import { AuthService } from '../services/auth';
import { UserRepository, ProjectRepository, ConversationRepository } from '../database/models';
import { generateId, validateShotDuration, sanitizeInput } from '../shared/utils';
import { createLLMService } from '../services/llm.js';
import { ModelAvailabilityService } from '../services/model-availability.js';
import { AgentConfigService } from '../services/agent-config.js';
import { projectDirectorService } from '../services/project-director.js';

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

  ipcMain.handle('db-update-project-format', async (event, projectId, formatType) => {
    try {
      return await databaseService.updateProjectFormat(projectId, formatType);
    } catch (error) {
      console.error('Update project format IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to update project format: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-delete-project', async (event, id) => {
    try {
      return await databaseService.deleteProject(id);
    } catch (error) {
      console.error('Delete project IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to delete project: ${error}`,
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

  ipcMain.handle('db-update-news-article', async (event, id, updates) => {
    try {
      return await databaseService.updateNewsArticle(id, updates);
    } catch (error) {
      console.error('Update article IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to update article: ${error}`,
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

  // ========== CREATIVE STRATEGY HANDLERS ==========

  ipcMain.handle('db-create-creative-strategy', async (event, strategyData) => {
    try {
      return await databaseService.createCreativeStrategy(strategyData);
    } catch (error) {
      console.error('Create creative strategy IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to create creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-get-creative-strategy', async (event, projectId) => {
    try {
      return await databaseService.getCreativeStrategy(projectId);
    } catch (error) {
      console.error('Get creative strategy IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to get creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-update-project-context', async (event, projectId, contextType) => {
    try {
      return await databaseService.updateProjectContext(projectId, contextType);
    } catch (error) {
      console.error('Update project context IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to update project context: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-generate-creative-strategy', async (event, projectId) => {
    try {
      return await databaseService.generateCreativeStrategy(projectId);
    } catch (error) {
      console.error('Generate creative strategy IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to generate creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-update-creative-strategy', async (event, strategyId, updates) => {
    try {
      return await databaseService.updateCreativeStrategy(strategyId, updates);
    } catch (error) {
      console.error('Update creative strategy IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to update creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('db-generate-director-notes', async (event, strategyId) => {
    try {
      return await databaseService.generateDirectorNotes(strategyId);
    } catch (error) {
      console.error('Generate director notes IPC handler failed:', error);
      return {
        success: false,
        error: `Failed to generate director notes: ${error}`,
        timestamp: new Date()
      };
    }
  });

  // ========== LLM HANDLERS ==========

  // Initialize LLM service
  const llmService = createLLMService();

  ipcMain.handle('llm-generate-response', async (event, conversationId, persona, userMessage, context, agentConfig) => {
    console.log('DEBUG: ===== LLM GENERATE RESPONSE HANDLER START =====');
    console.log('DEBUG: conversationId:', conversationId);
    console.log('DEBUG: persona:', persona);
    console.log('DEBUG: userMessage:', userMessage?.substring(0, 50) + '...');
    console.log('DEBUG: context:', context ? Object.keys(context) : 'null');
    console.log('DEBUG: agentConfig received:', agentConfig);
    
    try {
      console.log('DEBUG: About to call llmService.generateResponseWithConfig()');
      const response = await llmService.generateResponseWithConfig(conversationId, persona, userMessage, context, agentConfig);
      console.log('DEBUG: LLM response received:', { success: response.success, error: response.error });
      
      return {
        success: response.success,
        data: response.response,
        error: response.error,
        usage: response.usage,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('DEBUG: IPC handler exception:', error);
      return {
        success: false,
        error: `Failed to generate LLM response: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('llm-clear-conversation', async (event, conversationId) => {
    try {
      llmService.clearConversation(conversationId);
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Clear conversation failed:', error);
      return {
        success: false,
        error: `Failed to clear conversation: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('llm-get-conversation-summary', async (event, conversationId) => {
    try {
      const summary = llmService.getConversationSummary(conversationId);
      return {
        success: true,
        data: summary,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Get conversation summary failed:', error);
      return {
        success: false,
        error: `Failed to get conversation summary: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('llm-generate-structured', async (event, persona, prompt, schema) => {
    // This can be implemented later for structured output generation
    return {
      success: false,
      error: 'Structured generation not yet implemented',
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

  // ========== MODEL VALIDATION HANDLERS ==========

  ipcMain.handle('model-check-availability', async (event, provider, apiKey) => {
    try {
      console.log(`DEBUG: Checking model availability for ${provider}`);
      const result = await ModelAvailabilityService.checkAvailableModels(provider, apiKey);
      
      return {
        success: result.success,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Model availability check failed:', error);
      return {
        success: false,
        error: `Failed to check model availability: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('model-validate', async (event, provider, modelId, apiKey) => {
    try {
      console.log(`DEBUG: Validating model ${modelId} for ${provider}`);
      const result = await ModelAvailabilityService.validateModel(provider, modelId, apiKey);
      
      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Model validation failed:', error);
      return {
        success: false,
        error: `Failed to validate model: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('agent-validate', async (event, persona) => {
    try {
      console.log(`DEBUG: Validating agent configuration for ${persona}`);
      const result = await AgentConfigService.validateAgentConfig(persona);
      
      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Agent validation failed:', error);
      return {
        success: false,
        error: `Failed to validate agent: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('agent-validate-all', async (event) => {
    try {
      console.log('DEBUG: Validating all agent configurations');
      const result = await AgentConfigService.validateAllAgents();
      
      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('All agents validation failed:', error);
      return {
        success: false,
        error: `Failed to validate all agents: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('agent-auto-fix', async (event, persona) => {
    try {
      console.log(`DEBUG: Auto-fixing agent configuration for ${persona}`);
      const result = await AgentConfigService.autoFixAgentConfig(persona);
      
      return {
        success: result.success,
        data: result,
        error: result.error,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Agent auto-fix failed:', error);
      return {
        success: false,
        error: `Failed to auto-fix agent: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('agent-get-models-dynamic', async (event, provider, apiKey) => {
    try {
      console.log(`DEBUG: Getting dynamic models for ${provider}`);
      const result = await AgentConfigService.getModelsForProviderDynamic(provider, apiKey);
      
      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Dynamic models fetch failed:', error);
      return {
        success: false,
        error: `Failed to get dynamic models: ${error}`,
        timestamp: new Date()
      };
    }
  });

  ipcMain.handle('model-clear-cache', async (event) => {
    try {
      console.log('DEBUG: Clearing model availability cache');
      ModelAvailabilityService.clearCache();
      
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Clear model cache failed:', error);
      return {
        success: false,
        error: `Failed to clear cache: ${error}`,
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

  // Test handler to verify IPC communication
  ipcMain.handle('test-ipc', async (event, message) => {
    console.log('DEBUG: Test IPC handler called with message:', message);
    return { success: true, message: `Echo: ${message}` };
  });

  // ========== PROJECT DIRECTOR HANDLERS ==========
  
  ipcMain.handle('project-director-initialize', async (event, projectId) => {
    try {
      // Initialize LLM service if needed
      if (!projectDirectorService['llmService']) {
        const llmService = createLLMService();
        projectDirectorService['llmService'] = llmService;
      }
      
      // Get project context
      const projectResult = await databaseService.getProjectById(projectId);
      const articlesResult = await databaseService.getNewsArticlesByProject(projectId);
      const strategyResult = await databaseService.getCreativeStrategy(projectId);
      
      const projectContext = {
        project: projectResult.success ? projectResult.data : null,
        articles: articlesResult.success ? articlesResult.data : [],
        creativeStrategy: strategyResult.success ? strategyResult.data : null
      };
      
      await projectDirectorService.initializeForProject(projectId, projectContext);
      
      return {
        success: true,
        data: { message: 'Project Director initialized successfully' },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Project Director initialization failed:', error);
      return {
        success: false,
        error: `Project Director initialization failed: ${error}`,
        timestamp: new Date()
      };
    }
  });
  
  ipcMain.handle('project-director-health-check', async (event, projectId) => {
    try {
      // Get fresh project context
      const projectResult = await databaseService.getProjectById(projectId);
      const articlesResult = await databaseService.getNewsArticlesByProject(projectId);
      const strategyResult = await databaseService.getCreativeStrategy(projectId);
      
      const projectContext = {
        project: projectResult.success ? projectResult.data : null,
        articles: articlesResult.success ? articlesResult.data : [],
        creativeStrategy: strategyResult.success ? strategyResult.data : null
      };
      
      // Initialize if needed
      await projectDirectorService.initializeForProject(projectId, projectContext);
      
      const healthCheck = await projectDirectorService.performHealthCheck();
      
      return {
        success: true,
        data: healthCheck,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Project Director health check failed:', error);
      return {
        success: false,
        error: `Health check failed: ${error}`,
        timestamp: new Date()
      };
    }
  });
  
  ipcMain.handle('project-director-strategic-guidance', async (event, query) => {
    try {
      const guidance = await projectDirectorService.getStrategicGuidance(query);
      
      return {
        success: true,
        data: guidance,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Strategic guidance failed:', error);
      return {
        success: false,
        error: `Strategic guidance failed: ${error}`,
        timestamp: new Date()
      };
    }
  });
  
  ipcMain.handle('project-director-monitor-conversation', async (event, persona, userMessage, agentResponse) => {
    try {
      const qualityIssues = await projectDirectorService.monitorAgentConversation(persona, userMessage, agentResponse);
      
      return {
        success: true,
        data: qualityIssues,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Conversation monitoring failed:', error);
      return {
        success: false,
        error: `Conversation monitoring failed: ${error}`,
        timestamp: new Date()
      };
    }
  });

  console.log('IPC handlers setup completed');
}