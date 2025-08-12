// Project Overview Dashboard Component
// Provides analytics, progress tracking, and project insights

import { Project, NewsArticle, PersonaType, SatiricalContextType, SatiricalFormat } from '../../shared/types/index.js';

interface ProjectStats {
  totalArticles: number;
  completedPhases: number;
  totalPhases: number;
  lastActivity: Date;
  assignedPersonas: PersonaType[];
}

export class ProjectDashboard {
  private currentProject: Project | null = null;
  private projectStats: ProjectStats | null = null;

  /**
   * Initialize dashboard for a project
   */
  public async initialize(projectId: string): Promise<void> {
    try {
      // Load project data
      const projectResult = await window.electronAPI.database.getProjectById(projectId);
      if (!projectResult.success) {
        throw new Error('Failed to load project');
      }
      
      this.currentProject = projectResult.data;
      
      // Calculate project statistics
      await this.calculateProjectStats(projectId);
      
      // Render the dashboard
      this.renderDashboard();
    } catch (error) {
      console.error('Failed to initialize project dashboard:', error);
      this.renderError('Failed to load project dashboard');
    }
  }

  /**
   * Calculate project statistics
   */
  private async calculateProjectStats(projectId: string): Promise<void> {
    try {
      // @ts-ignore
      const articlesResult = await window.electronAPI.database.getNewsArticlesByProject(projectId);
      const articles: NewsArticle[] = articlesResult.success ? articlesResult.data : [];
      
      // Calculate stats
      const stats: ProjectStats = {
        totalArticles: articles.length,
        completedPhases: this.calculateCompletedPhases(),
        totalPhases: 7, // Total modules in the pipeline
        lastActivity: this.getLastActivity(articles),
        assignedPersonas: this.currentProject?.assigned_personas || []
      };
      
      this.projectStats = stats;
    } catch (error) {
      console.error('Failed to calculate project stats:', error);
      this.projectStats = {
        totalArticles: 0,
        completedPhases: 0,
        totalPhases: 7,
        lastActivity: new Date(),
        assignedPersonas: []
      };
    }
  }

  /**
   * Calculate completed phases based on project content
   */
  private calculateCompletedPhases(): number {
    // For Phase 1, we only have Module 1 completed
    // In future phases, this will check for actual completion status
    let completed = 0;
    
    // Phase 1: Project Management & News Article Ingestion
    if (this.projectStats && this.projectStats.totalArticles > 0) {
      completed = 1;
    }
    
    // Future phases would check for:
    // - Creative Strategy completion
    // - Script development completion
    // - Storyboard completion
    // - Sound design completion
    // - Shot brief completion
    // - Prompt generation completion
    
    return completed;
  }

  /**
   * Get last activity date from articles
   */
  private getLastActivity(articles: NewsArticle[]): Date {
    if (articles.length === 0) {
      return this.currentProject?.created_at || new Date();
    }
    
    const latestArticle = articles.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    });
    
    return new Date(latestArticle.created_at);
  }

  /**
   * Render the dashboard
   */
  private renderDashboard(): void {
    const container = this.getDashboardContainer();
    if (!container || !this.currentProject || !this.projectStats) return;

    const progressPercentage = (this.projectStats.completedPhases / this.projectStats.totalPhases) * 100;
    
    container.innerHTML = `
      <div class="project-dashboard">
        <!-- Project Header -->
        <div class="dashboard-header">
          <div class="project-info">
            <h2>${this.escapeHtml(this.currentProject.name)}</h2>
            <p class="project-description">${this.escapeHtml(this.currentProject.description || 'No description provided')}</p>
            <div class="project-metadata">
              <span class="metadata-item">
                <strong>Status:</strong> ${this.currentProject.status}
              </span>
              <span class="metadata-item">
                <strong>Created:</strong> ${new Date(this.currentProject.created_at).toLocaleDateString()}
              </span>
              <span class="metadata-item">
                <strong>Last Activity:</strong> ${this.projectStats.lastActivity.toLocaleDateString()}
              </span>
            </div>
          </div>
          <div class="project-actions">
            <button class="btn btn-primary dashboard-action" data-action="upload-article">
              📰 Upload Article
            </button>
            <button class="btn btn-secondary dashboard-action" data-action="view-articles">
              📋 View All Articles
            </button>
          </div>
        </div>

        <!-- Satirical Lens Configuration -->
        <div class="satirical-lens-section">
          <h3>🎯 Satirical Lens</h3>
          <p>This perspective guides all AI agents working on your project</p>
          <div id="current-lens-display">
            <!-- Current lens will be displayed here -->
          </div>
          <div class="lens-selector">
            <select id="project-satirical-lens-select" class="form-control">
              <option value="">Choose satirical perspective...</option>
              <option value="ANIMAL_LIBERATION">🐾 Animal Liberation & Vegan Ethics</option>
              <option value="ENVIRONMENTAL">🌍 Environmental Justice & Climate Action</option>
              <option value="GENERAL">💭 General Satirical Perspective</option>
            </select>
            <button type="button" id="apply-lens-btn" class="btn btn-primary">Apply Lens</button>
          </div>
          <div id="lens-description" class="lens-description" style="display: none;">
            <!-- Lens description will be populated here -->
          </div>
        </div>

        <!-- Satirical Format Configuration -->
        <div class="satirical-format-section">
          <h3>🎬 Satirical Format</h3>
          <p>Video format that shapes how your satirical content will be created</p>
          <div id="current-format-display">
            <!-- Current format will be displayed here -->
          </div>
          <div class="format-selector">
            <select id="project-satirical-format-select" class="form-control">
              <option value="">Choose video format...</option>
              <option value="NEWS_PARODY">📺 News Parody (BBC/ABC serious news style)</option>
              <option value="VOX_POP">🎤 Vox Pop (street interviews/public opinion)</option>
              <option value="MORNING_TV_INTERVIEW">☀️ Morning TV Interview (breakfast TV guest segment)</option>
              <option value="MOCKUMENTARY">🎬 Documentary Style (BBC/ABC mockumentary)</option>
              <option value="SOCIAL_MEDIA">📱 Social Media (TikTok/Instagram viral format)</option>
              <option value="SKETCH_COMEDY">🎭 Sketch Comedy (Monty Python/DAAS style)</option>
              <option value="SATIRICAL_ARTICLE">📰 Satirical Article (Private Eye/Chaser style)</option>
              <option value="PANEL_SHOW">🎪 Panel Show (Have I Got News/Good News Week)</option>
              <option value="COMMERCIAL_PARODY">📢 Commercial Parody (fake advertisements)</option>
              <option value="REALITY_TV_PARODY">📹 Reality TV Parody (competition show mockery)</option>
            </select>
            <button type="button" id="apply-format-btn" class="btn btn-primary">Apply Format</button>
          </div>
          <div id="format-description" class="format-description" style="display: none;">
            <!-- Format description will be populated here -->
          </div>
        </div>

        <!-- Progress Overview -->
        <div class="progress-section">
          <h3>Production Pipeline Progress</h3>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <span class="progress-text">${this.projectStats.completedPhases}/${this.projectStats.totalPhases} phases completed (${Math.round(progressPercentage)}%)</span>
          </div>
          
          <div class="phase-checklist" id="phase-checklist-container">
            <!-- Phase checklist will be loaded here -->
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="metrics-section">
          <h3>Project Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${this.projectStats.totalArticles}</div>
              <div class="metric-label">News Articles</div>
              <div class="metric-description">Source material uploaded</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">${this.projectStats.assignedPersonas.length}</div>
              <div class="metric-label">AI Personas</div>
              <div class="metric-description">Creative team members</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">0</div>
              <div class="metric-label">Scripts</div>
              <div class="metric-description">Generated storylines</div>
              <div class="metric-note">Available in Module 3</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-value">0</div>
              <div class="metric-label">Video Shots</div>
              <div class="metric-description">8-second segments</div>
              <div class="metric-note">Available in Module 4</div>
            </div>
          </div>
        </div>

        <!-- Assigned Personas -->
        <div class="personas-section">
          <h3>Creative Team (AI Personas)</h3>
          <div class="personas-grid">
            ${this.renderAssignedPersonas()}
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section">
          <h3>Recent Activity</h3>
          <div class="activity-feed" id="activity-feed-container">
            <!-- Activity will be loaded here -->
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <h3>Quick Actions</h3>
          <div class="quick-actions-grid">
            <button class="quick-action-btn" data-action="upload-article">
              <div class="action-icon">📰</div>
              <div class="action-title">Upload News Article</div>
              <div class="action-description">Add source material for satirical content</div>
            </button>
            
            <button class="quick-action-btn" data-action="create-strategy">
              <div class="action-icon">🎯</div>
              <div class="action-title">Create Strategy</div>
              <div class="action-description">Develop creative direction</div>
            </button>
            
            <button class="quick-action-btn disabled" data-action="develop-script">
              <div class="action-icon">📝</div>
              <div class="action-title">Develop Script</div>
              <div class="action-description">Generate satirical content (Module 3)</div>
            </button>
            
            <button class="quick-action-btn disabled" data-action="create-storyboard">
              <div class="action-icon">🎬</div>
              <div class="action-title">Create Storyboard</div>
              <div class="action-description">Design visual sequences (Module 4)</div>
            </button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    
    // Load activity feed and phase checklist asynchronously
    this.loadActivityFeed();
    this.loadPhaseChecklist();
  }

  /**
   * Load activity feed asynchronously
   */
  private async loadActivityFeed(): Promise<void> {
    const container = document.getElementById('activity-feed-container');
    if (!container || !this.currentProject) return;

    try {
      const activityHTML = await this.renderRecentActivity();
      container.innerHTML = activityHTML;
    } catch (error) {
      console.error('Failed to load activity feed:', error);
      container.innerHTML = `
        <div class="activity-error">
          <p>Failed to load recent activity</p>
        </div>
      `;
    }
  }

  /**
   * Load phase checklist asynchronously
   */
  private async loadPhaseChecklist(): Promise<void> {
    const container = document.getElementById('phase-checklist-container');
    if (!container || !this.currentProject) return;

    try {
      const checklistHTML = await this.renderPhaseChecklist();
      container.innerHTML = checklistHTML;
    } catch (error) {
      console.error('Failed to load phase checklist:', error);
      container.innerHTML = `
        <div class="phase-error">
          <p>Failed to load phase checklist</p>
        </div>
      `;
    }
  }

  /**
   * Render phase checklist
   */
  private async renderPhaseChecklist(): Promise<string> {
    // Check if creative strategy exists
    let hasCreativeStrategy = false;
    try {
      // @ts-ignore
      const strategyResult = await window.electronAPI.database.getCreativeStrategy(this.currentProject!.id);
      hasCreativeStrategy = strategyResult.success;
    } catch (error) {
      console.error('Failed to check creative strategy:', error);
    }

    const phases = [
      { id: 'articles', name: 'News Article Ingestion', completed: this.projectStats!.totalArticles > 0 },
      { id: 'strategy', name: 'Creative Strategy', completed: hasCreativeStrategy },
      { id: 'script', name: 'Script Development', completed: false },
      { id: 'storyboard', name: 'Visual Storyboard', completed: false },
      { id: 'sound', name: 'Sound Design', completed: false },
      { id: 'shots', name: 'Shot Brief Generation', completed: false },
      { id: 'prompts', name: 'AI Prompt Engineering', completed: false }
    ];

    return phases.map(phase => `
      <div class="phase-item ${phase.completed ? 'completed' : 'pending'}">
        <div class="phase-status">
          ${phase.completed ? '✅' : '⏳'}
        </div>
        <div class="phase-name">${phase.name}</div>
      </div>
    `).join('');
  }

  /**
   * Render assigned personas
   */
  private renderAssignedPersonas(): string {
    const personaLabels: Record<PersonaType, { name: string; description: string; icon: string }> = {
      'CREATIVE_STRATEGIST': {
        name: 'Creative Strategist',
        description: 'Develops satirical angles and creative direction',
        icon: '🎯'
      },
      'BAFFLING_BROADCASTER': {
        name: 'Baffling Broadcaster',
        description: 'Creates out-of-touch presenter commentary',
        icon: '📺'
      },
      'SATIRICAL_SCREENWRITER': {
        name: 'Satirical Screenwriter',
        description: 'Writes cynical dialogue and scene scripts',
        icon: '✍️'
      },
      'CINEMATIC_STORYBOARDER': {
        name: 'Cinematic Storyboarder',
        description: 'Designs detailed visual storyboards',
        icon: '🎬'
      },
      'SOUNDSCAPE_ARCHITECT': {
        name: 'Soundscape Architect',
        description: 'Creates audio design and sound effects',
        icon: '🎵'
      },
      'VIDEO_PROMPT_ENGINEER': {
        name: 'Video Prompt Engineer',
        description: 'Generates AI-optimized video prompts',
        icon: '🤖'
      },
      'PROJECT_DIRECTOR': {
        name: 'Project Director',
        description: 'Oversees overall project coordination',
        icon: '🎭'
      }
    };

    return this.projectStats!.assignedPersonas.map(persona => {
      const info = personaLabels[persona];
      return `
        <div class="persona-card">
          <div class="persona-icon">${info.icon}</div>
          <div class="persona-info">
            <div class="persona-name">${info.name}</div>
            <div class="persona-description">${info.description}</div>
          </div>
          <div class="persona-status">
            <span class="status-indicator active">Ready</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render recent activity feed
   */
  private async renderRecentActivity(): Promise<string> {
    try {
      // @ts-ignore
      const articlesResult = await window.electronAPI.database.getNewsArticlesByProject(this.currentProject!.id);
      const articles: NewsArticle[] = articlesResult.success ? articlesResult.data : [];
      
      if (articles.length === 0) {
        return `
          <div class="activity-empty">
            <div class="empty-icon">📭</div>
            <p>No recent activity. Upload your first news article to get started!</p>
          </div>
        `;
      }

      // Sort articles by creation date (newest first) and take the last 5
      const recentArticles = articles
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return recentArticles.map(article => `
        <div class="activity-item">
          <div class="activity-icon">📰</div>
          <div class="activity-content">
            <div class="activity-title">News article uploaded: "${this.escapeHtml(article.title)}"</div>
            <div class="activity-time">${this.getRelativeTime(new Date(article.created_at))}</div>
            ${article.source ? `<div class="activity-meta">Source: ${this.escapeHtml(article.source)}</div>` : ''}
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      return `
        <div class="activity-error">
          <p>Failed to load recent activity</p>
        </div>
      `;
    }
  }

  /**
   * Setup event listeners for dashboard interactions
   */
  private setupEventListeners(): void {
    // Dashboard actions
    const actionButtons = document.querySelectorAll('.dashboard-action');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).getAttribute('data-action');
        if (action) {
          this.handleDashboardAction(action);
        }
      });
    });

    // Quick actions
    const quickActionButtons = document.querySelectorAll('.quick-action-btn:not(.disabled)');
    quickActionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).closest('.quick-action-btn')?.getAttribute('data-action');
        if (action) {
          this.handleQuickAction(action);
        }
      });
    });
    
    // Satirical lens selector
    this.setupLensSelector();
    
    // Satirical format selector
    this.setupFormatSelector();
  }

  /**
   * Setup satirical lens selector
   */
  private setupLensSelector(): void {
    const lensSelect = document.getElementById('project-satirical-lens-select') as HTMLSelectElement;
    const applyLensBtn = document.getElementById('apply-lens-btn');
    const lensDescription = document.getElementById('lens-description');
    
    // Show lens description when selection changes
    lensSelect?.addEventListener('change', () => {
      const selectedValue = lensSelect.value as SatiricalContextType;
      this.showLensDescription(selectedValue);
    });
    
    // Apply lens to project
    applyLensBtn?.addEventListener('click', () => {
      const selectedValue = lensSelect.value as SatiricalContextType;
      if (selectedValue) {
        this.applyLensToProject(selectedValue);
      } else {
        alert('Please select a satirical lens first.');
      }
    });
    
    // Load and display current lens
    this.loadCurrentLens();
  }

  /**
   * Show lens description
   */
  private showLensDescription(lensType: SatiricalContextType): void {
    const lensDescription = document.getElementById('lens-description');
    if (!lensDescription || !lensType) {
      if (lensDescription) lensDescription.style.display = 'none';
      return;
    }
    
    const lensData = this.getLensDescription(lensType);
    
    if (lensData) {
      lensDescription.innerHTML = `
        <div class="lens-preview">
          <h4>${lensData.name}</h4>
          <p><strong>Focus:</strong> ${lensData.description}</p>
          <p><strong>Approach:</strong> ${lensData.ethicalFramework}</p>
          <div class="lens-principles">
            <strong>Key Principles:</strong>
            <ul>
              ${lensData.keyPrinciples.slice(0, 3).map((principle: string) => `<li>${principle}</li>`).join('')}
              ${lensData.keyPrinciples.length > 3 ? `<li><em>...and ${lensData.keyPrinciples.length - 3} more</em></li>` : ''}
            </ul>
          </div>
        </div>
      `;
      lensDescription.style.display = 'block';
    }
  }

  /**
   * Get lens description data
   */
  private getLensDescription(lensType: SatiricalContextType): any {
    const lenses = {
      'ANIMAL_LIBERATION': {
        name: 'Animal Liberation & Vegan Ethics',
        description: 'Strong anti-anthropocentric perspective focused on animal liberation, rights, and vegan ethics',
        ethicalFramework: 'Animal liberation philosophy with strong vegan ethics, rejecting speciesism and anthropocentrism',
        keyPrinciples: [
          'Animals are sentient beings with inherent worth, not property or resources',
          'All animal use is exploitation - reject "humane" or "welfare" approaches as inadequate',
          'Veganism is the baseline ethical position, not an extreme view',
          'Speciesism is a form of discrimination as serious as racism or sexism',
          'The animal perspective must be centered, not human convenience'
        ]
      },
      'ENVIRONMENTAL': {
        name: 'Environmental Justice & Climate Action',
        description: 'Focus on environmental destruction, climate change, and corporate greenwashing',
        ethicalFramework: 'Environmental justice perspective emphasizing systemic change over individual action',
        keyPrinciples: [
          'Climate change is primarily caused by corporate interests, not individual choices',
          'Environmental destruction disproportionately affects marginalized communities',
          'Greenwashing is a deliberate strategy to avoid systemic change',
          'Capitalism and endless growth are incompatible with environmental sustainability'
        ]
      },
      'GENERAL': {
        name: 'General Satirical Perspective',
        description: 'Broad satirical approach without specific ethical framework',
        ethicalFramework: 'General satirical perspective focused on exposing hypocrisy and absurdity',
        keyPrinciples: [
          'Question authority and conventional wisdom',
          'Expose hypocrisy and contradiction',
          'Challenge power structures',
          'Use humor to make serious points accessible'
        ]
      }
    };
    
    return lenses[lensType as keyof typeof lenses] || null;
  }

  /**
   * Apply lens to project
   */
  private async applyLensToProject(lensType: SatiricalContextType): Promise<void> {
    try {
      if (!this.currentProject) return;
      
      // @ts-ignore - Call backend to update project with satirical context
      const result = await window.electronAPI.database.updateProjectContext(this.currentProject.id, lensType);
      
      if (result.success) {
        alert(`✅ ${this.getLensDescription(lensType)?.name} lens applied to project!\n\nAll AI agents will now use this perspective when helping with your satirical content.`);
        
        // Update the current lens display
        this.updateCurrentLensDisplay(lensType);
        
        // Refresh project data
        await this.refreshProjectData();
      } else {
        throw new Error(result.error || 'Failed to apply lens');
      }
    } catch (error) {
      console.error('Failed to apply lens:', error);
      alert('Failed to apply satirical lens. Please try again.');
    }
  }

  /**
   * Load and display current lens
   */
  private async loadCurrentLens(): Promise<void> {
    try {
      if (!this.currentProject) return;
      
      if (this.currentProject.satirical_context) {
        const lensType = this.currentProject.satirical_context.type;
        
        // Set the selector to current lens
        const lensSelect = document.getElementById('project-satirical-lens-select') as HTMLSelectElement;
        if (lensSelect) {
          lensSelect.value = lensType;
          this.showLensDescription(lensType);
        }
        
        // Update current lens display
        this.updateCurrentLensDisplay(lensType);
      } else {
        // No lens set, show default message
        this.updateCurrentLensDisplay(null);
      }
    } catch (error) {
      console.error('Failed to load current lens:', error);
    }
  }

  /**
   * Update current lens display
   */
  private updateCurrentLensDisplay(lensType: SatiricalContextType | null): void {
    const currentLensDisplay = document.getElementById('current-lens-display');
    if (!currentLensDisplay) return;
    
    if (lensType) {
      const lensData = this.getLensDescription(lensType);
      if (lensData) {
        currentLensDisplay.innerHTML = `
          <div class="current-lens">
            <span class="lens-icon">✅</span>
            <div class="lens-info">
              <strong>Active Lens:</strong> ${lensData.name}
              <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #666;">All AI agents use this perspective</p>
            </div>
          </div>
        `;
      }
    } else {
      currentLensDisplay.innerHTML = `
        <div class="no-lens">
          <span class="lens-icon">⚠️</span>
          <div class="lens-info">
            <strong>No satirical lens set</strong>
            <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #666;">AI agents will use general satirical approach</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Setup satirical format selector
   */
  private setupFormatSelector(): void {
    const formatSelect = document.getElementById('project-satirical-format-select') as HTMLSelectElement;
    const applyFormatBtn = document.getElementById('apply-format-btn');
    const formatDescription = document.getElementById('format-description');
    
    // Show format description when selection changes
    formatSelect?.addEventListener('change', () => {
      const selectedValue = formatSelect.value as SatiricalFormat;
      this.showFormatDescription(selectedValue);
    });
    
    // Apply format to project
    applyFormatBtn?.addEventListener('click', async () => {
      const selectedFormat = formatSelect?.value as SatiricalFormat;
      if (!selectedFormat) {
        alert('Please select a video format first.');
        return;
      }
      
      await this.applyFormatToProject(selectedFormat);
    });
    
    // Load current format on initialization
    this.loadCurrentFormat();
  }

  /**
   * Show format description
   */
  private showFormatDescription(formatType: SatiricalFormat): void {
    const formatDescription = document.getElementById('format-description');
    if (!formatDescription || !formatType) {
      if (formatDescription) formatDescription.style.display = 'none';
      return;
    }

    const formatData = this.getFormatDescription(formatType);
    if (formatData) {
      formatDescription.innerHTML = `
        <div class="format-preview">
          <h4>${formatData.name}</h4>
          <p><strong>Style:</strong> ${formatData.description}</p>
          <p><strong>Key Elements:</strong> ${formatData.keyElements.join(', ')}</p>
          <p><strong>Examples:</strong> ${formatData.examples}</p>
        </div>
      `;
      formatDescription.style.display = 'block';
    }
  }

  /**
   * Get format description data
   */
  private getFormatDescription(formatType: SatiricalFormat) {
    const formats = {
      'NEWS_PARODY': {
        name: '📺 News Parody',
        description: 'Serious news format with deadpan delivery of absurd content',
        keyElements: ['Authoritative anchor', 'Professional graphics', 'Reporter segments', 'BBC/ABC serious tone'],
        examples: 'The Day Today, Brass Eye, Clarke and Dawe, The Chaser'
      },
      'VOX_POP': {
        name: '🎤 Vox Pop',
        description: 'Street interviews with members of the public about current issues',
        keyElements: ['Roving reporter', 'Public interviews', 'Street locations', 'Diverse public responses'],
        examples: 'The Chaser vox pops, Private Eye street interviews, Charlie Brooker segments'
      },
      'MORNING_TV_INTERVIEW': {
        name: '☀️ Morning TV Interview',
        description: 'Breakfast television guest segment with overly cheerful hosts',
        keyElements: ['Chirpy presenters', 'Sofa setting', 'Light questioning', 'Awkward guest dynamics'],
        examples: 'The Day Today morning segments, Brass Eye interviews, Australian morning TV parody'
      },
      'MOCKUMENTARY': {
        name: '🎬 Documentary Style',
        description: 'Serious documentary format with deadpan presentation of ridiculous subjects',
        keyElements: ['Talking heads', 'B-roll footage', 'Serious narrator', 'Documentary conventions'],
        examples: 'This Country, People Just Do Nothing, Summer Heights High, The Office'
      },
      'SOCIAL_MEDIA': {
        name: '📱 Social Media',
        description: 'Viral-ready content with quick cuts and trending formats',
        keyElements: ['Quick cuts', 'Mobile vertical format', 'Trending sounds', 'Hashtag culture'],
        examples: 'TikTok comedy, Instagram Reels, viral content parody'
      },
      'SKETCH_COMEDY': {
        name: '🎭 Sketch Comedy',
        description: 'Character-driven scenarios with absurdist British/Australian humour',
        keyElements: ['Recurring characters', 'Surreal situations', 'Catchphrases', 'Physical comedy'],
        examples: 'Monty Python, The Fast Show, DAAS Kapital, Big Train, Little Britain'
      },
      'SATIRICAL_ARTICLE': {
        name: '📰 Satirical Article',
        description: 'Written satire in the style of serious journalism',
        keyElements: ['Proper headlines', 'Bylines', 'Quotes from sources', 'News article structure'],
        examples: 'Private Eye, The Chaser, Charlie Brooker columns, The Betoota Advocate'
      },
      'PANEL_SHOW': {
        name: '🎪 Panel Show',
        description: 'Comedy panel discussion format with satirical news commentary',
        keyElements: ['Host and comedians', 'Current events', 'Rapid-fire jokes', 'Competitive format'],
        examples: 'Have I Got News For You, Mock the Week, Good News Week, The Last Leg'
      },
      'COMMERCIAL_PARODY': {
        name: '📢 Commercial Parody',
        description: 'Fake advertisement with product placement and testimonials',
        keyElements: ['Product focus', 'Spokesperson', 'Jingle/music', 'Customer testimonials'],
        examples: 'The Fast Show ads, Brass Eye commercials, DAAS advertising parodies'
      },
      'REALITY_TV_PARODY': {
        name: '📹 Reality TV Parody',
        description: 'Reality show tropes with manufactured drama and confessionals',
        keyElements: ['Confessional segments', 'Dramatic music', 'Competition elements', 'Artificial conflict'],
        examples: 'Come Fly With Me, People Just Do Nothing, reality show mockery'
      }
    };
    
    return formats[formatType as keyof typeof formats] || null;
  }

  /**
   * Apply satirical format to project
   */
  private async applyFormatToProject(formatType: SatiricalFormat): Promise<void> {
    try {
      if (!this.currentProject) return;
      
      // @ts-ignore - Call backend to update project with satirical format
      const result = await window.electronAPI.database.updateProjectFormat(this.currentProject.id, formatType);
      
      if (result.success) {
        alert(`✅ ${this.getFormatDescription(formatType)?.name} format applied to project!\n\nAll AI agents will now create content in this video format.`);
        
        // Update current project data
        this.currentProject.satirical_format = formatType;
        
        // Update display
        this.updateCurrentFormatDisplay(formatType);
      } else {
        throw new Error(result.error || 'Failed to update project format');
      }
    } catch (error) {
      console.error('Failed to apply satirical format:', error);
      alert('Failed to apply satirical format. Please try again.');
    }
  }

  /**
   * Load current format
   */
  private async loadCurrentFormat(): Promise<void> {
    try {
      if (!this.currentProject) return;
      
      if (this.currentProject.satirical_format) {
        const formatType = this.currentProject.satirical_format;
        
        // Set the selector to current format
        const formatSelect = document.getElementById('project-satirical-format-select') as HTMLSelectElement;
        if (formatSelect) {
          formatSelect.value = formatType;
          this.showFormatDescription(formatType);
        }
        
        // Update current format display
        this.updateCurrentFormatDisplay(formatType);
      } else {
        // No format set, show default message
        this.updateCurrentFormatDisplay(null);
      }
    } catch (error) {
      console.error('Failed to load current format:', error);
    }
  }

  /**
   * Update current format display
   */
  private updateCurrentFormatDisplay(formatType: SatiricalFormat | null): void {
    const currentFormatDisplay = document.getElementById('current-format-display');
    if (!currentFormatDisplay) return;
    
    if (formatType) {
      const formatData = this.getFormatDescription(formatType);
      if (formatData) {
        currentFormatDisplay.innerHTML = `
          <div class="current-format">
            <span class="format-icon">✅</span>
            <div class="format-info">
              <strong>Active Format:</strong> ${formatData.name}
              <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #666;">All AI agents will create content in this format</p>
            </div>
          </div>
        `;
      }
    } else {
      currentFormatDisplay.innerHTML = `
        <div class="no-format">
          <span class="format-icon">⚠️</span>
          <div class="format-info">
            <strong>No video format set</strong>
            <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #666;">AI agents will use general approach</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Refresh project data
   */
  private async refreshProjectData(): Promise<void> {
    try {
      if (!this.currentProject) return;
      
      // @ts-ignore
      const projectResult = await window.electronAPI.database.getProjectById(this.currentProject.id);
      if (projectResult.success) {
        this.currentProject = projectResult.data;
      }
    } catch (error) {
      console.error('Failed to refresh project data:', error);
    }
  }

  /**
   * Handle dashboard actions
   */
  private handleDashboardAction(action: string): void {
    switch (action) {
      case 'upload-article':
        this.openArticleUpload();
        break;
      case 'view-articles':
        this.switchToArticlesTab();
        break;
      default:
        console.log('Unknown dashboard action:', action);
    }
  }

  /**
   * Handle quick actions
   */
  private handleQuickAction(action: string): void {
    switch (action) {
      case 'upload-article':
        this.openArticleUpload();
        break;
      case 'create-strategy':
        this.switchToStrategyTab();
        break;
      case 'develop-script':
        alert('Script Development module will be available in Module 3');
        break;
      case 'create-storyboard':
        alert('Visual Storyboard module will be available in Module 4');
        break;
      default:
        console.log('Unknown quick action:', action);
    }
  }

  /**
   * Open article upload modal
   */
  private openArticleUpload(): void {
    if (!this.currentProject) return;
    
    import('./NewsArticleUpload.js').then(module => {
      module.newsArticleUpload.open(this.currentProject!.id);
    });
  }

  /**
   * Switch to articles tab
   */
  private switchToArticlesTab(): void {
    const articlesTab = document.querySelector('[data-tab="articles"]') as HTMLElement;
    if (articlesTab) {
      articlesTab.click();
    }
  }

  /**
   * Switch to strategy tab
   */
  private switchToStrategyTab(): void {
    const strategyTab = document.querySelector('[data-tab="strategy"]') as HTMLElement;
    if (strategyTab) {
      strategyTab.click();
    }
  }

  /**
   * Get dashboard container element
   */
  private getDashboardContainer(): HTMLElement | null {
    return document.getElementById('overview-tab');
  }

  /**
   * Get relative time string
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
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
    const container = this.getDashboardContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="dashboard-error">
        <div class="error-icon">❌</div>
        <h3>Dashboard Error</h3>
        <p>${this.escapeHtml(message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          Retry
        </button>
      </div>
    `;
  }
}

// Export singleton instance
export const projectDashboard = new ProjectDashboard();