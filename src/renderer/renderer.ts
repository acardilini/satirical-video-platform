// Renderer process script for the Satirical Video Production Platform

// Global variables
let currentUser: any = null;

// DOM ready handler
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  
  // Initialize components after app is ready and electronAPI is available
  initializeComponents();
});

/**
 * Initialize components
 */
async function initializeComponents() {
  try {
    // Ensure electronAPI is available
    if (typeof (window as any).electronAPI === 'undefined') {
      console.error('electronAPI not available, retrying in 100ms...');
      setTimeout(initializeComponents, 100);
      return;
    }
    
    // Import and initialize components
    await import('./components/ProjectCreationModal.js').catch(console.error);
    await import('./components/ProjectsManager.js').catch(console.error);
    await import('./components/NewsArticleUpload.js').catch(console.error);
    await import('./components/ProjectDashboard.js').catch(console.error);
    await import('./components/CreativeStrategy.js').catch(console.error);
    await import('./components/ProjectDirectorDashboard.js').catch(console.error);
    
    // Import settings components
    await import('./components/GlobalAPISettings.js').catch(console.error);
    await import('./components/AgentModelSelector.js').catch(console.error);
    
    // Import and initialize model validation
    await import('./components/ModelValidationNotifications.js').catch(console.error);
    
    // Initialize settings page
    initializeSettingsPage();
    
    console.log('Components initialized successfully');
  } catch (error) {
    console.error('Failed to initialize components:', error);
  }
}

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Load app information
    await loadAppInfo();
    
    // Initialize UI event handlers
    setupEventHandlers();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showError('Failed to initialize application');
  }
}

/**
 * Load application information
 */
async function loadAppInfo() {
  try {
    const version = await window.electronAPI.getAppVersion();
    const platformInfo = await window.electronAPI.getPlatformInfo();
    
    document.getElementById('app-version')!.textContent = version;
    document.getElementById('platform-info')!.textContent = 
      `${platformInfo.platform} (${platformInfo.arch})`;
  } catch (error) {
    console.error('Failed to load app info:', error);
    document.getElementById('app-version')!.textContent = 'Error';
    document.getElementById('platform-info')!.textContent = 'Error';
  }
}

/**
 * Setup event handlers
 */
function setupEventHandlers() {
  // Navigation is handled by onclick attributes in HTML for now
  // Will be refactored in Phase 1 with proper event delegation
}

/**
 * Initialize settings page
 */
async function initializeSettingsPage() {
  try {
    // Setup API settings button
    const openAPISettingsBtn = document.getElementById('open-global-api-settings');
    if (openAPISettingsBtn) {
      console.log('API Settings button found, setting up event listener');
      openAPISettingsBtn.addEventListener('click', async () => {
        console.log('API Settings button clicked, loading GlobalAPISettings component...');
        try {
          const { globalAPISettings } = await import('./components/GlobalAPISettings.js');
          console.log('GlobalAPISettings component loaded, opening modal...');
          globalAPISettings.open();
        } catch (error) {
          console.error('Failed to load or open GlobalAPISettings:', error);
          alert('Error: Failed to open API settings. Please check the console for details.');
        }
      });
    } else {
      console.error('API Settings button not found in DOM');
    }

    // Setup agent configuration buttons
    const configureAgentBtns = document.querySelectorAll('.configure-agent-btn');
    configureAgentBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const persona = (e.target as HTMLElement).dataset.persona;
        if (persona) {
          const { agentModelSelector } = await import('./components/AgentModelSelector.js');
          agentModelSelector.open(persona as any);
        }
      });
    });

    // Update status displays
    updateSettingsStatus();

    // Listen for configuration updates
    window.addEventListener('apiSettingsUpdated', () => {
      updateSettingsStatus();
    });

    window.addEventListener('agentConfigUpdated', () => {
      updateSettingsStatus();
    });

  } catch (error) {
    console.error('Failed to initialize settings page:', error);
  }
}

/**
 * Update settings status displays
 */
async function updateSettingsStatus() {
  try {
    // Update API status
    updateAPIStatus();
    
    // Update agent statuses
    updateAgentStatuses();
    
  } catch (error) {
    console.error('Failed to update settings status:', error);
  }
}

/**
 * Update API status display
 */
async function updateAPIStatus() {
  const apiStatusDiv = document.getElementById('api-status');
  if (!apiStatusDiv) return;

  try {
    const { GlobalAPISettings } = await import('./components/GlobalAPISettings.js');
    const hasProviders = GlobalAPISettings.hasAnyProvider();
    const availableProviders = GlobalAPISettings.getAvailableProviders();

    if (hasProviders) {
      apiStatusDiv.innerHTML = `
        <div style="padding: 12px; background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px;">
          <div style="color: #065f46; font-weight: 600; margin-bottom: 4px;">✅ API Providers Configured</div>
          <div style="color: #047857; font-size: 14px;">Active providers: ${availableProviders.join(', ')}</div>
          <div style="color: #047857; font-size: 12px; margin-top: 4px;">You can now configure individual AI agents and generate content!</div>
        </div>
      `;
    } else {
      apiStatusDiv.innerHTML = `
        <div style="padding: 12px; background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px;">
          <div style="color: #991b1b; font-weight: 600; margin-bottom: 4px;">⚠️ No API Providers Configured</div>
          <div style="color: #b91c1c; font-size: 14px;">Click "Configure API Keys" above to get started</div>
          <div style="color: #b91c1c; font-size: 12px; margin-top: 4px;">You'll need at least one provider (OpenAI, Anthropic, or Gemini) to use AI features</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to update API status:', error);
    apiStatusDiv.innerHTML = `
      <div style="padding: 12px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px;">
        <div style="color: #6b7280; font-weight: 500;">⚠️ Status check failed</div>
        <div style="color: #6b7280; font-size: 14px;">Please refresh the page or check console for errors</div>
      </div>
    `;
  }
}

/**
 * Update agent status displays with enhanced validation
 */
async function updateAgentStatuses() {
  try {
    const { AgentConfigService } = await import('../services/agent-config.js');
    
    const agentItems = document.querySelectorAll('.agent-setting-item');
    
    // Get validation results for all agents
    const validationResults = await window.electronAPI.agents.validateAll();
    
    agentItems.forEach(item => {
      const persona = (item as HTMLElement).dataset.persona;
      const statusSpan = item.querySelector('.agent-status') as HTMLElement;
      
      if (persona && statusSpan) {
        const validation = validationResults.success ? validationResults.data[persona] : null;
        
        if (validation) {
          if (validation.isConfigured && validation.isValid) {
            statusSpan.textContent = 'Ready';
            statusSpan.className = 'agent-status configured';
          } else if (validation.isConfigured && !validation.isValid) {
            statusSpan.textContent = 'Configured (API key needed)';
            statusSpan.className = 'agent-status configured-needs-api';
            statusSpan.title = validation.issues.join(', ');
          } else if (validation.needsAttention) {
            statusSpan.textContent = 'Needs attention';
            statusSpan.className = 'agent-status needs-attention';
            statusSpan.title = validation.issues.join(', ');
          } else {
            statusSpan.textContent = 'Not configured';
            statusSpan.className = 'agent-status not-configured';
          }
        } else {
          // Fallback to old method if validation fails
          const isConfigured = AgentConfigService.isAgentConfigured(persona as any);
          
          if (isConfigured) {
            statusSpan.textContent = 'Configured';
            statusSpan.className = 'agent-status configured';
          } else {
            statusSpan.textContent = 'Not configured';
            statusSpan.className = 'agent-status not-configured';
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to update agent statuses:', error);
  }
}

/**
 * Show a specific section
 */
function showSection(sectionId: string) {
  // Hide all sections
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    (section as HTMLElement).style.display = 'none';
  });
  
  // Show selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = 'block';
  }
}

/**
 * Test database connection
 */
async function testDatabase() {
  const resultDiv = document.getElementById('db-test-result')!;
  resultDiv.innerHTML = '<p>Testing database connection...</p>';
  
  try {
    // Test basic database connectivity
    const testResult = await window.electronAPI.database.testConnection();
    
    if (testResult.success) {
      resultDiv.innerHTML = `
        <div style="color: green;">
          <p>✅ Database connection successful!</p>
          <p>Users in database: ${testResult.data.userCount}</p>
          <p>Test completed at: ${new Date().toLocaleString()}</p>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `<p style="color: red;">❌ Database test failed: ${testResult.error}</p>`;
    }
  } catch (error) {
    console.error('Database test failed:', error);
    resultDiv.innerHTML = '<p style="color: red;">❌ Database test failed with exception</p>';
  }
}

/**
 * Test LLM integration
 */
async function testLLM() {
  const resultDiv = document.getElementById('llm-test-result')!;
  resultDiv.innerHTML = '<p>Testing LLM integration...</p>';
  
  try {
    // This will be implemented when LLM service is ready
    // For now, just show a placeholder
    resultDiv.innerHTML = '<p style="color: orange;">LLM service not yet implemented (Phase 0 in progress)</p>';
  } catch (error) {
    console.error('LLM test failed:', error);
    resultDiv.innerHTML = '<p style="color: red;">LLM test failed</p>';
  }
}

/**
 * Show error message to user
 */
function showError(message: string) {
  // Simple error display for now
  // Will be enhanced with proper toast/modal system in Phase 1
  console.error(message);
  alert(`Error: ${message}`);
}

/**
 * Show success message to user
 */
function showSuccess(message: string) {
  console.log(message);
  // Will be enhanced with proper toast system in Phase 1
}

// Make functions available globally for HTML onclick handlers
(window as any).showSection = showSection;
(window as any).testDatabase = testDatabase;
(window as any).testLLM = testLLM;