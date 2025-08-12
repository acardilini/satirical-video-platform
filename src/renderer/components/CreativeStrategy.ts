// Creative Strategy Component
// Redesigned for collaborative AI workflow - form alongside chat

import { 
  CreativeStrategy, 
  CreativeStrategyStatus, 
  SatiricalTone, 
  TargetAudience, 
  SatiricalAngle, 
  CharacterArchetype,
  SatiricalFormat,
  PersonaType
} from '../../shared/types/index.js';
import { ModernAIChatInterface } from './ModernAIChatInterface.js';

export class CreativeStrategyManager {
  private currentProjectId: string | null = null;
  private currentStrategy: CreativeStrategy | null = null;
  private isLoading = false;
  private modernAIChat: ModernAIChatInterface | null = null;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize Creative Strategy for a project
   */
  public async initialize(projectId: string): Promise<void> {
    this.currentProjectId = projectId;
    
    try {
      await this.loadExistingStrategy();
      this.render();
    } catch (error) {
      console.error('Failed to initialize Creative Strategy:', error);
      this.renderError('Failed to load Creative Strategy');
    }
  }

  /**
   * Load existing strategy or create new one
   */
  private async loadExistingStrategy(): Promise<void> {
    if (!this.currentProjectId) return;

    try {
      // @ts-ignore
      const result = await window.electronAPI.database.getCreativeStrategy(this.currentProjectId);
      
      if (result.success && result.data) {
        this.currentStrategy = result.data;
      } else {
        // No existing strategy, start with empty state
        this.currentStrategy = null;
      }
    } catch (error) {
      console.error('Failed to load strategy:', error);
      this.currentStrategy = null;
    }
  }

  /**
   * Main render method
   */
  private render(): void {
    const container = this.getContainer();
    if (!container) return;

    if (this.currentStrategy) {
      this.renderExistingStrategy(container);
    } else {
      this.renderNewStrategyWorkspace(container);
    }
  }

  /**
   * Get container element
   */
  private getContainer(): HTMLElement | null {
    // Try the proper container first, fallback to strategy-tab if needed
    let container = document.getElementById('creative-strategy-content');
    if (!container) {
      container = document.getElementById('strategy-tab');
    }
    return container;
  }

  /**
   * Render collaborative workspace for new strategy
   */
  private renderNewStrategyWorkspace(container: HTMLElement): void {
    container.innerHTML = `
      <div class="creative-strategy-workspace">
        <!-- Header -->
        <div class="workspace-header">
          <h3>Creative Strategy Development</h3>
          <p>Collaborate with AI to develop your satirical video strategy</p>
          <div class="articles-context-indicator" id="articles-context-info">
            <span class="loading-text">Loading article context...</span>
          </div>
        </div>

        <!-- Main Workspace (Form + Chat Side-by-Side) -->
        <div class="strategy-workspace-main">
          <!-- Strategy Form Section -->
          <div class="strategy-form-section">
            <div class="form-header">
              <h4>📋 Strategy Document</h4>
              <p>Collaborate with the AI to develop your strategy. The AI will suggest specific text for each field that you can copy and paste.</p>
            </div>

            <!-- Strategy Form Fields -->
            <div class="strategy-form">
              <!-- Creative Concept -->
              <div class="form-group">
                <label for="creative-concept">Creative Concept</label>
                <textarea id="creative-concept" placeholder="Core satirical approach (1-2 sentences)" rows="2"></textarea>
                <small>The overarching creative direction and satirical premise</small>
              </div>

              <!-- Target Audience -->
              <div class="form-group">
                <label for="target-audience">Target Audience</label>
                <textarea id="target-audience" placeholder="e.g., 'Tech-savvy millennials' or 'College-educated professionals'" rows="3"></textarea>
                <small>Be specific about demographics, interests, and what kind of humor they appreciate</small>
              </div>

              <!-- Satirical Tone -->
              <div class="form-group">
                <label for="satirical-tone">Satirical Tone</label>
                <textarea id="satirical-tone" placeholder="e.g., 'Dry wit with subtle irony' or 'Bold absurdist humor'" rows="3"></textarea>
                <small>How should the humor feel? Examples: dry wit, absurdist, cynical, deadpan, sarcastic</small>
              </div>


              <!-- Key Themes -->
              <div class="form-group">
                <label for="key-themes">Key Themes</label>
                <div class="themes-input-section">
                  <input type="text" id="theme-input" placeholder="Enter a theme (e.g., Media Bias, Corporate Culture)">
                  <button type="button" id="add-theme-btn" class="btn-small">Add Theme</button>
                </div>
                <div id="themes-list" class="themes-display">
                  <!-- Themes will be added dynamically -->
                </div>
                <small>Add 3-5 main topics or issues to satirize</small>
              </div>

              <!-- Character Archetypes -->
              <div class="form-group">
                <label>Character Archetypes</label>
                <div id="character-archetypes-section">
                  <button type="button" id="add-character-btn" class="btn-outline">+ Add Character Archetype</button>
                  <div id="characters-list">
                    <!-- Character archetypes will be added dynamically -->
                  </div>
                </div>
                <small>Define personality types (not specific characters)</small>
              </div>

              <!-- Visual Style Guide -->
              <div class="form-group">
                <label>Visual Style Guide</label>
                <div class="visual-style-inputs">
                  <div class="style-input-group">
                    <label for="overall-aesthetic">Overall Aesthetic</label>
                    <textarea id="overall-aesthetic" placeholder="e.g., Clean minimalist, Retro 80s, Documentary style" rows="2"></textarea>
                  </div>
                  <div class="style-input-group">
                    <label for="color-palette">Color Palette</label>
                    <textarea id="color-palette" placeholder="e.g., Muted earth tones, High contrast B&W, Neon accents" rows="2"></textarea>
                  </div>
                  <div class="style-input-group">
                    <label for="cinematography-notes">Cinematography Notes</label>
                    <textarea id="cinematography-notes" placeholder="Camera style, lighting approach, shot preferences" rows="2"></textarea>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" id="save-strategy-btn" class="btn btn-primary">Save Strategy</button>
                <button type="button" id="clear-form-btn" class="btn btn-outline">Clear Form</button>
              </div>
            </div>
          </div>

          <!-- AI Chat Section -->
          <div class="ai-chat-section">
            <div class="chat-header">
              <h4>💬 Creative Strategist AI</h4>
              <p>Collaborate to develop your strategy</p>
              <div class="chat-actions">
                <button type="button" id="start-ai-chat-btn" class="btn btn-primary chat-start-btn">
                  Start Collaboration
                </button>
                <button class="btn btn-outline" id="generate-ai-strategy-btn">
                  🚀 Quick Generation
                </button>
              </div>
            </div>
            
            <!-- Chat Interface Container -->
            <div id="ai-chat-container" class="chat-container">
              <div class="chat-placeholder">
                <div class="placeholder-icon">🤖</div>
                <p>Click "Start Collaboration" to begin working with the Creative Strategist AI.</p>
                <p class="placeholder-hint">The AI will help you develop each part of your Creative Strategy through focused questions and suggestions.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Collaboration Tips (Bottom of Page) -->
        <div class="strategy-tips-bottom">
          <h6>💡 AI Collaboration Tips</h6>
          <div class="tips-grid">
            <span><strong>Start Chat:</strong> Click "Start Collaboration" for guided questions</span>
            <span><strong>Be Specific:</strong> Share your vision clearly for better suggestions</span>
            <span><strong>Ask for Text:</strong> Request specific content for form fields</span>
            <span><strong>Copy & Paste:</strong> Use AI suggestions directly in the form</span>
            <span><strong>Iterate:</strong> Ask follow-ups for refinements</span>
            <span><strong>Quick Start:</strong> Try "🚀 Quick Generation" for auto-complete</span>
          </div>
        </div>
      </div>
    `;

    this.setupNewStrategyListeners();
    this.updateArticlesContextIndicator();
  }

  /**
   * Update articles context indicator
   */
  private async updateArticlesContextIndicator(): Promise<void> {
    try {
      const contextIndicator = document.getElementById('articles-context-info');
      if (!contextIndicator) return;

      const context = await this.getCurrentProjectContext();
      const articles = context.articles || [];
      
      if (articles.length === 0) {
        contextIndicator.innerHTML = `
          <div class="no-articles-warning">
            <span class="warning-icon">⚠️</span>
            <span>No news articles found. Upload articles first for better AI strategy development.</span>
          </div>
        `;
      } else {
        contextIndicator.innerHTML = `
          <div class="articles-available">
            <span class="success-icon">📰</span>
            <span><strong>${articles.length} news articles</strong> loaded and ready for AI analysis</span>
            <details style="margin-top: 0.5rem;">
              <summary style="cursor: pointer; color: #666;">View articles</summary>
              <div class="articles-list" style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.9rem;">
                ${articles.map((article: any, index: number) => `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>${index + 1}. ${this.escapeHtml(article.title)}</strong><br>
                    <span style="color: #666; font-size: 0.8rem;">Source: ${this.escapeHtml(article.source || 'Unknown')}</span>
                  </div>
                `).join('')}
              </div>
            </details>
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to update articles context indicator:', error);
      const contextIndicator = document.getElementById('articles-context-info');
      if (contextIndicator) {
        contextIndicator.innerHTML = `
          <div class="articles-error">
            <span class="error-icon">❌</span>
            <span>Could not load article context</span>
          </div>
        `;
      }
    }
  }

  /**
   * Render existing strategy view  
   */
  private renderExistingStrategy(container: HTMLElement): void {
    if (!this.currentStrategy) return;

    const strategy = this.currentStrategy;
    
    container.innerHTML = `
      <div class="existing-strategy">
        <div class="strategy-header">
          <div class="strategy-info">
            <h3>Creative Strategy</h3>
            <div class="strategy-metadata">
              <span class="status-badge ${strategy.status.toLowerCase()}">${this.formatStatus(strategy.status)}</span>
              <span class="created-date">Created: ${new Date(strategy.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div class="strategy-actions">
            <button class="btn btn-outline" id="edit-strategy-btn">Edit Strategy</button>
            <button class="btn btn-primary" id="refine-with-chat-btn">💬 Refine with AI</button>
            <button class="btn btn-success" id="generate-director-notes-btn">Generate Director's Notes</button>
          </div>
        </div>

        <!-- Strategy Overview -->
        <div class="strategy-overview">
          <div class="strategy-section">
            <h4>Creative Concept</h4>
            <p class="strategy-concept">${this.escapeHtml(strategy.creative_concept)}</p>
          </div>

          <div class="strategy-grid">
            <div class="strategy-card">
              <h5>Target Audience</h5>
              <span class="audience-tag">${this.formatAudience(strategy.target_audience)}</span>
            </div>
            
            <div class="strategy-card">
              <h5>Satirical Tone</h5>
              <span class="tone-tag">${this.formatTone(strategy.tone)}</span>
            </div>
          </div>
        </div>

        <!-- Key Themes -->
        <div class="strategy-section">
          <h4>Key Themes</h4>
          <div class="themes-list">
            ${strategy.key_themes.map(theme => 
              `<span class="theme-tag">${this.escapeHtml(theme)}</span>`
            ).join('')}
          </div>
        </div>

        <!-- Character Archetypes -->
        <div class="strategy-section">
          <h4>Character Archetypes</h4>
          <div class="characters-grid">
            ${strategy.character_archetypes.map(char => this.renderCharacterArchetype(char)).join('')}
          </div>
        </div>

        <!-- Visual Style Guide -->
        <div class="strategy-section">
          <h4>Visual Style Guide</h4>
          <div class="visual-guide">
            ${strategy.visual_style_guide.color_palette ? `
              <div class="style-item">
                <strong>Color Palette:</strong> ${this.escapeHtml(strategy.visual_style_guide.color_palette)}
              </div>
            ` : ''}
            ${strategy.visual_style_guide.cinematography_notes ? `
              <div class="style-item">
                <strong>Cinematography:</strong> ${this.escapeHtml(strategy.visual_style_guide.cinematography_notes)}
              </div>
            ` : ''}
            ${strategy.visual_style_guide.overall_aesthetic ? `
              <div class="style-item">
                <strong>Overall Aesthetic:</strong> ${this.escapeHtml(strategy.visual_style_guide.overall_aesthetic)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.setupExistingStrategyListeners();
  }

  /**
   * Setup event listeners for new collaborative workspace
   */
  private setupNewStrategyListeners(): void {
    // Chat initialization
    const startChatBtn = document.getElementById('start-ai-chat-btn');
    const generateAIBtn = document.getElementById('generate-ai-strategy-btn');
    
    startChatBtn?.addEventListener('click', () => this.startCollaborativeChat());
    generateAIBtn?.addEventListener('click', () => this.generateAIStrategy());

    // Form interactions
    const saveBtn = document.getElementById('save-strategy-btn');
    const clearBtn = document.getElementById('clear-form-btn');
    
    saveBtn?.addEventListener('click', () => this.saveStrategy());
    clearBtn?.addEventListener('click', () => this.clearForm());

    // Dynamic theme management
    const addThemeBtn = document.getElementById('add-theme-btn');
    const themeInput = document.getElementById('theme-input') as HTMLInputElement;
    
    addThemeBtn?.addEventListener('click', () => this.addTheme());
    themeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTheme();
      }
    });

    // Character archetype management
    const addCharacterBtn = document.getElementById('add-character-btn');
    addCharacterBtn?.addEventListener('click', () => this.addCharacterArchetype());

    // Auto-save form data as user types
    this.setupAutoSave();
  }

  /**
   * Setup event listeners for existing strategy view
   */
  private setupExistingStrategyListeners(): void {
    const refineWithChatBtn = document.getElementById('refine-with-chat-btn');
    const editBtn = document.getElementById('edit-strategy-btn');
    const generateNotesBtn = document.getElementById('generate-director-notes-btn');

    refineWithChatBtn?.addEventListener('click', () => this.refineWithChat());
    editBtn?.addEventListener('click', () => this.editStrategy());
    generateNotesBtn?.addEventListener('click', () => this.generateDirectorNotes());
  }

  /**
   * Start collaborative chat with Creative Strategist AI
   */
  private async startCollaborativeChat(): Promise<void> {
    try {
      const chatContainer = document.getElementById('ai-chat-container');
      if (!chatContainer) return;

      // Initialize modern AI chat interface within the chat container
      this.modernAIChat = new ModernAIChatInterface('ai-chat-container');
      
      // Gather current project context
      const projectContext = await this.getCurrentProjectContext();
      
      // Initialize with Creative Strategist persona
      await this.modernAIChat.initialize('CREATIVE_STRATEGIST', projectContext);
      
      // Update button state
      const startBtn = document.getElementById('start-ai-chat-btn') as HTMLButtonElement;
      if (startBtn) {
        startBtn.textContent = '💬 Chat Active';
        startBtn.disabled = true;
        startBtn.className = 'btn btn-success chat-start-btn';
      }

    } catch (error) {
      console.error('Failed to start collaborative chat:', error);
      alert('Failed to start AI collaboration. Please check your AI agent configuration.');
    }
  }

  /**
   * Get current project context for AI chat
   */
  private async getCurrentProjectContext(): Promise<any> {
    if (!this.currentProjectId) return {};

    try {
      // @ts-ignore
      const projectResult = await window.electronAPI.database.getProjectById(this.currentProjectId);
      // @ts-ignore 
      const articlesResult = await window.electronAPI.database.getNewsArticlesByProject(this.currentProjectId);

      const articles = articlesResult.success ? articlesResult.data : [];
      
      return {
        projectId: this.currentProjectId,
        project: projectResult.success ? projectResult.data : null,
        articles: articles,
        formData: this.getCurrentFormData(),
        instructions: `Help the user develop their Creative Strategy based on the ${articles.length} news articles provided. Analyze the articles to identify satirical opportunities and suggest specific strategic elements. Ask focused questions about each section and suggest content for the form fields. Base all recommendations on the actual article content.`
      };
    } catch (error) {
      console.error('Failed to get project context:', error);
      return { 
        projectId: this.currentProjectId,
        articles: [],
        instructions: "Help the user develop their Creative Strategy by asking focused questions about each section. Note: Could not load project articles - ask user to provide context about news articles they want to satirize."
      };
    }
  }

  /**
   * Get current form data
   */
  private getCurrentFormData(): any {
    const formData = {
      creative_concept: (document.getElementById('creative-concept') as HTMLTextAreaElement)?.value || '',
      target_audience: (document.getElementById('target-audience') as HTMLTextAreaElement)?.value || '',
      satirical_tone: (document.getElementById('satirical-tone') as HTMLTextAreaElement)?.value || '',
      key_themes: this.getThemesList(),
      character_archetypes: this.getCharactersList(),
      visual_style_guide: {
        overall_aesthetic: (document.getElementById('overall-aesthetic') as HTMLTextAreaElement)?.value || '',
        color_palette: (document.getElementById('color-palette') as HTMLTextAreaElement)?.value || '',
        cinematography_notes: (document.getElementById('cinematography-notes') as HTMLTextAreaElement)?.value || ''
      }
    };

    return formData;
  }

  /**
   * Transform form data to match CreativeStrategy interface
   */
  private transformFormDataForSave(formData: any): any {
    return {
      ...formData,
      // Convert string inputs to proper enum values for database
      target_audience: this.mapAudienceToEnum(formData.target_audience),
      tone: this.mapToneToEnum(formData.satirical_tone),
      // Add required satirical_angles field
      satirical_angles: this.generateSatiricalAngles(formData)
    };
  }

  /**
   * Map audience text to enum value
   */
  private mapAudienceToEnum(audienceText: string): string {
    const lowerText = audienceText.toLowerCase();
    if (lowerText.includes('political') || lowerText.includes('policy')) return 'POLITICAL_SATIRE';
    if (lowerText.includes('social') || lowerText.includes('society')) return 'SOCIAL_COMMENTARY';
    if (lowerText.includes('millennial')) return 'MILLENNIAL';
    if (lowerText.includes('gen z') || lowerText.includes('young')) return 'GEN_Z';
    return 'GENERAL';
  }

  /**
   * Map tone text to enum value
   */
  private mapToneToEnum(toneText: string): string {
    const lowerText = toneText.toLowerCase();
    if (lowerText.includes('subtle')) return 'SUBTLE';
    if (lowerText.includes('overt') || lowerText.includes('obvious')) return 'OVERT';
    if (lowerText.includes('absurd') || lowerText.includes('ridiculous')) return 'ABSURDIST';
    if (lowerText.includes('dry') || lowerText.includes('wit')) return 'DRY_WIT';
    if (lowerText.includes('news') || lowerText.includes('broadcast')) return 'SATIRICAL_NEWS';
    return 'DRY_WIT'; // Default
  }

  /**
   * Generate satirical angles based on form data
   */
  private generateSatiricalAngles(formData: any): any[] {
    const angles = [];
    
    if (formData.creative_concept.toLowerCase().includes('exaggerat')) {
      angles.push({
        angle_type: 'EXAGGERATION',
        description: 'Amplify absurd elements in the source material',
        key_elements: ['Dramatic presentation', 'Over-the-top reactions']
      });
    }
    
    if (formData.satirical_tone.toLowerCase().includes('parody')) {
      angles.push({
        angle_type: 'PARODY',
        description: 'Mock existing formats or styles',
        key_elements: ['Format mimicry', 'Style imitation']
      });
    }
    
    // Default satirical angle if none detected
    if (angles.length === 0) {
      angles.push({
        angle_type: 'IRONY',
        description: 'Use ironic commentary on current events',
        key_elements: ['Contradictory statements', 'Unexpected perspectives']
      });
    }
    
    return angles;
  }

  /**
   * Add theme to the themes list
   */
  private addTheme(): void {
    const themeInput = document.getElementById('theme-input') as HTMLInputElement;
    const themesList = document.getElementById('themes-list');
    
    if (!themeInput || !themesList || !themeInput.value.trim()) return;

    const theme = themeInput.value.trim();
    
    // Create theme element
    const themeElement = document.createElement('div');
    themeElement.className = 'theme-tag';
    themeElement.innerHTML = `
      <span class="theme-text">${this.escapeHtml(theme)}</span>
      <button type="button" class="theme-remove-btn">×</button>
    `;

    // Add remove handler
    const removeBtn = themeElement.querySelector('.theme-remove-btn');
    removeBtn?.addEventListener('click', () => themeElement.remove());

    themesList.appendChild(themeElement);
    themeInput.value = '';
  }

  /**
   * Get themes list from DOM
   */
  private getThemesList(): string[] {
    const themesList = document.getElementById('themes-list');
    if (!themesList) return [];

    const themes: string[] = [];
    themesList.querySelectorAll('.theme-text').forEach(el => {
      themes.push(el.textContent?.trim() || '');
    });

    return themes.filter(theme => theme.length > 0);
  }

  /**
   * Add character archetype
   */
  private addCharacterArchetype(): void {
    const charactersList = document.getElementById('characters-list');
    if (!charactersList) return;

    const characterElement = document.createElement('div');
    characterElement.className = 'character-archetype-input';
    characterElement.innerHTML = `
      <div class="character-inputs">
        <input type="text" class="character-archetype-name" placeholder="Archetype name (e.g., The Oblivious Expert)" required>
        <textarea class="character-archetype-description" placeholder="Brief personality description" rows="2"></textarea>
        <button type="button" class="character-remove-btn">Remove</button>
      </div>
    `;

    // Add remove handler
    const removeBtn = characterElement.querySelector('.character-remove-btn');
    removeBtn?.addEventListener('click', () => characterElement.remove());

    charactersList.appendChild(characterElement);
  }

  /**
   * Get characters list from DOM  
   */
  private getCharactersList(): any[] {
    const charactersList = document.getElementById('characters-list');
    if (!charactersList) return [];

    const characters: any[] = [];
    charactersList.querySelectorAll('.character-archetype-input').forEach(el => {
      const nameEl = el.querySelector('.character-archetype-name') as HTMLInputElement;
      const descEl = el.querySelector('.character-archetype-description') as HTMLTextAreaElement;
      
      if (nameEl?.value.trim()) {
        characters.push({
          name: nameEl.value.trim(),
          role: 'Supporting character',
          satirical_traits: descEl?.value.trim() ? descEl.value.trim().split(',').map(t => t.trim()) : [],
          visual_description: ''
        });
      }
    });

    return characters;
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(): void {
    const autoSaveElements = [
      'creative-concept',
      'target-audience', 
      'satirical-tone',
      'overall-aesthetic',
      'color-palette',
      'cinematography-notes'
    ];

    autoSaveElements.forEach(id => {
      const element = document.getElementById(id);
      element?.addEventListener('input', () => {
        if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
          this.autoSaveFormData();
        }, 2000);
      });
    });
  }







  /**
   * Auto-save current form data
   */
  private autoSaveFormData(): void {
    const formData = this.getCurrentFormData();
    localStorage.setItem(`creative-strategy-draft-${this.currentProjectId}`, JSON.stringify(formData));
    console.log('Auto-saved Creative Strategy draft');
  }

  /**
   * Save strategy to database
   */
  private async saveStrategy(): Promise<void> {
    try {
      const formData = this.getCurrentFormData();
      
      // Validate required fields
      if (!formData.creative_concept.trim()) {
        alert('Creative Concept is required');
        return;
      }

      if (!formData.target_audience.trim()) {
        alert('Target Audience is required');
        return;
      }

      if (!formData.satirical_tone.trim()) {
        alert('Satirical Tone is required');
        return;
      }

      this.isLoading = true;
      
      // Transform form data to match database schema
      const transformedData = this.transformFormDataForSave(formData);
      
      // @ts-ignore
      const result = await window.electronAPI.database.createCreativeStrategy({
        project_id: this.currentProjectId,
        ...transformedData,
        status: 'DRAFT',
        created_by: 'temp-user-id' // TODO: Get actual user ID from auth
      });

      if (result.success) {
        this.currentStrategy = result.data;
        alert('Creative Strategy saved successfully!');
        
        // Clear auto-save data
        localStorage.removeItem(`creative-strategy-draft-${this.currentProjectId}`);
        
        // Re-render to show saved strategy
        this.render();
      } else {
        throw new Error(result.error || 'Failed to save strategy');
      }

    } catch (error) {
      console.error('Failed to save strategy:', error);
      alert('Failed to save Creative Strategy. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Clear form data
   */
  private clearForm(): void {
    if (confirm('Are you sure you want to clear all form data? This cannot be undone.')) {
      // Clear all form fields
      (document.getElementById('creative-concept') as HTMLTextAreaElement).value = '';
      (document.getElementById('target-audience') as HTMLTextAreaElement).value = '';
      (document.getElementById('satirical-tone') as HTMLTextAreaElement).value = '';
      (document.getElementById('overall-aesthetic') as HTMLTextAreaElement).value = '';
      (document.getElementById('color-palette') as HTMLTextAreaElement).value = '';
      (document.getElementById('cinematography-notes') as HTMLTextAreaElement).value = '';

      // Clear themes
      const themesList = document.getElementById('themes-list');
      if (themesList) themesList.innerHTML = '';

      // Clear characters
      const charactersList = document.getElementById('characters-list');
      if (charactersList) charactersList.innerHTML = '';

      // Clear auto-save data
      localStorage.removeItem(`creative-strategy-draft-${this.currentProjectId}`);
    }
  }

  /**
   * Generate AI strategy (quick generation without chat)
   */
  private async generateAIStrategy(): Promise<void> {
    try {
      this.isLoading = true;
      
      // @ts-ignore
      const result = await window.electronAPI.database.generateCreativeStrategy(this.currentProjectId);
      
      if (result.success) {
        this.currentStrategy = result.data;
        this.render();
      } else {
        throw new Error(result.error || 'Failed to generate strategy');
      }

    } catch (error) {
      console.error('Failed to generate AI strategy:', error);
      alert('Failed to generate strategy. Please try the collaborative chat instead.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Refine existing strategy with AI chat
   */
  private async refineWithChat(): Promise<void> {
    try {
      // Switch to edit mode with chat enabled
      this.currentStrategy = null; // Temporarily clear to show workspace
      this.render();
      
      // Pre-populate form with existing data
      setTimeout(() => {
        this.populateFormWithExistingStrategy();
        this.startCollaborativeChat();
      }, 100);
      
    } catch (error) {
      console.error('Failed to start refinement chat:', error);
      alert('Failed to start refinement chat.');
    }
  }

  /**
   * Populate form with existing strategy data
   */
  private populateFormWithExistingStrategy(): void {
    if (!this.currentStrategy) return;

    const strategy = this.currentStrategy;

    // Populate basic fields
    const conceptEl = document.getElementById('creative-concept') as HTMLTextAreaElement;
    if (conceptEl) conceptEl.value = strategy.creative_concept;

    const audienceEl = document.getElementById('target-audience') as HTMLTextAreaElement;
    if (audienceEl) audienceEl.value = strategy.target_audience;

    const toneEl = document.getElementById('satirical-tone') as HTMLTextAreaElement;
    if (toneEl) toneEl.value = strategy.tone;

    // Populate visual style
    const aestheticEl = document.getElementById('overall-aesthetic') as HTMLTextAreaElement;
    if (aestheticEl) aestheticEl.value = strategy.visual_style_guide.overall_aesthetic || '';

    const paletteEl = document.getElementById('color-palette') as HTMLTextAreaElement;
    if (paletteEl) paletteEl.value = strategy.visual_style_guide.color_palette || '';

    const cinematographyEl = document.getElementById('cinematography-notes') as HTMLTextAreaElement;
    if (cinematographyEl) cinematographyEl.value = strategy.visual_style_guide.cinematography_notes || '';

    // Populate themes
    const themesList = document.getElementById('themes-list');
    if (themesList && strategy.key_themes) {
      strategy.key_themes.forEach(theme => {
        const themeElement = document.createElement('div');
        themeElement.className = 'theme-tag';
        themeElement.innerHTML = `
          <span class="theme-text">${this.escapeHtml(theme)}</span>
          <button type="button" class="theme-remove-btn">×</button>
        `;
        const removeBtn = themeElement.querySelector('.theme-remove-btn');
        removeBtn?.addEventListener('click', () => themeElement.remove());
        themesList.appendChild(themeElement);
      });
    }

    // Populate character archetypes
    const charactersList = document.getElementById('characters-list');
    if (charactersList && strategy.character_archetypes) {
      strategy.character_archetypes.forEach(character => {
        const characterElement = document.createElement('div');
        characterElement.className = 'character-archetype-input';
        characterElement.innerHTML = `
          <div class="character-inputs">
            <input type="text" class="character-archetype-name" value="${this.escapeHtml(character.name)}" placeholder="Archetype name" required>
            <textarea class="character-archetype-description" placeholder="Brief personality description" rows="2">${this.escapeHtml(character.satirical_traits.join(', '))}</textarea>
            <button type="button" class="character-remove-btn">Remove</button>
          </div>
        `;
        const removeBtn = characterElement.querySelector('.character-remove-btn');
        removeBtn?.addEventListener('click', () => characterElement.remove());
        charactersList.appendChild(characterElement);
      });
    }
  }

  /**
   * Edit existing strategy
   */
  private editStrategy(): void {
    // Switch to workspace mode and populate with existing data
    this.refineWithChat();
  }

  /**
   * Generate Director's Notes from completed strategy
   */
  private async generateDirectorNotes(): Promise<void> {
    if (!this.currentStrategy) return;

    try {
      this.isLoading = true;

      // @ts-ignore
      const result = await window.electronAPI.database.generateDirectorNotes(this.currentStrategy.id);

      if (result.success) {
        alert('Director\'s Notes generated successfully! You can view them in the next workflow stage.');
      } else {
        throw new Error(result.error || 'Failed to generate director notes');
      }

    } catch (error) {
      console.error('Failed to generate director notes:', error);
      alert('Failed to generate Director\'s Notes. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render character archetype
   */
  private renderCharacterArchetype(character: CharacterArchetype): string {
    return `
      <div class="character-card">
        <h6>${this.escapeHtml(character.name)}</h6>
        <div class="character-traits">
          ${character.satirical_traits.map((trait: string) => 
            `<span class="trait-tag">${this.escapeHtml(trait)}</span>`
          ).join('')}
        </div>
        <div class="character-role">${this.escapeHtml(character.role)}</div>
      </div>
    `;
  }

  /**
   * Format status for display
   */
  private formatStatus(status: CreativeStrategyStatus): string {
    return status.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format audience for display
   */
  private formatAudience(audience: TargetAudience): string {
    return audience.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format tone for display
   */
  private formatTone(tone: SatiricalTone): string {
    return tone.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
   * Render error state
   */
  private renderError(message: string): void {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="strategy-error">
        <div class="error-icon">❌</div>
        <h3>Creative Strategy Error</h3>
        <p>${this.escapeHtml(message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          Retry
        </button>
      </div>
    `;
  }
}

// Export singleton instance
export const creativeStrategyManager = new CreativeStrategyManager();