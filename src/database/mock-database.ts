// Mock Database Service for Phase 0 - Simple in-memory storage
// This will be replaced with proper SQLite integration in Phase 1

import { 
  User, 
  Project, 
  NewsArticle, 
  DirectorNotes, 
  Script, 
  Conversation,
  Message,
  APIResponse 
} from '../shared/types';
import { generateId } from '../shared/utils';

/**
 * Mock Database Service for Phase 0 testing
 * Uses in-memory storage instead of SQLite
 */
export class MockDatabaseService {
  private users: User[] = [];
  private projects: Project[] = [];
  private newsArticles: NewsArticle[] = [];
  private directorNotes: DirectorNotes[] = [];
  private scripts: Script[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private initialized = false;

  /**
   * Initialize the mock database
   */
  async initialize(): Promise<void> {
    console.log('Initializing Mock Database Service...');
    this.initialized = true;
    console.log('Mock Database initialized successfully');
  }

  /**
   * Mock migration (no-op)
   */
  async migrate(): Promise<void> {
    console.log('Mock database migration completed');
  }

  /**
   * Close database (no-op for mock)
   */
  close(): void {
    console.log('Mock database connection closed');
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<APIResponse<{ userCount: number; projectCount: number; articlesCount: number }>> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Database not initialized',
        timestamp: new Date()
      };
    }

    try {
      return {
        success: true,
        data: {
          userCount: this.users.length,
          projectCount: this.projects.length,
          articlesCount: this.newsArticles.length
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Database test failed:', error);
      return {
        success: false,
        error: `Database test failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  // ========== USER OPERATIONS ==========

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<APIResponse<User>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if email already exists
      const existingUser = this.users.find(u => u.email === userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Email already exists',
          timestamp: new Date()
        };
      }

      const user: User = {
        id: generateId(),
        ...userData,
        created_at: new Date()
      };

      this.users.push(user);

      return {
        success: true,
        data: { ...user, password_hash: undefined }, // Don't return password hash
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      return {
        success: false,
        error: `Failed to create user: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<APIResponse<User>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const user = this.users.find(u => u.id === id);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: { ...user, password_hash: undefined }, // Don't return password hash
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get user:', error);
      return {
        success: false,
        error: `Failed to get user: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    return this.users.find(u => u.email === email) || null;
  }

  // ========== PROJECT OPERATIONS ==========

  /**
   * Create a new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'created_at'>): Promise<APIResponse<Project>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const project: Project = {
        id: generateId(),
        ...projectData,
        created_at: new Date()
      };

      this.projects.push(project);

      return {
        success: true,
        data: project,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to create project:', error);
      return {
        success: false,
        error: `Failed to create project: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get projects for a user
   */
  async getProjectsForUser(userId: string): Promise<APIResponse<Project[]>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const projects = this.projects.filter(p => p.created_by === userId);

      return {
        success: true,
        data: projects,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get projects:', error);
      return {
        success: false,
        error: `Failed to get projects: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<APIResponse<Project>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const project = this.projects.find(p => p.id === id);

      if (!project) {
        return {
          success: false,
          error: 'Project not found',
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: project,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get project:', error);
      return {
        success: false,
        error: `Failed to get project: ${error}`,
        timestamp: new Date()
      };
    }
  }

  // ========== NEWS ARTICLE OPERATIONS ==========

  /**
   * Create a news article
   */
  async createNewsArticle(articleData: Omit<NewsArticle, 'id' | 'created_at'>): Promise<APIResponse<NewsArticle>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const article: NewsArticle = {
        id: generateId(),
        ...articleData,
        created_at: new Date()
      };

      this.newsArticles.push(article);

      return {
        success: true,
        data: article,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to create news article:', error);
      return {
        success: false,
        error: `Failed to create news article: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Upload a news article file
   */
  async uploadNewsArticleFile(fileData: {
    title: string;
    source?: string;
    url?: string;
    processing_notes?: string;
    project_id: string;
    uploaded_by: string;
    fileName: string;
    fileData: string; // Base64 encoded file content
    fileType: string;
  }): Promise<APIResponse<NewsArticle>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // In a real implementation, we would process the file content
      // For now, we'll simulate file processing
      let processedContent = '';
      
      if (fileData.fileType.includes('text/plain')) {
        // Decode base64 text file
        processedContent = Buffer.from(fileData.fileData, 'base64').toString('utf8');
      } else if (fileData.fileType.includes('pdf') || fileData.fileType.includes('doc')) {
        // For PDF/DOC files, we would use a proper parser
        // For now, just indicate that it's processed content
        processedContent = `[Processed content from ${fileData.fileName}]\n\nThis would contain the extracted text from the uploaded ${fileData.fileType} file. In a real implementation, we would use appropriate parsers for different file types.`;
      } else {
        processedContent = `[File content from ${fileData.fileName}]`;
      }

      const article: NewsArticle = {
        id: generateId(),
        title: fileData.title,
        source: fileData.source,
        url: fileData.url,
        content: processedContent,
        processing_notes: fileData.processing_notes,
        project_id: fileData.project_id,
        uploaded_by: fileData.uploaded_by,
        file_name: fileData.fileName,
        file_type: fileData.fileType,
        created_at: new Date()
      };

      this.newsArticles.push(article);

      return {
        success: true,
        data: article,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to upload news article file:', error);
      return {
        success: false,
        error: `Failed to upload file: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get news articles for a project
   */
  async getNewsArticlesByProject(projectId: string): Promise<APIResponse<NewsArticle[]>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const articles = this.newsArticles.filter(article => article.project_id === projectId);
      
      return {
        success: true,
        data: articles,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get news articles:', error);
      return {
        success: false,
        error: `Failed to get news articles: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get news article by ID
   */
  async getNewsArticleById(id: string): Promise<APIResponse<NewsArticle>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const article = this.newsArticles.find(a => a.id === id);
      
      if (!article) {
        return {
          success: false,
          error: 'News article not found',
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: article,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get news article:', error);
      return {
        success: false,
        error: `Failed to get news article: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Delete news article
   */
  async deleteNewsArticle(id: string): Promise<APIResponse<boolean>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const index = this.newsArticles.findIndex(a => a.id === id);
      
      if (index === -1) {
        return {
          success: false,
          error: 'News article not found',
          timestamp: new Date()
        };
      }

      this.newsArticles.splice(index, 1);

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to delete news article:', error);
      return {
        success: false,
        error: `Failed to delete news article: ${error}`,
        timestamp: new Date()
      };
    }
  }

  // ========== DIRECTOR NOTES OPERATIONS ==========

  /**
   * Create director notes
   */
  async createDirectorNotes(notesData: Omit<DirectorNotes, 'id' | 'created_at'>): Promise<APIResponse<DirectorNotes>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const notes: DirectorNotes = {
        id: generateId(),
        ...notesData,
        created_at: new Date()
      };

      this.directorNotes.push(notes);

      return {
        success: true,
        data: notes,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to create director notes:', error);
      return {
        success: false,
        error: `Failed to create director notes: ${error}`,
        timestamp: new Date()
      };
    }
  }

  // ========== CONVERSATION OPERATIONS ==========

  /**
   * Create a new conversation
   */
  async createConversation(conversationData: Omit<Conversation, 'id' | 'created_at'>): Promise<APIResponse<Conversation>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const conversation: Conversation = {
        id: generateId(),
        ...conversationData,
        created_at: new Date()
      };

      this.conversations.push(conversation);

      return {
        success: true,
        data: conversation,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return {
        success: false,
        error: `Failed to create conversation: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<APIResponse<Message>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const message: Message = {
        id: generateId(),
        ...messageData,
        created_at: new Date()
      };

      this.messages.push(message);

      return {
        success: true,
        data: message,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to add message:', error);
      return {
        success: false,
        error: `Failed to add message: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string): Promise<APIResponse<Message[]>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const messages = this.messages.filter(m => m.conversation_id === conversationId);

      return {
        success: true,
        data: messages,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get conversation messages:', error);
      return {
        success: false,
        error: `Failed to get conversation messages: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get database statistics for testing
   */
  getStats() {
    return {
      users: this.users.length,
      projects: this.projects.length,
      newsArticles: this.newsArticles.length,
      conversations: this.conversations.length,
      messages: this.messages.length,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const mockDatabaseService = new MockDatabaseService();