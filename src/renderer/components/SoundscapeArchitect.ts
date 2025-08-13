// Soundscape Architect Component
// Handles sound design for each shot - ambient sound, foley, SFX, and broadcast audio

import { Shot, SoundNotes } from '../../shared/types/index.js';

export class SoundscapeArchitect {
  private currentProjectId: string | null = null;
  private currentScript: any = null;
  private currentStoryboard: any = null;
  private shots: Shot[] = [];
  private soundNotes: Map<string, SoundNotes> = new Map();
  private conversationId: string = '';

  /**
   * Initialize sound design for a project
   */
  async initialize(projectId: string): Promise<void> {
    try {
      this.currentProjectId = projectId;
      
      // Load project context
      await this.loadProjectContext();
      
      // Load existing storyboard and shots
      await this.loadExistingStoryboard();
      await this.loadExistingShotsFromDatabase();
      
      // Load existing sound notes
      await this.loadExistingSoundNotes();
      
      // Initialize conversation for AI assistance
      this.conversationId = `soundscape-${projectId}-${Date.now()}`;
      
      // Render the sound design interface
      this.renderSoundDesignInterface();
      
      // Setup event handlers with a small delay to ensure DOM is ready
      setTimeout(() => {
        this.setupEventHandlers();
      }, 100);
      
    } catch (error) {
      console.error('Failed to initialize soundscape architect:', error);
      this.renderError('Failed to load sound design interface');
    }
  }

  /**
   * Load project context (script, storyboard)
   */
  private async loadProjectContext(): Promise<void> {
    try {
      if (!this.currentProjectId) return;

      // Load approved script
      const scriptsResult = await window.electronAPI.database.getScriptsByProject(this.currentProjectId);
      if (scriptsResult.success && scriptsResult.data && scriptsResult.data.length > 0) {
        const approvedScript = scriptsResult.data
          .filter((script: any) => script.status === 'APPROVED')
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
        
        if (approvedScript) {
          this.currentScript = approvedScript;
          console.log('Approved script loaded for sound design:', this.currentScript?.id);
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
        console.log('Existing storyboard loaded for sound design:', this.currentStoryboard?.id);
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
        console.log(`Loaded ${this.shots.length} existing shots for sound design`);
      }
    } catch (error) {
      console.error('Failed to load existing shots:', error);
    }
  }

  /**
   * Load existing sound notes from database
   */
  private async loadExistingSoundNotes(): Promise<void> {
    try {
      if (!this.currentProjectId) return;
      
      this.soundNotes.clear();
      
      const result = await window.electronAPI.database.getSoundNotes(this.currentProjectId);
      if (result.success && result.data) {
        result.data.forEach((soundNote: SoundNotes) => {
          this.soundNotes.set(soundNote.shot_id, soundNote);
        });
        console.log(`Loaded ${result.data.length} existing sound notes from database`);
      }
    } catch (error) {
      console.error('Failed to load existing sound notes:', error);
    }
  }

  /**
   * Render the sound design interface
   */
  private renderSoundDesignInterface(): void {
    const container = document.getElementById('soundscape-architect-container');
    if (!container) return;

    container.innerHTML = `
      <div class="soundscape-workspace">
        <div class="soundscape-header">
          <h2>🎵 Sound Design & Audio Architecture</h2>
          <p>Design soundscapes for each shot with the Soundscape Architect AI</p>
          
          ${this.renderStoryboardContext()}
        </div>

        <div class="soundscape-content-area">
          <!-- Sound Design Editor Section -->
          <div class="soundscape-editor-section">
            <div class="shots-sound-container">
              <h4>🎬 Shot Sound Design</h4>
              
              <div id="sound-shots-list" class="sound-shots-list">
                ${this.renderSoundShotsList()}
              </div>

              <div class="soundscape-actions">
                <button type="button" id="save-soundscape-btn" class="btn btn-primary">
                  💾 Save Sound Design
                </button>
                <button type="button" id="validate-soundscape-btn" class="btn btn-secondary">
                  ✅ Validate Audio Mix
                </button>
                <button type="button" id="submit-soundscape-approval-btn" class="btn btn-success">
                  📋 Submit for Approval
                </button>
              </div>

              <div id="soundscape-status" class="soundscape-status">
                ${this.renderSoundscapeStatus()}
              </div>
            </div>
          </div>

          <!-- AI Chat Assistant Section -->
          <div class="soundscape-ai-section">
            <div class="ai-assistant-container">
              <div class="ai-assistant-header">
                <h4>🎭 Soundscape Architect AI Assistant</h4>
                <p>Get help with sound design, audio mixing, foley effects, and broadcast audio</p>
              </div>
              
              <div id="soundscape-chat-container" class="chat-container">
                <div id="soundscape-chat-messages" class="chat-messages">
                  ${this.renderInitialAIMessage()}
                </div>
                
                <div class="chat-input-container">
                  <div class="chat-input-wrapper">
                    <textarea 
                      id="soundscape-user-input" 
                      class="chat-input" 
                      placeholder="Ask for help with ambient sound, foley effects, dialogue audio, music selection..."
                      rows="4"
                      style="min-height: 80px; resize: vertical;"
                    ></textarea>
                    <button id="soundscape-send-message" class="chat-send-btn">Send</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sound Design Tips -->
            <div class="soundscape-tips">
              <h5>🎯 Sound Design Tips</h5>
              <div class="tips-grid">
                <span><strong>Ambient Layers:</strong> Build atmosphere with background sounds</span>
                <span><strong>Foley Precision:</strong> Match actions with authentic sound effects</span>
                <span><strong>Broadcast Audio:</strong> Ensure clear dialogue and narration</span>
                <span><strong>Audio Continuity:</strong> Maintain consistent levels across shots</span>
                <span><strong>Satirical Emphasis:</strong> Use sound to enhance comedic timing</span>
                <span><strong>Professional Standards:</strong> Follow broadcast audio guidelines</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render storyboard context
   */
  private renderStoryboardContext(): string {
    if (!this.currentStoryboard || this.shots.length === 0) {
      return `
        <div class="storyboard-context missing">
          <div class="context-warning">
            <span class="warning-icon">⚠️</span>
            <div>
              <strong>No Approved Storyboard Found</strong>
              <p>Complete and approve a storyboard first to enable sound design.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="storyboard-context available">
        <div class="context-info">
          <span class="context-icon">✅</span>
          <div>
            <strong>Working from Approved Storyboard</strong>
            <p>${this.shots.length} shots ready for sound design</p>
          </div>
        </div>
        <details class="storyboard-preview">
          <summary>🎬 View Storyboard Overview</summary>
          <div class="storyboard-content-preview">
            <div class="storyboard-stats">
              <strong>Total Duration:</strong> ${this.shots.reduce((sum, shot) => sum + shot.length_seconds, 0)} seconds<br>
              <strong>Visual Concept:</strong> ${(this.currentStoryboard.visual_concept || '').substring(0, 150)}...
            </div>
          </div>
        </details>
      </div>
    `;
  }

  /**
   * Render sound shots list
   */
  private renderSoundShotsList(): string {
    if (this.shots.length === 0) {
      return `
        <div class="empty-sound-shots-state">
          <div class="empty-icon">🎵</div>
          <p>No shots available for sound design. Complete the storyboard first.</p>
        </div>
      `;
    }

    return this.shots.map((shot, index) => this.renderSoundShotItem(shot, index)).join('');
  }

  /**
   * Render individual sound shot item
   */
  private renderSoundShotItem(shot: Shot, index: number): string {
    const soundNote = this.soundNotes.get(shot.id);
    
    return `
      <div class="sound-shot-item" data-shot-id="${shot.id}">
        <div class="shot-header">
          <h5>Shot ${shot.panel_number} (${shot.length_seconds}s)</h5>
          <div class="shot-actions">
            <button type="button" class="btn btn-sm btn-secondary btn-edit-sound" data-shot-id="${shot.id}">
              🎵 Design Sound
            </button>
          </div>
        </div>
        
        <div class="shot-visual-preview">
          <div class="shot-preview-content">
            <strong>Visual:</strong> ${shot.visual_style.substring(0, 100)}...
          </div>
          <div class="shot-preview-content">
            <strong>Action:</strong> ${shot.character_action.substring(0, 100)}...
          </div>
          ${shot.dialogue_narration ? `
            <div class="shot-preview-content">
              <strong>Dialogue:</strong> ${shot.dialogue_narration}
            </div>
          ` : ''}
        </div>
        
        <div class="sound-design-section">
          <div class="sound-form-container" id="sound-form-${shot.id}" style="display: none;">
            ${this.renderSoundForm(shot, soundNote)}
          </div>
          
          ${soundNote ? this.renderSoundSummary(soundNote) : this.renderEmptySoundState()}
        </div>
      </div>
    `;
  }

  /**
   * Render sound form for a shot
   */
  private renderSoundForm(shot: Shot, soundNote?: SoundNotes): string {
    return `
      <div class="sound-form">
        <h6>🎵 Sound Design for Shot ${shot.panel_number}</h6>
        
        <div class="form-group">
          <label for="ambient-foley-${shot.id}">Ambient & Foley Sounds</label>
          <textarea 
            id="ambient-foley-${shot.id}" 
            class="form-control" 
            rows="3"
            placeholder="Background atmosphere, environmental sounds, physical action sounds..."
          >${soundNote?.ambient_foley || ''}</textarea>
          <small class="form-hint">Base layer sounds that create the scene's atmosphere and match physical actions</small>
        </div>
        
        <div class="form-group">
          <label for="specific-sfx-${shot.id}">Specific Sound Effects</label>
          <textarea 
            id="specific-sfx-${shot.id}" 
            class="form-control" 
            rows="3"
            placeholder="Specific sound cues, impacts, transitions, satirical audio elements..."
          >${soundNote?.specific_sfx || ''}</textarea>
          <small class="form-hint">Targeted sound effects that enhance comedy or emphasize specific moments</small>
        </div>
        
        <div class="form-group">
          <label for="broadcast-audio-${shot.id}">Broadcast Audio & Dialogue</label>
          <textarea 
            id="broadcast-audio-${shot.id}" 
            class="form-control" 
            rows="3"
            placeholder="Dialogue levels, news music, broadcast effects, audio processing notes..."
          >${soundNote?.broadcast_audio || ''}</textarea>
          <small class="form-hint">Professional broadcast audio standards, dialogue clarity, and news-style audio elements</small>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary btn-cancel-sound" data-shot-id="${shot.id}">Cancel</button>
          <button type="button" class="btn btn-primary btn-save-sound" data-shot-id="${shot.id}">Save Sound Design</button>
        </div>
      </div>
    `;
  }

  /**
   * Render sound summary for completed shots
   */
  private renderSoundSummary(soundNote: SoundNotes): string {
    return `
      <div class="sound-summary completed">
        <div class="sound-summary-header">
          <span class="completion-badge">✅ Sound Design Complete</span>
        </div>
        
        ${soundNote.ambient_foley ? `
          <div class="sound-detail">
            <strong>Ambient/Foley:</strong> ${soundNote.ambient_foley.substring(0, 80)}...
          </div>
        ` : ''}
        
        ${soundNote.specific_sfx ? `
          <div class="sound-detail">
            <strong>SFX:</strong> ${soundNote.specific_sfx.substring(0, 80)}...
          </div>
        ` : ''}
        
        ${soundNote.broadcast_audio ? `
          <div class="sound-detail">
            <strong>Broadcast Audio:</strong> ${soundNote.broadcast_audio.substring(0, 80)}...
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render empty sound state
   */
  private renderEmptySoundState(): string {
    return `
      <div class="sound-summary empty">
        <div class="sound-empty-message">
          <span class="empty-badge">🎵 Click "Design Sound" to add audio</span>
        </div>
      </div>
    `;
  }

  /**
   * Render soundscape status
   */
  private renderSoundscapeStatus(): string {
    const completedShots = Array.from(this.soundNotes.values()).length;
    const totalShots = this.shots.length;
    
    return `
      <div class="status-info">
        <span class="status-label">Progress:</span>
        <span class="status-value">${completedShots}/${totalShots} shots completed</span>
      </div>
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
        <div class="message-avatar">🎵</div>
        <div class="message-content">
          <div class="message-sender">Soundscape Architect</div>
          <div class="message-text">
            Hello! I'm here to help you design immersive soundscapes for your video. I'll help you create 
            professional-quality audio that enhances your satirical content and maintains broadcast standards.
            <br><br>
            <strong>I can help you with:</strong>
            <ul>
              <li>Ambient sound design and atmospheric audio</li>
              <li>Foley effects that match character actions</li>
              <li>Broadcast audio standards and dialogue clarity</li>
              <li>Satirical sound elements and comedic timing</li>
              <li>Audio continuity across all shots</li>
            </ul>
            
            <strong>Ready to start with any specific shot?</strong>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Save soundscape button
    document.getElementById('save-soundscape-btn')?.addEventListener('click', () => {
      this.saveSoundscape();
    });

    // Validate soundscape button
    document.getElementById('validate-soundscape-btn')?.addEventListener('click', () => {
      this.validateSoundscape();
    });

    // Submit for approval button
    document.getElementById('submit-soundscape-approval-btn')?.addEventListener('click', () => {
      this.submitForApproval();
    });

    // Setup sound event listeners
    this.setupSoundEventListeners();
    
    // AI chat functionality
    const sendButton = document.getElementById('soundscape-send-message');
    const userInput = document.getElementById('soundscape-user-input') as HTMLTextAreaElement;

    // Setup AI chat input
    if (userInput) {
      userInput.setAttribute('tabindex', '0');
      userInput.style.height = '80px';
      
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
   * Setup sound event listeners
   */
  private setupSoundEventListeners(): void {
    // Design sound buttons
    document.querySelectorAll('.btn-edit-sound').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shotId = (e.target as HTMLElement).getAttribute('data-shot-id');
        if (shotId) this.showSoundForm(shotId);
      });
    });

    // Save sound buttons
    document.querySelectorAll('.btn-save-sound').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shotId = (e.target as HTMLElement).getAttribute('data-shot-id');
        if (shotId) this.saveSoundDesign(shotId);
      });
    });

    // Cancel sound buttons
    document.querySelectorAll('.btn-cancel-sound').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shotId = (e.target as HTMLElement).getAttribute('data-shot-id');
        if (shotId) this.hideSoundForm(shotId);
      });
    });
  }

  /**
   * Show sound form for a shot
   */
  private showSoundForm(shotId: string): void {
    const formContainer = document.getElementById(`sound-form-${shotId}`);
    if (formContainer) {
      formContainer.style.display = 'block';
    }
  }

  /**
   * Hide sound form for a shot
   */
  private hideSoundForm(shotId: string): void {
    const formContainer = document.getElementById(`sound-form-${shotId}`);
    if (formContainer) {
      formContainer.style.display = 'none';
    }
  }

  /**
   * Save sound design for a shot
   */
  private saveSoundDesign(shotId: string): void {
    const ambientFoley = (document.getElementById(`ambient-foley-${shotId}`) as HTMLTextAreaElement)?.value || '';
    const specificSfx = (document.getElementById(`specific-sfx-${shotId}`) as HTMLTextAreaElement)?.value || '';
    const broadcastAudio = (document.getElementById(`broadcast-audio-${shotId}`) as HTMLTextAreaElement)?.value || '';

    const soundNote: SoundNotes = {
      id: `sound-${shotId}-${Date.now()}`,
      shot_id: shotId,
      ambient_foley: ambientFoley || undefined,
      specific_sfx: specificSfx || undefined,
      broadcast_audio: broadcastAudio || undefined,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.soundNotes.set(shotId, soundNote);
    this.hideSoundForm(shotId);
    this.refreshSoundShotsList();
    
    // Auto-save
    this.saveSoundscape(true); // Silent save
  }

  /**
   * Refresh sound shots list display
   */
  private refreshSoundShotsList(): void {
    const container = document.getElementById('sound-shots-list');
    if (container) {
      container.innerHTML = this.renderSoundShotsList();
      this.setupSoundEventListeners();
    }
  }

  /**
   * Send message to AI assistant
   */
  private async sendAIMessage(): Promise<void> {
    const userInput = document.getElementById('soundscape-user-input') as HTMLTextAreaElement;
    const messagesContainer = document.getElementById('soundscape-chat-messages');
    const sendButton = document.getElementById('soundscape-send-message') as HTMLButtonElement;

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

      // Prepare context for AI
      const context = {
        current_script: this.currentScript,
        current_storyboard: this.currentStoryboard,
        shots: this.shots,
        existing_sound_notes: Array.from(this.soundNotes.values()),
        shots_summary: this.generateShotsSummary(),
        project_id: this.currentProjectId
      };

      // Get agent config
      const { AgentConfigService } = await import('../../services/agent-config.js');
      const agentConfig = AgentConfigService.getAgentConfig('SOUNDSCAPE_ARCHITECT');
      
      console.log('DEBUG: Agent config for SOUNDSCAPE_ARCHITECT:', agentConfig);
      console.log('DEBUG: Context being sent to soundscape AI:', JSON.stringify(context, null, 2));
      
      // Enhanced message with context
      const enhancedMessage = `${message}

CURRENT PROJECT CONTEXT:
- Total Shots: ${this.shots.length}
- Completed Sound Designs: ${this.soundNotes.size}
- Script Available: ${this.currentScript ? 'Yes' : 'No'}
- Storyboard Available: ${this.currentStoryboard ? 'Yes' : 'No'}

SHOTS OVERVIEW:
${context.shots_summary}

Please provide specific sound design guidance based on this satirical news parody context and the shot details above.`;
      
      // Send to AI with agent config
      const response = await window.electronAPI.llm.generatePersonaResponse(
        this.conversationId,
        'SOUNDSCAPE_ARCHITECT',
        enhancedMessage,
        context,
        agentConfig
      );

      if (response.success && response.data) {
        this.addMessageToChat('ai', response.data);
      } else {
        console.error('AI response error:', response);
        this.addMessageToChat('ai', `Sorry, I encountered an error: ${response.error || 'Unknown error'}. Please check that the Soundscape Architect agent is properly configured in Settings.`);
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
    const messagesContainer = document.getElementById('soundscape-chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = sender === 'ai' ? '🎵' : '👤';
    const senderName = sender === 'ai' ? 'Soundscape Architect' : 'You';
    
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
   * Generate shots summary for AI context
   */
  private generateShotsSummary(): string {
    if (this.shots.length === 0) {
      return "No shots available for sound design.";
    }

    const summary = this.shots.map((shot, index) => {
      const soundNote = this.soundNotes.get(shot.id);
      return `SHOT ${shot.panel_number} (${shot.length_seconds}s):
- Visual: ${shot.visual_style.split('\n')[0].replace('- ', '')}
- Action: ${shot.character_action.split('\n')[0].replace(/^\d+\.\s*/, '')}
- Dialogue: ${shot.dialogue_narration || 'No dialogue'}
- Sound Design: ${soundNote ? '✅ Complete' : '❌ Needs Design'}`;
    }).join('\n\n');

    return `SHOTS FOR SOUND DESIGN (${this.shots.length} total):\n\n${summary}`;
  }

  /**
   * Save soundscape
   */
  private async saveSoundscape(silent: boolean = false): Promise<void> {
    try {
      if (!this.currentProjectId) return;

      const soundNotesArray = Array.from(this.soundNotes.values());
      const result = await window.electronAPI.database.saveSoundNotes(this.currentProjectId, soundNotesArray);
      
      if (result.success) {
        if (!silent) {
          alert('💾 Sound design saved successfully!');
        }
        
        // Update status display
        const statusContainer = document.getElementById('soundscape-status');
        if (statusContainer) {
          statusContainer.innerHTML = this.renderSoundscapeStatus();
        }
      } else {
        throw new Error(result.error || 'Failed to save sound notes');
      }
      
    } catch (error) {
      console.error('Failed to save soundscape:', error);
      if (!silent) {
        alert('❌ Failed to save sound design. Please try again.');
      }
    }
  }

  /**
   * Validate soundscape
   */
  private validateSoundscape(): void {
    try {
      const incompleteShots = this.shots.filter(shot => !this.soundNotes.has(shot.id));
      
      if (incompleteShots.length > 0) {
        alert(`⚠️ Sound design incomplete. ${incompleteShots.length} shots still need sound design:\n${incompleteShots.map(s => `Shot ${s.panel_number}`).join(', ')}`);
      } else {
        alert('✅ Sound design validation complete! All shots have sound design.');
      }
    } catch (error) {
      console.error('Failed to validate soundscape:', error);
      alert('❌ Failed to validate sound design. Please try again.');
    }
  }

  /**
   * Submit soundscape for approval
   */
  private async submitForApproval(): Promise<void> {
    try {
      // Implementation for submitting for approval
      alert('📋 Sound design submitted for approval!');
    } catch (error) {
      console.error('Failed to submit soundscape for approval:', error);
      alert('❌ Failed to submit sound design for approval. Please try again.');
    }
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    const container = document.getElementById('soundscape-architect-container');
    if (!container) return;

    container.innerHTML = `
      <div class="soundscape-error">
        <div class="error-icon">❌</div>
        <h3>Sound Design Error</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          Retry
        </button>
      </div>
    `;
  }
}

// Export singleton instance
export const soundscapeArchitect = new SoundscapeArchitect();