// Project Director Dashboard Component
// Central command interface for project management and strategic guidance

import { ProjectHealthCheck, QualityIssue, WorkflowStage } from '../../services/project-director.js';
import { Project, PersonaType } from '../../shared/types/index.js';

export class ProjectDirectorDashboard {
  private currentProject: Project | null = null;
  private healthCheck: ProjectHealthCheck | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize Project Director Dashboard
   */
  public async initialize(projectId: string): Promise<void> {
    try {
      // Load project data
      const projectResult = await window.electronAPI.database.getProjectById(projectId);
      if (!projectResult.success) {
        throw new Error('Failed to load project');
      }
      
      this.currentProject = projectResult.data;
      
      // Perform initial health check
      await this.performHealthCheck();
      
      // Render the dashboard
      this.renderDashboard();
      
      // Set up auto-refresh every 30 seconds
      this.refreshInterval = setInterval(() => {
        this.performHealthCheck();
      }, 30000);
      
    } catch (error) {
      console.error('Failed to initialize Project Director Dashboard:', error);
      this.renderError('Failed to load Project Director Dashboard');
    }
  }

  /**
   * Cleanup when component is destroyed
   */
  public cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Perform health check and update dashboard
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // @ts-ignore - Call backend to get project health check
      const result = await window.electronAPI.projectDirector.performHealthCheck(this.currentProject?.id);
      
      if (result.success) {
        this.healthCheck = result.data;
        this.updateHealthDisplay();
      }
    } catch (error) {
      console.error('Failed to perform health check:', error);
    }
  }

  /**
   * Render the main dashboard
   */
  private renderDashboard(): void {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="project-director-dashboard">
        <!-- Header -->
        <div class="director-header">
          <div class="director-title">
            <h2>🎯 Project Director</h2>
            <p>Strategic oversight and workflow management</p>
          </div>
          <div class="director-actions">
            <button type="button" id="get-guidance-btn" class="btn btn-primary">
              💬 Get Strategic Guidance
            </button>
            <button type="button" id="refresh-health-btn" class="btn btn-outline">
              🔄 Refresh Analysis
            </button>
          </div>
        </div>

        <!-- Project Health Overview -->
        <div class="health-overview-section">
          <h3>📊 Project Health Overview</h3>
          <div id="health-overview-content">
            <div class="health-loading">
              <span class="loading-spinner">⏳</span>
              Analyzing project health...
            </div>
          </div>
        </div>

        <!-- Strategic Recommendations -->
        <div class="recommendations-section">
          <h3>💡 Strategic Recommendations</h3>
          <div id="recommendations-content">
            <div class="recommendations-loading">
              <span class="loading-spinner">⏳</span>
              Generating recommendations...
            </div>
          </div>
        </div>

        <!-- Workflow Progress -->
        <div class="workflow-progress-section">
          <h3>🚀 Workflow Progress</h3>
          <div id="workflow-progress-content">
            <div class="workflow-loading">
              <span class="loading-spinner">⏳</span>
              Analyzing workflow stages...
            </div>
          </div>
        </div>

        <!-- Quality Issues -->
        <div class="quality-issues-section">
          <h3>⚠️ Quality Control</h3>
          <div id="quality-issues-content">
            <div class="quality-loading">
              <span class="loading-spinner">⏳</span>
              Checking for quality issues...
            </div>
          </div>
        </div>

        <!-- Strategic Guidance Chat -->
        <div class="guidance-chat-section" id="guidance-chat-section" style="display: none;">
          <h3>💬 Strategic Guidance</h3>
          <div class="guidance-chat-interface">
            <div id="guidance-messages" class="guidance-messages"></div>
            <div class="guidance-input-section">
              <input type="text" id="guidance-input" placeholder="Ask the Project Director for strategic advice..." class="guidance-input">
              <button type="button" id="send-guidance-btn" class="btn btn-primary">Send</button>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps-section">
          <h3>📋 Next Steps</h3>
          <div id="next-steps-content">
            <div class="next-steps-loading">
              <span class="loading-spinner">⏳</span>
              Determining next steps...
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Update health display with latest data
   */
  private updateHealthDisplay(): void {
    if (!this.healthCheck) return;

    this.updateHealthOverview();
    this.updateRecommendations();
    this.updateWorkflowProgress();
    this.updateQualityIssues();
    this.updateNextSteps();
  }

  /**
   * Update health overview section
   */
  private updateHealthOverview(): void {
    const container = document.getElementById('health-overview-content');
    if (!container || !this.healthCheck) return;

    const healthIcon = this.getHealthIcon(this.healthCheck.overallHealth);
    const healthColor = this.getHealthColor(this.healthCheck.overallHealth);

    container.innerHTML = `
      <div class="health-overview-grid">
        <div class="health-card overall-health" style="border-color: ${healthColor}">
          <div class="health-icon">${healthIcon}</div>
          <div class="health-info">
            <h4>Overall Health</h4>
            <span class="health-status" style="color: ${healthColor}">
              ${this.formatHealthStatus(this.healthCheck.overallHealth)}
            </span>
          </div>
        </div>

        <div class="health-card progress-card">
          <div class="progress-icon">📈</div>
          <div class="progress-info">
            <h4>Workflow Progress</h4>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this.healthCheck.workflowProgress}%"></div>
            </div>
            <span class="progress-text">${this.healthCheck.workflowProgress}% Complete</span>
          </div>
        </div>

        <div class="health-card consistency-card">
          <div class="consistency-icon">${this.healthCheck.formatConsistency ? '✅' : '⚠️'}</div>
          <div class="consistency-info">
            <h4>Format Consistency</h4>
            <span class="consistency-status">
              ${this.healthCheck.formatConsistency ? 'Maintained' : 'Needs Attention'}
            </span>
          </div>
        </div>

        <div class="health-card issues-card">
          <div class="issues-icon">${this.healthCheck.qualityIssues.length === 0 ? '✨' : '⚠️'}</div>
          <div class="issues-info">
            <h4>Quality Issues</h4>
            <span class="issues-count">
              ${this.healthCheck.qualityIssues.length} ${this.healthCheck.qualityIssues.length === 1 ? 'Issue' : 'Issues'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update recommendations section
   */
  private updateRecommendations(): void {
    const container = document.getElementById('recommendations-content');
    if (!container || !this.healthCheck) return;

    if (this.healthCheck.recommendations.length === 0) {
      container.innerHTML = `
        <div class="no-recommendations">
          <div class="success-icon">🎉</div>
          <p>Excellent work! No immediate recommendations at this time.</p>
        </div>
      `;
      return;
    }

    const recommendationsHtml = this.healthCheck.recommendations
      .map((recommendation, index) => `
        <div class="recommendation-item">
          <div class="recommendation-priority">
            <span class="priority-badge priority-${index === 0 ? 'high' : index === 1 ? 'medium' : 'low'}">
              ${index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'}
            </span>
          </div>
          <div class="recommendation-content">
            <p>${this.escapeHtml(recommendation)}</p>
          </div>
          <div class="recommendation-actions">
            <button type="button" class="btn btn-small btn-outline" data-action="dismiss-recommendation" data-index="${index}">
              Dismiss
            </button>
          </div>
        </div>
      `).join('');

    container.innerHTML = `
      <div class="recommendations-list">
        ${recommendationsHtml}
      </div>
    `;
  }

  /**
   * Update workflow progress section
   */
  private updateWorkflowProgress(): void {
    const container = document.getElementById('workflow-progress-content');
    if (!container || !this.healthCheck) return;

    // For now, create a basic workflow display
    // TODO: Get actual workflow stages from health check
    const mockStages = [
      { name: 'News Articles', completed: true, quality: 'excellent' },
      { name: 'Satirical Format', completed: !!this.currentProject?.satirical_format, quality: 'good' },
      { name: 'Creative Strategy', completed: false, quality: 'not_started' },
      { name: 'Script Development', completed: false, quality: 'not_started' },
      { name: 'Visual Storyboard', completed: false, quality: 'not_started' },
      { name: 'Audio Design', completed: false, quality: 'not_started' }
    ];

    const stagesHtml = mockStages.map(stage => `
      <div class="workflow-stage ${stage.completed ? 'completed' : 'pending'}">
        <div class="stage-indicator">
          ${stage.completed ? '✅' : '⏳'}
        </div>
        <div class="stage-info">
          <h5>${stage.name}</h5>
          <span class="stage-status">${stage.completed ? 'Completed' : 'Pending'}</span>
        </div>
        <div class="stage-quality">
          <span class="quality-badge quality-${stage.quality}">${this.formatQualityStatus(stage.quality)}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="workflow-stages">
        ${stagesHtml}
      </div>
    `;
  }

  /**
   * Update quality issues section
   */
  private updateQualityIssues(): void {
    const container = document.getElementById('quality-issues-content');
    if (!container || !this.healthCheck) return;

    if (this.healthCheck.qualityIssues.length === 0) {
      container.innerHTML = `
        <div class="no-issues">
          <div class="success-icon">✨</div>
          <p>No quality issues detected. Great work!</p>
        </div>
      `;
      return;
    }

    const issuesHtml = this.healthCheck.qualityIssues.map((issue, index) => `
      <div class="quality-issue severity-${issue.severity}">
        <div class="issue-header">
          <div class="issue-icon">${this.getIssueIcon(issue.type)}</div>
          <div class="issue-title">
            <h5>${this.formatIssueType(issue.type)}</h5>
            <span class="severity-badge severity-${issue.severity}">${issue.severity.toUpperCase()}</span>
          </div>
        </div>
        <div class="issue-content">
          <p class="issue-description">${this.escapeHtml(issue.description)}</p>
          <p class="issue-fix"><strong>Suggested Fix:</strong> ${this.escapeHtml(issue.suggestedFix)}</p>
          <span class="affected-section">Affects: ${issue.affectedSection}</span>
        </div>
        <div class="issue-actions">
          <button type="button" class="btn btn-small btn-primary" data-action="fix-issue" data-index="${index}">
            Apply Fix
          </button>
          <button type="button" class="btn btn-small btn-outline" data-action="ignore-issue" data-index="${index}">
            Ignore
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="quality-issues-list">${issuesHtml}</div>`;
  }

  /**
   * Update next steps section
   */
  private updateNextSteps(): void {
    const container = document.getElementById('next-steps-content');
    if (!container || !this.healthCheck) return;

    const stepsHtml = this.healthCheck.nextSteps
      .map((step, index) => `
        <div class="next-step-item">
          <div class="step-number">${index + 1}</div>
          <div class="step-content">
            <p>${this.escapeHtml(step)}</p>
          </div>
          <div class="step-actions">
            <button type="button" class="btn btn-small btn-primary" data-action="start-step" data-step="${index}">
              Start This Step
            </button>
          </div>
        </div>
      `).join('');

    container.innerHTML = `
      <div class="next-steps-list">
        ${stepsHtml}
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const getGuidanceBtn = document.getElementById('get-guidance-btn');
    const refreshHealthBtn = document.getElementById('refresh-health-btn');
    const guidanceInput = document.getElementById('guidance-input') as HTMLInputElement;
    const sendGuidanceBtn = document.getElementById('send-guidance-btn');

    getGuidanceBtn?.addEventListener('click', () => this.toggleGuidanceChat());
    refreshHealthBtn?.addEventListener('click', () => this.performHealthCheck());
    
    sendGuidanceBtn?.addEventListener('click', () => this.sendGuidanceMessage());
    guidanceInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendGuidanceMessage();
      }
    });
    
    // Listen for agent workflow handoffs
    window.addEventListener('workflowHandoff', (e: any) => {
      this.handleWorkflowHandoff(e.detail);
    });
    
    // Listen for Project Director guidance requests
    window.addEventListener('requestProjectDirectorGuidance', (e: any) => {
      this.handleGuidanceRequest(e.detail);
    });

    // Delegate event listeners for dynamic content
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      
      if (action === 'start-step') {
        const stepIndex = target.getAttribute('data-step');
        this.handleStartStep(parseInt(stepIndex || '0'));
      } else if (action === 'fix-issue') {
        const issueIndex = target.getAttribute('data-index');
        this.handleFixIssue(parseInt(issueIndex || '0'));
      } else if (action === 'dismiss-recommendation') {
        const recIndex = target.getAttribute('data-index');
        this.handleDismissRecommendation(parseInt(recIndex || '0'));
      }
    });
  }

  /**
   * Toggle strategic guidance chat
   */
  private toggleGuidanceChat(): void {
    const chatSection = document.getElementById('guidance-chat-section');
    if (chatSection) {
      const isVisible = chatSection.style.display !== 'none';
      chatSection.style.display = isVisible ? 'none' : 'block';
      
      const button = document.getElementById('get-guidance-btn');
      if (button) {
        button.textContent = isVisible ? '💬 Get Strategic Guidance' : '❌ Close Guidance Chat';
      }
    }
  }

  /**
   * Send guidance message to Project Director
   */
  private async sendGuidanceMessage(): Promise<void> {
    const input = document.getElementById('guidance-input') as HTMLInputElement;
    const messagesContainer = document.getElementById('guidance-messages');
    
    if (!input || !messagesContainer || !input.value.trim()) return;

    const userMessage = input.value.trim();
    input.value = '';

    // Add user message to chat
    const userMessageEl = document.createElement('div');
    userMessageEl.className = 'guidance-message user-message';
    userMessageEl.innerHTML = `<p>${this.escapeHtml(userMessage)}</p>`;
    messagesContainer.appendChild(userMessageEl);

    // Add loading message
    const loadingEl = document.createElement('div');
    loadingEl.className = 'guidance-message director-message loading';
    loadingEl.innerHTML = `<p>🎯 Project Director is thinking...</p>`;
    messagesContainer.appendChild(loadingEl);

    try {
      // @ts-ignore - Call backend for strategic guidance
      const result = await window.electronAPI.projectDirector.getStrategicGuidance(userMessage);
      
      // Remove loading message
      loadingEl.remove();
      
      // Add Director response
      const directorMessageEl = document.createElement('div');
      directorMessageEl.className = 'guidance-message director-message';
      directorMessageEl.innerHTML = `<p>${this.escapeHtml(result.success ? result.data : 'Unable to provide guidance at this time.')}</p>`;
      messagesContainer.appendChild(directorMessageEl);
      
    } catch (error) {
      loadingEl.remove();
      const errorEl = document.createElement('div');
      errorEl.className = 'guidance-message error-message';
      errorEl.innerHTML = `<p>Error getting guidance. Please try again.</p>`;
      messagesContainer.appendChild(errorEl);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Handle starting a workflow step
   */
  private handleStartStep(stepIndex: number): void {
    if (!this.healthCheck) return;
    
    const step = this.healthCheck.nextSteps[stepIndex];
    if (step) {
      // TODO: Navigate to appropriate workflow section
      alert(`Starting: ${step}\n\nThis would navigate to the appropriate workflow section.`);
    }
  }

  /**
   * Handle fixing a quality issue
   */
  private handleFixIssue(issueIndex: number): void {
    if (!this.healthCheck) return;
    
    const issue = this.healthCheck.qualityIssues[issueIndex];
    if (issue) {
      // TODO: Implement automated fixes where possible
      alert(`Applying fix: ${issue.suggestedFix}\n\nThis would implement the suggested fix automatically.`);
    }
  }

  /**
   * Handle dismissing a recommendation
   */
  private handleDismissRecommendation(recIndex: number): void {
    // TODO: Mark recommendation as dismissed
    console.log(`Dismissed recommendation ${recIndex}`);
    this.performHealthCheck(); // Refresh to remove dismissed recommendation
  }

  /**
   * Get container element
   */
  private getContainer(): HTMLElement | null {
    return document.getElementById('director-tab') || document.getElementById('project-director-content');
  }

  /**
   * Helper methods for formatting
   */
  private getHealthIcon(health: string): string {
    const icons = {
      'excellent': '🟢',
      'good': '🟡', 
      'needs_attention': '🟠',
      'critical': '🔴'
    };
    return icons[health as keyof typeof icons] || '❓';
  }

  private getHealthColor(health: string): string {
    const colors = {
      'excellent': '#28a745',
      'good': '#ffc107',
      'needs_attention': '#fd7e14', 
      'critical': '#dc3545'
    };
    return colors[health as keyof typeof colors] || '#6c757d';
  }

  private formatHealthStatus(health: string): string {
    return health.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatQualityStatus(quality: string): string {
    return quality.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private getIssueIcon(type: string): string {
    const icons = {
      'format_drift': '🎬',
      'consistency_error': '⚠️',
      'workflow_gap': '📋',
      'quality_concern': '🔍'
    };
    return icons[type as keyof typeof icons] || '⚠️';
  }

  private formatIssueType(type: string): string {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle workflow handoff notifications from agents
   */
  private handleWorkflowHandoff(detail: any): void {
    const { persona, stage, message, timestamp } = detail;
    
    console.log(`📢 Workflow handoff: ${persona} → ${stage}`);
    
    // Add notification to guidance chat
    const messagesContainer = document.getElementById('guidance-messages');
    if (messagesContainer) {
      const handoffMessage = document.createElement('div');
      handoffMessage.className = 'guidance-message system-message';
      handoffMessage.innerHTML = `
        <div class="message-header">
          <span class="message-sender">🎯 Workflow System</span>
          <span class="message-time">${new Date(timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">
          <strong>${persona}</strong> has completed their work and is ready for <strong>${stage}</strong>.
          <br><small>💡 Consider switching to the next workflow tab to continue the process.</small>
        </div>
      `;
      messagesContainer.appendChild(handoffMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Show temporary notification
    this.showHandoffNotification(persona, stage);
    
    // Refresh health check to update workflow progress
    setTimeout(() => {
      this.performHealthCheck();
    }, 1000);
  }

  /**
   * Handle Project Director guidance requests from agents
   */
  private handleGuidanceRequest(detail: any): void {
    const { persona, message, response, timestamp } = detail;
    
    console.log(`🤔 Guidance request from: ${persona}`);
    
    // Add guidance request to chat
    const messagesContainer = document.getElementById('guidance-messages');
    if (messagesContainer) {
      const requestMessage = document.createElement('div');
      requestMessage.className = 'guidance-message system-message';
      requestMessage.innerHTML = `
        <div class="message-header">
          <span class="message-sender">🤔 ${persona}</span>
          <span class="message-time">${new Date(timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">
          <strong>Requesting Strategic Guidance:</strong>
          <br>${this.escapeHtml(message)}
          <br><br><small><em>Agent response: "${this.escapeHtml(response.substring(0, 100))}..."</em></small>
        </div>
      `;
      messagesContainer.appendChild(requestMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Auto-open guidance chat if not already visible
    if (!document.querySelector('.guidance-section.active')) {
      this.toggleGuidanceChat();
    }
    
    // Show notification
    this.showGuidanceRequestNotification(persona);
  }

  /**
   * Show temporary handoff notification
   */
  private showHandoffNotification(persona: string, stage: string): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'handoff-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🎯</div>
        <div class="notification-message">
          <strong>${persona}</strong> completed!<br>
          Ready for <strong>${stage}</strong>
        </div>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      max-width: 280px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Show temporary guidance request notification
   */
  private showGuidanceRequestNotification(persona: string): void {
    const notification = document.createElement('div');
    notification.className = 'guidance-request-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🤔</div>
        <div class="notification-message">
          <strong>${persona}</strong> needs guidance!<br>
          <small>Check the Strategic Guidance chat</small>
        </div>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #2196F3;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      max-width: 280px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="director-error">
        <div class="error-icon">❌</div>
        <h3>Project Director Error</h3>
        <p>${this.escapeHtml(message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          Retry
        </button>
      </div>
    `;
  }
}

// Export singleton instance
export const projectDirectorDashboard = new ProjectDirectorDashboard();