// Agent Model Selector Component
// Allows users to select which model each AI agent should use

import { PersonaType } from '../../shared/types/index.js';
import { AgentConfigService } from '../../services/agent-config.js';
import { GlobalAPISettings } from './GlobalAPISettings.js';

export class AgentModelSelector {
  private modal: HTMLElement | null = null;
  private isOpen = false;
  private currentPersona: PersonaType | null = null;

  constructor() {
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Create the settings modal
   */
  private createModal() {
    const modalHTML = `
      <div id="agent-model-selector-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="agent-modal-title">🤖 Agent Model Selection</h2>
            <button class="modal-close" id="close-agent-settings">&times;</button>
          </div>
          
          <div class="modal-form">
            <div class="agent-info" id="agent-info">
              <!-- Agent info will be populated dynamically -->
            </div>

            <form id="agent-model-form">
              <div class="form-group">
                <label for="agent-provider">AI Provider</label>
                <select id="agent-provider" name="provider">
                  <option value="">Select provider...</option>
                </select>
                <small class="form-hint">Choose from your configured AI providers</small>
              </div>

              <div class="form-group" id="model-group" style="display: none;">
                <label for="agent-model">Model</label>
                <select id="agent-model" name="model">
                  <option value="">Select model...</option>
                </select>
                <small class="form-hint" id="model-hint">Choose the specific model for this agent</small>
              </div>

              <div class="no-providers-message" id="no-providers" style="display: none;">
                <div class="info-callout">
                  <strong>⚠️ No AI providers configured</strong><br>
                  You need to set up your API keys before configuring agents.
                  <button type="button" class="btn btn-outline" id="setup-providers-btn" style="margin-top: 8px;">
                    Setup API Keys
                  </button>
                </div>
              </div>

              <div class="model-info" id="model-info" style="display: none;">
                <div class="info-box">
                  <h4>💡 Model Recommendations</h4>
                  <div id="model-recommendations">
                    <!-- Recommendations will be populated -->
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-agent-settings">Cancel</button>
                <button type="submit" class="btn btn-primary" id="save-agent-settings">Save Model Selection</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('agent-model-selector-modal');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const closeBtn = document.getElementById('close-agent-settings');
    const cancelBtn = document.getElementById('cancel-agent-settings');
    const form = document.getElementById('agent-model-form');
    const providerSelect = document.getElementById('agent-provider') as HTMLSelectElement;
    const setupBtn = document.getElementById('setup-providers-btn');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    form?.addEventListener('submit', (e) => this.handleSubmit(e));
    setupBtn?.addEventListener('click', () => this.openGlobalSettings());

    providerSelect?.addEventListener('change', () => this.handleProviderChange());

    // Close on overlay click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  /**
   * Open for specific persona
   */
  public open(persona: PersonaType): void {
    this.currentPersona = persona;
    if (this.modal) {
      this.populateAgentInfo();
      this.loadAvailableProviders();
      this.loadCurrentSettings();
      this.modal.style.display = 'flex';
      this.isOpen = true;
    }
  }

  /**
   * Close settings modal
   */
  public close(): void {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.isOpen = false;
      this.currentPersona = null;
    }
  }

  /**
   * Populate agent information
   */
  private populateAgentInfo(): void {
    if (!this.currentPersona) return;

    const titleEl = document.getElementById('agent-modal-title');
    const infoEl = document.getElementById('agent-info');
    
    const displayName = AgentConfigService.getPersonaDisplayName(this.currentPersona);
    const icon = this.getPersonaIcon(this.currentPersona);
    const description = this.getPersonaDescription(this.currentPersona);

    if (titleEl) {
      titleEl.textContent = `${icon} ${displayName} Settings`;
    }

    if (infoEl) {
      infoEl.innerHTML = `
        <div class="agent-card">
          <div class="agent-avatar">${icon}</div>
          <div class="agent-details">
            <h3>${displayName}</h3>
            <p>${description}</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Load available providers
   */
  private loadAvailableProviders(): void {
    const providerSelect = document.getElementById('agent-provider') as HTMLSelectElement;
    const noProvidersEl = document.getElementById('no-providers');
    
    const availableProviders = GlobalAPISettings.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      noProvidersEl!.style.display = 'block';
      providerSelect.style.display = 'none';
      document.getElementById('model-group')!.style.display = 'none';
      return;
    }

    noProvidersEl!.style.display = 'none';
    providerSelect.style.display = 'block';
    
    // Clear existing options except first
    providerSelect.innerHTML = '<option value="">Select provider...</option>';
    
    // Add available providers
    const providerNames = {
      'openai': '🤖 OpenAI',
      'anthropic': '🧠 Anthropic', 
      'gemini': '💎 Google Gemini',
      'local': '🏠 Local LLM'
    };

    availableProviders.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider;
      option.textContent = providerNames[provider as keyof typeof providerNames] || provider;
      providerSelect.appendChild(option);
    });
  }

  /**
   * Handle provider change
   */
  private handleProviderChange(): void {
    const providerSelect = document.getElementById('agent-provider') as HTMLSelectElement;
    const modelGroup = document.getElementById('model-group');
    const modelSelect = document.getElementById('agent-model') as HTMLSelectElement;
    const modelInfo = document.getElementById('model-info');
    const recommendations = document.getElementById('model-recommendations');
    
    const provider = providerSelect.value;
    
    if (!provider) {
      modelGroup!.style.display = 'none';
      modelInfo!.style.display = 'none';
      return;
    }

    modelGroup!.style.display = 'block';
    
    // Clear existing models
    modelSelect.innerHTML = '<option value="">Select model...</option>';
    
    // Add models for provider
    const models = AgentConfigService.getModelsForProvider(provider);
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.value;
      option.textContent = model.label;
      modelSelect.appendChild(option);
    });

    // Show model info and recommendations
    if (recommendations && this.currentPersona) {
      modelInfo!.style.display = 'block';
      recommendations.innerHTML = this.getModelRecommendations(provider, this.currentPersona);
    }
  }

  /**
   * Get model recommendations for persona and provider
   */
  private getModelRecommendations(provider: string, persona: PersonaType): string {
    const recommendations: Record<string, Record<PersonaType, string>> = {
      'openai': {
        'CREATIVE_STRATEGIST': '**GPT-4** - Best for creative brainstorming and strategic thinking',
        'SATIRICAL_SCREENWRITER': '**GPT-4** - Excellent for writing and dialogue creation',
        'CINEMATIC_STORYBOARDER': '**GPT-4 Turbo** - Great for visual descriptions and planning',
        'SOUNDSCAPE_ARCHITECT': '**GPT-4** - Creative audio design and sound planning',
        'VIDEO_PROMPT_ENGINEER': '**GPT-4 Turbo** - Optimized for technical prompt creation',
        'BAFFLING_BROADCASTER': '**GPT-4** - Perfect for character-based content creation',
        'PROJECT_DIRECTOR': '**GPT-4** - Excellent for project coordination and management'
      },
      'anthropic': {
        'CREATIVE_STRATEGIST': '**Claude 3 Sonnet** - Excellent analytical and creative abilities',
        'SATIRICAL_SCREENWRITER': '**Claude 3 Opus** - Superior writing and storytelling',
        'CINEMATIC_STORYBOARDER': '**Claude 3 Sonnet** - Strong visual planning capabilities',
        'SOUNDSCAPE_ARCHITECT': '**Claude 3 Sonnet** - Creative and technical audio design',
        'VIDEO_PROMPT_ENGINEER': '**Claude 3 Haiku** - Fast and efficient for technical tasks',
        'BAFFLING_BROADCASTER': '**Claude 3 Opus** - Best for character consistency',
        'PROJECT_DIRECTOR': '**Claude 3 Sonnet** - Strategic planning and coordination'
      },
      'gemini': {
        'CREATIVE_STRATEGIST': '**Gemini 1.5 Pro** - Advanced reasoning for strategic planning',
        'SATIRICAL_SCREENWRITER': '**Gemini 1.5 Pro** - Strong creative writing abilities',
        'CINEMATIC_STORYBOARDER': '**Gemini 1.5 Flash** - Fast visual concept generation',
        'SOUNDSCAPE_ARCHITECT': '**Gemini 1.5 Pro** - Comprehensive audio planning',
        'VIDEO_PROMPT_ENGINEER': '**Gemini 1.5 Flash** - Efficient technical optimization',
        'BAFFLING_BROADCASTER': '**Gemini 1.5 Pro** - Good character development',
        'PROJECT_DIRECTOR': '**Gemini 1.5 Pro** - Advanced project coordination'
      },
      'local': {
        'CREATIVE_STRATEGIST': '**Llama 2** - Good for creative brainstorming',
        'SATIRICAL_SCREENWRITER': '**Mistral** - Strong writing capabilities',
        'CINEMATIC_STORYBOARDER': '**Llama 2** - Decent visual planning',
        'SOUNDSCAPE_ARCHITECT': '**Llama 2** - Creative audio concepts',
        'VIDEO_PROMPT_ENGINEER': '**CodeLlama** - Technical prompt optimization',
        'BAFFLING_BROADCASTER': '**Mistral** - Character-based content',
        'PROJECT_DIRECTOR': '**Llama 2** - Project management support'
      }
    };

    return recommendations[provider]?.[persona] || 'All models work well for this agent';
  }

  /**
   * Load current settings
   */
  private loadCurrentSettings(): void {
    if (!this.currentPersona) return;
    
    const config = AgentConfigService.getAgentConfig(this.currentPersona);
    if (!config) return;

    const providerSelect = document.getElementById('agent-provider') as HTMLSelectElement;
    const modelSelect = document.getElementById('agent-model') as HTMLSelectElement;

    providerSelect.value = config.provider;
    this.handleProviderChange(); // This will populate models
    
    // Set model after models are populated
    setTimeout(() => {
      modelSelect.value = config.model;
    }, 50);
  }

  /**
   * Handle form submission
   */
  private handleSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.currentPersona) return;
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const provider = formData.get('provider') as string;
    const model = formData.get('model') as string;

    if (!provider) {
      alert('Please select an AI provider');
      return;
    }

    if (!model) {
      alert('Please select a model');
      return;
    }

    // Save agent configuration (API keys are stored globally)
    AgentConfigService.saveAgentConfig(this.currentPersona, {
      provider: provider as any,
      model: model
    });

    alert(`✅ Model selection saved for ${AgentConfigService.getPersonaDisplayName(this.currentPersona)}!`);
    this.close();

    // Trigger update event
    window.dispatchEvent(new CustomEvent('agentConfigUpdated', { 
      detail: { persona: this.currentPersona }
    }));
  }

  /**
   * Open global API settings
   */
  private openGlobalSettings(): void {
    import('./GlobalAPISettings.js').then(module => {
      module.globalAPISettings.open();
    });
    this.close();
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
      'CREATIVE_STRATEGIST': 'Develops creative strategies and satirical angles for video content',
      'BAFFLING_BROADCASTER': 'Creates out-of-touch presenter characters for satirical commentary',
      'SATIRICAL_SCREENWRITER': 'Writes cynical dialogue and constructs satirical scenes',
      'CINEMATIC_STORYBOARDER': 'Plans visual storytelling and shot compositions',
      'SOUNDSCAPE_ARCHITECT': 'Designs audio elements and sound effects for enhanced impact',
      'VIDEO_PROMPT_ENGINEER': 'Optimizes prompts for AI video generation tools',
      'PROJECT_DIRECTOR': 'Coordinates all creative elements and manages project direction'
    };
    return descriptions[persona] || 'AI assistant for satirical content creation';
  }
}

// Export singleton instance
export const agentModelSelector = new AgentModelSelector();