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

    // News Article operations
    createNewsArticle: (articleData: any) => ipcRenderer.invoke('db-create-article', articleData),
    uploadNewsArticleFile: (fileData: any) => ipcRenderer.invoke('db-upload-article-file', fileData),
    getNewsArticlesByProject: (projectId: string) => ipcRenderer.invoke('db-get-articles-by-project', projectId),
    getNewsArticle: (id: string) => ipcRenderer.invoke('db-get-article', id),
    deleteNewsArticle: (id: string) => ipcRenderer.invoke('db-delete-article', id),

    // Director Notes operations
    createDirectorNotes: (notesData: any) => ipcRenderer.invoke('db-create-director-notes', notesData),
    getDirectorNotes: (projectId: string) => ipcRenderer.invoke('db-get-director-notes', projectId),
    updateDirectorNotes: (id: string, data: any) => ipcRenderer.invoke('db-update-director-notes', id, data),
  },

  // LLM operations (will be implemented in Phase 0)
  llm: {
    generatePersonaResponse: (persona: string, prompt: string, context: any) => 
      ipcRenderer.invoke('llm-generate-response', persona, prompt, context),
    generateStructuredOutput: (persona: string, prompt: string, schema: any) =>
      ipcRenderer.invoke('llm-generate-structured', persona, prompt, schema),
    createConversation: (projectId: string, personas: string[]) =>
      ipcRenderer.invoke('llm-create-conversation', projectId, personas),
    addMessage: (conversationId: string, message: any) =>
      ipcRenderer.invoke('llm-add-message', conversationId, message),
    getConversationHistory: (conversationId: string) =>
      ipcRenderer.invoke('llm-get-conversation', conversationId)
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
  }
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
        createNewsArticle: (articleData: any) => Promise<any>;
        getNewsArticle: (id: string) => Promise<any>;
        createDirectorNotes: (notesData: any) => Promise<any>;
        getDirectorNotes: (projectId: string) => Promise<any>;
        updateDirectorNotes: (id: string, data: any) => Promise<any>;
      };
      llm: {
        generatePersonaResponse: (persona: string, prompt: string, context: any) => Promise<string>;
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
    };
  }
}