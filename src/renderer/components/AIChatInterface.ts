// AI Chat Interface Component
// Handles collaborative chat sessions with AI personas for creative development

import { PersonaType } from '../../shared/types/index.js';
import { LLMSettings, llmSettings } from './LLMSettings.js';

export interface ChatMessage {
  id: string;
  sender: PersonaType | 'USER';
  content: string;
  timestamp: Date;
  messageType: 'text' | 'suggestion' | 'question' | 'summary';
}

export interface ChatSession {
  id: string;
  projectId: string;
  persona: PersonaType;
  messages: ChatMessage[];
  status: 'active' | 'completed' | 'paused';
  context: {
    phase: 'introduction' | 'analysis' | 'brainstorming' | 'refinement' | 'finalization';
    articlesAnalyzed: boolean;
    keyTopicsIdentified: string[];
    strategicElements: any;
  };
}

export class AIChatInterface {
  private container: HTMLElement | null = null;
  private currentSession: ChatSession | null = null;
  private isTyping = false;
  private useMockResponses = false;

  /**
   * Initialize chat interface for a specific project and persona
   */
  public async initialize(projectId: string, persona: PersonaType, containerId: string, existingStrategy?: any): Promise<void> {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Chat container not found:', containerId);
      return;
    }

    // Check if LLM is configured
    if (!LLMSettings.isConfigured()) {
      this.renderConfigurationRequired();
      return;
    }

    try {
      // Create new chat session
      await this.createChatSession(projectId, persona, existingStrategy);
      this.render();
      
      // Start conversation
      await this.startConversation();
    } catch (error) {
      console.error('Failed to initialize AI chat:', error);
      this.renderError('Failed to initialize AI chat interface');
    }
  }

  /**
   * Create new chat session
   */
  private async createChatSession(projectId: string, persona: PersonaType, existingStrategy?: any): Promise<void> {
    // For now, create a mock session. In production, this would call the backend
    this.currentSession = {
      id: `chat_${Date.now()}`,
      projectId: projectId,
      persona: persona,
      messages: [],
      status: 'active',
      context: {
        phase: existingStrategy ? 'refinement' : 'introduction',
        articlesAnalyzed: existingStrategy ? true : false,
        keyTopicsIdentified: existingStrategy ? existingStrategy.key_themes || [] : [],
        strategicElements: existingStrategy ? {
          'Existing Strategy': existingStrategy.creative_concept || '',
          'Current Audience': existingStrategy.target_audience || '',
          'Current Tone': existingStrategy.tone || '',
          'Character Count': existingStrategy.character_archetypes?.length || 0,
          'Refinement Mode': 'Active'
        } : {}
      }
    };
  }

  /**
   * Render the chat interface
   */
  private render(): void {
    if (!this.container || !this.currentSession) return;

    const personaInfo = this.getPersonaInfo(this.currentSession.persona);

    this.container.innerHTML = `
      <div class="modern-ai-chat">
        <!-- Chat Messages Area -->
        <div class="chat-messages-area" id="chat-messages-area">
          <div class="chat-messages-container" id="chat-messages">
            ${this.renderMessages()}
          </div>
          
          <!-- Typing Indicator -->
          <div class="typing-indicator-modern" id="typing-indicator" style="display: none;">
            <div class="typing-avatar">
              <div class="avatar-circle">🎯</div>
            </div>
            <div class="typing-bubble">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Chat Input -->
        <div class="chat-input-modern">
          <div class="input-container">
            <textarea 
              id="chat-input" 
              placeholder="Ask about strategy improvements, character development, tone adjustments..."
              rows="1"
              maxlength="2000"></textarea>
            <div class="input-actions">
              <button class="send-btn" id="send-message-btn" disabled title="Send message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="input-footer">
            <div class="input-hints">
              <span class="ai-status">
                <span class="status-dot"></span>
                ${personaInfo.name} • ${this.formatPhase(this.currentSession.context.phase)} phase
              </span>
            </div>
            <div class="input-controls">
              <button class="control-btn" id="save-progress-btn" title="Save progress">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 21H5C3.89 21 3 20.11 3 19V5C3 3.89 3.89 3 5 3H16L21 8V19C21 20.11 20.11 21 19 21Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              <button class="control-btn primary" id="end-chat-btn" title="Apply changes">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Strategy Context (Collapsible) -->
        <div class="strategy-context-modern" id="strategy-context" style="display: none;">
          <div class="context-header-modern">
            <h4>💡 Discovered Elements</h4>
            <button class="context-toggle" id="context-toggle">▲</button>
          </div>
          <div class="context-grid">
            <div class="context-item">
              <h5>Key Topics</h5>
              <div class="topic-tags-modern" id="topic-tags">
                ${this.renderTopicTags()}
              </div>
            </div>
            <div class="context-item">
              <h5>Strategic Elements</h5>
              <div class="strategic-elements-modern" id="strategic-elements">
                ${this.renderStrategicElements()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render chat messages
   */
  private renderMessages(): string {
    if (!this.currentSession || this.currentSession.messages.length === 0) {
      const isRefinementMode = this.currentSession?.context.phase === 'refinement';
      return `
        <div class="chat-welcome-modern">
          <div class="welcome-avatar">
            <div class="avatar-circle large">🎯</div>
          </div>
          <div class="welcome-content">
            <h4>${isRefinementMode ? 'Ready to refine your strategy!' : 'Ready to develop your creative strategy!'}</h4>
            <p>${isRefinementMode ? 'I\'ll help you improve and enhance your existing approach.' : 'I\'ll help you analyze your articles and develop a compelling satirical approach.'}</p>
          </div>
        </div>
      `;
    }

    return this.currentSession.messages.map(message => this.renderMessage(message)).join('');
  }

  /**
   * Render individual message
   */
  private renderMessage(message: ChatMessage): string {
    const isUser = message.sender === 'USER';
    const personaInfo = isUser ? null : this.getPersonaInfo(message.sender as PersonaType);

    return `
      <div class="message-modern ${isUser ? 'user-message' : 'ai-message'}" data-message-id="${message.id}">
        ${!isUser ? `<div class="message-avatar">
          <div class="avatar-circle">${personaInfo!.icon}</div>
        </div>` : ''}
        <div class="message-bubble ${message.messageType}">
          <div class="message-content-modern">
            ${this.formatMessageContent(message.content, message.messageType)}
          </div>
          ${message.messageType === 'question' && !isUser ? this.renderQuickResponses() : ''}
          <div class="message-time-modern">
            ${message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format message content based on type
   */
  private formatMessageContent(content: string, messageType: string): string {
    switch (messageType) {
      case 'question':
        return `<div class="question-content">❓ ${content}</div>`;
      case 'suggestion':
        return `<div class="suggestion-content">💡 ${content}</div>`;
      case 'summary':
        return `<div class="summary-content">📋 ${content}</div>`;
      default:
        return `<div class="text-content">${this.escapeHtml(content)}</div>`;
    }
  }

  /**
   * Render quick response buttons for questions
   */
  private renderQuickResponses(): string {
    return `
      <div class="quick-responses-modern">
        <button class="quick-response-modern" data-response="Yes, let's explore that">✅ Yes, let's explore that</button>
        <button class="quick-response-modern" data-response="No, let's try a different approach">❌ Try different approach</button>
        <button class="quick-response-modern" data-response="Can you give me more options?">🔄 More options</button>
        <button class="quick-response-modern" data-response="I need to think about this">🤔 Let me think</button>
      </div>
    `;
  }

  /**
   * Render topic tags
   */
  private renderTopicTags(): string {
    if (!this.currentSession?.context.keyTopicsIdentified.length) {
      return '<p class="no-data">Topics will appear as we discuss your articles</p>';
    }

    return this.currentSession.context.keyTopicsIdentified
      .map(topic => `<span class="topic-tag">${this.escapeHtml(topic)}</span>`)
      .join('');
  }

  /**
   * Render strategic elements
   */
  private renderStrategicElements(): string {
    const elements = this.currentSession?.context.strategicElements;
    if (!elements || Object.keys(elements).length === 0) {
      return '<p class="no-data">Strategic elements will develop during our conversation</p>';
    }

    return Object.entries(elements)
      .map(([key, value]) => `
        <div class="element-item">
          <strong>${key}:</strong> ${this.escapeHtml(String(value))}
        </div>
      `).join('');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Chat input handling
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const sendBtn = document.getElementById('send-message-btn') as HTMLButtonElement;
    const clearBtn = document.getElementById('clear-input-btn') as HTMLButtonElement;

    chatInput?.addEventListener('input', () => {
      sendBtn.disabled = chatInput.value.trim().length === 0;
      
      // Auto-resize textarea
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    sendBtn?.addEventListener('click', () => this.sendMessage());
    clearBtn?.addEventListener('click', () => {
      if (chatInput) chatInput.value = '';
      sendBtn.disabled = true;
    });

    // Chat actions
    document.getElementById('save-progress-btn')?.addEventListener('click', () => this.saveProgress());
    document.getElementById('end-chat-btn')?.addEventListener('click', () => this.endSession());

    // Quick responses
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('quick-response-modern')) {
        const response = target.getAttribute('data-response');
        if (response) {
          this.sendQuickResponse(response);
        }
      }
    });

    // Context panel toggle
    document.querySelector('.btn-toggle')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const contentId = target.getAttribute('data-target');
      if (contentId) {
        const content = document.getElementById(contentId);
        if (content) {
          const isVisible = content.style.display !== 'none';
          content.style.display = isVisible ? 'none' : 'block';
          target.textContent = isVisible ? '▶' : '▼';
        }
      }
    });
  }

  /**
   * Start the conversation
   */
  private async startConversation(): Promise<void> {
    if (!this.currentSession) return;

    // Add welcome message from AI
    const personaInfo = this.getPersonaInfo(this.currentSession.persona);
    const isRefinementMode = this.currentSession.context.phase === 'refinement';
    
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: this.currentSession.persona,
      content: isRefinementMode 
        ? `Hello! I'm ${personaInfo.name}, and I'm here to help you refine and improve your existing creative strategy. I can see you already have a solid foundation with your current approach. What aspects of your strategy would you like to explore further or improve? Are there any elements that feel like they could be stronger or more focused?`
        : `Hello! I'm ${personaInfo.name}, and I'm excited to help you develop a compelling creative strategy for your satirical video project. I've noticed you have some articles uploaded - shall we start by analyzing them to identify the key themes and potential satirical angles?`,
      timestamp: new Date(),
      messageType: 'question'
    };

    this.currentSession.messages.push(welcomeMessage);
    this.updateDisplay();
  }

  /**
   * Send user message
   */
  private async sendMessage(): Promise<void> {
    const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    const message = chatInput.value.trim();
    
    if (!message || !this.currentSession) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'USER',
      content: message,
      timestamp: new Date(),
      messageType: 'text'
    };

    this.currentSession.messages.push(userMessage);
    chatInput.value = '';
    
    const sendBtn = document.getElementById('send-message-btn') as HTMLButtonElement;
    sendBtn.disabled = true;

    this.updateDisplay();

    // Generate AI response
    await this.generateAIResponse(message);
  }

  /**
   * Send quick response
   */
  private async sendQuickResponse(response: string): Promise<void> {
    if (!this.currentSession) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'USER',
      content: response,
      timestamp: new Date(),
      messageType: 'text'
    };

    this.currentSession.messages.push(userMessage);
    this.updateDisplay();

    await this.generateAIResponse(response);
  }

  /**
   * Generate AI response using real LLM
   */
  private async generateAIResponse(userInput: string): Promise<void> {
    if (!this.currentSession) return;

    this.showTyping();

    // Check if LLM is configured
    if (!LLMSettings.isConfigured()) {
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: this.currentSession.persona,
        content: `❌ AI Chat is not configured. Please configure your AI provider in the settings to continue.`,
        timestamp: new Date(),
        messageType: 'text'
      };

      this.currentSession.messages.push(errorMessage);
      this.hideTyping();
      this.updateDisplay();
      return;
    }

    try {
      // Prepare context for LLM
      const context = {
        phase: this.currentSession.context.phase,
        existingStrategy: this.currentSession.context.strategicElements?.['Existing Strategy'] ? {
          creative_concept: this.currentSession.context.strategicElements['Existing Strategy'],
          target_audience: this.currentSession.context.strategicElements['Current Audience'],
          tone: this.currentSession.context.strategicElements['Current Tone'],
          key_themes: this.currentSession.context.keyTopicsIdentified || []
        } : null,
        conversationHistory: this.currentSession.messages.map(m => ({
          role: m.sender === 'USER' ? 'user' : 'assistant',
          content: m.content
        }))
      };

      // @ts-ignore
      const result = await window.electronAPI.llm.generatePersonaResponse(
        this.currentSession.id,
        this.currentSession.persona,
        userInput,
        context
      );

      if (result.success) {
        // Determine message type based on content
        const messageType = this.determineMessageType(result.data);
        
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          sender: this.currentSession.persona,
          content: result.data,
          timestamp: new Date(),
          messageType: messageType
        };

        this.currentSession.messages.push(aiMessage);
        
        // Update context based on AI response
        this.updateContextFromResponse(result.data);
        
      } else {
        // Show error message - LLM is required
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          sender: this.currentSession.persona,
          content: `❌ AI Chat Error: ${result.error}\n\nPlease configure your AI provider in the settings to continue the conversation.`,
          timestamp: new Date(),
          messageType: 'text'
        };

        this.currentSession.messages.push(errorMessage);
      }

    } catch (error) {
      console.error('Failed to generate AI response:', error);
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: this.currentSession.persona,
        content: "I'm having trouble connecting right now. Let me try a different approach - what specific aspect of your strategy would you like to focus on?",
        timestamp: new Date(),
        messageType: 'question'
      };

      this.currentSession.messages.push(errorMessage);
    }

    this.hideTyping();
    this.updateDisplay();
  }

  /**
   * Determine message type from AI response content
   */
  private determineMessageType(content: string): 'text' | 'question' | 'suggestion' | 'summary' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('?')) {
      return 'question';
    } else if (lowerContent.includes('suggest') || lowerContent.includes('recommend') || lowerContent.includes('consider') || lowerContent.includes('could')) {
      return 'suggestion';
    } else if (lowerContent.includes('summary') || lowerContent.includes('recap') || lowerContent.includes('overall')) {
      return 'summary';
    } else {
      return 'text';
    }
  }

  /**
   * Update context based on AI response content
   */
  private updateContextFromResponse(aiResponse: string): void {
    if (!this.currentSession) return;

    // Extract topics and themes from AI response
    const lowerResponse = aiResponse.toLowerCase();
    const newTopics: string[] = [];

    // Look for common creative strategy terms
    if (lowerResponse.includes('character')) newTopics.push('Character Development');
    if (lowerResponse.includes('audience')) newTopics.push('Target Audience');
    if (lowerResponse.includes('tone') || lowerResponse.includes('style')) newTopics.push('Tone & Style');
    if (lowerResponse.includes('visual')) newTopics.push('Visual Elements');
    if (lowerResponse.includes('satirical') || lowerResponse.includes('satire')) newTopics.push('Satirical Approach');

    // Add new topics to context
    newTopics.forEach(topic => {
      if (!this.currentSession!.context.keyTopicsIdentified.includes(topic)) {
        this.currentSession!.context.keyTopicsIdentified.push(topic);
      }
    });

    // Update strategic elements based on conversation progress
    const messageCount = this.currentSession.messages.length;
    if (messageCount > 3) {
      this.currentSession.context.strategicElements = {
        ...this.currentSession.context.strategicElements,
        'Discussion Progress': `${Math.floor(messageCount / 2)} topics explored`
      };
    }
  }


  /**
   * Mock AI response generation (kept as fallback)
   */
  private async mockAIResponse(userInput: string): Promise<{
    content: string;
    type: 'text' | 'question' | 'suggestion' | 'summary';
    contextUpdates?: any;
  }> {
    const phase = this.currentSession!.context.phase;
    const lowerInput = userInput.toLowerCase();
    const messageCount = this.currentSession!.messages.length;

    // Add variety based on message count to avoid repetition
    const responseVariant = messageCount % 4;

    // Simulate different responses based on conversation phase
    switch (phase) {
      case 'introduction':
        if (lowerInput.includes('yes') || lowerInput.includes('start') || lowerInput.includes('analyze')) {
          return {
            content: "Perfect! Let me analyze your uploaded articles... I can see some interesting themes emerging. What specific aspect of current events do you find most absurd or worthy of satirical commentary?",
            type: 'question',
            contextUpdates: { 
              phase: 'analysis',
              articlesAnalyzed: true,
              keyTopicsIdentified: ['Current Events', 'Media Coverage', 'Social Issues']
            }
          };
        }
        return this.getIntroductionResponse(lowerInput, responseVariant);

      case 'analysis':
        if (lowerInput.includes('media') || lowerInput.includes('politics') || lowerInput.includes('social')) {
          return {
            content: "Excellent insight! I can see you're interested in critiquing media coverage. Based on your articles, I'm noticing themes around performative journalism and out-of-touch commentary. Would you like to explore a satirical angle that exaggerates how disconnected mainstream media can be from real issues?",
            type: 'suggestion',
            contextUpdates: {
              phase: 'brainstorming',
              keyTopicsIdentified: ['Media Disconnect', 'Performative Journalism', 'Social Commentary'],
              strategicElements: { 
                'Primary Theme': 'Media Disconnect',
                'Satirical Approach': 'Exaggerated Commentary' 
              }
            }
          };
        }
        return this.getAnalysisResponse(lowerInput, responseVariant);

      case 'brainstorming':
        return this.getBrainstormingResponse(lowerInput, responseVariant);

      case 'refinement':
        return this.getRefinementResponse(lowerInput, responseVariant);

      case 'finalization':
        return this.getFinalizationResponse(lowerInput, responseVariant);

      default:
        return this.getGeneralResponse(lowerInput, responseVariant);
    }
  }

  /**
   * Get varied responses for introduction phase
   */
  private getIntroductionResponse(userInput: string, variant: number): any {
    const responses = [
      {
        content: "Great! What specific themes or topics from your articles caught your attention? I'd love to understand what resonates with your satirical vision.",
        type: 'question'
      },
      {
        content: "Interesting perspective! Can you tell me more about the tone you're aiming for - are you thinking more subtle irony or bold, obvious satire?",
        type: 'question'
      },
      {
        content: "That's a solid foundation. Let's dive deeper - what aspects of your articles do you think would translate best to visual satire?",
        type: 'suggestion'
      },
      {
        content: "I appreciate that insight. What's your gut feeling about the main message you want to convey through this satirical video?",
        type: 'question'
      }
    ];
    return responses[variant];
  }

  /**
   * Get varied responses for analysis phase
   */
  private getAnalysisResponse(userInput: string, variant: number): any {
    const responses = [
      {
        content: "That's a compelling angle! How do you think we could exaggerate those elements to make them more obviously satirical without losing the underlying truth?",
        type: 'question'
      },
      {
        content: "I like where you're going with this. What kind of character or narrator do you envision delivering this satirical take?",
        type: 'suggestion',
        contextUpdates: {
          phase: 'brainstorming'
        }
      },
      {
        content: "Excellent observation! Let's explore the visual possibilities - what setting or scenario would best highlight the absurdity you're targeting?",
        type: 'question'
      },
      {
        content: "That's exactly the kind of insight we need. What would be the most ridiculous way someone might actually behave in this situation?",
        type: 'suggestion'
      }
    ];
    return responses[variant];
  }

  /**
   * Get varied responses for brainstorming phase
   */
  private getBrainstormingResponse(userInput: string, variant: number): any {
    const responses = [
      {
        content: "Great direction! For characters, I'm thinking we could create archetypes that embody the absurdity. What's your target audience - are we going for subtle wit or more obvious humor?",
        type: 'question',
        contextUpdates: {
          phase: 'refinement',
          strategicElements: {
            ...this.currentSession!.context.strategicElements,
            'Character Development': 'In Progress',
            'Audience Consideration': 'Under Discussion'
          }
        }
      },
      {
        content: "I love that concept! Let's think about the visual style - should we go for a documentary feel, news parody, or something more stylized and surreal?",
        type: 'suggestion'
      },
      {
        content: "That's brilliant! How do you envision the pacing? Quick cuts and snappy dialogue, or longer, more contemplative moments that build the absurdity?",
        type: 'question'
      },
      {
        content: "Perfect insight! What props, costumes, or visual elements could we use to immediately signal the satirical intent to viewers?",
        type: 'suggestion'
      }
    ];
    return responses[variant];
  }

  /**
   * Get varied responses for refinement phase
   */
  private getRefinementResponse(userInput: string, variant: number): any {
    const responses = [
      {
        content: "That's a thoughtful addition to your existing strategy. How do you think this refinement changes the overall tone compared to your original approach?",
        type: 'question'
      },
      {
        content: "I can see how that would strengthen your current concept. What other elements of your strategy do you feel could benefit from similar adjustments?",
        type: 'suggestion'
      },
      {
        content: "Excellent refinement! That adds more depth to your characters. How might this change affect the visual style guide you already have?",
        type: 'question'
      },
      {
        content: "That's a smart evolution of your existing idea. Should we also consider how this impacts your satirical angles - do any need updating?",
        type: 'suggestion',
        contextUpdates: {
          strategicElements: {
            ...this.currentSession!.context.strategicElements,
            'Refinement Progress': 'Active Discussion'
          }
        }
      }
    ];
    return responses[variant];
  }

  /**
   * Get varied responses for finalization phase
   */
  private getFinalizationResponse(userInput: string, variant: number): any {
    const responses = [
      {
        content: "We're making great progress! Looking at everything we've discussed, what feels like the strongest element of your refined strategy?",
        type: 'question',
        contextUpdates: {
          phase: 'finalization'
        }
      },
      {
        content: "This is shaping up really well! Are there any final touches or concerns you'd like to address before we finalize these improvements?",
        type: 'summary'
      },
      {
        content: "Excellent work! Your strategy has evolved nicely. What aspect of this refinement are you most excited about implementing?",
        type: 'question'
      },
      {
        content: "I think we've covered a lot of ground! Should we summarize the key improvements we've made to your creative strategy?",
        type: 'suggestion'
      }
    ];
    return responses[variant];
  }

  /**
   * Get general varied responses
   */
  private getGeneralResponse(userInput: string, variant: number): any {
    const responses = [
      {
        content: "That's an interesting perspective! Can you elaborate on what specifically appeals to you about that approach?",
        type: 'question'
      },
      {
        content: "I love that direction! How do you think your audience will connect with that concept?",
        type: 'suggestion'
      },
      {
        content: "That's exactly the kind of creative thinking we need! What other elements could we explore in that same vein?",
        type: 'question'
      },
      {
        content: "Brilliant insight! Let's build on that - what would be the most effective way to bring that idea to life visually?",
        type: 'suggestion'
      }
    ];
    return responses[variant];
  }

  /**
   * Show typing indicator
   */
  private showTyping(): void {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
      this.scrollToBottom();
    }
    this.isTyping = true;
  }

  /**
   * Hide typing indicator
   */
  private hideTyping(): void {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
    this.isTyping = false;
  }

  /**
   * Update display after new messages
   */
  private updateDisplay(): void {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = this.renderMessages();
    }

    const topicTags = document.getElementById('topic-tags');
    if (topicTags) {
      topicTags.innerHTML = this.renderTopicTags();
    }

    const strategicElements = document.getElementById('strategic-elements');
    if (strategicElements) {
      strategicElements.innerHTML = this.renderStrategicElements();
    }

    this.scrollToBottom();
  }

  /**
   * Scroll to bottom of chat
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesArea = document.getElementById('chat-messages-area');
      if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
    }, 100);
  }

  /**
   * Save progress
   */
  private async saveProgress(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // In production, this would save to backend
      console.log('Saving chat session:', this.currentSession);
      
      // Show feedback
      const saveBtn = document.getElementById('save-progress-btn');
      const originalText = saveBtn?.textContent || '💾 Save Progress';
      if (saveBtn) {
        saveBtn.textContent = '✅ Saved';
        setTimeout(() => {
          if (saveBtn) saveBtn.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  /**
   * End chat session
   */
  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    const confirmed = confirm('Are you ready to complete this session and generate your creative strategy?');
    if (!confirmed) return;

    try {
      // Generate final creative strategy from chat
      await this.generateFinalStrategy();
      
      // Mark session as completed
      this.currentSession.status = 'completed';
      
      // Close chat interface
      this.close();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Generate final creative strategy from chat session
   */
  private async generateFinalStrategy(): Promise<void> {
    if (!this.currentSession) return;

    // Extract strategic elements from conversation
    const context = this.currentSession.context;
    const messages = this.currentSession.messages;

    // Create strategy data structure from chat context
    const strategyData = {
      project_id: this.currentSession.projectId,
      creative_concept: this.extractCreativeConcept(messages, context),
      target_audience: this.extractTargetAudience(messages, context),
      tone: this.extractTone(messages, context),
      key_themes: context.keyTopicsIdentified || [],
      satirical_angles: this.extractSatiricalAngles(messages, context),
      character_archetypes: this.extractCharacterArchetypes(messages, context),
      visual_style_guide: this.extractVisualStyle(messages, context),
      created_by: 'temp-user-id',
      generated_by_persona: this.currentSession.persona
    };

    // Save to backend
    try {
      // @ts-ignore
      const result = await window.electronAPI.database.createCreativeStrategy(strategyData);
      if (result.success) {
        alert('✅ Creative Strategy generated successfully from your chat session!');
        
        // Trigger refresh of strategy tab
        window.dispatchEvent(new CustomEvent('refreshStrategy'));
      } else {
        alert('❌ Failed to generate strategy: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to create strategy from chat:', error);
      alert('❌ Failed to generate strategy from chat session');
    }
  }

  /**
   * Extract creative concept from chat
   */
  private extractCreativeConcept(messages: ChatMessage[], context: any): string {
    const userMessages = messages.filter(m => m.sender === 'USER').map(m => m.content).join(' ');
    const themes = context.keyTopicsIdentified?.join(', ') || 'current events';
    
    return `Satirical approach to ${themes} developed through collaborative discussion. Focus on ${context.strategicElements?.['Primary Theme'] || 'social commentary'} with emphasis on ${context.strategicElements?.['Satirical Approach'] || 'observational humor'}.`;
  }

  /**
   * Extract other strategy elements (simplified for now)
   */
  private extractTargetAudience(messages: ChatMessage[], context: any): string {
    return 'SOCIAL_COMMENTARY'; // Default, could be extracted from conversation
  }

  private extractTone(messages: ChatMessage[], context: any): string {
    return 'DRY_WIT'; // Default, could be extracted from conversation
  }

  private extractSatiricalAngles(messages: ChatMessage[], context: any): any[] {
    return [{
      angle_type: 'EXAGGERATION',
      description: 'Amplify absurd elements identified in chat discussion',
      key_elements: context.keyTopicsIdentified || ['Media Commentary', 'Social Observation']
    }];
  }

  private extractCharacterArchetypes(messages: ChatMessage[], context: any): any[] {
    return [{
      name: context.strategicElements?.['Character Concept'] || 'The Narrator',
      role: 'Main commentator',
      satirical_traits: ['Observational', 'Witty', 'Slightly cynical'],
      visual_description: 'Developed through collaborative discussion'
    }];
  }

  private extractVisualStyle(messages: ChatMessage[], context: any): any {
    return {
      overall_aesthetic: 'Style developed through collaborative chat session',
      cinematography_notes: 'Visual approach refined through discussion',
      color_palette: 'To be determined in production phase'
    };
  }

  /**
   * Close chat interface
   */
  public close(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.currentSession = null;
  }

  /**
   * Get persona information
   */
  private getPersonaInfo(persona: PersonaType): { name: string; description: string; icon: string } {
    const personas = {
      'CREATIVE_STRATEGIST': {
        name: 'Creative Strategist',
        description: 'Expert in developing satirical angles and creative direction',
        icon: '🎯'
      },
      'BAFFLING_BROADCASTER': {
        name: 'Baffling Broadcaster',
        description: 'Specialist in out-of-touch presenter commentary',
        icon: '📺'
      },
      'SATIRICAL_SCREENWRITER': {
        name: 'Satirical Screenwriter',
        description: 'Master of cynical dialogue and scene construction',
        icon: '✍️'
      },
      'CINEMATIC_STORYBOARDER': {
        name: 'Cinematic Storyboarder',
        description: 'Visual storytelling and storyboard expert',
        icon: '🎬'
      },
      'SOUNDSCAPE_ARCHITECT': {
        name: 'Soundscape Architect',
        description: 'Audio design and sound effects specialist',
        icon: '🎵'
      },
      'VIDEO_PROMPT_ENGINEER': {
        name: 'Video Prompt Engineer',
        description: 'AI-optimized video prompt generation expert',
        icon: '🤖'
      },
      'PROJECT_DIRECTOR': {
        name: 'Project Director',
        description: 'Overall project coordination and oversight',
        icon: '🎭'
      }
    };

    return personas[persona] || personas['CREATIVE_STRATEGIST'];
  }

  /**
   * Format conversation phase for display
   */
  private formatPhase(phase: string): string {
    return phase.charAt(0).toUpperCase() + phase.slice(1).replace(/([A-Z])/g, ' $1');
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Render configuration required state
   */
  private renderConfigurationRequired(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="chat-config-required">
        <div class="config-icon">⚙️</div>
        <h3>AI Configuration Required</h3>
        <p>To use AI chat, you need to configure your AI provider settings.</p>
        <div class="config-options">
          <div class="config-option">
            <h4>🔧 Quick Setup Options:</h4>
            <ul>
              <li><strong>OpenAI:</strong> Use GPT-4 for best results</li>
              <li><strong>Anthropic:</strong> Use Claude for detailed conversations</li>
              <li><strong>Local:</strong> Use Ollama for privacy</li>
            </ul>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn btn-primary" id="open-llm-settings">
            🔑 Configure AI Settings
          </button>
          <button class="btn btn-outline" id="use-mock-chat">
            💬 Use Basic Chat (No AI)
          </button>
        </div>
      </div>
    `;

    // Setup event listeners
    document.getElementById('open-llm-settings')?.addEventListener('click', () => {
      llmSettings.open();
      
      // Listen for settings update
      const handleSettingsUpdate = () => {
        window.removeEventListener('llmSettingsUpdated', handleSettingsUpdate);
        // Reinitialize chat after settings are saved
        location.reload();
      };
      window.addEventListener('llmSettingsUpdated', handleSettingsUpdate);
    });

    document.getElementById('use-mock-chat')?.addEventListener('click', () => {
      // Initialize with mock responses
      this.initializeMockChat();
    });
  }

  /**
   * Initialize with mock responses (fallback)
   */
  private async initializeMockChat(): Promise<void> {
    // Force use of mock responses
    this.useMockResponses = true;
    
    // Need to create session first if it doesn't exist
    if (!this.currentSession) {
      console.error('No session to initialize mock chat');
      return;
    }
    
    // Render and start conversation
    this.render();
    await this.startConversation();
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="chat-error">
        <div class="error-icon">❌</div>
        <h3>Chat Interface Error</h3>
        <p>${this.escapeHtml(message)}</p>
        <div class="error-actions">
          <button class="btn btn-outline" id="configure-ai-btn">
            ⚙️ Configure AI
          </button>
          <button class="btn btn-primary" onclick="location.reload()">
            🔄 Retry
          </button>
        </div>
      </div>
    `;

    document.getElementById('configure-ai-btn')?.addEventListener('click', () => {
      llmSettings.open();
    });
  }
}

// Export singleton instance
export const aiChatInterface = new AIChatInterface();