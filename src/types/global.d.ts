// Global type declarations for the renderer process

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatformInfo: () => Promise<{ platform: string; arch: string }>;
  
  database: {
    testConnection: () => Promise<any>;
    createUser: (userData: any) => Promise<any>;
    authenticateUser: (email: string, password: string) => Promise<any>;
    getUserById: (id: string) => Promise<any>;
    createProject: (projectData: any) => Promise<any>;
    getProjects: (userId: string) => Promise<any>;
    getProjectById: (id: string) => Promise<any>;
    updateProject: (id: string, data: any) => Promise<any>;
    createNewsArticle: (articleData: any) => Promise<any>;
    uploadNewsArticleFile: (fileData: any) => Promise<any>;
    getNewsArticlesByProject: (projectId: string) => Promise<any>;
    getNewsArticle: (id: string) => Promise<any>;
    deleteNewsArticle: (id: string) => Promise<any>;
    createDirectorNotes: (notesData: any) => Promise<any>;
    getDirectorNotes: (projectId: string) => Promise<any>;
    updateDirectorNotes: (id: string, data: any) => Promise<any>;
  };
  
  llm: {
    generatePersonaResponse: (conversationId: string, persona: string, userMessage: string, context: any, agentConfig?: any) => Promise<any>;
    clearConversation: (conversationId: string) => Promise<any>;
    getConversationSummary: (conversationId: string) => Promise<any>;
    generateStructuredOutput: (persona: string, prompt: string, schema: any) => Promise<any>;
    createConversation: (projectId: string, personas: string[]) => Promise<any>;
    addMessage: (conversationId: string, message: any) => Promise<void>;
    getConversationHistory: (conversationId: string) => Promise<any[]>;
  };

  models: {
    checkAvailability: (provider: string, apiKey?: string) => Promise<any>;
    validateModel: (provider: string, modelId: string, apiKey?: string) => Promise<any>;
    clearCache: () => Promise<any>;
  };

  agents: {
    validate: (persona: string) => Promise<any>;
    validateAll: () => Promise<any>;
    autoFix: (persona: string) => Promise<any>;
    getModelsDynamic: (provider: string, apiKey?: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Make this available to modules
declare const window: Window & typeof globalThis;