// Modern AI Chat Interface
// Redesigned to match modern AI chat UX (Claude/ChatGPT style)

import { PersonaType } from '../../shared/types/index.js';
import { AgentConfigService } from '../../services/agent-config.js';
import { GlobalAPISettings } from './GlobalAPISettings.js';
import { agentModelSelector } from './AgentModelSelector.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  persona?: PersonaType;
}

export interface ChatSession {
  id: string;
  persona: PersonaType;
  messages: ChatMessage[];
  context: any;
  title: string;
  createdAt: Date;
}

export class ModernAIChatInterface {
  private container: HTMLElement;
  private currentSession: ChatSession | null = null;
  private messagesContainer: HTMLElement | null = null;
  private inputContainer: HTMLElement | null = null;
  private isLoading = false;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID '${containerId}' not found`);
    }
    this.container = container;
  }

  /**
   * Initialize chat with a persona
   */
  public async initialize(persona: PersonaType, projectContext?: any): Promise<void> {
    // Create new chat session
    this.currentSession = {
      id: `session_${Date.now()}`,
      persona,
      messages: [],
      context: projectContext || {},
      title: this.getPersonaDisplayName(persona),
      createdAt: new Date()
    };

    await this.render();
    await this.startConversation();
  }

  /**
   * Render the modern chat interface
   */
  private async render(): Promise<void> {
    if (!this.currentSession) return;

    const persona = this.currentSession.persona;
    const hasGlobalAPI = GlobalAPISettings.hasAnyProvider();
    const isAgentConfigured = AgentConfigService.isAgentConfigured(persona);
    const isConfigured = hasGlobalAPI && isAgentConfigured;

    console.log('DEBUG: ModernAIChatInterface render() called');
    console.log('DEBUG: persona:', persona);
    console.log('DEBUG: hasGlobalAPI:', hasGlobalAPI);
    console.log('DEBUG: isAgentConfigured:', isAgentConfigured);
    console.log('DEBUG: isConfigured:', isConfigured);
    console.log('DEBUG: Container element:', this.container);

    this.container.innerHTML = `
      <div class="ai-chat-interface">
        <!-- Minimal Header -->
        <div class="ai-chat-header">
          <div class="chat-persona-info">
            <div class="persona-avatar-mini">${this.getPersonaIcon(persona)}</div>
            <div class="persona-details">
              <span class="persona-name-mini">${this.getPersonaDisplayName(persona)}</span>
              <span class="persona-status-mini ${isConfigured ? 'ready' : 'needs-setup'}">
                ${isConfigured ? '● Online' : hasGlobalAPI ? '○ Configure model' : '○ Setup required'}
              </span>
            </div>
          </div>
          <div class="chat-controls">
            ${isConfigured ? '' : `
              <button class="control-btn setup-btn" id="quick-setup-btn" title="Quick Setup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                </svg>
              </button>
            `}
            <button class="control-btn" id="clear-chat-btn" title="Clear Chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/>
              </svg>
            </button>
            <button class="control-btn" id="settings-menu-btn" title="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Main Chat Area -->
        <div class="ai-chat-main">
          <div class="chat-messages-area" id="chat-messages">
            ${this.renderMessages()}
          </div>
          
          <!-- Chat Input -->
          <div class="chat-input-area">
            ${isConfigured ? this.renderModernInputArea() : this.renderSetupPrompt()}
          </div>
        </div>
      </div>
    `;

    this.messagesContainer = document.getElementById('chat-messages');
    this.setupEventListeners();
  }

  /**
   * Render chat messages with modern bubble design
   */
  private renderMessages(): string {
    if (!this.currentSession?.messages.length) {
      if (!this.currentSession) return '';
      
      return `
        <div class="chat-welcome">
          <div class="welcome-content">
            <div class="persona-avatar-large">
              ${this.getPersonaIcon(this.currentSession.persona)}
            </div>
            <h3>Hello! I'm your ${this.getPersonaDisplayName(this.currentSession.persona)}</h3>
            <p>${this.getPersonaDescription(this.currentSession.persona)}</p>
            <div class="suggested-prompts">
              ${this.getSuggestedPrompts().map(prompt => 
                `<button class="suggested-prompt" data-prompt="${prompt}">${prompt}</button>`
              ).join('')}
            </div>
          </div>
        </div>
      `;
    }

    return this.currentSession.messages.map(message => `
      <div class="chat-message ${message.role}">
        <div class="message-bubble ${message.role}-bubble">
          <div class="message-text">${this.formatMessageContent(message.content)}</div>
          <div class="message-time">${this.formatTimestamp(message.timestamp)}</div>
        </div>
        <div class="message-avatar ${message.role}-avatar">
          ${message.role === 'assistant' ? this.getPersonaIcon(this.currentSession!.persona) : '👤'}
        </div>
      </div>
    `).join('');
  }

  /**
   * Render input area
   */
  private renderInputArea(): string {
    return `
      <div class="input-area">
        <div class="input-wrapper">
          <textarea 
            id="chat-input" 
            placeholder="Message ${this.getPersonaDisplayName(this.currentSession!.persona)}..."
            rows="1"
            maxlength="2000"
          ></textarea>
          <button id="send-btn" class="send-button" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="input-footer">
          <span class="character-count">0/2000</span>
          <span class="input-hint">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    `;
  }

  /**
   * Render configuration prompt
   */
  private renderConfigurationPrompt(): string {
    const hasGlobalAPI = GlobalAPISettings.hasAnyProvider();
    
    if (!hasGlobalAPI) {
      return `
        <div class="config-prompt">
          <div class="config-prompt-content">
            <h4>🔑 Setup Required</h4>
            <p>Configure your AI provider API keys to start chatting with agents.</p>
            <button class="btn btn-primary" id="setup-api-keys-btn">
              Setup API Keys
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="config-prompt">
          <div class="config-prompt-content">
            <h4>🤖 Select Model</h4>
            <p>Choose which AI model this ${this.getPersonaDisplayName(this.currentSession!.persona)} agent should use.</p>
            <button class="btn btn-primary" id="configure-agent-btn">
              Select Agent Model
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Render modern input area with auto-expanding textarea
   */
  private renderModernInputArea(): string {
    return `
      <div class="modern-chat-input">
        <div class="input-container">
          <textarea 
            id="chat-input" 
            placeholder="Message ${this.getPersonaDisplayName(this.currentSession!.persona)}..."
            rows="1"
            maxlength="4000"
          ></textarea>
          <button class="send-btn" id="send-btn" title="Send message" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
            </svg>
          </button>
        </div>
        <div class="input-hints">
          <span class="hint">Press Enter to send, Shift+Enter for new line</span>
          <span class="char-count"><span id="char-count">0</span>/4000</span>
        </div>
      </div>
    `;
  }

  /**
   * Render minimal setup prompt for unconfigured agents
   */
  private renderSetupPrompt(): string {
    const hasGlobalAPI = GlobalAPISettings.hasAnyProvider();
    
    return `
      <div class="setup-prompt-minimal">
        <div class="setup-content">
          ${!hasGlobalAPI ? `
            <span class="setup-text">🔑 Setup API keys to start chatting</span>
            <button class="setup-action-btn" id="setup-api-keys-btn">Setup Keys</button>
          ` : `
            <span class="setup-text">🤖 Select a model for this agent</span>
            <button class="setup-action-btn" id="configure-agent-btn">Select Model</button>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Send message
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    
    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      chatInput.addEventListener('input', (e) => {
        this.handleInputChange(e);
        this.autoResizeTextarea(chatInput);
      });
    }

    // Suggested prompts
    document.querySelectorAll('.suggested-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = (e.target as HTMLElement).dataset.prompt;
        if (prompt && chatInput) {
          chatInput.value = prompt;
          this.handleInputChange({ target: chatInput } as any);
          chatInput.focus();
        }
      });
    });

    // Header buttons
    document.getElementById('agent-settings-btn')?.addEventListener('click', () => {
      this.openAgentSettings();
    });

    document.getElementById('clear-chat-btn')?.addEventListener('click', () => {
      this.clearChat();
    });

    document.getElementById('configure-agent-btn')?.addEventListener('click', () => {
      this.openAgentSettings();
    });

    document.getElementById('setup-api-keys-btn')?.addEventListener('click', () => {
      this.openGlobalAPISettings();
    });
  }

  /**
   * Handle input changes
   */
  private handleInputChange(e: Event): void {
    const input = e.target as HTMLTextAreaElement;
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    const charCountEl = document.getElementById('char-count') as HTMLElement;

    if (sendBtn) {
      sendBtn.disabled = !input.value.trim() || this.isLoading;
    }

    if (charCountEl) {
      charCountEl.textContent = input.value.length.toString();
    }
  }

  /**
   * Auto-resize textarea
   */
  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    const maxHeight = 150; // Max 6 lines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + 'px';
  }

  /**
   * Send message
   */
  private async sendMessage(): Promise<void> {
    console.log('DEBUG: sendMessage() called');
    
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    
    console.log('DEBUG: chatInput found:', !!chatInput);
    console.log('DEBUG: currentSession exists:', !!this.currentSession);
    
    if (!chatInput || !this.currentSession) return;

    const message = chatInput.value.trim();
    console.log('DEBUG: message content:', message);
    console.log('DEBUG: isLoading:', this.isLoading);
    
    if (!message || this.isLoading) return;

    // Disable input while processing
    this.isLoading = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    this.currentSession.messages.push(userMessage);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Re-render messages
    await this.updateMessagesDisplay();

    // Scroll to bottom
    this.scrollToBottom();

    try {
      // Generate AI response
      await this.generateAIResponse(message);
    } finally {
      // Re-enable input
      this.isLoading = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  /**
   * Generate AI response
   */
  private async generateAIResponse(userMessage: string): Promise<void> {
    if (!this.currentSession) return;

    console.log('DEBUG: Frontend generateAIResponse called');
    console.log('DEBUG: Session ID:', this.currentSession.id);
    console.log('DEBUG: Persona:', this.currentSession.persona);
    console.log('DEBUG: User message:', userMessage);
    console.log('DEBUG: Context:', this.currentSession.context);

    // Add typing indicator
    this.showTypingIndicator();

    try {
      console.log('DEBUG: Getting agent configuration from frontend...');
      const agentConfig = AgentConfigService.getAgentConfig(this.currentSession.persona);
      console.log('DEBUG: Frontend agentConfig:', agentConfig);
      
      console.log('DEBUG: About to call window.electronAPI.llm.generatePersonaResponse');
      const result = await window.electronAPI.llm.generatePersonaResponse(
        this.currentSession.id,
        this.currentSession.persona,
        userMessage,
        this.currentSession.context,
        agentConfig
      );
      console.log('DEBUG: Received result from IPC:', result);

      // Remove typing indicator
      this.hideTypingIndicator();

      if (result.success) {
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: result.data,
          timestamp: new Date(),
          persona: this.currentSession.persona
        };

        this.currentSession.messages.push(aiMessage);
        await this.updateMessagesDisplay();
      } else {
        // Show error message
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `❌ **Error**: ${result.error}\\n\\nPlease check your AI agent configuration and try again.`,
          timestamp: new Date(),
          persona: this.currentSession.persona
        };

        this.currentSession.messages.push(errorMessage);
        await this.updateMessagesDisplay();
      }
    } catch (error) {
      this.hideTypingIndicator();
      console.error('Failed to generate AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `❌ **Connection Error**: Failed to connect to AI service.\\n\\nPlease check your network connection and AI configuration.`,
        timestamp: new Date(),
        persona: this.currentSession.persona
      };

      this.currentSession.messages.push(errorMessage);
      await this.updateMessagesDisplay();
    }

    this.scrollToBottom();
  }

  /**
   * Show typing indicator
   */
  private showTypingIndicator(): void {
    if (!this.messagesContainer) return;

    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'message assistant-message typing';
    typingIndicator.innerHTML = `
      <div class="message-avatar">
        ${this.getPersonaIcon(this.currentSession!.persona)}
      </div>
      <div class="message-content">
        <div class="typing-animation">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    this.messagesContainer.appendChild(typingIndicator);
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  private hideTypingIndicator(): void {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  /**
   * Update messages display
   */
  private async updateMessagesDisplay(): Promise<void> {
    if (!this.messagesContainer || !this.currentSession) return;

    this.messagesContainer.innerHTML = this.renderMessages();
  }

  /**
   * Scroll to bottom
   */
  private scrollToBottom(): void {
    if (!this.messagesContainer) return;
    
    setTimeout(() => {
      this.messagesContainer!.scrollTop = this.messagesContainer!.scrollHeight;
    }, 50);
  }

  /**
   * Start conversation with initial message
   */
  private async startConversation(): Promise<void> {
    const hasGlobalAPI = GlobalAPISettings.hasAnyProvider();
    const isAgentConfigured = AgentConfigService.isAgentConfigured(this.currentSession!.persona);
    
    if (!hasGlobalAPI || !isAgentConfigured) {
      return; // Wait for configuration
    }

    // Could add an initial greeting message here if needed
  }

  /**
   * Open agent settings
   */
  private openAgentSettings(): void {
    if (!this.currentSession) return;
    agentModelSelector.open(this.currentSession.persona);
  }

  /**
   * Open global API settings
   */
  private openGlobalAPISettings(): void {
    import('./GlobalAPISettings.js').then(module => {
      module.globalAPISettings.open();
    });
  }

  /**
   * Clear chat
   */
  private clearChat(): void {
    if (!this.currentSession) return;

    if (confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
      this.currentSession.messages = [];
      this.updateMessagesDisplay();
      
      // Clear conversation history on backend
      window.electronAPI.llm.clearConversation(this.currentSession.id);
    }
  }

  /**
   * Get persona display name
   */
  private getPersonaDisplayName(persona: PersonaType): string {
    return AgentConfigService.getPersonaDisplayName(persona);
  }

  /**
   * Get persona icon
   */
  private getPersonaIcon(persona: PersonaType): string {
    const icons = {
      'CREATIVE_STRATEGIST': '🎯',
      'BAFFLING_BROADCASTER': '📺',
      'SATIRICAL_SCREENWRITER': '✍️',
      'CINEMATIC_STORYBOARDER': '🎬',
      'SOUNDSCAPE_ARCHITECT': '🎵',
      'VIDEO_PROMPT_ENGINEER': '🤖',
      'PROJECT_DIRECTOR': '🎪'
    };
    return icons[persona] || '🤖';
  }

  /**
   * Get persona description
   */
  private getPersonaDescription(persona: PersonaType): string {
    const descriptions = {
      'CREATIVE_STRATEGIST': 'I help develop creative concepts and strategies for satirical content.',
      'BAFFLING_BROADCASTER': 'I specialize in creating out-of-touch presenter characters.',
      'SATIRICAL_SCREENWRITER': 'I craft cynical, witty dialogue and satirical scenes.',
      'CINEMATIC_STORYBOARDER': 'I create visual storytelling concepts for satirical content.',
      'SOUNDSCAPE_ARCHITECT': 'I design audio elements that enhance satirical impact.',
      'VIDEO_PROMPT_ENGINEER': 'I create AI-optimized prompts for video generation.',
      'PROJECT_DIRECTOR': 'I coordinate all creative elements and manage project direction.'
    };
    return descriptions[persona] || 'I am your AI assistant for satirical content creation.';
  }

  /**
   * Get suggested prompts
   */
  private getSuggestedPrompts(): string[] {
    const prompts = {
      'CREATIVE_STRATEGIST': [
        'Help me analyze these news articles for satirical angles',
        'What creative approach would work for this topic?',
        'How can we make this more absurd and funny?'
      ],
      'BAFFLING_BROADCASTER': [
        'Create a disconnected presenter character',
        'How would an out-of-touch broadcaster cover this?',
        'Design dialogue for an oblivious news anchor'
      ],
      'SATIRICAL_SCREENWRITER': [
        'Write satirical dialogue for this scene',
        'How can we structure this narrative?',
        'Create witty commentary on this situation'
      ],
      'CINEMATIC_STORYBOARDER': [
        'How should we visualize this satirical concept?',
        'What shots would enhance the comedic timing?',
        'Create a visual metaphor for this theme'
      ],
      'SOUNDSCAPE_ARCHITECT': [
        'What audio would enhance this satirical moment?',
        'Design sound effects for this scene',
        'How can audio create ironic contrast?'
      ],
      'VIDEO_PROMPT_ENGINEER': [
        'Create video prompts for this concept',
        'How do we optimize this for AI video generation?',
        'Write technical prompts for this scene'
      ],
      'PROJECT_DIRECTOR': [
        'Coordinate the creative elements for this project',
        'What\'s the overall production strategy?',
        'How do we manage this project timeline?'
      ]
    };
    
    return prompts[this.currentSession!.persona] || [
      'How can you help with my satirical project?',
      'What\'s your expertise area?',
      'Let\'s get started on this content'
    ];
  }

  /**
   * Format message content (support markdown-like formatting)
   */
  private formatMessageContent(content: string): string {
    return content
      .replace(/\\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    
    return timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}