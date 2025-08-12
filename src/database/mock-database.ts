// Mock Database Service for Phase 0 - Simple in-memory storage
// This will be replaced with proper SQLite integration in Phase 1

import { 
  User, 
  Project, 
  NewsArticle, 
  DirectorNotes,
  CreativeStrategy,
  Script, 
  Conversation,
  Message,
  APIResponse 
} from '../shared/types';
import { generateId } from '../shared/utils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mock Database Service for Phase 0 testing
 * Uses in-memory storage instead of SQLite
 */
export class MockDatabaseService {
  private users: User[] = [];
  private projects: Project[] = [];
  private newsArticles: NewsArticle[] = [];
  private creativeStrategies: CreativeStrategy[] = [];
  private directorNotes: DirectorNotes[] = [];
  private scripts: Script[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private initialized = false;
  private dataFilePath: string;

  constructor() {
    // Store data in user's app data directory
    const os = require('os');
    const appDataDir = path.join(os.homedir(), '.satirical-video-platform');
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    this.dataFilePath = path.join(appDataDir, 'mock-database.json');
  }

  /**
   * Initialize the mock database
   */
  async initialize(): Promise<void> {
    console.log('Initializing Mock Database Service...');
    
    // Load existing data from file if it exists
    await this.loadData();
    
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
   * Load data from JSON file
   */
  private async loadData(): Promise<void> {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const rawData = fs.readFileSync(this.dataFilePath, 'utf8');
        const data = JSON.parse(rawData);
        
        // Convert date strings back to Date objects
        this.users = (data.users || []).map((user: any) => ({
          ...user,
          created_at: new Date(user.created_at),
          updated_at: user.updated_at ? new Date(user.updated_at) : undefined
        }));
        
        this.projects = (data.projects || []).map((project: any) => ({
          ...project,
          created_at: new Date(project.created_at),
          updated_at: project.updated_at ? new Date(project.updated_at) : undefined
        }));
        
        this.newsArticles = (data.newsArticles || []).map((article: any) => ({
          ...article,
          created_at: new Date(article.created_at),
          updated_at: article.updated_at ? new Date(article.updated_at) : undefined
        }));
        
        this.creativeStrategies = (data.creativeStrategies || []).map((strategy: any) => ({
          ...strategy,
          created_at: new Date(strategy.created_at),
          updated_at: strategy.updated_at ? new Date(strategy.updated_at) : undefined
        }));
        
        this.directorNotes = (data.directorNotes || []).map((notes: any) => ({
          ...notes,
          created_at: new Date(notes.created_at),
          updated_at: notes.updated_at ? new Date(notes.updated_at) : undefined
        }));
        
        this.scripts = data.scripts || [];
        this.conversations = data.conversations || [];
        this.messages = data.messages || [];
        
        console.log(`Loaded ${this.projects.length} projects, ${this.newsArticles.length} articles from persistent storage`);
      } else {
        console.log('No existing data file found, starting with empty database');
      }
    } catch (error) {
      console.error('Failed to load data from file:', error);
      // Continue with empty arrays if file load fails
    }
  }

  /**
   * Save data to JSON file
   */
  private async saveData(): Promise<void> {
    try {
      const data = {
        users: this.users,
        projects: this.projects,
        newsArticles: this.newsArticles,
        creativeStrategies: this.creativeStrategies,
        directorNotes: this.directorNotes,
        scripts: this.scripts,
        conversations: this.conversations,
        messages: this.messages,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save data to file:', error);
    }
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

      // Save to persistent storage
      await this.saveData();

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

  /**
   * Update project satirical context
   */
  async updateProjectContext(projectId: string, contextType: string): Promise<APIResponse<Project>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const projectIndex = this.projects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) {
        return {
          success: false,
          error: 'Project not found',
          timestamp: new Date()
        };
      }

      // Import the satirical context service
      const { SatiricalContextService } = await import('../services/satirical-context.js');
      const contextData = SatiricalContextService.getContextByType(contextType as any);
      
      if (!contextData) {
        return {
          success: false,
          error: 'Invalid satirical context type',
          timestamp: new Date()
        };
      }

      // Update the project with satirical context
      this.projects[projectIndex] = {
        ...this.projects[projectIndex],
        satirical_context: contextData,
        updated_at: new Date()
      };

      // Save to persistent storage
      await this.saveData();

      return {
        success: true,
        data: this.projects[projectIndex],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to update project context:', error);
      return {
        success: false,
        error: `Failed to update project context: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Delete a project and all associated data
   */
  async deleteProject(id: string): Promise<APIResponse<void>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if project exists
      const projectIndex = this.projects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        return {
          success: false,
          error: 'Project not found',
          timestamp: new Date()
        };
      }

      // Delete all associated data
      
      // 1. Delete news articles for this project
      this.newsArticles = this.newsArticles.filter(article => article.project_id !== id);
      
      // 2. Delete creative strategies for this project
      this.creativeStrategies = this.creativeStrategies.filter(strategy => strategy.project_id !== id);
      
      // 3. Delete director notes for this project
      this.directorNotes = this.directorNotes.filter(notes => notes.project_id !== id);
      
      // 4. Delete scripts for this project
      this.scripts = this.scripts.filter(script => script.project_id !== id);
      
      // 5. Delete conversations for this project (if any exist)
      this.conversations = this.conversations.filter(conv => conv.project_id !== id);

      // 6. Finally, delete the project itself
      this.projects.splice(projectIndex, 1);

      // Save the changes to persistent storage
      await this.saveData();

      console.log(`Project ${id} and all associated data deleted successfully`);

      return {
        success: true,
        data: undefined,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to delete project:', error);
      return {
        success: false,
        error: `Failed to delete project: ${error}`,
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

      // Save to persistent storage
      await this.saveData();

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
   * Update news article
   */
  async updateNewsArticle(id: string, updates: Partial<NewsArticle>): Promise<APIResponse<NewsArticle>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const index = this.newsArticles.findIndex(a => a.id === id);
      
      if (index === -1) {
        return {
          success: false,
          error: 'Article not found',
          timestamp: new Date()
        };
      }

      // Update article with new data
      const updatedArticle = {
        ...this.newsArticles[index],
        ...updates,
        updated_at: new Date()
      };

      this.newsArticles[index] = updatedArticle;

      // Save to persistent storage
      await this.saveData();

      return {
        success: true,
        data: updatedArticle,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to update news article:', error);
      return {
        success: false,
        error: `Failed to update news article: ${error}`,
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

  // ========== CREATIVE STRATEGY OPERATIONS ==========

  /**
   * Create a creative strategy
   */
  async createCreativeStrategy(strategyData: Omit<CreativeStrategy, 'id' | 'created_at' | 'version' | 'status' | 'validation_criteria'>): Promise<APIResponse<CreativeStrategy>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // Validate project exists
      const project = this.projects.find(p => p.id === strategyData.project_id);
      if (!project) {
        return {
          success: false,
          error: 'Project not found',
          timestamp: new Date()
        };
      }

      // Create validation criteria based on strategy completeness
      const validation_criteria = {
        theme_consistency: strategyData.key_themes.length > 0,
        character_coherence: strategyData.character_archetypes.length > 0,
        satirical_effectiveness: strategyData.satirical_angles.length > 0,
        technical_feasibility: !!strategyData.visual_style_guide
      };

      const strategy: CreativeStrategy = {
        id: generateId(),
        ...strategyData,
        status: 'DRAFT',
        version: 1,
        validation_criteria,
        created_at: new Date()
      };

      this.creativeStrategies.push(strategy);

      // Save to persistent storage
      await this.saveData();

      return {
        success: true,
        data: strategy,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to create creative strategy:', error);
      return {
        success: false,
        error: `Failed to create creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get creative strategy by project ID
   */
  async getCreativeStrategy(projectId: string): Promise<APIResponse<CreativeStrategy>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const strategy = this.creativeStrategies.find(s => s.project_id === projectId);
      
      if (!strategy) {
        return {
          success: false,
          error: 'Creative strategy not found',
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: strategy,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get creative strategy:', error);
      return {
        success: false,
        error: `Failed to get creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate AI-powered creative strategy
   */
  async generateCreativeStrategy(projectId: string): Promise<APIResponse<CreativeStrategy>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      // Validate project exists
      const project = this.projects.find(p => p.id === projectId);
      if (!project) {
        return {
          success: false,
          error: 'Project not found',
          timestamp: new Date()
        };
      }

      // Get articles for context
      const articles = this.newsArticles.filter(a => a.project_id === projectId);
      if (articles.length === 0) {
        return {
          success: false,
          error: 'No articles found for project. Upload articles first to generate strategy.',
          timestamp: new Date()
        };
      }

      // Mock AI generation - create a sample strategy based on project data
      const strategy: CreativeStrategy = {
        id: generateId(),
        project_id: projectId,
        creative_concept: `Satirical take on current events focusing on "${articles[0].title}". Using modern media critique to expose societal contradictions through exaggerated news broadcast format.`,
        satirical_angles: [
          {
            angle_type: 'EXAGGERATION',
            description: 'Amplify the absurd elements in mainstream media coverage',
            key_elements: ['Over-the-top presenter reactions', 'Ridiculous expert interviews', 'Unnecessary dramatic music']
          },
          {
            angle_type: 'PARODY',
            description: 'Mock traditional news broadcast format',
            key_elements: ['Fake breaking news alerts', 'Pretentious anchor dialogue', 'Meaningless graphics and stats']
          }
        ],
        target_audience: 'SOCIAL_COMMENTARY',
        tone: 'DRY_WIT',
        key_themes: ['Media manipulation', 'Social disconnect', 'Political theater'],
        character_archetypes: [
          {
            name: 'The Clueless Anchor',
            role: 'News presenter',
            satirical_traits: ['Out of touch with reality', 'Overly dramatic delivery', 'Misses obvious points'],
            visual_description: 'Perfectly groomed but vacant expression, expensive suit'
          },
          {
            name: 'The Expert Nobody',
            role: 'Commentary provider',
            satirical_traits: ['Speaks in buzzwords', 'Never actually answers questions', 'Claims expertise in everything'],
            visual_description: 'Generic business attire, perpetually confused look'
          }
        ],
        visual_style_guide: {
          color_palette: 'Corporate news colors - red, blue, white with harsh lighting',
          cinematography_notes: 'Static shots mimicking news broadcasts, occasional dramatic zoom-ins',
          overall_aesthetic: 'Sterile news studio environment with overly serious presentation'
        },
        validation_criteria: {
          theme_consistency: true,
          character_coherence: true,
          satirical_effectiveness: true,
          technical_feasibility: true
        },
        status: 'DRAFT',
        version: 1,
        generated_by_persona: 'CREATIVE_STRATEGIST',
        created_by: 'temp-user-id',
        created_at: new Date()
      };

      this.creativeStrategies.push(strategy);

      // Save to persistent storage
      await this.saveData();

      return {
        success: true,
        data: strategy,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to generate creative strategy:', error);
      return {
        success: false,
        error: `Failed to generate creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Update creative strategy
   */
  async updateCreativeStrategy(strategyId: string, updates: Partial<CreativeStrategy>): Promise<APIResponse<CreativeStrategy>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const index = this.creativeStrategies.findIndex(s => s.id === strategyId);
      
      if (index === -1) {
        return {
          success: false,
          error: 'Creative strategy not found',
          timestamp: new Date()
        };
      }

      // Update strategy with new version
      const currentStrategy = this.creativeStrategies[index];
      const updatedStrategy = {
        ...currentStrategy,
        ...updates,
        version: currentStrategy.version + 1,
        updated_at: new Date()
      };

      this.creativeStrategies[index] = updatedStrategy;

      return {
        success: true,
        data: updatedStrategy,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to update creative strategy:', error);
      return {
        success: false,
        error: `Failed to update creative strategy: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate director's notes from strategy
   */
  async generateDirectorNotes(strategyId: string): Promise<APIResponse<DirectorNotes>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    try {
      const strategy = this.creativeStrategies.find(s => s.id === strategyId);
      
      if (!strategy) {
        return {
          success: false,
          error: 'Creative strategy not found',
          timestamp: new Date()
        };
      }

      // Generate director's notes based on strategy
      const directorNotes: DirectorNotes = {
        id: generateId(),
        project_id: strategy.project_id,
        creative_strategy_id: strategyId,
        summary: `Director's notes generated from creative strategy. ${strategy.creative_concept}`,
        satirical_hook: strategy.satirical_angles.map(angle => angle.description).join('. '),
        characters: strategy.character_archetypes.map(char => 
          `${char.name} (${char.role}): ${char.satirical_traits.join(', ')}`
        ).join('\n'),
        visual_concepts: `${strategy.visual_style_guide.overall_aesthetic || 'Modern satirical style'}. ${strategy.visual_style_guide.cinematography_notes || ''}`,
        status: 'DRAFT',
        version: 1,
        created_at: new Date()
      };

      this.directorNotes.push(directorNotes);

      return {
        success: true,
        data: directorNotes,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to generate director notes:', error);
      return {
        success: false,
        error: `Failed to generate director notes: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Update project satirical format
   */
  async updateProjectFormat(projectId: string, formatType: string): Promise<APIResponse<Project>> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }
    
    try {
      const projectIndex = this.projects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) {
        return {
          success: false,
          error: 'Project not found',
          timestamp: new Date()
        };
      }
      
      // Validate the format type
      const validFormats = ['NEWS_PARODY', 'VOX_POP', 'MORNING_TV_INTERVIEW', 'MOCKUMENTARY', 'SOCIAL_MEDIA', 'SKETCH_COMEDY', 'SATIRICAL_ARTICLE', 'PANEL_SHOW', 'COMMERCIAL_PARODY', 'REALITY_TV_PARODY'];
      if (!validFormats.includes(formatType)) {
        return {
          success: false,
          error: 'Invalid satirical format type',
          timestamp: new Date()
        };
      }
      
      // Update the project with satirical format
      this.projects[projectIndex] = {
        ...this.projects[projectIndex],
        satirical_format: formatType as any,
        updated_at: new Date()
      };
      
      // Save to persistent storage
      await this.saveData();
      
      return {
        success: true,
        data: this.projects[projectIndex],
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Failed to update project format:', error);
      return {
        success: false,
        error: `Failed to update project format: ${error}`,
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
      creativeStrategies: this.creativeStrategies.length,
      conversations: this.conversations.length,
      messages: this.messages.length,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const mockDatabaseService = new MockDatabaseService();