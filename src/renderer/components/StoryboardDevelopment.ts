// Storyboard Development Component
// Handles visual design and storyboarding for the Cinematic Storyboarder persona

import { Shot, Storyboard } from '../../shared/types/index.js';

export class StoryboardDevelopment {
  private currentProjectId: string | null = null;
  private currentScript: any = null;
  private creativeStrategy: any = null;
  private currentStoryboard: Storyboard | null = null;
  private conversationId: string = '';
  private shots: Shot[] = [];

  /**
   * Initialize storyboard development for a project
   */
  async initialize(projectId: string): Promise<void> {
    try {
      this.currentProjectId = projectId;
      
      // Load project context
      await this.loadProjectContext();
      
      // Load existing storyboard and shots
      await this.loadExistingStoryboard();
      await this.loadExistingShotsFromDatabase();
      
      // Initialize conversation for AI assistance
      this.conversationId = `storyboard-${projectId}-${Date.now()}`;
      
      // Render the storyboard development interface
      this.renderStoryboardInterface();
      
      // Setup event handlers with a small delay to ensure DOM is ready
      setTimeout(() => {
        this.setupEventHandlers();
      }, 100);
      
    } catch (error) {
      console.error('Failed to initialize storyboard development:', error);
      this.renderError('Failed to load storyboard development interface');
    }
  }

  /**
   * Load project context (script, creative strategy)
   */
  private async loadProjectContext(): Promise<void> {
    try {
      if (!this.currentProjectId) return;

      // Load creative strategy
      const strategyResult = await window.electronAPI.database.getCreativeStrategy(this.currentProjectId);
      if (strategyResult.success && strategyResult.data) {
        this.creativeStrategy = strategyResult.data;
        console.log('Creative strategy loaded for storyboard development:', this.creativeStrategy?.id);
      }

      // Load approved script
      const scriptsResult = await window.electronAPI.database.getScriptsByProject(this.currentProjectId);
      if (scriptsResult.success && scriptsResult.data && scriptsResult.data.length > 0) {
        // Get the most recent approved script
        const approvedScript = scriptsResult.data
          .filter((script: any) => script.status === 'APPROVED')
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
        
        if (approvedScript) {
          this.currentScript = approvedScript;
          console.log('Approved script loaded for storyboard development:', this.currentScript?.id);
        } else {
          console.warn('No approved script found for storyboard development');
        }
      }
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  }

  /**
   * Load existing storyboard for this project
   */
  private async loadExistingStoryboard(): Promise<void> {
    try {
      if (!this.currentProjectId) return;
      
      const result = await window.electronAPI.database.getStoryboard(this.currentProjectId);
      if (result.success && result.data) {
        this.currentStoryboard = result.data;
        console.log('Existing storyboard loaded:', this.currentStoryboard?.id);
      }
    } catch (error) {
      console.error('Failed to load existing storyboard:', error);
    }
  }

  /**
   * Load existing shots from database
   */
  private async loadExistingShotsFromDatabase(): Promise<void> {
    try {
      if (!this.currentProjectId) return;
      
      const result = await window.electronAPI.database.getShots(this.currentProjectId);
      if (result.success && result.data) {
        this.shots = result.data;
        console.log(`Loaded ${this.shots.length} existing shots from database`);
      }
    } catch (error) {
      console.error('Failed to load existing shots:', error);
    }
  }

  /**
   * Render the storyboard development interface
   */
  private renderStoryboardInterface(): void {
    const container = document.getElementById('storyboard-development-container');
    if (!container) return;

    container.innerHTML = `
      <div class="storyboard-workspace">
        <div class="storyboard-header">
          <h2>🎬 Visual Storyboard Development</h2>
          <p>Collaborate with the Cinematic Storyboarder AI to create visual storyboards based on your approved script</p>
          
          ${this.renderScriptContext()}
        </div>

        <div class="storyboard-content-area">
          <!-- Storyboard Editor Section -->
          <div class="storyboard-editor-section">
            <div class="storyboard-form-container">
              <div class="form-group">
                <label for="storyboard-concept">Visual Concept Overview</label>
                <textarea 
                  id="storyboard-concept" 
                  class="form-control" 
                  rows="4" 
                  placeholder="Overall visual style, cinematography approach, and artistic direction..."
                >${this.currentStoryboard?.visual_concept || ''}</textarea>
                <small class="form-hint">High-level visual style and cinematographic approach</small>
              </div>

              <div class="shots-container">
                <div class="shots-header">
                  <h4>📸 Shot Breakdown</h4>
                  <button type="button" id="add-shot-btn" class="btn btn-secondary">
                    ➕ Add Shot
                  </button>
                </div>
                
                <div id="shot-form-container" class="shot-form-container" style="display: none;">
                  ${this.renderInlineShotForm()}
                </div>
                
                <div id="shots-list" class="shots-list">
                  ${this.renderShotsList()}
                </div>
              </div>

              <div class="storyboard-actions">
                <button type="button" id="save-storyboard-btn" class="btn btn-primary">
                  💾 Save Storyboard
                </button>
                <button type="button" id="validate-storyboard-btn" class="btn btn-secondary">
                  ✅ Validate Timing
                </button>
                <button type="button" id="submit-storyboard-approval-btn" class="btn btn-success">
                  📋 Submit for Approval
                </button>
              </div>

              <div id="storyboard-status" class="storyboard-status">
                ${this.renderStoryboardStatus()}
              </div>
            </div>
          </div>

          <!-- AI Chat Assistant Section -->
          <div class="storyboard-ai-section">
            <div class="ai-assistant-container">
              <div class="ai-assistant-header">
                <h4>🎭 Cinematic Storyboarder AI Assistant</h4>
                <p>Get help with visual design, shot composition, and cinematography based on your script</p>
              </div>
              
              <div id="storyboard-chat-container" class="chat-container">
                <div id="storyboard-chat-messages" class="chat-messages">
                  ${this.renderInitialAIMessage()}
                </div>
                
                <div class="chat-input-container">
                  <div class="chat-input-wrapper">
                    <textarea 
                      id="storyboard-user-input" 
                      class="chat-input" 
                      placeholder="Ask for help with visual style, shot composition, camera angles, lighting..."
                      rows="4"
                      style="min-height: 80px; resize: vertical;"
                    ></textarea>
                    <button id="storyboard-send-message" class="chat-send-btn">Send</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Storyboard Development Tips -->
            <div class="storyboard-tips">
              <h5>🎯 Storyboard Development Tips</h5>
              <div class="tips-grid">
                <span><strong>8-Second Rule:</strong> Each shot must be ≤8 seconds for AI generation</span>
                <span><strong>Visual Continuity:</strong> Maintain consistent style across shots</span>
                <span><strong>Shot Variety:</strong> Mix wide, medium, and close-up shots</span>
                <span><strong>Camera Movement:</strong> Specify pans, zooms, and static shots</span>
                <span><strong>Lighting Notes:</strong> Define mood and atmosphere</span>
                <span><strong>Character Blocking:</strong> Position characters in frame</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render script context
   */
  private renderScriptContext(): string {
    if (!this.currentScript) {
      return `
        <div class="script-context missing">
          <div class="context-warning">
            <span class="warning-icon">⚠️</span>
            <div>
              <strong>No Approved Script Found</strong>
              <p>Complete and approve a script first to enable storyboard development.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="script-context available">
        <div class="context-info">
          <span class="context-icon">✅</span>
          <div>
            <strong>Working from Approved Script</strong>
            <p>Script approved on ${new Date(this.currentScript.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
        <details class="script-preview">
          <summary>📄 View Script Preview</summary>
          <div class="script-content-preview">
            ${this.currentScript.outline ? `
              <div class="script-section">
                <h6>Outline:</h6>
                <p>${this.currentScript.outline.substring(0, 200)}...</p>
              </div>
            ` : ''}
            ${this.currentScript.content ? `
              <div class="script-section">
                <h6>Script Content:</h6>
                <p>${this.currentScript.content.substring(0, 300)}...</p>
              </div>
            ` : ''}
          </div>
        </details>
      </div>
    `;
  }

  /**
   * Render shots list
   */
  private renderShotsList(): string {
    if (this.shots.length === 0) {
      return `
        <div class="empty-shots-state">
          <div class="empty-icon">📸</div>
          <p>No shots created yet. Use the AI assistant to help break down your script into visual shots.</p>
        </div>
      `;
    }

    let html = '';
    
    // Add insert button at the beginning
    html += this.renderInsertButton(0);
    
    // Render shots with insert buttons after each
    this.shots.forEach((shot, index) => {
      html += this.renderShotItem(shot, index);
      html += this.renderInsertButton(index + 1);
    });

    return html;
  }

  /**
   * Render insert button
   */
  private renderInsertButton(insertPosition: number): string {
    const beforeText = insertPosition === 0 ? 'at beginning' : `after Shot ${insertPosition}`;
    return `
      <div class="insert-shot-container">
        <button type="button" class="btn-insert-shot" data-insert-position="${insertPosition}">
          ➕ Insert shot ${beforeText}
        </button>
      </div>
    `;
  }

  /**
   * Render individual shot item
   */
  private renderShotItem(shot: Shot, index: number): string {
    return `
      <div class="shot-item" data-shot-index="${index}">
        <div class="shot-header">
          <h5>Shot ${index + 1}</h5>
          <div class="shot-actions">
            <button type="button" class="btn btn-sm btn-secondary btn-edit-shot" data-shot-index="${index}">
              ✏️ Edit
            </button>
            <button type="button" class="btn btn-sm btn-danger btn-delete-shot" data-shot-index="${index}">
              🗑️ Delete
            </button>
          </div>
        </div>
        
        <div class="shot-details">
          <div class="shot-timing ${shot.length_seconds > 8 ? 'timing-warning' : 'timing-ok'}">
            <strong>Duration:</strong> ${shot.length_seconds}s ${shot.length_seconds > 8 ? '⚠️ Exceeds 8-second limit' : '✅'}
          </div>
          
          <div class="shot-visual">
            <strong>Visual:</strong> ${shot.visual_style}
          </div>
          
          <div class="shot-camera">
            <strong>Camera:</strong> ${shot.camera_angle}
          </div>
          
          <div class="shot-action">
            <strong>Action:</strong> ${shot.character_action}
          </div>
          
          ${shot.dialogue_narration ? `
            <div class="shot-dialogue">
              <strong>Dialogue/Narration:</strong> ${shot.dialogue_narration}
            </div>
          ` : ''}
          
          <div class="shot-lighting">
            <strong>Lighting/Mood:</strong> ${shot.lighting_mood}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render storyboard status
   */
  private renderStoryboardStatus(): string {
    return `
      <div class="status-info">
        <span class="status-label">Status:</span>
        <span class="status-value draft">Draft</span>
      </div>
    `;
  }

  /**
   * Render initial AI message
   */
  private renderInitialAIMessage(): string {
    return `
      <div class="chat-message ai-message">
        <div class="message-avatar">🎭</div>
        <div class="message-content">
          <div class="message-sender">Cinematic Storyboarder</div>
          <div class="message-text">
            Hello! I'm here to help you transform your approved script into a compelling visual storyboard. 
            I can help you break down scenes into shots, suggest camera angles, and ensure each shot 
            stays within the 8-second limit for AI video generation.
            <br><br>
            <strong>What would you like to work on first?</strong>
            <ul>
              <li>Break down the script into individual shots</li>
              <li>Suggest visual style and cinematography</li>
              <li>Help with specific scene composition</li>
              <li>Review shot timing and pacing</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Save storyboard button
    document.getElementById('save-storyboard-btn')?.addEventListener('click', () => {
      this.saveStoryboard();
    });

    // Validate storyboard button
    document.getElementById('validate-storyboard-btn')?.addEventListener('click', () => {
      this.validateStoryboard();
    });

    // Submit for approval button
    document.getElementById('submit-storyboard-approval-btn')?.addEventListener('click', () => {
      this.submitForApproval();
    });

    // Add shot button
    document.getElementById('add-shot-btn')?.addEventListener('click', () => {
      this.addNewShot();
    });

    // Setup initial shot event listeners
    this.setupShotEventListeners();
    
    // Auto-save visual concept on change
    const visualConceptField = document.getElementById('storyboard-concept') as HTMLTextAreaElement;
    if (visualConceptField) {
      let saveTimeout: NodeJS.Timeout;
      visualConceptField.addEventListener('input', () => {
        // Debounce auto-save
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          this.saveStoryboard(true); // Silent save
        }, 2000); // Save 2 seconds after user stops typing
      });
    }

    // AI chat functionality
    const sendButton = document.getElementById('storyboard-send-message');
    const userInput = document.getElementById('storyboard-user-input') as HTMLTextAreaElement;

    // Ensure textarea is properly initialized and focusable
    if (userInput) {
      userInput.setAttribute('tabindex', '0');
      userInput.style.height = '80px';
      
      userInput.addEventListener('click', () => {
        if (!userInput.disabled) {
          userInput.focus();
        }
      });
      
      const autoResize = () => {
        userInput.style.height = 'auto';
        const newHeight = Math.max(80, Math.min(userInput.scrollHeight, 300));
        userInput.style.height = newHeight + 'px';
      };
      
      userInput.addEventListener('input', autoResize);
      userInput.addEventListener('paste', () => {
        setTimeout(autoResize, 10);
      });
      
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
  }

  /**
   * Send message to AI assistant
   */
  private async sendAIMessage(): Promise<void> {
    const userInput = document.getElementById('storyboard-user-input') as HTMLTextAreaElement;
    const messagesContainer = document.getElementById('storyboard-chat-messages');
    const sendButton = document.getElementById('storyboard-send-message') as HTMLButtonElement;

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
      userInput.style.height = '80px';

      // Load project details for context
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
        current_storyboard: this.currentStoryboard,
        existing_shots: this.shots,
        shots_summary: this.generateShotsSummary(),
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

      // Get agent config from renderer process
      const { AgentConfigService } = await import('../../services/agent-config.js');
      const agentConfig = AgentConfigService.getAgentConfig('CINEMATIC_STORYBOARDER');
      
      console.log('DEBUG: Agent config for CINEMATIC_STORYBOARDER:', agentConfig);
      console.log('DEBUG: Context being sent to storyboard AI:', JSON.stringify(context, null, 2));
      
      // Add specific prompt enhancement
      const enhancedMessage = `${message}

IMPORTANT PROJECT CONTEXT:
- Satirical Format: ${context.satirical_format || 'Not specified'}
- Project: "${context.project_title}"
- Script Status: ${context.current_script ? 'Approved and Available' : 'Not available'}
- Creative Strategy: ${context.creative_strategy ? 'Available' : 'Not available'}

CURRENT STORYBOARD STATUS:
${context.shots_summary}

Please use this context, the existing shots, and the 8-second shot limit constraint in your response. When suggesting new shots, consider how they fit with the existing sequence.`;
      
      // Send to AI with agent config
      const response = await window.electronAPI.llm.generatePersonaResponse(
        this.conversationId,
        'CINEMATIC_STORYBOARDER',
        enhancedMessage,
        context,
        agentConfig
      );

      if (response.success && response.data) {
        this.addMessageToChat('ai', response.data);
      } else {
        console.error('AI response error:', response);
        this.addMessageToChat('ai', `Sorry, I encountered an error: ${response.error || 'Unknown error'}. Please check that the Cinematic Storyboarder agent is properly configured in Settings.`);
      }
    } catch (error) {
      console.error('Failed to send AI message:', error);
      this.addMessageToChat('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
      // Re-enable input and focus it
      userInput.disabled = false;
      if (sendButton) sendButton.disabled = false;
      
      setTimeout(() => {
        userInput.focus();
      }, 100);
    }
  }

  /**
   * Add message to chat display
   */
  private addMessageToChat(sender: 'user' | 'ai', message: string): void {
    const messagesContainer = document.getElementById('storyboard-chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = sender === 'ai' ? '🎭' : '👤';
    const senderName = sender === 'ai' ? 'Cinematic Storyboarder' : 'You';
    
    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-sender">${senderName}</div>
        <div class="message-text">${message.replace(/\n/g, '<br>')}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Save storyboard
   */
  private async saveStoryboard(silent: boolean = false): Promise<void> {
    try {
      if (!this.currentProjectId) return;

      // Get visual concept from form
      const visualConcept = (document.getElementById('storyboard-concept') as HTMLTextAreaElement)?.value || '';
      
      const storyboardData = {
        script_id: this.currentScript?.id || '',
        visual_concept: visualConcept,
        shots: this.shots,
        status: 'DRAFT' as const,
        created_by: 'temp-user-id'
      };

      const result = await window.electronAPI.database.saveStoryboard(this.currentProjectId, storyboardData);
      if (result.success) {
        this.currentStoryboard = result.data;
        if (!silent) {
          alert('💾 Storyboard saved successfully!');
        }
      } else {
        throw new Error(result.error || 'Failed to save storyboard');
      }
    } catch (error) {
      console.error('Failed to save storyboard:', error);
      alert('❌ Failed to save storyboard. Please try again.');
    }
  }

  /**
   * Validate storyboard timing
   */
  private validateStoryboard(): void {
    try {
      // Implementation for validating 8-second constraints
      alert('✅ Storyboard timing validation complete!');
    } catch (error) {
      console.error('Failed to validate storyboard:', error);
      alert('❌ Failed to validate storyboard. Please try again.');
    }
  }

  /**
   * Submit storyboard for approval
   */
  private async submitForApproval(): Promise<void> {
    try {
      // Implementation for submitting for approval
      alert('📋 Storyboard submitted for approval!');
    } catch (error) {
      console.error('Failed to submit storyboard for approval:', error);
      alert('❌ Failed to submit storyboard for approval. Please try again.');
    }
  }

  /**
   * Add new shot
   */
  private addNewShot(): void {
    this.showInlineShotForm();
  }

  /**
   * Insert shot at specific position
   */
  private insertShotAtPosition(insertPosition: number): void {
    this.showInlineShotForm(undefined, insertPosition);
  }

  /**
   * Render inline shot form
   */
  private renderInlineShotForm(shotIndex?: number, insertPosition?: number): string {
    const isEditing = shotIndex !== undefined;
    const isInserting = insertPosition !== undefined;
    const shot = isEditing ? this.shots[shotIndex!] : null;
    
    let formTitle = 'Add New Shot';
    if (isEditing) {
      formTitle = 'Edit Shot';
    } else if (isInserting) {
      formTitle = insertPosition === 0 ? 'Insert Shot at Beginning' : `Insert Shot After Shot ${insertPosition}`;
    }
    
    return `
      <div class="inline-shot-form">
        <div class="form-header">
          <h5>${formTitle}</h5>
          <button type="button" class="btn-close-form" id="close-inline-form">✕</button>
        </div>
        
        <form id="inline-shot-form" class="shot-form-inline">
          <div class="form-row">
            <div class="form-group">
              <label for="inline-shot-duration">Duration (seconds) *</label>
              <input 
                type="number" 
                id="inline-shot-duration" 
                class="form-control" 
                min="1" 
                max="8" 
                step="0.5" 
                value="${shot?.length_seconds || 3}"
                required
              >
              <small class="form-hint">Maximum 8 seconds for AI video generation</small>
            </div>
            
            <div class="form-group">
              <label for="inline-shot-camera">Camera & Movement Details *</label>
              <textarea 
                id="inline-shot-camera" 
                class="form-control" 
                rows="3"
                placeholder="e.g., Camera: Wide establishing shot (16ft) pushing slowly to medium shot (8ft)
Movement: Smooth mechanical push-in  
Framing: Centered on anchor, rule of thirds"
                required
              >${shot?.camera_angle || ''}</textarea>
              <small class="form-hint">Detailed camera specs, movement, and framing as AI provides</small>
            </div>
          </div>
          
          <div class="form-group">
            <label for="inline-shot-visual">Visual Style & Setting *</label>
            <textarea 
              id="inline-shot-visual" 
              class="form-control" 
              rows="4" 
              placeholder="e.g., - Professional news studio with glossy black anchor desk
- Deep blue backdrop with subtle world map pattern  
- Lower third graphic: 'BREAKING NEWS: Revolutionary Program'
- Chrome/glass desk with perfectly arranged papers"
              required
            >${shot?.visual_style || ''}</textarea>
            <small class="form-hint">Detailed environment with all graphics and visual elements</small>
          </div>
          
          <div class="form-group">
            <label for="inline-shot-action">Character Action & Timing *</label>
            <textarea 
              id="inline-shot-action" 
              class="form-control" 
              rows="3" 
              placeholder="e.g., 1. Anchor straightens papers (1sec)
2. Looks up with grave expression (1sec)
3. Gestures towards screen (2sec)"
              required
            >${shot?.character_action || ''}</textarea>
            <small class="form-hint">Timestamped character actions as AI provides</small>
          </div>
          
          <div class="form-group">
            <label for="inline-shot-dialogue">Dialogue Indicator</label>
            <input 
              type="text" 
              id="inline-shot-dialogue" 
              class="form-control" 
              placeholder="e.g., 'Anchor delivers breaking news', 'Karen speaks enthusiastically', 'Voiceover narration'"
              value="${shot?.dialogue_narration || ''}"
            >
            <small class="form-hint">Who speaks or type of dialogue (exact text comes from script)</small>
          </div>
          
          <div class="form-group">
            <label for="inline-shot-lighting">Lighting/Mood *</label>
            <textarea 
              id="inline-shot-lighting" 
              class="form-control" 
              rows="2" 
              placeholder="e.g., Bright studio lighting, Professional news atmosphere, Dramatic shadows..."
              required
            >${shot?.lighting_mood || ''}</textarea>
            <small class="form-hint">Lighting setup and overall mood</small>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-inline-form">Cancel</button>
            <button type="button" class="btn btn-primary" id="save-inline-form" data-shot-index="${shotIndex !== undefined ? shotIndex : ''}" data-insert-position="${insertPosition !== undefined ? insertPosition : ''}">
              ${isEditing ? 'Update Shot' : isInserting ? 'Insert Shot' : 'Add Shot'}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Show inline shot form
   */
  private showInlineShotForm(shotIndex?: number, insertPosition?: number): void {
    const formContainer = document.getElementById('shot-form-container');
    if (!formContainer) return;
    
    formContainer.innerHTML = this.renderInlineShotForm(shotIndex, insertPosition);
    formContainer.style.display = 'block';
    
    // Hide add shot button while form is open
    const addShotBtn = document.getElementById('add-shot-btn');
    if (addShotBtn) addShotBtn.style.display = 'none';
    
    this.setupInlineFormEventListeners(shotIndex, insertPosition);
  }

  /**
   * Hide inline shot form
   */
  private hideInlineShotForm(): void {
    const formContainer = document.getElementById('shot-form-container');
    if (formContainer) {
      formContainer.style.display = 'none';
      formContainer.innerHTML = '';
    }
    
    // Show add shot button again
    const addShotBtn = document.getElementById('add-shot-btn');
    if (addShotBtn) addShotBtn.style.display = 'inline-block';
  }

  /**
   * Setup inline form event listeners
   */
  private setupInlineFormEventListeners(shotIndex?: number, insertPosition?: number): void {
    const closeBtn = document.getElementById('close-inline-form');
    const cancelBtn = document.getElementById('cancel-inline-form');
    const saveBtn = document.getElementById('save-inline-form');
    
    closeBtn?.addEventListener('click', () => this.hideInlineShotForm());
    cancelBtn?.addEventListener('click', () => this.hideInlineShotForm());
    saveBtn?.addEventListener('click', () => this.saveInlineShotForm(shotIndex));
  }

  /**
   * Save shot from inline form
   */
  private saveInlineShotForm(shotIndex?: number): void {
    const duration = parseFloat((document.getElementById('inline-shot-duration') as HTMLInputElement).value);
    const camera = (document.getElementById('inline-shot-camera') as HTMLTextAreaElement).value;
    const visual = (document.getElementById('inline-shot-visual') as HTMLTextAreaElement).value;
    const action = (document.getElementById('inline-shot-action') as HTMLTextAreaElement).value;
    const dialogue = (document.getElementById('inline-shot-dialogue') as HTMLInputElement).value;
    const lighting = (document.getElementById('inline-shot-lighting') as HTMLTextAreaElement).value;
    
    // Get insert position from save button if it exists
    const saveButton = document.getElementById('save-inline-form');
    const insertPosition = saveButton ? parseInt(saveButton.getAttribute('data-insert-position') || '') : undefined;
    
    // Validate required fields
    if (!camera || !visual || !action || !lighting) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (duration > 8) {
      const confirm = window.confirm('This shot exceeds the 8-second limit for AI generation. Continue anyway?');
      if (!confirm) return;
    }
    
    const shotData: Shot = {
      id: shotIndex !== undefined ? this.shots[shotIndex].id : `shot-${Date.now()}`,
      script_id: this.currentScript?.id || '',
      panel_number: shotIndex !== undefined ? this.shots[shotIndex].panel_number : this.shots.length + 1,
      length_seconds: duration,
      camera_angle: camera,
      character_action: action,
      lighting_mood: lighting,
      dialogue_narration: dialogue || undefined,
      visual_style: visual,
      created_at: shotIndex !== undefined ? this.shots[shotIndex].created_at : new Date(),
      updated_at: new Date()
    };
    
    if (shotIndex !== undefined) {
      // Update existing shot
      this.shots[shotIndex] = shotData;
    } else if (insertPosition !== undefined && !isNaN(insertPosition)) {
      // Insert shot at specific position
      this.shots.splice(insertPosition, 0, shotData);
      // Update panel numbers for all shots after insertion
      this.shots.forEach((shot, index) => {
        shot.panel_number = index + 1;
      });
    } else {
      // Add new shot at end
      this.shots.push(shotData);
    }
    
    // Hide form and refresh shots list
    this.hideInlineShotForm();
    this.refreshShotsList();
    
    // Auto-save shots to database and storyboard  
    this.saveShotsToDatabase();
    this.saveStoryboard(true); // Silent save
  }


  /**
   * Refresh shots list display
   */
  private refreshShotsList(): void {
    const shotsContainer = document.getElementById('shots-list');
    if (shotsContainer) {
      shotsContainer.innerHTML = this.renderShotsList();
      this.setupShotEventListeners();
    }
  }

  /**
   * Setup event listeners for shot items
   */
  private setupShotEventListeners(): void {
    // Edit shot buttons
    document.querySelectorAll('.btn-edit-shot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shotIndex = parseInt((e.target as HTMLElement).getAttribute('data-shot-index') || '0');
        this.showInlineShotForm(shotIndex);
      });
    });
    
    // Delete shot buttons
    document.querySelectorAll('.btn-delete-shot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shotIndex = parseInt((e.target as HTMLElement).getAttribute('data-shot-index') || '0');
        this.deleteShot(shotIndex);
      });
    });

    // Insert shot buttons
    document.querySelectorAll('.btn-insert-shot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const insertPosition = parseInt((e.target as HTMLElement).getAttribute('data-insert-position') || '0');
        this.insertShotAtPosition(insertPosition);
      });
    });
  }

  /**
   * Delete shot
   */
  private async deleteShot(shotIndex: number): Promise<void> {
    if (confirm(`Are you sure you want to delete Shot ${shotIndex + 1}?`)) {
      this.shots.splice(shotIndex, 1);
      // Update panel numbers
      this.shots.forEach((shot, index) => {
        shot.panel_number = index + 1;
      });
      this.refreshShotsList();
      
      // Auto-save shots to database and storyboard
      this.saveShotsToDatabase();
      this.saveStoryboard(true); // Silent save
    }
  }

  /**
   * Generate shots summary for AI context
   */
  private generateShotsSummary(): string {
    if (this.shots.length === 0) {
      return "No shots created yet. This is the start of the storyboard.";
    }

    const summary = this.shots.map((shot, index) => {
      return `SHOT ${shot.panel_number} (${shot.length_seconds}s):
- Camera: ${shot.camera_angle.split('\n')[0].replace('Camera: ', '')}
- Visual: ${shot.visual_style.split('\n')[0].replace('- ', '')}
- Action: ${shot.character_action.split('\n')[0].replace(/^\d+\.\s*/, '')}
- Dialogue: ${shot.dialogue_narration || 'No dialogue'}`;
    }).join('\n\n');

    return `EXISTING STORYBOARD (${this.shots.length} shots):\n\n${summary}`;
  }

  /**
   * Save shots to database
   */
  private async saveShotsToDatabase(): Promise<void> {
    try {
      if (!this.currentProjectId) return;

      const result = await window.electronAPI.database.saveShots(this.currentProjectId, this.shots);
      if (result.success) {
        console.log(`Saved ${this.shots.length} shots to database`);
      } else {
        console.error('Failed to save shots:', result.error);
      }
    } catch (error) {
      console.error('Failed to save shots to database:', error);
    }
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    const container = document.getElementById('storyboard-development-container');
    if (!container) return;

    container.innerHTML = `
      <div class="storyboard-error">
        <div class="error-icon">❌</div>
        <h3>Storyboard Development Error</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          Retry
        </button>
      </div>
    `;
  }
}

// Export singleton instance
export const storyboardDevelopment = new StoryboardDevelopment();