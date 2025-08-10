// Phase 0: Using mock database instead of SQLite due to native module compilation issues
// This will be replaced with proper SQLite implementation in Phase 1

import { mockDatabaseService } from './mock-database';
import { 
  User, 
  Project, 
  NewsArticle, 
  DirectorNotes, 
  Conversation,
  Message,
  APIResponse 
} from '../shared/types';

/**
 * DatabaseService - Phase 0 wrapper around mock database
 * Will be replaced with proper SQLite implementation in Phase 1
 */
export class DatabaseService {
  
  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    try {
      console.log('Phase 0: Using mock database service');
      await mockDatabaseService.initialize();
      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Run database migrations (mock)
   */
  async migrate(): Promise<void> {
    return await mockDatabaseService.migrate();
  }

  /**
   * Close database connection
   */
  close(): void {
    mockDatabaseService.close();
  }

  /**
   * Get mock database instance for testing
   */
  getDatabase(): any {
    if (!mockDatabaseService.isInitialized()) {
      throw new Error('Database not initialized');
    }
    return {
      prepare: (sql: string) => {
        // Mock prepare method for compatibility
        return {
          get: () => ({ count: mockDatabaseService.getStats().users }),
          all: () => [],
          run: () => ({ changes: 1 })
        };
      }
    };
  }

  // ========== DELEGATED OPERATIONS TO MOCK SERVICE ==========

  /**
   * Test database connection
   */
  async testConnection(): Promise<APIResponse<{ userCount: number; projectCount: number; articlesCount: number }>> {
    return await mockDatabaseService.testConnection();
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<APIResponse<User>> {
    return await mockDatabaseService.createUser(userData);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<APIResponse<User>> {
    return await mockDatabaseService.getUserById(id);
  }

  /**
   * Get user by email (for authentication)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await mockDatabaseService.getUserByEmail(email);
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'created_at'>): Promise<APIResponse<Project>> {
    return await mockDatabaseService.createProject(projectData);
  }

  /**
   * Get projects for a user
   */
  async getProjectsForUser(userId: string): Promise<APIResponse<Project[]>> {
    return await mockDatabaseService.getProjectsForUser(userId);
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<APIResponse<Project>> {
    return await mockDatabaseService.getProjectById(id);
  }

  /**
   * Create a news article
   */
  async createNewsArticle(articleData: Omit<NewsArticle, 'id' | 'created_at'>): Promise<APIResponse<NewsArticle>> {
    return await mockDatabaseService.createNewsArticle(articleData);
  }

  /**
   * Upload a news article file
   */
  async uploadNewsArticleFile(fileData: any): Promise<APIResponse<NewsArticle>> {
    return await mockDatabaseService.uploadNewsArticleFile(fileData);
  }

  /**
   * Get news articles for a project
   */
  async getNewsArticlesByProject(projectId: string): Promise<APIResponse<NewsArticle[]>> {
    return await mockDatabaseService.getNewsArticlesByProject(projectId);
  }

  /**
   * Get news article by ID
   */
  async getNewsArticleById(id: string): Promise<APIResponse<NewsArticle>> {
    return await mockDatabaseService.getNewsArticleById(id);
  }

  /**
   * Delete news article
   */
  async deleteNewsArticle(id: string): Promise<APIResponse<boolean>> {
    return await mockDatabaseService.deleteNewsArticle(id);
  }

  /**
   * Create director notes
   */
  async createDirectorNotes(notesData: Omit<DirectorNotes, 'id' | 'created_at'>): Promise<APIResponse<DirectorNotes>> {
    return await mockDatabaseService.createDirectorNotes(notesData);
  }

  /**
   * Create a new conversation
   */
  async createConversation(conversationData: Omit<Conversation, 'id' | 'created_at'>): Promise<APIResponse<Conversation>> {
    return await mockDatabaseService.createConversation(conversationData);
  }

  /**
   * Add message to conversation
   */
  async addMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<APIResponse<Message>> {
    return await mockDatabaseService.addMessage(messageData);
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string): Promise<APIResponse<Message[]>> {
    return await mockDatabaseService.getConversationMessages(conversationId);
  }
}

// Singleton instance
export const databaseService = new DatabaseService();