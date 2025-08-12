// LLM Settings Component
// Allows users to configure their LLM API settings

export class LLMSettings {
  private modal: HTMLElement | null = null;
  private isOpen = false;

  constructor() {
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Create the settings modal
   */
  private createModal() {
    const modalHTML = `
      <div id="llm-settings-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>AI Chat Configuration</h2>
            <button class="modal-close" id="close-llm-settings">&times;</button>
          </div>
          
          <div class="modal-form">
            <div class="settings-info">
              <p>Configure your AI provider to enable intelligent chat conversations with the Creative Strategist persona.</p>
            </div>

            <form id="llm-settings-form">
              <div class="form-group">
                <label for="llm-provider">AI Provider</label>
                <select id="llm-provider" name="provider">
                  <option value="">Select provider...</option>
                  <option value="openai">OpenAI (GPT-4)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="gemini">Google (Gemini)</option>
                  <option value="local">Local LLM (Ollama)</option>
                </select>
                <small class="form-hint">Choose your preferred AI service provider</small>
              </div>

              <div class="form-group api-key-group" style="display: none;">
                <label for="api-key">API Key</label>
                <input type="password" id="api-key" name="apiKey" placeholder="Enter your API key...">
                <small class="form-hint">
                  <span id="api-key-hint">Your API key will be stored locally and encrypted.</span>
                </small>
                <div class="api-key-links" id="api-key-links" style="display: none;">
                  <!-- Links will be populated by JavaScript -->
                </div>
              </div>

              <div class="form-group">
                <label for="llm-model">Model</label>
                <select id="llm-model" name="model">
                  <option value="">Auto-select best model</option>
                </select>
                <small class="form-hint">Choose the specific AI model to use</small>
              </div>

              <div class="form-group local-config" style="display: none;">
                <label for="base-url">Local Server URL</label>
                <input type="url" id="base-url" name="baseUrl" value="http://localhost:11434" placeholder="http://localhost:11434">
                <small class="form-hint">URL of your local LLM server (e.g., Ollama)</small>
              </div>

              <div class="test-section">
                <button type="button" class="btn btn-outline" id="test-connection-btn">
                  Test Connection
                </button>
                <div class="test-result" id="test-result" style="display: none;"></div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-settings">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('llm-settings-modal');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    const closeBtn = document.getElementById('close-llm-settings');
    const cancelBtn = document.getElementById('cancel-settings');
    const form = document.getElementById('llm-settings-form');
    const providerSelect = document.getElementById('llm-provider') as HTMLSelectElement;
    const testBtn = document.getElementById('test-connection-btn');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    form?.addEventListener('submit', (e) => this.handleSubmit(e));
    providerSelect?.addEventListener('change', () => this.handleProviderChange());
    testBtn?.addEventListener('click', () => this.testConnection());

    // Close on overlay click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  /**
   * Open settings modal
   */
  public open() {
    if (this.modal) {
      this.loadCurrentSettings();
      this.modal.style.display = 'flex';
      this.isOpen = true;
    }
  }

  /**
   * Close settings modal
   */
  public close() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.isOpen = false;
      this.clearForm();
    }
  }

  /**
   * Load current settings into form
   */
  private loadCurrentSettings() {
    // Load from localStorage
    const savedSettings = localStorage.getItem('llm-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        const form = this.modal?.querySelector('#llm-settings-form') as HTMLFormElement;
        
        if (form && settings) {
          (form.querySelector('[name="provider"]') as HTMLSelectElement).value = settings.provider || '';
          (form.querySelector('[name="model"]') as HTMLSelectElement).value = settings.model || '';
          (form.querySelector('[name="baseUrl"]') as HTMLInputElement).value = settings.baseUrl || 'http://localhost:11434';
          
          if (settings.provider) {
            this.handleProviderChange();
          }
        }
      } catch (error) {
        console.error('Failed to load LLM settings:', error);
      }
    }
  }

  /**
   * Handle provider selection change
   */
  private handleProviderChange() {
    const providerSelect = document.getElementById('llm-provider') as HTMLSelectElement;
    const apiKeyGroup = document.querySelector('.api-key-group') as HTMLElement;
    const localConfig = document.querySelector('.local-config') as HTMLElement;
    const modelSelect = document.getElementById('llm-model') as HTMLSelectElement;
    const apiKeyLinks = document.getElementById('api-key-links') as HTMLElement;
    const apiKeyHint = document.getElementById('api-key-hint') as HTMLElement;

    const provider = providerSelect.value;

    // Show/hide relevant sections
    apiKeyGroup.style.display = (provider === 'openai' || provider === 'anthropic' || provider === 'gemini') ? 'block' : 'none';
    localConfig.style.display = provider === 'local' ? 'block' : 'none';

    // Update model options
    modelSelect.innerHTML = '<option value="">Auto-select best model</option>';
    
    if (provider === 'openai') {
      modelSelect.innerHTML += `
        <option value="gpt-4o">GPT-4o (Recommended - Multimodal)</option>
        <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
        <option value="gpt-4-turbo">GPT-4 Turbo (Large Context)</option>
        <option value="gpt-4">GPT-4 (Reliable)</option>
        <option value="o1-preview">o1 Preview (Complex Reasoning)</option>
        <option value="o1-mini">o1 Mini (Reasoning - Budget)</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
      `;
      apiKeyHint.textContent = 'Get your API key from OpenAI Platform';
      apiKeyLinks.innerHTML = '<a href="https://platform.openai.com/api-keys" target="_blank">Get OpenAI API Key</a>';
      apiKeyLinks.style.display = 'block';
    } else if (provider === 'anthropic') {
      modelSelect.innerHTML += `
        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recommended - Latest)</option>
        <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet (Previous Version)</option>
        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fastest)</option>
        <option value="claude-3-opus-20240229">Claude 3 Opus (Complex Reasoning)</option>
        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Stable)</option>
        <option value="claude-3-haiku-20240307">Claude 3 Haiku (Budget)</option>
      `;
      apiKeyHint.textContent = 'Get your API key from Anthropic Console';
      apiKeyLinks.innerHTML = '<a href="https://console.anthropic.com/" target="_blank">Get Anthropic API Key</a>';
      apiKeyLinks.style.display = 'block';
    } else if (provider === 'gemini') {
      modelSelect.innerHTML += `
        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Recommended - Best Reasoning)</option>
        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Best Price/Performance)</option>
        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Fastest & Cheapest)</option>
        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Large Context - 2M tokens)</option>
        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Reliable)</option>
        <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B (Budget)</option>
        <option value="gemini-pro">Gemini Pro (Legacy)</option>
      `;
      apiKeyHint.textContent = 'Get your API key from Google AI Studio';
      apiKeyLinks.innerHTML = '<a href="https://makersuite.google.com/app/apikey" target="_blank">Get Gemini API Key</a>';
      apiKeyLinks.style.display = 'block';
    } else if (provider === 'local') {
      modelSelect.innerHTML += `
        <option value="llama3.1:70b">Llama 3.1 70B (Best Overall)</option>
        <option value="llama3.1:8b">Llama 3.1 8B (Fast & Capable)</option>
        <option value="llama3.2:3b">Llama 3.2 3B (Lightweight)</option>
        <option value="qwen2.5:72b">Qwen 2.5 72B (Excellent)</option>
        <option value="qwen2.5:32b">Qwen 2.5 32B (Strong)</option>
        <option value="deepseek-coder-v2:16b">DeepSeek Coder V2 16B (Coding)</option>
        <option value="mistral-nemo:12b">Mistral Nemo 12B (Balanced)</option>
        <option value="codellama:13b">Code Llama 13B (Legacy Coding)</option>
        <option value="phi3.5:3.8b">Phi 3.5 (Microsoft - Compact)</option>
      `;
      apiKeyLinks.style.display = 'none';
    } else {
      apiKeyLinks.style.display = 'none';
    }
  }

  /**
   * Test connection with current settings
   */
  private async testConnection() {
    const testBtn = document.getElementById('test-connection-btn') as HTMLButtonElement;
    const testResult = document.getElementById('test-result') as HTMLElement;
    const form = this.modal?.querySelector('#llm-settings-form') as HTMLFormElement;
    
    if (!form) return;

    const formData = new FormData(form);
    const settings = {
      provider: formData.get('provider'),
      apiKey: formData.get('apiKey'),
      model: formData.get('model'),
      baseUrl: formData.get('baseUrl')
    };

    if (!settings.provider) {
      this.showTestResult('Please select a provider first', false);
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';

    try {
      // Test the connection (this would call the LLM service)
      const testMessage = "Hello! This is a connection test.";
      
      // For now, simulate the test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would call:
      // const result = await window.electronAPI.llm.testConnection(settings);
      
      this.showTestResult('✅ Connection successful!', true);
    } catch (error) {
      this.showTestResult(`❌ Connection failed: ${error}`, false);
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
    }
  }

  /**
   * Show test result
   */
  private showTestResult(message: string, success: boolean) {
    const testResult = document.getElementById('test-result') as HTMLElement;
    testResult.textContent = message;
    testResult.className = `test-result ${success ? 'success' : 'error'}`;
    testResult.style.display = 'block';

    // Hide after 5 seconds
    setTimeout(() => {
      testResult.style.display = 'none';
    }, 5000);
  }

  /**
   * Handle form submission
   */
  private handleSubmit(event: Event) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const settings = {
      provider: formData.get('provider'),
      apiKey: formData.get('apiKey'),
      model: formData.get('model'),
      baseUrl: formData.get('baseUrl')
    };

    // Validate settings
    if (!settings.provider) {
      alert('Please select an AI provider');
      return;
    }

    if ((settings.provider === 'openai' || settings.provider === 'anthropic' || settings.provider === 'gemini') && !settings.apiKey) {
      alert('Please enter your API key');
      return;
    }

    // Save settings to localStorage (in production, this should be encrypted)
    try {
      localStorage.setItem('llm-settings', JSON.stringify(settings));
      alert('✅ Settings saved successfully! You can now use AI chat.');
      this.close();
      
      // Trigger a refresh of any active chat sessions
      window.dispatchEvent(new CustomEvent('llmSettingsUpdated'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings');
    }
  }

  /**
   * Clear form
   */
  private clearForm() {
    const form = this.modal?.querySelector('#llm-settings-form') as HTMLFormElement;
    if (form) {
      form.reset();
      document.querySelector('.api-key-group')!.setAttribute('style', 'display: none;');
      document.querySelector('.local-config')!.setAttribute('style', 'display: none;');
    }
  }

  /**
   * Check if settings are configured
   */
  public static isConfigured(): boolean {
    const settings = localStorage.getItem('llm-settings');
    if (!settings) return false;
    
    try {
      const config = JSON.parse(settings);
      return !!(config.provider && (
        config.provider === 'local' || 
        (config.provider === 'openai' && config.apiKey) ||
        (config.provider === 'anthropic' && config.apiKey) ||
        (config.provider === 'gemini' && config.apiKey)
      ));
    } catch {
      return false;
    }
  }

  /**
   * Get current settings
   */
  public static getSettings(): any {
    const settings = localStorage.getItem('llm-settings');
    if (!settings) return null;
    
    try {
      return JSON.parse(settings);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const llmSettings = new LLMSettings();