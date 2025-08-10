// Project Creation Modal Component
// Handles creating new projects with persona assignments

import { PersonaType } from '../../shared/types/index.js';

export class ProjectCreationModal {
  private modal: HTMLElement | null = null;
  private isOpen = false;

  constructor() {
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Create the modal HTML structure
   */
  private createModal() {
    const modalHTML = `
      <div id="project-creation-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Create New Project</h2>
            <button class="modal-close" id="close-project-modal">&times;</button>
          </div>
          
          <form id="project-creation-form" class="modal-form">
            <div class="form-group">
              <label for="project-name">Project Name *</label>
              <input type="text" id="project-name" name="name" required maxlength="100">
              <div class="form-error" id="project-name-error"></div>
            </div>

            <div class="form-group">
              <label for="project-description">Description</label>
              <textarea id="project-description" name="description" rows="3" maxlength="500"></textarea>
              <small class="form-hint">Brief description of your satirical video project</small>
            </div>

            <div class="form-group">
              <label>Assign Personas</label>
              <div class="persona-selection">
                <div class="persona-item">
                  <input type="checkbox" id="persona-creative-strategist" name="personas" value="CREATIVE_STRATEGIST">
                  <label for="persona-creative-strategist">Creative Strategist</label>
                  <small>Brainstorms satirical angles and provides creative direction</small>
                </div>
                
                <div class="persona-item">
                  <input type="checkbox" id="persona-baffling-broadcaster" name="personas" value="BAFFLING_BROADCASTER">
                  <label for="persona-baffling-broadcaster">Baffling Broadcaster</label>
                  <small>Generates out-of-touch presenter commentary</small>
                </div>
                
                <div class="persona-item">
                  <input type="checkbox" id="persona-satirical-screenwriter" name="personas" value="SATIRICAL_SCREENWRITER">
                  <label for="persona-satirical-screenwriter">Satirical Screenwriter</label>
                  <small>Writes cynical dialogue and scene scripts</small>
                </div>
                
                <div class="persona-item">
                  <input type="checkbox" id="persona-cinematic-storyboarder" name="personas" value="CINEMATIC_STORYBOARDER">
                  <label for="persona-cinematic-storyboarder">Cinematic Storyboarder</label>
                  <small>Creates detailed visual storyboards</small>
                </div>
                
                <div class="persona-item">
                  <input type="checkbox" id="persona-soundscape-architect" name="personas" value="SOUNDSCAPE_ARCHITECT">
                  <label for="persona-soundscape-architect">Soundscape Architect</label>
                  <small>Designs audio and sound effects</small>
                </div>
                
                <div class="persona-item">
                  <input type="checkbox" id="persona-video-prompt-engineer" name="personas" value="VIDEO_PROMPT_ENGINEER">
                  <label for="persona-video-prompt-engineer">Video Prompt Engineer</label>
                  <small>Generates AI-optimized video prompts</small>
                </div>
              </div>
              <div class="form-error" id="personas-error"></div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="cancel-project-creation">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Project</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('project-creation-modal');
  }

  /**
   * Setup event listeners for modal interactions
   */
  private setupEventListeners() {
    // Close modal events
    const closeBtn = document.getElementById('close-project-modal');
    const cancelBtn = document.getElementById('cancel-project-creation');
    const overlay = this.modal;

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // Form submission
    const form = document.getElementById('project-creation-form');
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time validation
    const nameInput = document.getElementById('project-name') as HTMLInputElement;
    nameInput?.addEventListener('input', () => this.validateProjectName());
  }

  /**
   * Open the modal
   */
  public open() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.isOpen = true;
      
      // Focus on project name input
      const nameInput = document.getElementById('project-name') as HTMLInputElement;
      setTimeout(() => nameInput?.focus(), 100);
    }
  }

  /**
   * Close the modal
   */
  public close() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.isOpen = false;
      this.resetForm();
    }
  }

  /**
   * Reset the form to initial state
   */
  private resetForm() {
    const form = document.getElementById('project-creation-form') as HTMLFormElement;
    form?.reset();
    
    // Clear error messages
    this.clearErrors();
  }

  /**
   * Clear all error messages
   */
  private clearErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(element => {
      element.textContent = '';
    });
  }

  /**
   * Validate project name input
   */
  private validateProjectName(): boolean {
    const nameInput = document.getElementById('project-name') as HTMLInputElement;
    const errorElement = document.getElementById('project-name-error');
    
    if (!nameInput || !errorElement) return false;

    const name = nameInput.value.trim();
    
    if (name.length === 0) {
      errorElement.textContent = 'Project name is required';
      return false;
    }
    
    if (name.length < 3) {
      errorElement.textContent = 'Project name must be at least 3 characters';
      return false;
    }
    
    if (name.length > 100) {
      errorElement.textContent = 'Project name must be less than 100 characters';
      return false;
    }

    errorElement.textContent = '';
    return true;
  }

  /**
   * Validate selected personas
   */
  private validatePersonas(): PersonaType[] {
    const checkboxes = document.querySelectorAll('input[name="personas"]:checked') as NodeListOf<HTMLInputElement>;
    const personas = Array.from(checkboxes).map(cb => cb.value as PersonaType);
    const errorElement = document.getElementById('personas-error');

    if (!errorElement) return personas;

    if (personas.length === 0) {
      errorElement.textContent = 'Please select at least one persona for this project';
      return [];
    }

    // Recommend Creative Strategist for all projects
    if (!personas.includes('CREATIVE_STRATEGIST')) {
      errorElement.textContent = 'Tip: Creative Strategist is recommended for all projects';
      // Don't return empty array - this is just a warning
    } else {
      errorElement.textContent = '';
    }

    return personas;
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(event: Event) {
    event.preventDefault();

    // Validate form
    const isNameValid = this.validateProjectName();
    const selectedPersonas = this.validatePersonas();

    if (!isNameValid || selectedPersonas.length === 0) {
      return;
    }

    // Get form data
    const nameInput = document.getElementById('project-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;

    const projectData = {
      name: nameInput.value.trim(),
      description: descriptionInput.value.trim() || undefined,
      status: 'ACTIVE' as const,
      created_by: 'temp-user-id', // TODO: Get from session in Phase 1
      assigned_personas: selectedPersonas
    };

    try {
      // Disable submit button
      const submitBtn = document.querySelector('#project-creation-form button[type="submit"]') as HTMLButtonElement;
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      // Create project via IPC
      const result = await window.electronAPI.database.createProject(projectData);

      if (result.success) {
        // Show success message
        this.showSuccess('Project created successfully!');
        
        // Close modal
        this.close();
        
        // Refresh project list (if we're on projects page)
        this.refreshProjectsList();
      } else {
        this.showError(result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Project creation failed:', error);
      this.showError('Failed to create project. Please try again.');
    } finally {
      // Re-enable submit button
      const submitBtn = document.querySelector('#project-creation-form button[type="submit"]') as HTMLButtonElement;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Project';
    }
  }

  /**
   * Show success message
   */
  private showSuccess(message: string) {
    // Simple success notification - will be enhanced in later modules
    alert(`✅ ${message}`);
  }

  /**
   * Show error message
   */
  private showError(message: string) {
    // Simple error notification - will be enhanced in later modules
    alert(`❌ Error: ${message}`);
  }

  /**
   * Refresh the projects list
   */
  private refreshProjectsList() {
    // Trigger projects list refresh if we're on the projects page
    const projectsSection = document.getElementById('projects');
    if (projectsSection && projectsSection.style.display !== 'none') {
      // Dispatch custom event to refresh projects
      window.dispatchEvent(new CustomEvent('refreshProjects'));
    }
  }

  /**
   * Check if modal is open
   */
  public isModalOpen(): boolean {
    return this.isOpen;
  }
}

// Export singleton instance
export const projectCreationModal = new ProjectCreationModal();