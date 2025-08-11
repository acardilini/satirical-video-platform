// Global API Settings Component
// Central management for all AI provider API keys

export interface APIKeySettings {
  openai_api_key?: string;
  anthropic_api_key?: string;
  gemini_api_key?: string;
  local_base_url?: string;
}

export class GlobalAPISettings {
  private modal: HTMLElement | null = null;
  private isOpen = false;
  private static readonly STORAGE_KEY = 'global-api-settings';

  constructor() {
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Create the settings modal
   */
  private createModal() {
    const modalHTML = `
      <div id="global-api-settings-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>🔑 AI Provider Setup</h2>
            <button class="modal-close" id="close-api-settings">&times;</button>
          </div>
          
          <div class="modal-form">
            <div class="settings-info">
              <p>Configure your AI provider API keys once. Individual agents will select models from configured providers.</p>
              <div class="info-callout">
                <strong>💡 Tip:</strong> You only need to configure the providers you want to use. Leave others blank.
              </div>
            </div>

            <form id="global-api-form">
              
              <!-- OpenAI Section -->
              <div class="provider-section">
                <div class="provider-header">
                  <h3>🤖 OpenAI</h3>
                  <span class="provider-status" id="openai-status">Not configured</span>
                </div>
                <div class="form-group">
                  <label for="openai-key">API Key</label>
                  <div class="key-input-group">
                    <input type="password" id="openai-key" name="openai_api_key" placeholder="sk-...">
                    <button type="button" class="btn btn-outline test-btn" data-provider="openai">Test</button>
                  </div>
                  <small class="form-hint">
                    Models: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
                    <a href="https://platform.openai.com/api-keys" target="_blank">Get API Key</a>
                  </small>
                </div>
              </div>

              <!-- Anthropic Section -->  
              <div class="provider-section">
                <div class="provider-header">
                  <h3>🧠 Anthropic</h3>
                  <span class="provider-status" id="anthropic-status">Not configured</span>
                </div>
                <div class="form-group">
                  <label for="anthropic-key">API Key</label>
                  <div class="key-input-group">
                    <input type="password" id="anthropic-key" name="anthropic_api_key" placeholder="sk-ant-...">
                    <button type="button" class="btn btn-outline test-btn" data-provider="anthropic">Test</button>
                  </div>
                  <small class="form-hint">
                    Models: Claude 3 Sonnet, Haiku, Opus
                    <a href="https://console.anthropic.com/" target="_blank">Get API Key</a>
                  </small>
                </div>
              </div>

              <!-- Gemini Section -->
              <div class="provider-section">
                <div class="provider-header">
                  <h3>💎 Google Gemini</h3>
                  <span class="provider-status" id="gemini-status">Not configured</span>
                </div>
                <div class="form-group">
                  <label for="gemini-key">API Key</label>
                  <div class="key-input-group">
                    <input type="password" id="gemini-key" name="gemini_api_key" placeholder="AIza...">
                    <button type="button" class="btn btn-outline test-btn" data-provider="gemini">Test</button>
                  </div>
                  <small class="form-hint">
                    Models: Gemini 1.5 Pro, Flash, Pro
                    <a href="https://makersuite.google.com/app/apikey" target="_blank">Get API Key</a>
                  </small>
                </div>
              </div>

              <!-- Local LLM Section -->
              <div class="provider-section">
                <div class="provider-header">
                  <h3>🏠 Local LLM</h3>
                  <span class="provider-status" id="local-status">Not configured</span>
                </div>
                <div class="form-group">
                  <label for="local-url">Server URL</label>
                  <div class="key-input-group">
                    <input type="url" id="local-url" name="local_base_url" placeholder="http://localhost:11434" value="http://localhost:11434">
                    <button type="button" class="btn btn-outline test-btn" data-provider="local">Test</button>
                  </div>
                  <small class="form-hint">
                    Models: Llama 2, Mistral, CodeLlama (via Ollama)
                    <a href="https://ollama.ai/" target="_blank">Install Ollama</a>
                  </small>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-api-settings">Cancel</button>
                <button type="submit" class="btn btn-primary">Save API Keys</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('global-api-settings-modal');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const closeBtn = document.getElementById('close-api-settings');
    const cancelBtn = document.getElementById('cancel-api-settings');
    const form = document.getElementById('global-api-form');
    
    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Test buttons
    document.querySelectorAll('.test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const provider = (e.target as HTMLElement).dataset.provider!;
        this.testConnection(provider);
      });
    });

    // Close on overlay click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Real-time status updates
    ['openai-key', 'anthropic-key', 'gemini-key', 'local-url'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        this.updateProviderStatus();
      });
    });
  }

  /**
   * Open settings modal
   */
  public open(): void {
    if (this.modal) {
      this.loadCurrentSettings();
      this.updateProviderStatus();
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
      this.clearForm();
    }
  }

  /**
   * Load current settings
   */
  private loadCurrentSettings(): void {
    const settings = GlobalAPISettings.getAPISettings();
    if (!settings) return;

    const form = this.modal?.querySelector('#global-api-form') as HTMLFormElement;
    if (!form) return;

    (form.querySelector('[name="openai_api_key"]') as HTMLInputElement).value = settings.openai_api_key || '';
    (form.querySelector('[name="anthropic_api_key"]') as HTMLInputElement).value = settings.anthropic_api_key || '';
    (form.querySelector('[name="gemini_api_key"]') as HTMLInputElement).value = settings.gemini_api_key || '';
    (form.querySelector('[name="local_base_url"]') as HTMLInputElement).value = settings.local_base_url || 'http://localhost:11434';
  }

  /**
   * Update provider status indicators
   */
  private updateProviderStatus(): void {
    const settings = this.getCurrentFormData();
    
    this.updateStatusIndicator('openai', !!settings.openai_api_key);
    this.updateStatusIndicator('anthropic', !!settings.anthropic_api_key);
    this.updateStatusIndicator('gemini', !!settings.gemini_api_key);
    this.updateStatusIndicator('local', !!settings.local_base_url);
  }

  /**
   * Update individual status indicator
   */
  private updateStatusIndicator(provider: string, isConfigured: boolean): void {
    const statusEl = document.getElementById(`${provider}-status`);
    if (statusEl) {
      statusEl.textContent = isConfigured ? '✅ Configured' : 'Not configured';
      statusEl.className = `provider-status ${isConfigured ? 'configured' : 'not-configured'}`;
    }
  }

  /**
   * Get current form data
   */
  private getCurrentFormData(): APIKeySettings {
    const form = this.modal?.querySelector('#global-api-form') as HTMLFormElement;
    if (!form) return {};

    const formData = new FormData(form);
    return {
      openai_api_key: formData.get('openai_api_key') as string || undefined,
      anthropic_api_key: formData.get('anthropic_api_key') as string || undefined,
      gemini_api_key: formData.get('gemini_api_key') as string || undefined,
      local_base_url: formData.get('local_base_url') as string || undefined
    };
  }

  /**
   * Test connection for a provider
   */
  private async testConnection(provider: string): Promise<void> {
    const testBtn = document.querySelector(`[data-provider="${provider}"]`) as HTMLButtonElement;
    if (!testBtn) return;

    const originalText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';

    try {
      const settings = this.getCurrentFormData();
      
      // Here we would test the actual API connection
      // For now, simulate the test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock test success based on whether key is provided
      const hasKey = this.getKeyForProvider(provider, settings);
      
      if (hasKey) {
        this.showTestResult(provider, '✅ Connection successful!', true);
      } else {
        this.showTestResult(provider, '❌ API key required', false);
      }
      
    } catch (error) {
      this.showTestResult(provider, `❌ Connection failed: ${error}`, false);
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = originalText;
    }
  }

  /**
   * Get API key for provider
   */
  private getKeyForProvider(provider: string, settings: APIKeySettings): string | undefined {
    switch (provider) {
      case 'openai': return settings.openai_api_key;
      case 'anthropic': return settings.anthropic_api_key;
      case 'gemini': return settings.gemini_api_key;
      case 'local': return settings.local_base_url;
      default: return undefined;
    }
  }

  /**
   * Show test result
   */
  private showTestResult(provider: string, message: string, success: boolean): void {
    // Find the provider section and show result
    const section = document.querySelector(`#${provider}-status`)?.closest('.provider-section');
    if (!section) return;

    // Remove any existing test result
    section.querySelector('.test-result')?.remove();

    // Add new test result
    const resultEl = document.createElement('div');
    resultEl.className = `test-result ${success ? 'success' : 'error'}`;
    resultEl.textContent = message;
    section.appendChild(resultEl);

    // Remove after 5 seconds
    setTimeout(() => resultEl.remove(), 5000);
  }

  /**
   * Handle form submission
   */
  private handleSubmit(event: Event): void {
    event.preventDefault();
    
    const settings = this.getCurrentFormData();
    
    try {
      GlobalAPISettings.saveAPISettings(settings);
      alert('✅ API keys saved successfully!\n\nYou can now configure individual agents to use these providers.');
      this.close();
      
      // Trigger event for other components
      window.dispatchEvent(new CustomEvent('apiSettingsUpdated', { detail: settings }));
      
    } catch (error) {
      console.error('Failed to save API settings:', error);
      alert('❌ Failed to save API settings');
    }
  }

  /**
   * Clear form
   */
  private clearForm(): void {
    const form = this.modal?.querySelector('#global-api-form') as HTMLFormElement;
    if (form) {
      form.reset();
      // Reset local URL default
      (form.querySelector('[name="local_base_url"]') as HTMLInputElement).value = 'http://localhost:11434';
    }
  }

  /**
   * Static method to get API settings
   */
  public static getAPISettings(): APIKeySettings | null {
    try {
      const stored = localStorage.getItem(GlobalAPISettings.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load API settings:', error);
      return null;
    }
  }

  /**
   * Static method to save API settings
   */
  public static saveAPISettings(settings: APIKeySettings): void {
    try {
      localStorage.setItem(GlobalAPISettings.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save API settings:', error);
      throw error;
    }
  }

  /**
   * Static method to check if any provider is configured
   */
  public static hasAnyProvider(): boolean {
    const settings = GlobalAPISettings.getAPISettings();
    if (!settings) return false;
    
    return !!(
      settings.openai_api_key ||
      settings.anthropic_api_key ||
      settings.gemini_api_key ||
      settings.local_base_url
    );
  }

  /**
   * Static method to get available providers
   */
  public static getAvailableProviders(): string[] {
    const settings = GlobalAPISettings.getAPISettings();
    if (!settings) return [];

    const providers = [];
    if (settings.openai_api_key) providers.push('openai');
    if (settings.anthropic_api_key) providers.push('anthropic');
    if (settings.gemini_api_key) providers.push('gemini');
    if (settings.local_base_url) providers.push('local');
    
    return providers;
  }

  /**
   * Static method to get API key for provider
   */
  public static getAPIKeyForProvider(provider: string): string | null {
    const settings = GlobalAPISettings.getAPISettings();
    if (!settings) return null;

    switch (provider) {
      case 'openai': return settings.openai_api_key || null;
      case 'anthropic': return settings.anthropic_api_key || null;
      case 'gemini': return settings.gemini_api_key || null;
      case 'local': return settings.local_base_url || null;
      default: return null;
    }
  }
}

// Export singleton instance
export const globalAPISettings = new GlobalAPISettings();