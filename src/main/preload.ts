import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getPlatformInfo: () => ipcRenderer.invoke('platform-info'),

  // Database operations (will be implemented in Phase 0)
  database: {
    // Test connection
    testConnection: () => ipcRenderer.invoke('db-test-connection'),
    
    // User operations
    createUser: (userData: any) => ipcRenderer.invoke('db-create-user', userData),
    authenticateUser: (email: string, password: string) => 
      ipcRenderer.invoke('db-authenticate-user', email, password),
    getUserById: (id: string) => ipcRenderer.invoke('db-get-user', id),

    // Project operations
    createProject: (projectData: any) => ipcRenderer.invoke('db-create-project', projectData),
    getProjects: (userId: string) => ipcRenderer.invoke('db-get-projects', userId),
    getProjectById: (id: string) => ipcRenderer.invoke('db-get-project', id),
    updateProject: (id: string, data: any) => ipcRenderer.invoke('db-update-project', id, data),
    updateProjectFormat: (projectId: string, formatType: string) => ipcRenderer.invoke('db-update-project-format', projectId, formatType),
    deleteProject: (id: string) => ipcRenderer.invoke('db-delete-project', id),

    // News Article operations
    createNewsArticle: (articleData: any) => ipcRenderer.invoke('db-create-article', articleData),
    uploadNewsArticleFile: (fileData: any) => ipcRenderer.invoke('db-upload-article-file', fileData),
    getNewsArticlesByProject: (projectId: string) => ipcRenderer.invoke('db-get-articles-by-project', projectId),
    getNewsArticle: (id: string) => ipcRenderer.invoke('db-get-article', id),
    updateNewsArticle: (id: string, updates: any) => ipcRenderer.invoke('db-update-news-article', id, updates),
    deleteNewsArticle: (id: string) => ipcRenderer.invoke('db-delete-article', id),

    // Creative Strategy operations  
    createCreativeStrategy: (strategyData: any) => ipcRenderer.invoke('db-create-creative-strategy', strategyData),
    getCreativeStrategy: (projectId: string) => ipcRenderer.invoke('db-get-creative-strategy', projectId),
    updateProjectContext: (projectId: string, contextType: string) => ipcRenderer.invoke('db-update-project-context', projectId, contextType),
    generateCreativeStrategy: (projectId: string) => ipcRenderer.invoke('db-generate-creative-strategy', projectId),
    updateCreativeStrategy: (id: string, updates: any) => ipcRenderer.invoke('db-update-creative-strategy', id, updates),
    generateDirectorNotes: (strategyId: string) => ipcRenderer.invoke('db-generate-director-notes', strategyId),

    // Director Notes operations
    createDirectorNotes: (notesData: any) => ipcRenderer.invoke('db-create-director-notes', notesData),
    getDirectorNotes: (projectId: string) => ipcRenderer.invoke('db-get-director-notes', projectId),
    updateDirectorNotes: (id: string, data: any) => ipcRenderer.invoke('db-update-director-notes', id, data),
  },

  // LLM operations
  llm: {
    generatePersonaResponse: (conversationId: string, persona: string, userMessage: string, context: any, agentConfig?: any) => 
      ipcRenderer.invoke('llm-generate-response', conversationId, persona, userMessage, context, agentConfig),
    clearConversation: (conversationId: string) =>
      ipcRenderer.invoke('llm-clear-conversation', conversationId),
    getConversationSummary: (conversationId: string) =>
      ipcRenderer.invoke('llm-get-conversation-summary', conversationId),
    generateStructuredOutput: (persona: string, prompt: string, schema: any) =>
      ipcRenderer.invoke('llm-generate-structured', persona, prompt, schema),
    createConversation: (projectId: string, personas: string[]) =>
      ipcRenderer.invoke('llm-create-conversation', projectId, personas),
    addMessage: (conversationId: string, message: any) =>
      ipcRenderer.invoke('llm-add-message', conversationId, message),
    getConversationHistory: (conversationId: string) =>
      ipcRenderer.invoke('llm-get-conversation', conversationId)
  },

  // Model validation operations
  models: {
    checkAvailability: (provider: string, apiKey?: string) =>
      ipcRenderer.invoke('model-check-availability', provider, apiKey),
    validateModel: (provider: string, modelId: string, apiKey?: string) =>
      ipcRenderer.invoke('model-validate', provider, modelId, apiKey),
    clearCache: () =>
      ipcRenderer.invoke('model-clear-cache')
  },

  // Agent validation operations
  agents: {
    validate: (persona: string) =>
      ipcRenderer.invoke('agent-validate', persona),
    validateAll: () =>
      ipcRenderer.invoke('agent-validate-all'),
    autoFix: (persona: string) =>
      ipcRenderer.invoke('agent-auto-fix', persona),
    getModelsDynamic: (provider: string, apiKey?: string) =>
      ipcRenderer.invoke('agent-get-models-dynamic', provider, apiKey)
  },

  // File operations
  files: {
    saveFile: (filepath: string, content: string) => 
      ipcRenderer.invoke('file-save', filepath, content),
    readFile: (filepath: string) => ipcRenderer.invoke('file-read', filepath),
    selectFile: () => ipcRenderer.invoke('file-select')
  },

  // Utilities
  utils: {
    generateId: () => ipcRenderer.invoke('util-generate-id'),
    validateShotDuration: (seconds: number) => ipcRenderer.invoke('util-validate-duration', seconds),
    sanitizeInput: (input: string) => ipcRenderer.invoke('util-sanitize', input)
  },
  
  // Project Director operations
  projectDirector: {
    initialize: (projectId: string) => ipcRenderer.invoke('project-director-initialize', projectId),
    performHealthCheck: (projectId: string) => ipcRenderer.invoke('project-director-health-check', projectId),
    getStrategicGuidance: (query: string) => ipcRenderer.invoke('project-director-strategic-guidance', query),
    monitorConversation: (persona: string, userMessage: string, agentResponse: string) => 
      ipcRenderer.invoke('project-director-monitor-conversation', persona, userMessage, agentResponse)
  },

  // Test IPC
  testIPC: (message: string) => ipcRenderer.invoke('test-ipc', message)
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getPlatformInfo: () => Promise<{platform: string, arch: string, version: string}>;
      database: {
        testConnection: () => Promise<any>;
        createUser: (userData: any) => Promise<any>;
        authenticateUser: (email: string, password: string) => Promise<any>;
        getUserById: (id: string) => Promise<any>;
        createProject: (projectData: any) => Promise<any>;
        getProjects: (userId: string) => Promise<any[]>;
        getProjectById: (id: string) => Promise<any>;
        updateProject: (id: string, data: any) => Promise<any>;
        updateProjectFormat: (projectId: string, formatType: string) => Promise<any>;
        deleteProject: (id: string) => Promise<any>;
        createNewsArticle: (articleData: any) => Promise<any>;
        getNewsArticle: (id: string) => Promise<any>;
        updateNewsArticle: (id: string, updates: any) => Promise<any>;
        createCreativeStrategy: (strategyData: any) => Promise<any>;
        getCreativeStrategy: (projectId: string) => Promise<any>;
        generateCreativeStrategy: (projectId: string) => Promise<any>;
        updateCreativeStrategy: (id: string, updates: any) => Promise<any>;
        generateDirectorNotes: (strategyId: string) => Promise<any>;
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
      files: {
        saveFile: (filepath: string, content: string) => Promise<boolean>;
        readFile: (filepath: string) => Promise<string>;
        selectFile: () => Promise<string>;
      };
      utils: {
        generateId: () => Promise<string>;
        validateShotDuration: (seconds: number) => Promise<boolean>;
        sanitizeInput: (input: string) => Promise<string>;
      };
      projectDirector: {
        initialize: (projectId: string) => Promise<any>;
        performHealthCheck: (projectId: string) => Promise<any>;
        getStrategicGuidance: (query: string) => Promise<any>;
        monitorConversation: (persona: string, userMessage: string, agentResponse: string) => Promise<any>;
      };
      testIPC: (message: string) => Promise<any>;
    };
  }
}