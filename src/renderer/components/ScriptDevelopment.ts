// Script Development Component for Satirical Screenwriter
// Handles script writing workflow with AI assistance and creative strategy integration

import { Script, CreativeStrategy, PersonaType } from '../../shared/types/index.js';

export class ScriptDevelopment {
  private currentProjectId: string | null = null;
  private currentScript: Script | null = null;
  private creativeStrategy: CreativeStrategy | null = null;
  private conversationId: string | null = null;

  /**
   * Initialize script development for a project
   */
  public async initialize(projectId: string): Promise<void> {
    try {
      this.currentProjectId = projectId;
      
      // Load creative strategy (input for script)
      await this.loadCreativeStrategy();
      
      // Load existing script or prepare for new one
      await this.loadExistingScript();
      
      // Initialize conversation for AI assistance
      this.conversationId = `script-${projectId}-${Date.now()}`;
      
      // Render the script development interface
      this.renderScriptInterface();
      
      // Setup event handlers with a small delay to ensure DOM is ready
      setTimeout(() => {
        this.setupEventHandlers();
      }, 100);
      
    } catch (error) {
      console.error('Failed to initialize script development:', error);
      this.renderError('Failed to load script development interface');
    }
  }

  /**
   * Load creative strategy as input for script development
   */
  private async loadCreativeStrategy(): Promise<void> {
    try {
      if (!this.currentProjectId) return;
      
      const result = await window.electronAPI.database.getCreativeStrategy(this.currentProjectId);
      
      if (result.success && result.data) {
        this.creativeStrategy = result.data;
        console.log('Creative strategy loaded for script development:', this.creativeStrategy?.id);
      } else {
        console.warn('No creative strategy found for project:', this.currentProjectId);
      }
    } catch (error) {
      console.error('Failed to load creative strategy:', error);
    }
  }

  /**
   * Load existing script for this project
   */
  private async loadExistingScript(): Promise<void> {
    try {
      if (!this.currentProjectId) return;
      
      const result = await window.electronAPI.database.getScriptsByProject(this.currentProjectId);
      
      if (result.success && result.data && result.data.length > 0) {
        // Get the most recent script
        this.currentScript = result.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        console.log('Existing script loaded:', this.currentScript?.id);
      }
    } catch (error) {
      console.error('Failed to load existing script:', error);
    }
  }

  /**
   * Render the script development interface
   */
  private renderScriptInterface(): void {
    const container = document.getElementById('script-development-container');
    if (!container) return;

    container.innerHTML = `
      <div class="script-workspace">
        <div class="script-header">
          <h2>✍️ Script Development</h2>
          <p>Collaborate with AI to create engaging satirical scripts based on your creative strategy</p>
          
          ${this.renderStrategyContext()}
        </div>

        <div class="script-content-area">
          <!-- Script Editor Section -->
          <div class="script-editor-section">
            <div class="script-form-container">
              <div class="form-group">
                <label for="script-outline">Script Outline</label>
                <textarea 
                  id="script-outline" 
                  class="form-control" 
                  rows="4" 
                  placeholder="High-level structure and flow of your satirical video script..."
                >${this.currentScript?.outline || ''}</textarea>
                <small class="form-hint">Brief overview of scenes, characters, and narrative arc</small>
              </div>

              <div class="form-group">
                <label for="script-content">Full Script Content</label>
                <textarea 
                  id="script-content" 
                  class="form-control script-content-editor" 
                  rows="20" 
                  placeholder="Write your complete script with dialogue, narration, and scene descriptions..."
                >${this.currentScript?.content || ''}</textarea>
                <small class="form-hint">Complete script with character dialogue, stage directions, and voiceover narration</small>
              </div>

              <div class="script-actions">
                <button type="button" id="save-script-btn" class="btn btn-primary">
                  💾 Save Script
                </button>
                <button type="button" id="validate-script-btn" class="btn btn-secondary">
                  ✅ Validate & Review
                </button>
                ${this.currentScript?.status === 'DRAFT' ? `
                  <button type="button" id="submit-approval-btn" class="btn btn-success">
                    📋 Submit for Approval
                  </button>
                ` : ''}
              </div>

              <div id="script-status" class="script-status">
                ${this.renderScriptStatus()}
              </div>
            </div>
          </div>

          <!-- AI Chat Assistant Section -->
          <div class="script-ai-section">
            <div class="ai-assistant-container">
              <div class="ai-assistant-header">
                <h4>🤖 Satirical Screenwriter AI Assistant</h4>
                <p>Get help with script development, character dialogue, and satirical elements</p>
              </div>
              
              <div id="script-chat-container" class="chat-container">
                <div id="script-chat-messages" class="chat-messages">
                  ${this.renderInitialAIMessage()}
                </div>
                
                <div class="chat-input-container">
                  <div class="chat-input-wrapper">
                    <textarea 
                      id="script-user-input" 
                      class="chat-input" 
                      placeholder="Ask for help with dialogue, scenes, character development, satirical elements..."
                      rows="4"
                      style="min-height: 80px; resize: vertical;"
                    ></textarea>
                    <button id="script-send-message" class="chat-send-btn">Send</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Script Development Tips -->
            <div class="script-tips">
              <h5>💡 Script Development Tips</h5>
              <div class="tips-grid">
                <span><strong>Character Consistency:</strong> Reference creative strategy archetypes</span>
                <span><strong>Satirical Tone:</strong> Maintain perspective throughout</span>
                <span><strong>8-Second Shots:</strong> Structure for video constraints</span>
                <span><strong>Dialogue Tags:</strong> Clear speaker attribution</span>
                <span><strong>Visual Cues:</strong> Include scene descriptions</span>
                <span><strong>Pacing:</strong> Balance dialogue with action</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render creative strategy context
   */
  private renderStrategyContext(): string {
    if (!this.creativeStrategy) {
      return `
        <div class="strategy-context missing">
          <div class="context-warning">
            <span class="warning-icon">⚠️</span>
            <div>
              <strong>No Creative Strategy Found</strong>
              <p>Complete the Creative Strategy first to provide context for script development.</p>
              <button class="btn btn-outline btn-sm" onclick="navigateToCreativeStrategy()">
                Go to Creative Strategy
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="strategy-context">
        <h4>📋 Creative Strategy Context</h4>
        <div class="context-summary">
          <div class="context-item">
            <strong>Creative Concept:</strong> ${this.creativeStrategy.creative_concept}
          </div>
          <div class="context-item">
            <strong>Character Archetypes:</strong> 
            ${this.creativeStrategy.character_archetypes.map(char => char.name).join(', ')}
          </div>
          <div class="context-item">
            <strong>Satirical Angles:</strong> 
            ${this.creativeStrategy.satirical_angles.map(angle => angle.description).join(', ')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render script status
   */
  private renderScriptStatus(): string {
    if (!this.currentScript) {
      return `
        <div class="status-indicator draft">
          <span class="status-icon">📝</span>
          <span>New Script - Ready to Begin</span>
        </div>
      `;
    }

    const statusConfig = {
      'DRAFT': { icon: '📝', text: 'Draft', class: 'draft' },
      'APPROVED': { icon: '✅', text: 'Approved', class: 'approved' }
    };

    const config = statusConfig[this.currentScript.status];
    
    return `
      <div class="status-indicator ${config.class}">
        <span class="status-icon">${config.icon}</span>
        <span>${config.text}</span>
        <small>Last updated: ${new Date(this.currentScript.updated_at || this.currentScript.created_at).toLocaleDateString()}</small>
      </div>
    `;
  }

  /**
   * Render initial AI message
   */
  private renderInitialAIMessage(): string {
    const strategyContext = this.creativeStrategy ? 
      `I can see your creative strategy focuses on "${this.creativeStrategy.creative_concept}" with characters like ${this.creativeStrategy.character_archetypes.map(c => c.name).join(', ')}. ` : 
      '';

    return `
      <div class="chat-message ai-message">
        <div class="message-avatar">🎭</div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">Satirical Screenwriter</span>
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
          </div>
          <div class="message-text">
            Hello! I'm your Satirical Screenwriter AI assistant. ${strategyContext}I'm here to help you craft compelling satirical scripts that bring your creative vision to life.
            
            I can help with:
            • Character dialogue and voice development
            • Scene structure and pacing  
            • Satirical elements and comedic timing
            • Script formatting and clarity
            • Continuity with your creative strategy
            
            What would you like to work on first?
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Save script button
    document.getElementById('save-script-btn')?.addEventListener('click', () => {
      this.saveScript();
    });

    // Validate script button
    document.getElementById('validate-script-btn')?.addEventListener('click', () => {
      this.validateScript();
    });

    // Submit for approval button
    document.getElementById('submit-approval-btn')?.addEventListener('click', () => {
      this.submitForApproval();
    });

    // AI chat functionality
    const sendButton = document.getElementById('script-send-message');
    const userInput = document.getElementById('script-user-input') as HTMLTextAreaElement;

    // Ensure textarea is properly initialized and focusable
    if (userInput) {
      // Make sure it's focusable
      userInput.setAttribute('tabindex', '0');
      userInput.style.height = '80px'; // Set initial height
      
      // Add click handler to ensure focus
      userInput.addEventListener('click', () => {
        if (!userInput.disabled) {
          userInput.focus();
        }
      });
      
      // Auto-resize functionality with better height calculation
      const autoResize = () => {
        userInput.style.height = 'auto';
        const newHeight = Math.max(80, Math.min(userInput.scrollHeight, 300));
        userInput.style.height = newHeight + 'px';
      };
      
      userInput.addEventListener('input', autoResize);
      userInput.addEventListener('paste', () => {
        setTimeout(autoResize, 10);
      });
      
      // Initial resize
      autoResize();
    }

    sendButton?.addEventListener('click', () => {
      this.sendAIMessage();
    });

    userInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendAIMessage();
      }
    });

    // Auto-save functionality for script fields
    let saveTimeout: NodeJS.Timeout;
    const autoSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.saveScript(true); // Silent auto-save
      }, 2000);
    };

    document.getElementById('script-outline')?.addEventListener('input', autoSave);
    document.getElementById('script-content')?.addEventListener('input', autoSave);
  }

  /**
   * Save script to database
   */
  private async saveScript(silent: boolean = false): Promise<void> {
    try {
      const outlineEl = document.getElementById('script-outline') as HTMLTextAreaElement;
      const contentEl = document.getElementById('script-content') as HTMLTextAreaElement;

      if (!outlineEl || !contentEl) return;

      const outline = outlineEl.value.trim();
      const content = contentEl.value.trim();

      if (!content) {
        if (!silent) alert('Please enter script content before saving.');
        return;
      }

      if (!this.currentProjectId) return;

      if (this.currentScript) {
        // Update existing script
        const result = await window.electronAPI.database.updateScript(this.currentScript.id, {
          outline,
          content,
          status: 'DRAFT'
        });

        if (result.success) {
          this.currentScript = result.data;
          if (!silent) {
            alert('✅ Script updated successfully!');
            this.updateScriptStatus();
          }
        } else {
          throw new Error(result.error);
        }
      } else {
        // Create new script
        if (!this.creativeStrategy) {
          alert('⚠️ Please complete Creative Strategy first before creating a script.');
          return;
        }

        const scriptData = {
          project_id: this.currentProjectId,
          director_notes_id: this.creativeStrategy.id, // Link to creative strategy for now
          outline,
          content,
          status: 'DRAFT' as const,
          version: 1,
          ai_generated: false,
          persona_source: 'SATIRICAL_SCREENWRITER'
        };

        const result = await window.electronAPI.database.createScript(scriptData);

        if (result.success) {
          this.currentScript = result.data;
          if (!silent) {
            alert('✅ Script created successfully!');
            this.updateScriptStatus();
          }
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('Failed to save script:', error);
      if (!silent) {
        alert('❌ Failed to save script. Please try again.');
      }
    }
  }

  /**
   * Validate script content
   */
  private validateScript(): void {
    const contentEl = document.getElementById('script-content') as HTMLTextAreaElement;
    if (!contentEl) return;

    const content = contentEl.value.trim();
    const issues: string[] = [];

    // Basic validation
    if (!content) {
      issues.push('Script content is empty');
    }

    if (content.length < 100) {
      issues.push('Script appears too short for a complete video');
    }

    // Check for character consistency with creative strategy
    if (this.creativeStrategy) {
      const characterNames = this.creativeStrategy.character_archetypes.map(c => c.name.toLowerCase());
      const hasCharacters = characterNames.some(name => 
        content.toLowerCase().includes(name)
      );
      
      if (!hasCharacters) {
        issues.push('Script should reference characters from creative strategy');
      }
    }

    // Check for basic script formatting
    if (!content.includes(':') && !content.includes('NARRATOR')) {
      issues.push('Script should include character dialogue or narration');
    }

    if (issues.length === 0) {
      alert('✅ Script validation passed! Ready for approval.');
    } else {
      alert(`⚠️ Script validation issues:\n\n• ${issues.join('\n• ')}\n\nPlease address these before submitting for approval.`);
    }
  }

  /**
   * Submit script for approval
   */
  private async submitForApproval(): Promise<void> {
    try {
      if (!this.currentScript) {
        alert('Please save the script first.');
        return;
      }

      // First validate
      this.validateScript();

      const result = await window.electronAPI.database.updateScript(this.currentScript.id, {
        status: 'APPROVED'
      });

      if (result.success) {
        this.currentScript = result.data;
        alert('✅ Script submitted for approval!');
        this.updateScriptStatus();
        
        // Trigger navigation to next step (storyboard)
        window.dispatchEvent(new CustomEvent('scriptApproved', {
          detail: { scriptId: this.currentScript?.id, projectId: this.currentProjectId }
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to submit script for approval:', error);
      alert('❌ Failed to submit script for approval. Please try again.');
    }
  }

  /**
   * Update script status display
   */
  private updateScriptStatus(): void {
    const statusEl = document.getElementById('script-status');
    if (statusEl) {
      statusEl.innerHTML = this.renderScriptStatus();
    }
  }

  /**
   * Send message to AI assistant
   */
  private async sendAIMessage(): Promise<void> {
    const userInput = document.getElementById('script-user-input') as HTMLTextAreaElement;
    const messagesContainer = document.getElementById('script-chat-messages');
    const sendButton = document.getElementById('script-send-message') as HTMLButtonElement;

    if (!userInput || !messagesContainer || !this.conversationId) return;

    const message = userInput.value.trim();
    if (!message) return;

    try {
      // Disable input during processing
      userInput.disabled = true;
      if (sendButton) sendButton.disabled = true;
      
      // Add user message to chat
      this.addMessageToChat('user', message);
      userInput.value = '';
      
      // Reset height after clearing
      userInput.style.height = '80px';

      // Load project details to get satirical format
      let projectDetails = null;
      try {
        if (this.currentProjectId) {
          const projectResult = await window.electronAPI.database.getProjectById(this.currentProjectId);
          if (projectResult.success && projectResult.data) {
            projectDetails = projectResult.data;
          }
        }
      } catch (error) {
        console.error('Failed to load project details for AI context:', error);
      }

      // Prepare enhanced context for AI - match expected structure
      const context = {
        creative_strategy: this.creativeStrategy,
        current_script: this.currentScript,
        project_id: this.currentProjectId,
        project: {
          ...projectDetails,
          satirical_format: projectDetails?.satirical_format || 'Not specified'
        },
        // Also include at root level for enhanced message
        satirical_format: projectDetails?.satirical_format || 'Not specified',
        project_title: projectDetails?.name || projectDetails?.title || 'Untitled Project',
        news_article: projectDetails ? {
          headline: projectDetails.news_headline,
          content: projectDetails.news_content,
          source: projectDetails.news_source
        } : null
      };

      // Get agent config from renderer process (where localStorage is available)
      const { AgentConfigService } = await import('../../services/agent-config.js');
      const agentConfig = AgentConfigService.getAgentConfig('SATIRICAL_SCREENWRITER');
      
      console.log('DEBUG: Agent config for SATIRICAL_SCREENWRITER:', agentConfig);
      console.log('DEBUG: Context being sent to AI:', JSON.stringify(context, null, 2));
      console.log('DEBUG: Satirical format:', context.satirical_format);
      console.log('DEBUG: Project details:', projectDetails);
      
      // Add a specific prompt enhancement to ensure AI gets the format info
      const enhancedMessage = `${message}

IMPORTANT PROJECT CONTEXT:
- Satirical Format: ${context.satirical_format || 'Not specified'}
- Project: "${context.project_title}"
- Creative Strategy: ${context.creative_strategy ? 'Available' : 'Not available'}
${context.news_article ? `- News Article: "${context.news_article.headline}"` : ''}

Please use this context in your response.`;
      
      // Send to AI with agent config
      const response = await window.electronAPI.llm.generatePersonaResponse(
        this.conversationId,
        'SATIRICAL_SCREENWRITER',
        enhancedMessage,
        context,
        agentConfig
      );

      if (response.success && response.data) {
        this.addMessageToChat('ai', response.data);
      } else {
        console.error('AI response error:', response);
        console.error('Full response object:', JSON.stringify(response, null, 2));
        this.addMessageToChat('ai', `Sorry, I encountered an error: ${response.error || 'Unknown error'}. Please check that the Satirical Screenwriter agent is properly configured in Settings.`);
      }
    } catch (error) {
      console.error('Failed to send AI message:', error);
      this.addMessageToChat('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
      // Re-enable input and focus it
      userInput.disabled = false;
      if (sendButton) sendButton.disabled = false;
      
      // Focus the input after a short delay
      setTimeout(() => {
        userInput.focus();
      }, 100);
    }
  }

  /**
   * Add message to chat display
   */
  private addMessageToChat(sender: 'user' | 'ai', message: string): void {
    const messagesContainer = document.getElementById('script-chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = sender === 'ai' ? '🎭' : '👤';
    const senderName = sender === 'ai' ? 'Satirical Screenwriter' : 'You';
    
    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-header">
          <span class="sender-name">${senderName}</span>
          <span class="message-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="message-text">${message}</div>
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    const container = document.getElementById('script-development-container');
    if (!container) return;

    container.innerHTML = `
      <div class="error-state">
        <h3>❌ Error Loading Script Development</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Export singleton instance
export const scriptDevelopment = new ScriptDevelopment();

// Global navigation function
(window as any).navigateToCreativeStrategy = () => {
  // This will be implemented when we have proper navigation
  alert('Navigate to Creative Strategy (to be implemented)');
};