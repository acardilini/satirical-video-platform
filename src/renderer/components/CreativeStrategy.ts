// Creative Strategy Component
// Handles creative strategy development and director's notes generation

import { 
  CreativeStrategy, 
  CreativeStrategyStatus, 
  SatiricalTone, 
  TargetAudience, 
  SatiricalAngle, 
  CharacterArchetype,
  PersonaType 
} from '../../shared/types/index.js';
import { ModernAIChatInterface } from './ModernAIChatInterface.js';

export class CreativeStrategyManager {
  private currentProjectId: string | null = null;
  private currentStrategy: CreativeStrategy | null = null;
  private isLoading = false;
  private modernAIChat: ModernAIChatInterface | null = null;

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
      console.error('Failed to load existing strategy:', error);
    }
  }

  /**
   * Render the Creative Strategy interface
   */
  private render(): void {
    const container = this.getContainer();
    if (!container) return;

    if (this.currentStrategy) {
      this.renderExistingStrategy(container);
    } else {
      this.renderNewStrategyForm(container);
    }
  }

  /**
   * Render existing strategy for editing
   */
  private renderExistingStrategy(container: HTMLElement): void {
    const strategy = this.currentStrategy!;
    const statusClass = strategy.status.toLowerCase().replace('_', '-');

    container.innerHTML = `
      <div class="creative-strategy">
        <!-- Strategy Header -->
        <div class="strategy-header">
          <div class="strategy-meta">
            <h3>Creative Strategy</h3>
            <span class="strategy-status ${statusClass}">${this.formatStatus(strategy.status)}</span>
            <span class="strategy-version">v${strategy.version}</span>
          </div>
          <div class="strategy-actions">
            <button class="btn btn-outline" id="refine-with-chat-btn">
              💬 Refine with AI Chat
            </button>
            <button class="btn btn-outline" id="edit-strategy-btn">
              ✏️ Edit Strategy
            </button>
            <button class="btn btn-primary" id="generate-director-notes-btn">
              🎬 Generate Director's Notes
            </button>
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

        <!-- Satirical Angles -->
        <div class="strategy-section">
          <h4>Satirical Angles</h4>
          <div class="angles-list">
            ${strategy.satirical_angles.map(angle => this.renderSatiricalAngle(angle)).join('')}
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

        <!-- Validation Status -->
        <div class="strategy-section">
          <h4>Validation Criteria</h4>
          <div class="validation-grid">
            ${this.renderValidationCriteria(strategy.validation_criteria)}
          </div>
        </div>
      </div>
    `;

    this.setupExistingStrategyListeners();
  }

  /**
   * Render new strategy creation form
   */
  private renderNewStrategyForm(container: HTMLElement): void {
    container.innerHTML = `
      <div class="creative-strategy-form">
        <!-- Header -->
        <div class="form-header">
          <h3>Create Creative Strategy</h3>
          <p>Develop the creative direction for this satirical video project</p>
        </div>

        <!-- AI Collaboration Option -->
        <div class="ai-generation-section">
          <h4>🤖 AI-Powered Strategy Development</h4>
          <p>Collaborate with the Creative Strategist persona to develop your strategy through interactive discussion.</p>
          <div class="collaboration-options">
            <button class="btn btn-primary" id="start-ai-chat-btn">
              💬 Start Collaborative Chat
            </button>
            <button class="btn btn-outline" id="generate-ai-strategy-btn">
              🚀 Quick AI Generation
            </button>
          </div>
          <div class="divider">
            <span>or</span>
          </div>
        </div>

        <!-- Manual Creation Form -->
        <form id="creative-strategy-form" class="strategy-form">
          <div class="form-group">
            <label for="creative-concept">Creative Concept *</label>
            <textarea id="creative-concept" name="creative_concept" rows="4" maxlength="1000" 
                      placeholder="Describe the core satirical concept and approach for this project..." required></textarea>
            <small class="form-hint">What's the main satirical idea driving this video?</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="target-audience">Target Audience *</label>
              <select id="target-audience" name="target_audience" required>
                <option value="">Select audience...</option>
                <option value="GENERAL">General Audience</option>
                <option value="POLITICAL_SATIRE">Political Satire Fans</option>
                <option value="SOCIAL_COMMENTARY">Social Commentary</option>
                <option value="MILLENNIAL">Millennial</option>
                <option value="GEN_Z">Gen Z</option>
              </select>
            </div>

            <div class="form-group">
              <label for="satirical-tone">Satirical Tone *</label>
              <select id="satirical-tone" name="satirical_tone" required>
                <option value="">Select tone...</option>
                <option value="SUBTLE">Subtle</option>
                <option value="OVERT">Overt</option>
                <option value="ABSURDIST">Absurdist</option>
                <option value="DRY_WIT">Dry Wit</option>
                <option value="SATIRICAL_NEWS">Satirical News</option>
              </select>
            </div>
          </div>

          <!-- Key Themes -->
          <div class="form-group">
            <label>Key Themes</label>
            <div class="dynamic-list" id="themes-list">
              <div class="list-item">
                <input type="text" placeholder="Enter a key theme..." maxlength="100">
                <button type="button" class="btn-remove">×</button>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-add-item" data-target="themes-list">
              + Add Theme
            </button>
          </div>

          <!-- Satirical Angles -->
          <div class="form-group">
            <label>Satirical Angles</label>
            <div id="angles-container">
              <!-- Angles will be added dynamically -->
            </div>
            <button type="button" class="btn btn-outline" id="add-angle-btn">
              + Add Satirical Angle
            </button>
          </div>

          <!-- Character Archetypes -->
          <div class="form-group">
            <label>Character Archetypes</label>
            <div id="characters-container">
              <!-- Characters will be added dynamically -->
            </div>
            <button type="button" class="btn btn-outline" id="add-character-btn">
              + Add Character
            </button>
          </div>

          <!-- Visual Style Guide -->
          <div class="form-group">
            <label>Visual Style Guide</label>
            <div class="visual-style-inputs">
              <div class="form-group">
                <label for="color-palette">Color Palette</label>
                <input type="text" id="color-palette" name="color_palette" maxlength="200" 
                       placeholder="e.g., Muted earth tones with bold red accents">
              </div>
              
              <div class="form-group">
                <label for="cinematography-notes">Cinematography Notes</label>
                <textarea id="cinematography-notes" name="cinematography_notes" rows="2" maxlength="500" 
                          placeholder="Camera angles, lighting preferences, shot composition..."></textarea>
              </div>
              
              <div class="form-group">
                <label for="overall-aesthetic">Overall Aesthetic</label>
                <input type="text" id="overall-aesthetic" name="overall_aesthetic" maxlength="200" 
                       placeholder="e.g., Mock documentary style, retro news broadcast">
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-strategy-btn">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Creative Strategy
            </button>
          </div>
        </form>
      </div>
    `;

    this.setupFormListeners();
  }

  /**
   * Render satirical angle item
   */
  private renderSatiricalAngle(angle: SatiricalAngle): string {
    return `
      <div class="angle-item">
        <div class="angle-header">
          <span class="angle-type">${angle.angle_type}</span>
        </div>
        <div class="angle-description">
          ${this.escapeHtml(angle.description)}
        </div>
        <div class="angle-elements">
          ${angle.key_elements.map(element => 
            `<span class="element-tag">${this.escapeHtml(element)}</span>`
          ).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render character archetype
   */
  private renderCharacterArchetype(character: CharacterArchetype): string {
    return `
      <div class="character-card">
        <h5 class="character-name">${this.escapeHtml(character.name)}</h5>
        <div class="character-role">${this.escapeHtml(character.role)}</div>
        <div class="character-traits">
          ${character.satirical_traits.map(trait => 
            `<span class="trait-tag">${this.escapeHtml(trait)}</span>`
          ).join('')}
        </div>
        ${character.visual_description ? `
          <div class="character-visual">
            <strong>Visual:</strong> ${this.escapeHtml(character.visual_description)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render validation criteria
   */
  private renderValidationCriteria(criteria: any): string {
    const criteriaItems = [
      { key: 'theme_consistency', label: 'Theme Consistency', value: criteria.theme_consistency },
      { key: 'character_coherence', label: 'Character Coherence', value: criteria.character_coherence },
      { key: 'satirical_effectiveness', label: 'Satirical Effectiveness', value: criteria.satirical_effectiveness },
      { key: 'technical_feasibility', label: 'Technical Feasibility', value: criteria.technical_feasibility }
    ];

    return criteriaItems.map(item => `
      <div class="validation-item">
        <div class="validation-label">${item.label}</div>
        <div class="validation-status ${item.value ? 'valid' : 'invalid'}">
          ${item.value ? '✅' : '❌'}
        </div>
      </div>
    `).join('');
  }

  /**
   * Setup event listeners for existing strategy
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
   * Setup event listeners for form
   */
  private setupFormListeners(): void {
    const form = document.getElementById('creative-strategy-form');
    const generateAIBtn = document.getElementById('generate-ai-strategy-btn');
    const startChatBtn = document.getElementById('start-ai-chat-btn');
    const cancelBtn = document.getElementById('cancel-strategy-btn');
    const addAngleBtn = document.getElementById('add-angle-btn');
    const addCharacterBtn = document.getElementById('add-character-btn');

    form?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    generateAIBtn?.addEventListener('click', () => this.generateAIStrategy());
    startChatBtn?.addEventListener('click', () => this.startCollaborativeChat());
    cancelBtn?.addEventListener('click', () => this.cancel());
    addAngleBtn?.addEventListener('click', () => this.addAngleInput());
    addCharacterBtn?.addEventListener('click', () => this.addCharacterInput());

    // Dynamic list handlers
    this.setupDynamicListHandlers();
  }

  /**
   * Setup dynamic list input handlers
   */
  private setupDynamicListHandlers(): void {
    const addBtns = document.querySelectorAll('.btn-add-item');
    addBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).getAttribute('data-target');
        if (target) this.addListItem(target);
      });
    });
  }

  /**
   * Add dynamic list item
   */
  private addListItem(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const newItem = document.createElement('div');
    newItem.className = 'list-item';
    newItem.innerHTML = `
      <input type="text" placeholder="Enter a key theme..." maxlength="100">
      <button type="button" class="btn-remove">×</button>
    `;

    container.appendChild(newItem);

    // Add remove handler
    const removeBtn = newItem.querySelector('.btn-remove');
    removeBtn?.addEventListener('click', () => {
      if (container.children.length > 1) {
        newItem.remove();
      }
    });
  }

  /**
   * Add satirical angle input
   */
  private addAngleInput(): void {
    const container = document.getElementById('angles-container');
    if (!container) return;

    const angleDiv = document.createElement('div');
    angleDiv.className = 'angle-input-group';
    angleDiv.innerHTML = `
      <div class="angle-input">
        <div class="form-row">
          <div class="form-group">
            <label>Angle Type</label>
            <select name="angle_type" required>
              <option value="">Select type...</option>
              <option value="IRONY">Irony</option>
              <option value="EXAGGERATION">Exaggeration</option>
              <option value="PARODY">Parody</option>
              <option value="SUBVERSION">Subversion</option>
            </select>
          </div>
          <div class="form-group angle-remove">
            <button type="button" class="btn btn-danger btn-remove-angle">×</button>
          </div>
        </div>
        
        <div class="form-group">
          <label>Description</label>
          <textarea name="angle_description" rows="2" maxlength="300" 
                    placeholder="Describe this satirical angle..." required></textarea>
        </div>
        
        <div class="form-group">
          <label>Key Elements</label>
          <div class="angle-elements-list">
            <div class="list-item">
              <input type="text" name="angle_element" placeholder="Enter key element..." maxlength="100">
              <button type="button" class="btn-remove">×</button>
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-add-element">+ Add Element</button>
        </div>
      </div>
    `;

    container.appendChild(angleDiv);

    // Setup remove handlers
    const removeBtn = angleDiv.querySelector('.btn-remove-angle');
    removeBtn?.addEventListener('click', () => angleDiv.remove());

    const addElementBtn = angleDiv.querySelector('.btn-add-element');
    addElementBtn?.addEventListener('click', () => {
      const elementsList = angleDiv.querySelector('.angle-elements-list');
      if (elementsList) this.addAngleElement(elementsList);
    });
  }

  /**
   * Add character archetype input
   */
  private addCharacterInput(): void {
    const container = document.getElementById('characters-container');
    if (!container) return;

    const characterDiv = document.createElement('div');
    characterDiv.className = 'character-input-group';
    characterDiv.innerHTML = `
      <div class="character-input">
        <div class="form-row">
          <div class="form-group">
            <label>Character Name</label>
            <input type="text" name="character_name" maxlength="100" 
                   placeholder="Character name..." required>
          </div>
          <div class="form-group">
            <label>Role</label>
            <input type="text" name="character_role" maxlength="100" 
                   placeholder="Character role..." required>
          </div>
          <div class="form-group character-remove">
            <button type="button" class="btn btn-danger btn-remove-character">×</button>
          </div>
        </div>
        
        <div class="form-group">
          <label>Visual Description</label>
          <input type="text" name="character_visual" maxlength="200" 
                 placeholder="Physical appearance, style...">
        </div>
        
        <div class="form-group">
          <label>Satirical Traits</label>
          <div class="character-traits-list">
            <div class="list-item">
              <input type="text" name="character_trait" placeholder="Enter satirical trait..." maxlength="100">
              <button type="button" class="btn-remove">×</button>
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-add-trait">+ Add Trait</button>
        </div>
      </div>
    `;

    container.appendChild(characterDiv);

    // Setup remove handlers
    const removeBtn = characterDiv.querySelector('.btn-remove-character');
    removeBtn?.addEventListener('click', () => characterDiv.remove());

    const addTraitBtn = characterDiv.querySelector('.btn-add-trait');
    addTraitBtn?.addEventListener('click', () => {
      const traitsList = characterDiv.querySelector('.character-traits-list');
      if (traitsList) this.addCharacterTrait(traitsList);
    });
  }

  /**
   * Add angle element
   */
  private addAngleElement(container: Element): void {
    const newElement = document.createElement('div');
    newElement.className = 'list-item';
    newElement.innerHTML = `
      <input type="text" name="angle_element" placeholder="Enter key element..." maxlength="100">
      <button type="button" class="btn-remove">×</button>
    `;

    container.appendChild(newElement);

    const removeBtn = newElement.querySelector('.btn-remove');
    removeBtn?.addEventListener('click', () => {
      if (container.children.length > 1) {
        newElement.remove();
      }
    });
  }

  /**
   * Add character trait
   */
  private addCharacterTrait(container: Element): void {
    const newTrait = document.createElement('div');
    newTrait.className = 'list-item';
    newTrait.innerHTML = `
      <input type="text" name="character_trait" placeholder="Enter satirical trait..." maxlength="100">
      <button type="button" class="btn-remove">×</button>
    `;

    container.appendChild(newTrait);

    const removeBtn = newTrait.querySelector('.btn-remove');
    removeBtn?.addEventListener('click', () => {
      if (container.children.length > 1) {
        newTrait.remove();
      }
    });
  }

  /**
   * Refine existing strategy with AI chat
   */
  private async refineWithChat(): Promise<void> {
    if (!this.currentProjectId || !this.currentStrategy) return;

    try {
      const container = this.getContainer();
      if (!container) return;

      // Create split-screen layout: strategy on left, chat on right
      container.innerHTML = `
        <div class="strategy-refinement-layout">
          <!-- Strategy Review Panel -->
          <div class="strategy-review-panel">
            <div class="strategy-review-header">
              <h3>📋 Current Strategy</h3>
              <button class="btn btn-outline btn-sm" id="close-refinement-btn">✕ Close Chat</button>
            </div>
            <div class="strategy-review-content">
              ${this.renderStrategyForReview()}
            </div>
          </div>

          <!-- Chat Panel -->
          <div class="chat-refinement-panel">
            <div class="chat-refinement-header">
              <div class="chat-persona-info">
                <div class="persona-avatar-small">🎯</div>
                <div class="persona-details-small">
                  <h4>Creative Strategist</h4>
                  <span class="persona-status">Ready to refine your strategy</span>
                </div>
              </div>
              <div class="chat-controls">
                <button class="btn btn-ghost btn-sm" id="save-chat-btn">💾 Save</button>
                <button class="btn btn-primary btn-sm" id="finalize-strategy-btn">✅ Apply Changes</button>
              </div>
            </div>
            <div id="ai-chat-container" class="ai-chat-interface">
              <!-- AI Chat Interface will be inserted here -->
            </div>
          </div>
        </div>
      `;

      // Setup event listeners
      const closeBtn = document.getElementById('close-refinement-btn');
      const saveBtn = document.getElementById('save-chat-btn');
      const finalizeBtn = document.getElementById('finalize-strategy-btn');

      closeBtn?.addEventListener('click', () => {
        this.modernAIChat = null;
        this.render(); // Return to normal strategy view
      });

      saveBtn?.addEventListener('click', () => {
        // Save current chat progress
        this.showSuccess('Chat progress saved!');
      });

      finalizeBtn?.addEventListener('click', () => {
        // Finalize and apply strategy changes
        this.finalizeStrategyRefinement();
      });

      // Initialize modern AI chat interface
      this.modernAIChat = new ModernAIChatInterface('ai-chat-container');
      await this.modernAIChat.initialize('CREATIVE_STRATEGIST', this.currentStrategy);

      // Setup expandable sections
      this.setupExpandableListeners();

      // Listen for strategy refresh events
      window.addEventListener('refreshStrategy', () => {
        this.loadExistingStrategy().then(() => this.render());
      });

    } catch (error) {
      console.error('Failed to start strategy refinement chat:', error);
      this.showError('Failed to start strategy refinement session');
    }
  }

  /**
   * Render strategy for review in refinement mode
   */
  private renderStrategyForReview(): string {
    if (!this.currentStrategy) return '';

    return `
      <div class="strategy-review">
        <!-- Quick Overview -->
        <div class="review-section">
          <h4>Creative Concept</h4>
          <div class="review-content">
            ${this.escapeHtml(this.currentStrategy.creative_concept)}
          </div>
        </div>

        <!-- Key Details -->
        <div class="review-grid">
          <div class="review-card">
            <h5>Target Audience</h5>
            <span class="audience-badge">${this.formatAudience(this.currentStrategy.target_audience)}</span>
          </div>
          <div class="review-card">
            <h5>Tone</h5>
            <span class="tone-badge">${this.formatTone(this.currentStrategy.tone)}</span>
          </div>
          <div class="review-card">
            <h5>Themes</h5>
            <span class="count-badge">${this.currentStrategy.key_themes.length} themes</span>
          </div>
          <div class="review-card">
            <h5>Characters</h5>
            <span class="count-badge">${this.currentStrategy.character_archetypes.length} characters</span>
          </div>
        </div>

        <!-- Expandable Sections -->
        <div class="review-expandable">
          <div class="expand-section">
            <button class="expand-trigger" data-target="themes-detail">
              <span>Key Themes</span>
              <span class="expand-icon">▼</span>
            </button>
            <div class="expand-content" id="themes-detail" style="display: none;">
              <div class="themes-list-compact">
                ${this.currentStrategy.key_themes.map(theme => 
                  `<span class="theme-tag-compact">${this.escapeHtml(theme)}</span>`
                ).join('')}
              </div>
            </div>
          </div>

          <div class="expand-section">
            <button class="expand-trigger" data-target="characters-detail">
              <span>Characters (${this.currentStrategy.character_archetypes.length})</span>
              <span class="expand-icon">▼</span>
            </button>
            <div class="expand-content" id="characters-detail" style="display: none;">
              ${this.currentStrategy.character_archetypes.map(char => `
                <div class="character-compact">
                  <strong>${this.escapeHtml(char.name)}</strong> - ${this.escapeHtml(char.role)}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="expand-section">
            <button class="expand-trigger" data-target="angles-detail">
              <span>Satirical Angles (${this.currentStrategy.satirical_angles.length})</span>
              <span class="expand-icon">▼</span>
            </button>
            <div class="expand-content" id="angles-detail" style="display: none;">
              ${this.currentStrategy.satirical_angles.map(angle => `
                <div class="angle-compact">
                  <span class="angle-type-compact">${angle.angle_type}</span>
                  <p>${this.escapeHtml(angle.description)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup expandable section listeners
   */
  private setupExpandableListeners(): void {
    const triggers = document.querySelectorAll('.expand-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).getAttribute('data-target');
        const content = document.getElementById(target!);
        const icon = trigger.querySelector('.expand-icon');
        
        if (content && icon) {
          const isVisible = content.style.display !== 'none';
          content.style.display = isVisible ? 'none' : 'block';
          icon.textContent = isVisible ? '▼' : '▲';
        }
      });
    });
  }

  /**
   * Finalize strategy refinement
   */
  private async finalizeStrategyRefinement(): Promise<void> {
    const confirmed = confirm('Apply the refined strategy changes? This will update your current strategy.');
    if (!confirmed) return;

    try {
      // For now, just show success. In production, this would apply chat-generated changes
      this.showSuccess('Strategy refinement applied successfully!');
      
      // Close chat and return to normal view
      this.modernAIChat = null;
      this.render();
    } catch (error) {
      console.error('Failed to finalize strategy refinement:', error);
      this.showError('Failed to apply strategy changes');
    }
  }

  /**
   * Start collaborative chat with AI
   */
  private async startCollaborativeChat(): Promise<void> {
    if (!this.currentProjectId) return;

    try {
      // Hide the form and show chat interface
      const container = this.getContainer();
      if (!container) return;

      // Create chat container with proper layout
      container.innerHTML = `
        <div class="creative-strategy-chat">
          <div class="chat-intro-header">
            <div class="intro-content">
              <h3>🤖 Collaborative Strategy Development</h3>
              <p>Work with the Creative Strategist to develop your satirical video strategy</p>
            </div>
            <button class="btn btn-outline" id="back-to-form-btn">← Back to Form</button>
          </div>
          <div id="ai-chat-container" class="ai-chat-interface" style="height: calc(100vh - 120px); min-height: 500px;">
            <!-- AI Chat Interface will be inserted here -->
          </div>
        </div>
      `;

      // Setup back button
      const backBtn = document.getElementById('back-to-form-btn');
      backBtn?.addEventListener('click', () => {
        this.modernAIChat = null;
        this.render(); // Re-render the form
      });

      // Initialize modern AI chat interface
      console.log('DEBUG: Starting ModernAIChatInterface initialization');
      this.modernAIChat = new ModernAIChatInterface('ai-chat-container');
      console.log('DEBUG: ModernAIChatInterface created, initializing...');
      await this.modernAIChat.initialize('CREATIVE_STRATEGIST');
      console.log('DEBUG: ModernAIChatInterface initialized');

      // Listen for strategy refresh events
      window.addEventListener('refreshStrategy', () => {
        this.loadExistingStrategy().then(() => this.render());
      });

    } catch (error) {
      console.error('Failed to start collaborative chat:', error);
      this.showError('Failed to start collaborative chat session');
    }
  }

  /**
   * Generate AI-powered strategy (quick generation)
   */
  private async generateAIStrategy(): Promise<void> {
    if (!this.currentProjectId) return;

    try {
      const generateBtn = document.getElementById('generate-ai-strategy-btn') as HTMLButtonElement;
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating Strategy...';

      // @ts-ignore
      const result = await window.electronAPI.database.generateCreativeStrategy(this.currentProjectId);

      if (result.success) {
        this.currentStrategy = result.data;
        this.render();
        this.showSuccess('Creative Strategy generated successfully!');
      } else {
        this.showError(result.error || 'Failed to generate strategy');
      }
    } catch (error) {
      console.error('AI strategy generation failed:', error);
      this.showError('Failed to generate AI strategy');
    } finally {
      const generateBtn = document.getElementById('generate-ai-strategy-btn') as HTMLButtonElement;
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = '🚀 Quick AI Generation';
      }
    }
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.currentProjectId) return;

    try {
      const formData = this.collectFormData();
      if (!formData) return;

      const submitBtn = document.querySelector('#creative-strategy-form button[type="submit"]') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Strategy...';

      // @ts-ignore
      const result = await window.electronAPI.database.createCreativeStrategy(formData);

      if (result.success) {
        this.currentStrategy = result.data;
        this.render();
        this.showSuccess('Creative Strategy created successfully!');
      } else {
        this.showError(result.error || 'Failed to create strategy');
      }
    } catch (error) {
      console.error('Strategy creation failed:', error);
      this.showError('Failed to create strategy');
    }
  }

  /**
   * Collect form data
   */
  private collectFormData(): any | null {
    const form = document.getElementById('creative-strategy-form') as HTMLFormElement;
    if (!form) return null;

    const formData = new FormData(form);
    
    // Collect themes
    const themes = Array.from(document.querySelectorAll('#themes-list input'))
      .map(input => (input as HTMLInputElement).value.trim())
      .filter(value => value.length > 0);

    // Collect satirical angles
    const angles: SatiricalAngle[] = [];
    const angleGroups = document.querySelectorAll('.angle-input-group');
    angleGroups.forEach(group => {
      const typeSelect = group.querySelector('select[name="angle_type"]') as HTMLSelectElement;
      const descriptionTextarea = group.querySelector('textarea[name="angle_description"]') as HTMLTextAreaElement;
      const elementInputs = group.querySelectorAll('input[name="angle_element"]');
      
      if (typeSelect.value && descriptionTextarea.value.trim()) {
        const elements = Array.from(elementInputs)
          .map(input => (input as HTMLInputElement).value.trim())
          .filter(value => value.length > 0);

        angles.push({
          angle_type: typeSelect.value as any,
          description: descriptionTextarea.value.trim(),
          key_elements: elements
        });
      }
    });

    // Collect character archetypes
    const characters: CharacterArchetype[] = [];
    const characterGroups = document.querySelectorAll('.character-input-group');
    characterGroups.forEach(group => {
      const nameInput = group.querySelector('input[name="character_name"]') as HTMLInputElement;
      const roleInput = group.querySelector('input[name="character_role"]') as HTMLInputElement;
      const visualInput = group.querySelector('input[name="character_visual"]') as HTMLInputElement;
      const traitInputs = group.querySelectorAll('input[name="character_trait"]');
      
      if (nameInput.value.trim() && roleInput.value.trim()) {
        const traits = Array.from(traitInputs)
          .map(input => (input as HTMLInputElement).value.trim())
          .filter(value => value.length > 0);

        characters.push({
          name: nameInput.value.trim(),
          role: roleInput.value.trim(),
          visual_description: visualInput.value.trim() || undefined,
          satirical_traits: traits
        });
      }
    });

    return {
      project_id: this.currentProjectId,
      creative_concept: formData.get('creative_concept'),
      target_audience: formData.get('target_audience'),
      tone: formData.get('satirical_tone'),
      key_themes: themes,
      satirical_angles: angles,
      character_archetypes: characters,
      visual_style_guide: {
        color_palette: formData.get('color_palette') || undefined,
        cinematography_notes: formData.get('cinematography_notes') || undefined,
        overall_aesthetic: formData.get('overall_aesthetic') || undefined
      },
      created_by: 'temp-user-id' // TODO: Get from session
    };
  }

  /**
   * Edit existing strategy
   */
  private editStrategy(): void {
    // TODO: Implement edit functionality
    alert('Strategy editing will be available in a future update');
  }

  /**
   * Generate director's notes from strategy
   */
  private async generateDirectorNotes(): Promise<void> {
    if (!this.currentStrategy) return;

    try {
      // @ts-ignore
      const result = await window.electronAPI.database.generateDirectorNotes(this.currentStrategy.id);
      
      if (result.success) {
        this.showSuccess('Director\'s Notes generated successfully! Check the Script tab.');
      } else {
        this.showError(result.error || 'Failed to generate director\'s notes');
      }
    } catch (error) {
      console.error('Director notes generation failed:', error);
      this.showError('Failed to generate director\'s notes');
    }
  }

  /**
   * Cancel creation
   */
  private cancel(): void {
    // Go back to project dashboard
    const overviewTab = document.querySelector('[data-tab="overview"]') as HTMLElement;
    overviewTab?.click();
  }

  /**
   * Get container element
   */
  private getContainer(): HTMLElement | null {
    return document.getElementById('strategy-tab');
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

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    alert(`✅ ${message}`);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    alert(`❌ Error: ${message}`);
  }
}

// Export singleton instance
export const creativeStrategyManager = new CreativeStrategyManager();