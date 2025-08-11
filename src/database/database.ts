// Phase 0: Using mock database instead of SQLite due to native module compilation issues
// This will be replaced with proper SQLite implementation in Phase 1

import { mockDatabaseService } from './mock-database';
import { 
  User, 
  Project, 
  NewsArticle, 
  CreativeStrategy,
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
   * Delete a project and all associated data
   */
  async deleteProject(id: string): Promise<APIResponse<void>> {
    return await mockDatabaseService.deleteProject(id);
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
   * Update news article
   */
  async updateNewsArticle(id: string, updates: Partial<NewsArticle>): Promise<APIResponse<NewsArticle>> {
    return await mockDatabaseService.updateNewsArticle(id, updates);
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

  // ========== CREATIVE STRATEGY OPERATIONS ==========

  /**
   * Create a creative strategy
   */
  async createCreativeStrategy(strategyData: Omit<CreativeStrategy, 'id' | 'created_at' | 'version' | 'status' | 'validation_criteria'>): Promise<APIResponse<CreativeStrategy>> {
    return await mockDatabaseService.createCreativeStrategy(strategyData);
  }

  /**
   * Get creative strategy by project ID
   */
  async getCreativeStrategy(projectId: string): Promise<APIResponse<CreativeStrategy>> {
    return await mockDatabaseService.getCreativeStrategy(projectId);
  }

  /**
   * Generate AI-powered creative strategy
   */
  async generateCreativeStrategy(projectId: string): Promise<APIResponse<CreativeStrategy>> {
    try {
      // Get project details through proper database method
      const projectResult = await mockDatabaseService.getProjectById(projectId);
      if (!projectResult.success) {
        return {
          success: false,
          error: 'Project not found',
          timestamp: new Date()
        };
      }
      const project = projectResult.data;

      // Get articles for context through proper database method
      const articlesResult = await mockDatabaseService.getNewsArticlesByProject(projectId);
      if (!articlesResult.success || !articlesResult.data || articlesResult.data.length === 0) {
        return {
          success: false,
          error: 'No articles found for project. Upload articles first to generate strategy.',
          timestamp: new Date()
        };
      }
      const articles = articlesResult.data;

      // Import LLM service
      const { LLMService } = await import('../services/llm');
      
      // Create a basic config - the actual provider will be determined by agent configuration
      const llmService = new LLMService({
        provider: 'openai', // Default, will be overridden by agent config
        apiKey: '',  // Will be overridden by agent config
      });

      // Construct context from articles
      const articlesContext = articles.map(article => 
        `Title: ${article.title}\nSource: ${article.source || 'Unknown'}\nContent: ${article.content.substring(0, 1000)}...`
      ).join('\n\n---\n\n');

      // Create creative strategy prompt for the Creative Strategist persona
      const userPrompt = `Analyze these news articles and generate a comprehensive creative strategy for a satirical video.

**Project Context:**
- Project Name: ${project?.name || 'Unknown Project'}
- Project Description: ${project?.description || 'No description provided'}

**News Articles to Analyze:**
${articlesContext}

**Your Task:**
Generate a comprehensive creative strategy for a satirical video based on these news articles. Return your response as a JSON object with this exact structure:

{
  "creative_concept": "A detailed description of the core satirical concept and approach (200-400 words)",
  "target_audience": "GENERAL|POLITICAL_SATIRE|SOCIAL_COMMENTARY|MILLENNIAL|GEN_Z",
  "tone": "SUBTLE|OVERT|ABSURDIST|DRY_WIT|SATIRICAL_NEWS",
  "key_themes": ["theme1", "theme2", "theme3"],
  "satirical_angles": [
    {
      "angle_type": "IRONY|EXAGGERATION|PARODY|SUBVERSION",
      "description": "Description of this satirical approach",
      "key_elements": ["element1", "element2", "element3"]
    }
  ],
  "character_archetypes": [
    {
      "name": "Character Name",
      "role": "Their role in the video",
      "satirical_traits": ["trait1", "trait2"],
      "visual_description": "Physical appearance and style"
    }
  ],
  "visual_style_guide": {
    "color_palette": "Description of color scheme",
    "cinematography_notes": "Camera angles, lighting, shot composition notes",
    "overall_aesthetic": "Overall visual style description"
  }
}

Focus on creating content that:
- Exposes contradictions and absurdities in the original news
- Uses humor to make social commentary
- Is engaging and shareable
- Maintains satirical edge without crossing into mean-spirited territory
- Works well for AI video generation platforms

Generate a creative, witty strategy that transforms these news articles into compelling satirical content.`;

      // Call LLM with Creative Strategist persona
      const response = await llmService.generateResponse(
        `strategy_${projectId}`,
        'CREATIVE_STRATEGIST',
        userPrompt,
        { project, articles }
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to generate strategy with AI',
          timestamp: new Date()
        };
      }

      // Parse the JSON response
      let strategyData;
      try {
        // Clean the response - remove any markdown code block formatting
        let cleanContent = (response.response || '').trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        strategyData = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', parseError);
        console.error('Raw response:', response.response);
        return {
          success: false,
          error: 'Failed to parse AI-generated strategy. Please try again.',
          timestamp: new Date()
        };
      }

      // Generate unique ID for the strategy
      const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create the CreativeStrategy object
      const strategy: CreativeStrategy = {
        id: strategyId,
        project_id: projectId,
        creative_concept: strategyData.creative_concept,
        satirical_angles: strategyData.satirical_angles,
        target_audience: strategyData.target_audience,
        tone: strategyData.tone,
        key_themes: strategyData.key_themes,
        character_archetypes: strategyData.character_archetypes,
        visual_style_guide: strategyData.visual_style_guide,
        validation_criteria: {
          theme_consistency: true,
          character_coherence: true,
          satirical_effectiveness: true,
          technical_feasibility: true
        },
        status: 'DRAFT',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'ai-creative-strategist'
      };

      // Save to mock database through proper method
      await mockDatabaseService.createCreativeStrategy(strategy);

      return {
        success: true,
        data: strategy,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Generate creative strategy failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      };
    }
  }

  /**
   * Update creative strategy
   */
  async updateCreativeStrategy(strategyId: string, updates: Partial<CreativeStrategy>): Promise<APIResponse<CreativeStrategy>> {
    return await mockDatabaseService.updateCreativeStrategy(strategyId, updates);
  }

  /**
   * Generate director's notes from strategy
   */
  async generateDirectorNotes(strategyId: string): Promise<APIResponse<DirectorNotes>> {
    // For Phase 0, keep the LLM-powered director notes generation in the mock implementation
    // The creative strategy generation above uses real LLM, which is the main focus
    // Director notes generation will be enhanced in Phase 1 with proper database queries
    return await mockDatabaseService.generateDirectorNotes(strategyId);
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