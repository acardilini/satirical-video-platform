// Projects Manager Component
// Handles project listing, creation, and management

import { Project, PersonaType } from '../../shared/types/index.js';
import { projectCreationModal } from './ProjectCreationModal.js';

export class ProjectsManager {
  private currentUser: any = null; // TODO: Get from session
  private projects: Project[] = [];
  private isLoading = false;

  constructor() {
    this.setupEventListeners();
    this.loadProjects();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    // Listen for refresh events
    window.addEventListener('refreshProjects', () => {
      this.loadProjects();
    });

    // Create project button
    const createBtn = document.getElementById('create-project-btn');
    createBtn?.addEventListener('click', () => {
      projectCreationModal.open();
    });
  }

  /**
   * Load projects from database
   */
  async loadProjects() {
    this.setLoading(true);

    try {
      // For Phase 1, use a temporary user ID
      // In Phase 2, this will come from authentication session
      const tempUserId = 'temp-user-id';
      
      const result = await window.electronAPI.database.getProjects(tempUserId);
      
      // @ts-ignore
      if (result && result.success) {
        // @ts-ignore
        this.projects = result.data || [];
        this.renderProjects();
      } else {
        // @ts-ignore
        console.error('Failed to load projects:', result?.error || 'Unknown error');
        this.showError('Failed to load projects');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      this.showError('Error loading projects');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Render projects list
   */
  private renderProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;

    if (this.projects.length === 0) {
      this.renderEmptyState(container);
      return;
    }

    const projectsHTML = this.projects.map(project => this.renderProjectCard(project)).join('');
    
    container.innerHTML = `
      <div class="project-list">
        ${projectsHTML}
      </div>
    `;

    // Setup project card event listeners
    this.setupProjectCardListeners();
  }

  /**
   * Render individual project card
   */
  private renderProjectCard(project: Project): string {
    const statusClass = project.status.toLowerCase();
    const createdDate = new Date(project.created_at).toLocaleDateString();
    const personaCount = project.assigned_personas?.length || 0;

    return `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-card-header">
          <h3 class="project-card-title">${this.escapeHtml(project.name)}</h3>
          <span class="project-status ${statusClass}">${project.status}</span>
        </div>
        
        ${project.description ? `
          <div class="project-card-description">
            ${this.escapeHtml(project.description)}
          </div>
        ` : ''}
        
        <div class="project-personas">
          ${this.renderPersonaTags(project.assigned_personas)}
        </div>
        
        <div class="project-meta">
          <small>Created: ${createdDate} • ${personaCount} personas assigned</small>
        </div>
        
        <div class="project-card-actions">
          <button class="btn btn-outline btn-view-project" data-project-id="${project.id}">
            View Details
          </button>
          <button class="btn btn-primary btn-open-project" data-project-id="${project.id}">
            Open Project
          </button>
          <button class="btn btn-danger btn-delete-project" data-project-id="${project.id}" title="Delete Project">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render persona tags
   */
  private renderPersonaTags(personas: PersonaType[] = []): string {
    const personaLabels: Record<PersonaType, string> = {
      'CREATIVE_STRATEGIST': 'Creative Strategist',
      'BAFFLING_BROADCASTER': 'Baffling Broadcaster',
      'SATIRICAL_SCREENWRITER': 'Satirical Screenwriter',
      'CINEMATIC_STORYBOARDER': 'Cinematic Storyboarder',
      'SOUNDSCAPE_ARCHITECT': 'Soundscape Architect',
      'VIDEO_PROMPT_ENGINEER': 'Video Prompt Engineer',
      'PROJECT_DIRECTOR': 'Project Director'
    };

    return personas.map(persona => 
      `<span class="persona-tag">${personaLabels[persona] || persona}</span>`
    ).join('');
  }

  /**
   * Render empty state when no projects exist
   */
  private renderEmptyState(container: HTMLElement) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <h3>No Projects Yet</h3>
        <p>Create your first satirical video production project to get started.</p>
        <button class="btn btn-primary" onclick="document.getElementById('create-project-btn').click()">
          Create Your First Project
        </button>
      </div>
    `;
  }

  /**
   * Setup event listeners for project cards
   */
  private setupProjectCardListeners() {
    // View project details
    const viewBtns = document.querySelectorAll('.btn-view-project');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = (e.target as HTMLElement).getAttribute('data-project-id');
        if (projectId) this.viewProjectDetails(projectId);
      });
    });

    // Open project for editing
    const openBtns = document.querySelectorAll('.btn-open-project');
    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = (e.target as HTMLElement).getAttribute('data-project-id');
        if (projectId) this.openProject(projectId);
      });
    });

    // Delete project
    const deleteBtns = document.querySelectorAll('.btn-delete-project');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = (e.target as HTMLElement).getAttribute('data-project-id');
        if (projectId) this.deleteProject(projectId);
      });
    });
  }

  /**
   * View project details
   */
  private async viewProjectDetails(projectId: string) {
    try {
      const result = await window.electronAPI.database.getProjectById(projectId);
      
      if (result.success) {
        this.showProjectDetails(result.data);
      } else {
        this.showError('Failed to load project details');
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      this.showError('Error loading project details');
    }
  }

  /**
   * Show project details modal
   */
  private showProjectDetails(project: Project) {
    const createdDate = new Date(project.created_at).toLocaleDateString();
    const personaList = project.assigned_personas.map(p => 
      p.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    ).join(', ');

    // Simple alert for now - will be enhanced with proper modal in later modules
    alert(`
Project Details:

Name: ${project.name}
Status: ${project.status}
Description: ${project.description || 'No description'}
Created: ${createdDate}
Assigned Personas: ${personaList}

This will be replaced with a proper details modal in Phase 1.2
    `.trim());
  }

  /**
   * Open project for editing (navigate to project workspace)
   */
  private openProject(projectId: string) {
    // Show project workspace
    this.showProjectWorkspace(projectId);
  }

  /**
   * Show project workspace
   */
  private async showProjectWorkspace(projectId: string) {
    try {
      const result = await window.electronAPI.database.getProjectById(projectId);
      
      if (!result.success) {
        this.showError('Failed to load project details');
        return;
      }

      const project = result.data;
      
      // Create project workspace HTML
      const workspaceHTML = `
        <div class="project-workspace" data-project-id="${project.id}">
          <div class="project-header">
            <div>
              <h1 class="project-title">${this.escapeHtml(project.name)}</h1>
              <div class="project-meta">
                Created: ${new Date(project.created_at).toLocaleDateString()} • 
                Status: ${project.status} • 
                ${project.assigned_personas.length} personas assigned
              </div>
            </div>
            <div class="project-actions">
              <button class="btn btn-secondary" id="back-to-projects-btn">
                ← Back to Projects
              </button>
              <button class="btn btn-primary" id="upload-article-btn">
                Upload News Article
              </button>
            </div>
          </div>

          <div class="project-tabs">
            <button class="project-tab active" data-tab="overview">Overview</button>
            <button class="project-tab" data-tab="articles">Articles</button>
            <button class="project-tab" data-tab="strategy">Creative Strategy</button>
            <button class="project-tab" data-tab="script">Script</button>
            <button class="project-tab" data-tab="storyboard">Storyboard</button>
          </div>

          <div class="tab-content active" id="overview-tab">
            <!-- Dashboard will be loaded here -->
          </div>

          <div class="tab-content" id="articles-tab">
            <div id="articles-list" class="articles-list">
              <div class="loading-text">
                <span class="loading-spinner"></span>
                Loading articles...
              </div>
            </div>
          </div>

          <div class="tab-content" id="strategy-tab">
            <div class="loading-text">
              <span class="loading-spinner"></span>
              Loading creative strategy...
            </div>
          </div>

          <div class="tab-content" id="script-tab">
            <div class="empty-state">
              <div class="empty-state-icon">📝</div>
              <h3>Script Development</h3>
              <p>Script development will be implemented in Module 3.</p>
            </div>
          </div>

          <div class="tab-content" id="storyboard-tab">
            <div class="empty-state">
              <div class="empty-state-icon">🎬</div>
              <h3>Visual Storyboard</h3>
              <p>Visual design and storyboarding will be implemented in Module 4.</p>
            </div>
          </div>
        </div>
      `;

      // Replace the projects section content with workspace
      const projectsSection = document.getElementById('projects');
      if (projectsSection) {
        projectsSection.innerHTML = `<div class="card">${workspaceHTML}</div>`;
        
        // Setup workspace event listeners
        this.setupWorkspaceEventListeners(project);
        
        // Initialize dashboard
        this.initializeDashboard(projectId);
        
        // Load articles for this project (but don't show them initially)
        this.loadProjectArticles(projectId);
      }
    } catch (error) {
      console.error('Error opening project workspace:', error);
      this.showError('Error opening project workspace');
    }
  }

  /**
   * Initialize dashboard for project
   */
  private async initializeDashboard(projectId: string): Promise<void> {
    try {
      const { projectDashboard } = await import('./ProjectDashboard.js');
      await projectDashboard.initialize(projectId);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      const overviewTab = document.getElementById('overview-tab');
      if (overviewTab) {
        overviewTab.innerHTML = `
          <div class="dashboard-error">
            <div class="error-icon">❌</div>
            <h3>Dashboard Error</h3>
            <p>Failed to load project dashboard</p>
            <button class="btn btn-primary" onclick="location.reload()">
              Retry
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * Setup workspace event listeners
   */
  private setupWorkspaceEventListeners(project: any) {
    // Back to projects button
    const backBtn = document.getElementById('back-to-projects-btn');
    backBtn?.addEventListener('click', () => {
      this.showProjectsList();
    });

    // Upload article button
    const uploadBtn = document.getElementById('upload-article-btn');
    uploadBtn?.addEventListener('click', () => {
      // Import and use the news article upload component
      import('./NewsArticleUpload.js').then(module => {
        module.newsArticleUpload.open(project.id);
      });
    });

    // Tab switching
    const tabs = document.querySelectorAll('.project-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = (e.target as HTMLElement).getAttribute('data-tab');
        if (tabId) this.switchTab(tabId);
      });
    });

    // Listen for article upload events
    window.addEventListener('refreshProjectView', () => {
      this.loadProjectArticles(project.id);
    });
  }

  /**
   * Switch tabs in project workspace
   */
  private switchTab(tabId: string) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.project-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-tab`);
    
    selectedTab?.classList.add('active');
    selectedContent?.classList.add('active');

    // Get current project ID from the workspace context
    const currentProjectId = this.getCurrentProjectId();
    
    // Handle tab-specific initialization
    if (tabId === 'overview' && currentProjectId) {
      // Refresh dashboard data
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } else if (tabId === 'strategy' && currentProjectId) {
      // Initialize Creative Strategy component
      this.initializeCreativeStrategy(currentProjectId);
    }
  }

  /**
   * Get current project ID from workspace context
   */
  private getCurrentProjectId(): string | null {
    const projectWorkspace = document.querySelector('.project-workspace');
    if (!projectWorkspace) return null;
    
    // We can get the project ID from the data attribute we'll add
    return projectWorkspace.getAttribute('data-project-id');
  }

  /**
   * Initialize Creative Strategy component
   */
  private async initializeCreativeStrategy(projectId: string): Promise<void> {
    try {
      const { creativeStrategyManager } = await import('./CreativeStrategy.js');
      await creativeStrategyManager.initialize(projectId);
    } catch (error) {
      console.error('Failed to initialize Creative Strategy:', error);
      const strategyTab = document.getElementById('strategy-tab');
      if (strategyTab) {
        strategyTab.innerHTML = `
          <div class="strategy-error">
            <div class="error-icon">❌</div>
            <h3>Creative Strategy Error</h3>
            <p>Failed to load Creative Strategy component</p>
            <button class="btn btn-primary" onclick="location.reload()">
              Retry
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * Load articles for project
   */
  private async loadProjectArticles(projectId: string) {
    const container = document.getElementById('articles-list');
    if (!container) return;

    try {
      // @ts-ignore
      const result = await window.electronAPI.database.getNewsArticlesByProject(projectId);
      
      if (result.success) {
        this.renderArticlesList(result.data, container);
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">❌</div>
            <h3>Error Loading Articles</h3>
            <p>Failed to load articles for this project</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading project articles:', error);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h3>Error Loading Articles</h3>
          <p>An error occurred while loading articles</p>
        </div>
      `;
    }
  }

  /**
   * Render articles list
   */
  private renderArticlesList(articles: any[], container: HTMLElement) {
    if (articles.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📰</div>
          <h3>No Articles Yet</h3>
          <p>Upload your first news article to begin creating satirical content.</p>
          <button class="btn btn-primary" onclick="document.getElementById('upload-article-btn').click()">
            Upload First Article
          </button>
        </div>
      `;
      return;
    }

    const articlesHTML = articles.map(article => this.renderArticleItem(article)).join('');
    container.innerHTML = `
      <div class="articles-list">
        ${articlesHTML}
      </div>
    `;

    // Setup article event listeners
    this.setupArticleEventListeners();
  }

  /**
   * Render individual article item
   */
  private renderArticleItem(article: any): string {
    const createdDate = new Date(article.created_at).toLocaleDateString();
    const preview = article.content.substring(0, 200) + (article.content.length > 200 ? '...' : '');

    return `
      <div class="article-item" data-article-id="${article.id}">
        <div class="article-header">
          <h3 class="article-title">${this.escapeHtml(article.title)}</h3>
          ${article.source ? `<span class="article-source">${this.escapeHtml(article.source)}</span>` : ''}
        </div>
        
        <div class="article-preview">
          ${this.escapeHtml(preview)}
        </div>
        
        <div class="article-meta">
          <small>
            ${article.file_name ? `File: ${article.file_name} • ` : ''}
            Uploaded: ${createdDate}
            ${article.processing_notes ? ' • Has processing notes' : ''}
          </small>
        </div>
        
        <div class="article-actions">
          <button class="btn btn-outline btn-view-article" data-article-id="${article.id}">
            View Full Article
          </button>
          <button class="btn btn-secondary btn-edit-article" data-article-id="${article.id}">
            Edit
          </button>
          <button class="btn btn-danger btn-delete-article" data-article-id="${article.id}">
            Delete
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup article event listeners
   */
  private setupArticleEventListeners() {
    // View article
    const viewBtns = document.querySelectorAll('.btn-view-article');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const articleId = (e.target as HTMLElement).getAttribute('data-article-id');
        if (articleId) this.viewArticle(articleId);
      });
    });

    // Edit article
    const editBtns = document.querySelectorAll('.btn-edit-article');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const articleId = (e.target as HTMLElement).getAttribute('data-article-id');
        if (articleId) this.editArticle(articleId);
      });
    });

    // Delete article
    const deleteBtns = document.querySelectorAll('.btn-delete-article');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const articleId = (e.target as HTMLElement).getAttribute('data-article-id');
        if (articleId) this.deleteArticle(articleId);
      });
    });
  }

  /**
   * View full article
   */
  private async viewArticle(articleId: string) {
    try {
      const result = await window.electronAPI.database.getNewsArticle(articleId);
      
      if (result.success) {
        const article = result.data;
        const content = `
Article: ${article.title}
${article.source ? `Source: ${article.source}` : ''}
${article.url ? `URL: ${article.url}` : ''}

Content:
${article.content}

${article.processing_notes ? `Processing Notes: ${article.processing_notes}` : ''}
        `.trim();
        
        // Simple alert for now - will be enhanced with proper modal later
        alert(content);
      } else {
        this.showError('Failed to load article details');
      }
    } catch (error) {
      console.error('Error viewing article:', error);
      this.showError('Error loading article');
    }
  }

  /**
   * Edit article
   */
  private async editArticle(articleId: string): Promise<void> {
    try {
      const result = await window.electronAPI.database.getNewsArticle(articleId);
      
      if (result.success) {
        const article = result.data;
        
        // Import and open the news article upload component in edit mode
        const { newsArticleUpload } = await import('./NewsArticleUpload.js');
        newsArticleUpload.openForEdit(article);
      } else {
        this.showError('Failed to load article for editing');
      }
    } catch (error) {
      console.error('Error loading article for edit:', error);
      this.showError('Error loading article for edit');
    }
  }

  /**
   * Delete article
   */
  private async deleteArticle(articleId: string) {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      // @ts-ignore
      const result = await window.electronAPI.database.deleteNewsArticle(articleId);
      
      if (result.success) {
        // Refresh articles list
        const currentProject = document.querySelector('.project-workspace');
        if (currentProject) {
          // Get project ID from the current workspace (we'll need to store this)
          window.dispatchEvent(new CustomEvent('refreshProjectView'));
        }
      } else {
        this.showError('Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      this.showError('Error deleting article');
    }
  }

  /**
   * Delete project with confirmation
   */
  private async deleteProject(projectId: string): Promise<void> {
    try {
      // Find the project to get its name for confirmation
      const project = this.projects.find(p => p.id === projectId);
      if (!project) {
        this.showError('Project not found');
        return;
      }

      // Show confirmation dialog
      const confirmed = confirm(
        `Are you sure you want to delete the project "${project.name}"?\n\n` +
        `This will permanently delete:\n` +
        `• The project and all its settings\n` +
        `• All uploaded news articles\n` +
        `• Any generated creative strategies\n` +
        `• All associated data\n\n` +
        `This action cannot be undone!`
      );

      if (!confirmed) {
        return;
      }

      // Show loading state
      const deleteBtn = document.querySelector(`[data-project-id="${projectId}"].btn-delete-project`) as HTMLButtonElement;
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting...';
      }

      // Call database to delete project
      // @ts-ignore
      const result = await window.electronAPI.database.deleteProject(projectId);

      if (result.success) {
        // Remove from local projects array
        this.projects = this.projects.filter(p => p.id !== projectId);
        
        // Re-render the projects list
        this.renderProjects();
        
        // Show success message
        this.showSuccess(`Project "${project.name}" has been deleted successfully`);
      } else {
        this.showError(result.error || 'Failed to delete project');
        
        // Re-enable button on failure
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '🗑️ Delete';
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      this.showError('An error occurred while deleting the project');
      
      // Re-enable button on error
      const deleteBtn = document.querySelector(`[data-project-id="${projectId}"].btn-delete-project`) as HTMLButtonElement;
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '🗑️ Delete';
      }
    }
  }

  /**
   * Show projects list (go back from workspace)
   */
  public showProjectsList() {
    const projectsSection = document.getElementById('projects');
    if (!projectsSection) return;

    // Restore the original projects section HTML
    projectsSection.innerHTML = `
      <div class="card">
        <div class="projects-header">
          <h2>Projects</h2>
          <button id="create-project-btn" class="btn btn-primary">
            Create New Project
          </button>
        </div>
        <p>Manage your satirical video production projects</p>
        
        <div id="projects-list">
          <!-- Projects will be loaded here -->
        </div>

        <div class="debug-section" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
          <h4>Database Test</h4>
          <button onclick="testDatabase()">Test Database Connection</button>
          <div id="db-test-result"></div>
        </div>
      </div>
    `;

    // Reload projects
    this.loadProjects();
    
    // Re-setup event listeners
    const createBtn = document.getElementById('create-project-btn');
    createBtn?.addEventListener('click', () => {
      import('./ProjectCreationModal.js').then(module => {
        module.projectCreationModal.open();
      });
    });
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean) {
    this.isLoading = loading;
    const container = document.getElementById('projects-list');
    
    if (!container) return;

    if (loading) {
      container.innerHTML = `
        <div class="loading-text">
          <span class="loading-spinner"></span>
          Loading projects...
        </div>
      `;
    }
  }

  /**
   * Show error message
   */
  private showError(message: string) {
    console.error(message);
    const container = document.getElementById('projects-list');
    
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h3>Error Loading Projects</h3>
          <p>${this.escapeHtml(message)}</p>
          <button class="btn btn-primary" onclick="location.reload()">
            Retry
          </button>
        </div>
      `;
    }
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    console.log(`✅ ${message}`);
    // Simple alert for now - will be enhanced with proper toast system later
    alert(`✅ ${message}`);
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
   * Refresh projects list
   */
  public refresh() {
    this.loadProjects();
  }

  /**
   * Get current projects
   */
  public getProjects(): Project[] {
    return [...this.projects];
  }

  /**
   * Get project count
   */
  public getProjectCount(): number {
    return this.projects.length;
  }
}

// Export singleton instance
export const projectsManager = new ProjectsManager();