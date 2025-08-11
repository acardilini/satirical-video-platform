// Model Validation Notifications
// Shows alerts and recommendations for agent model configuration issues

import { PersonaType } from '../../shared/types/index.js';
import { AgentConfigService } from '../../services/agent-config.js';

export interface ValidationNotification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  persona?: PersonaType;
  actions: {
    label: string;
    action: string;
    primary?: boolean;
    data?: any;
  }[];
  dismissible: boolean;
  autoHide?: number; // milliseconds
}

export class ModelValidationNotifications {
  private static instance: ModelValidationNotifications | null = null;
  private container: HTMLElement | null = null;
  private notifications: Map<string, ValidationNotification> = new Map();
  private checkInterval: number | null = null;

  private constructor() {
    this.setupContainer();
    this.startPeriodicCheck();
  }

  public static getInstance(): ModelValidationNotifications {
    if (!ModelValidationNotifications.instance) {
      ModelValidationNotifications.instance = new ModelValidationNotifications();
    }
    return ModelValidationNotifications.instance;
  }

  /**
   * Setup notification container
   */
  private setupContainer(): void {
    // Create notification container if it doesn't exist
    this.container = document.getElementById('model-validation-notifications');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'model-validation-notifications';
      this.container.className = 'model-validation-notifications';
      this.container.innerHTML = `
        <style>
          .model-validation-notifications {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
          }
          
          .validation-notification {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-bottom: 12px;
            padding: 16px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
          }
          
          .validation-notification.show {
            opacity: 1;
            transform: translateX(0);
          }
          
          .validation-notification.warning {
            border-left: 4px solid #f59e0b;
          }
          
          .validation-notification.error {
            border-left: 4px solid #ef4444;
          }
          
          .validation-notification.info {
            border-left: 4px solid #3b82f6;
          }
          
          .validation-notification.success {
            border-left: 4px solid #10b981;
          }
          
          .notification-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .notification-title {
            font-weight: 600;
            font-size: 14px;
            margin: 0;
            color: #1f2937;
          }
          
          .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            color: #6b7280;
            cursor: pointer;
            padding: 0;
            margin-left: 8px;
          }
          
          .notification-close:hover {
            color: #374151;
          }
          
          .notification-message {
            font-size: 13px;
            color: #4b5563;
            margin: 0 0 12px 0;
            line-height: 1.4;
          }
          
          .notification-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          
          .notification-action {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .notification-action:hover {
            background: #e5e7eb;
          }
          
          .notification-action.primary {
            background: #3b82f6;
            color: white;
            border-color: #2563eb;
          }
          
          .notification-action.primary:hover {
            background: #2563eb;
          }
        </style>
      `;
      
      document.body.appendChild(this.container);
    }
  }

  /**
   * Start periodic model validation checks
   */
  private startPeriodicCheck(): void {
    // Check every 5 minutes
    this.checkInterval = window.setInterval(() => {
      this.checkAllAgentModels();
    }, 5 * 60 * 1000);

    // Initial check after a short delay
    setTimeout(() => {
      this.checkAllAgentModels();
    }, 10000);
  }

  /**
   * Check all agent models for issues
   */
  private async checkAllAgentModels(): Promise<void> {
    try {
      console.log('DEBUG: Checking all agent models for validation issues...');
      const validationResults = await AgentConfigService.validateAllAgents();

      // Clear existing validation notifications
      this.clearValidationNotifications();

      const hasIssues = Object.values(validationResults).some(result => !result.isValid);

      if (hasIssues) {
        // Show summary notification
        const issueCount = Object.values(validationResults).filter(r => !r.isValid).length;
        this.showNotification({
          id: 'agent-validation-summary',
          type: 'warning',
          title: 'Agent Configuration Issues',
          message: `${issueCount} agent(s) need attention. Click to view details.`,
          actions: [
            {
              label: 'View Details',
              action: 'open-agent-settings',
              primary: true
            },
            {
              label: 'Auto-Fix',
              action: 'auto-fix-all'
            }
          ],
          dismissible: true
        });

        // Show specific notifications for critical issues
        for (const [persona, result] of Object.entries(validationResults)) {
          if (!result.isValid && result.issues.some(issue => issue.includes('not available'))) {
            this.showNotification({
              id: `agent-${persona}-critical`,
              type: 'error',
              title: `${AgentConfigService.getPersonaDisplayName(persona as PersonaType)} Unavailable`,
              message: `Model is not available. This agent cannot function until reconfigured.`,
              persona: persona as PersonaType,
              actions: [
                {
                  label: 'Fix Now',
                  action: 'configure-agent',
                  primary: true,
                  data: { persona }
                }
              ],
              dismissible: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check agent models:', error);
    }
  }

  /**
   * Show a validation notification
   */
  public showNotification(notification: ValidationNotification): void {
    this.notifications.set(notification.id, notification);
    this.renderNotification(notification);

    // Auto-hide if specified
    if (notification.autoHide) {
      setTimeout(() => {
        this.hideNotification(notification.id);
      }, notification.autoHide);
    }
  }

  /**
   * Hide a notification
   */
  public hideNotification(id: string): void {
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.classList.remove('show');
      setTimeout(() => {
        element.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  /**
   * Clear all validation-related notifications
   */
  private clearValidationNotifications(): void {
    const validationIds = Array.from(this.notifications.keys()).filter(id => 
      id.startsWith('agent-') || id === 'agent-validation-summary'
    );
    
    validationIds.forEach(id => this.hideNotification(id));
  }

  /**
   * Render a notification
   */
  private renderNotification(notification: ValidationNotification): void {
    if (!this.container) return;

    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = `validation-notification ${notification.type}`;

    element.innerHTML = `
      <div class="notification-header">
        <h4 class="notification-title">${notification.title}</h4>
        ${notification.dismissible ? '<button class="notification-close">&times;</button>' : ''}
      </div>
      <p class="notification-message">${notification.message}</p>
      <div class="notification-actions">
        ${notification.actions.map(action => `
          <button class="notification-action ${action.primary ? 'primary' : ''}" 
                  data-action="${action.action}" 
                  data-notification-id="${notification.id}"
                  ${action.data ? `data-action-data='${JSON.stringify(action.data)}'` : ''}>
            ${action.label}
          </button>
        `).join('')}
      </div>
    `;

    // Setup event listeners
    if (notification.dismissible) {
      const closeBtn = element.querySelector('.notification-close') as HTMLButtonElement;
      closeBtn?.addEventListener('click', () => this.hideNotification(notification.id));
    }

    // Setup action listeners
    element.querySelectorAll('.notification-action').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAction(e as any));
    });

    this.container.appendChild(element);

    // Trigger show animation
    setTimeout(() => {
      element.classList.add('show');
    }, 100);
  }

  /**
   * Handle notification actions
   */
  private async handleAction(event: MouseEvent): Promise<void> {
    const button = event.target as HTMLButtonElement;
    const action = button.dataset.action;
    const notificationId = button.dataset.notificationId;
    const actionData = button.dataset.actionData ? JSON.parse(button.dataset.actionData) : {};

    console.log(`DEBUG: Handling notification action: ${action}`, actionData);

    switch (action) {
      case 'configure-agent':
        if (actionData.persona) {
          await this.openAgentConfiguration(actionData.persona);
        }
        break;

      case 'auto-fix-all':
        await this.autoFixAllAgents();
        break;

      case 'open-agent-settings':
        await this.openAgentSettings();
        break;

      case 'dismiss':
        if (notificationId) {
          this.hideNotification(notificationId);
        }
        break;
    }
  }

  /**
   * Open agent configuration for specific persona
   */
  private async openAgentConfiguration(persona: PersonaType): Promise<void> {
    try {
      // Import and open agent model selector
      const { agentModelSelector } = await import('./AgentModelSelector.js');
      agentModelSelector.open(persona);
      
      // Hide the notification after opening
      this.clearValidationNotifications();
    } catch (error) {
      console.error('Failed to open agent configuration:', error);
    }
  }

  /**
   * Auto-fix all agent configuration issues
   */
  private async autoFixAllAgents(): Promise<void> {
    try {
      const personas: PersonaType[] = [
        'CREATIVE_STRATEGIST',
        'BAFFLING_BROADCASTER', 
        'SATIRICAL_SCREENWRITER',
        'CINEMATIC_STORYBOARDER',
        'SOUNDSCAPE_ARCHITECT',
        'VIDEO_PROMPT_ENGINEER',
        'PROJECT_DIRECTOR'
      ];

      let fixedCount = 0;
      const fixes: string[] = [];

      for (const persona of personas) {
        const result = await AgentConfigService.autoFixAgentConfig(persona);
        if (result.success && result.changes.length > 0 && !result.changes.includes('No fixes needed')) {
          fixedCount++;
          fixes.push(`${AgentConfigService.getPersonaDisplayName(persona)}: ${result.changes.join(', ')}`);
        }
      }

      if (fixedCount > 0) {
        this.showNotification({
          id: 'auto-fix-success',
          type: 'success',
          title: 'Auto-Fix Complete',
          message: `Fixed ${fixedCount} agent(s). Changes: ${fixes.join('; ')}`,
          actions: [
            {
              label: 'OK',
              action: 'dismiss',
              primary: true
            }
          ],
          dismissible: true,
          autoHide: 10000
        });
      } else {
        this.showNotification({
          id: 'auto-fix-none',
          type: 'info',
          title: 'No Auto-Fixes Available',
          message: 'All issues require manual configuration.',
          actions: [
            {
              label: 'Configure Manually',
              action: 'open-agent-settings',
              primary: true
            }
          ],
          dismissible: true,
          autoHide: 5000
        });
      }

      // Clear validation notifications after auto-fix
      this.clearValidationNotifications();
      
      // Re-check after a delay
      setTimeout(() => {
        this.checkAllAgentModels();
      }, 2000);

    } catch (error) {
      console.error('Auto-fix failed:', error);
      this.showNotification({
        id: 'auto-fix-error',
        type: 'error',
        title: 'Auto-Fix Failed',
        message: `Failed to automatically fix agents: ${error}`,
        actions: [
          {
            label: 'Configure Manually',
            action: 'open-agent-settings',
            primary: true
          }
        ],
        dismissible: true
      });
    }
  }

  /**
   * Open agent settings
   */
  private async openAgentSettings(): Promise<void> {
    try {
      // This would open a general agent settings panel
      // For now, we'll open the first agent that needs attention
      const validationResults = await AgentConfigService.validateAllAgents();
      const firstInvalid = Object.keys(validationResults).find(persona => 
        !validationResults[persona].isValid
      ) as PersonaType;

      if (firstInvalid) {
        await this.openAgentConfiguration(firstInvalid);
      }
    } catch (error) {
      console.error('Failed to open agent settings:', error);
    }
  }

  /**
   * Force refresh model checks
   */
  public async forceRefresh(): Promise<void> {
    console.log('DEBUG: Force refreshing model validation checks...');
    await this.checkAllAgentModels();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.notifications.clear();
    ModelValidationNotifications.instance = null;
  }
}

// Export singleton instance
export const modelValidationNotifications = ModelValidationNotifications.getInstance();