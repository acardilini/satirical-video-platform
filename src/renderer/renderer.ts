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