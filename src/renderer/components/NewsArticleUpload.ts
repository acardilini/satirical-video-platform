// News Article Upload Component
// Handles uploading and processing news articles for satirical video projects

import { NewsArticle } from '../../shared/types/index.js';

export class NewsArticleUpload {
  private modal: HTMLElement | null = null;
  private isOpen = false;
  private currentProjectId: string | null = null;
  private isEditMode = false;
  private currentArticle: any = null;

  constructor() {
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Create the modal HTML structure
   */
  private createModal() {
    const modalHTML = `
      <div id="news-article-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Upload News Article</h2>
            <button class="modal-close" id="close-article-modal">&times;</button>
          </div>
          
          <form id="article-upload-form" class="modal-form">
            <div class="form-group">
              <label for="article-title">Article Title *</label>
              <input type="text" id="article-title" name="title" required maxlength="200">
              <div class="form-error" id="article-title-error"></div>
            </div>

            <div class="form-group">
              <label for="article-source">Source/Publication</label>
              <input type="text" id="article-source" name="source" maxlength="100" placeholder="e.g., BBC News, The Guardian">
              <small class="form-hint">The original publication or source</small>
            </div>

            <div class="form-group">
              <label for="article-url">Article URL</label>
              <input type="url" id="article-url" name="url" placeholder="https://example.com/article">
              <small class="form-hint">Link to the original article (optional)</small>
            </div>

            <div class="form-group">
              <label>Upload Method</label>
              <div class="upload-method-selection">
                <label class="upload-method-option">
                  <input type="radio" name="upload-method" value="file" checked>
                  <span>Upload File</span>
                  <small>Upload a text file, PDF, or Word document</small>
                </label>
                <label class="upload-method-option">
                  <input type="radio" name="upload-method" value="paste">
                  <span>Paste Text</span>
                  <small>Copy and paste the article content directly</small>
                </label>
              </div>
            </div>

            <div class="form-group" id="file-upload-section">
              <label for="article-file">Select File *</label>
              <div class="file-upload-area" id="file-drop-zone">
                <input type="file" id="article-file" name="file" accept=".txt,.pdf,.doc,.docx,.rtf" style="display: none;">
                <div class="file-upload-placeholder">
                  <div class="file-upload-icon">📄</div>
                  <div class="file-upload-text">
                    <strong>Click to select</strong> or drag and drop a file here
                  </div>
                  <div class="file-upload-hint">
                    Supported: .txt, .pdf, .doc, .docx, .rtf (max 10MB)
                  </div>
                </div>
                <div class="file-upload-selected" id="selected-file" style="display: none;">
                  <div class="selected-file-info">
                    <div class="selected-file-icon">📄</div>
                    <div class="selected-file-details">
                      <div class="selected-file-name"></div>
                      <div class="selected-file-size"></div>
                    </div>
                    <button type="button" class="selected-file-remove">&times;</button>
                  </div>
                </div>
              </div>
              <div class="form-error" id="article-file-error"></div>
            </div>

            <div class="form-group" id="text-paste-section" style="display: none;">
              <label for="article-content">Article Content *</label>
              <textarea id="article-content" name="content" rows="10" maxlength="50000" placeholder="Paste the full article text here..."></textarea>
              <small class="form-hint">Maximum 50,000 characters</small>
              <div class="form-error" id="article-content-error"></div>
            </div>

            <div class="form-group">
              <label for="article-notes">Processing Notes</label>
              <textarea id="article-notes" name="processing_notes" rows="3" maxlength="1000" placeholder="Any specific notes about how this article should be processed..."></textarea>
              <small class="form-hint">Optional notes for the AI personas about satirical angles or key points</small>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="cancel-article-upload">Cancel</button>
              <button type="submit" class="btn btn-primary">Upload Article</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('news-article-modal');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    // Modal close events
    const closeBtn = document.getElementById('close-article-modal');
    const cancelBtn = document.getElementById('cancel-article-upload');
    const overlay = this.modal;

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // Form submission
    const form = document.getElementById('article-upload-form');
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Upload method toggle
    const uploadMethodInputs = document.querySelectorAll('input[name="upload-method"]');
    uploadMethodInputs.forEach(input => {
      input.addEventListener('change', () => this.toggleUploadMethod());
    });

    // File upload handling
    this.setupFileUpload();

    // Real-time validation
    const titleInput = document.getElementById('article-title') as HTMLInputElement;
    titleInput?.addEventListener('input', () => this.validateTitle());
  }

  /**
   * Setup file upload functionality
   */
  private setupFileUpload() {
    const fileInput = document.getElementById('article-file') as HTMLInputElement;
    const dropZone = document.getElementById('file-drop-zone');
    const placeholder = dropZone?.querySelector('.file-upload-placeholder');

    // File input change
    fileInput?.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });

    // Click to select file
    placeholder?.addEventListener('click', () => {
      fileInput?.click();
    });

    // Drag and drop
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });

    // Remove selected file
    const removeBtn = document.querySelector('.selected-file-remove');
    removeBtn?.addEventListener('click', () => this.clearSelectedFile());
  }

  /**
   * Handle file selection
   */
  private handleFileSelection(file: File) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx', '.rtf'];
    
    // Validate file size
    if (file.size > maxSize) {
      this.showFileError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      this.showFileError('Please select a supported file type (.txt, .pdf, .doc, .docx, .rtf)');
      return;
    }

    // Clear any previous errors
    this.clearFileError();

    // Show selected file info
    this.displaySelectedFile(file);
  }

  /**
   * Display selected file information
   */
  private displaySelectedFile(file: File) {
    const placeholder = document.querySelector('.file-upload-placeholder') as HTMLElement;
    const selectedDiv = document.getElementById('selected-file') as HTMLElement;
    const fileName = selectedDiv.querySelector('.selected-file-name') as HTMLElement;
    const fileSize = selectedDiv.querySelector('.selected-file-size') as HTMLElement;

    placeholder.style.display = 'none';
    selectedDiv.style.display = 'block';
    
    fileName.textContent = file.name;
    fileSize.textContent = this.formatFileSize(file.size);

    // Store file reference
    const fileInput = document.getElementById('article-file') as HTMLInputElement;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
  }

  /**
   * Clear selected file
   */
  private clearSelectedFile() {
    const placeholder = document.querySelector('.file-upload-placeholder') as HTMLElement;
    const selectedDiv = document.getElementById('selected-file') as HTMLElement;
    const fileInput = document.getElementById('article-file') as HTMLInputElement;

    placeholder.style.display = 'block';
    selectedDiv.style.display = 'none';
    fileInput.value = '';
    
    this.clearFileError();
  }

  /**
   * Toggle between upload methods
   */
  private toggleUploadMethod() {
    const selectedMethod = document.querySelector('input[name="upload-method"]:checked') as HTMLInputElement;
    const fileSection = document.getElementById('file-upload-section');
    const textSection = document.getElementById('text-paste-section');

    if (selectedMethod?.value === 'file') {
      fileSection!.style.display = 'block';
      textSection!.style.display = 'none';
    } else {
      fileSection!.style.display = 'none';
      textSection!.style.display = 'block';
    }
  }

  /**
   * Open modal for specific project
   */
  public open(projectId: string) {
    this.currentProjectId = projectId;
    this.isEditMode = false;
    this.currentArticle = null;
    
    if (this.modal) {
      this.updateModalTitle();
      this.modal.style.display = 'flex';
      this.isOpen = true;
      
      // Focus on title input
      const titleInput = document.getElementById('article-title') as HTMLInputElement;
      setTimeout(() => titleInput?.focus(), 100);
    }
  }

  /**
   * Open modal for editing existing article
   */
  public openForEdit(article: any) {
    this.currentProjectId = article.project_id;
    this.isEditMode = true;
    this.currentArticle = article;
    
    if (this.modal) {
      this.updateModalTitle();
      this.populateFormWithArticle(article);
      this.modal.style.display = 'flex';
      this.isOpen = true;
      
      // Focus on title input
      const titleInput = document.getElementById('article-title') as HTMLInputElement;
      setTimeout(() => titleInput?.focus(), 100);
    }
  }

  /**
   * Close modal
   */
  public close() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.isOpen = false;
      this.resetForm();
    }
  }

  /**
   * Update modal title based on edit mode
   */
  private updateModalTitle(): void {
    // Use setTimeout to ensure DOM elements are available
    setTimeout(() => {
      const titleElement = this.modal?.querySelector('.modal-header h2');
      const submitButton = this.modal?.querySelector('#article-upload-form button[type="submit"]');
      
      if (titleElement && submitButton) {
        if (this.isEditMode) {
          titleElement.textContent = 'Edit News Article';
          (submitButton as HTMLElement).textContent = 'Save Changes';
        } else {
          titleElement.textContent = 'Upload News Article';
          (submitButton as HTMLElement).textContent = 'Upload Article';
        }
      } else {
        console.log('Could not find modal elements for title update', { titleElement, submitButton });
      }
    }, 50);
  }

  /**
   * Populate form with existing article data
   */
  private populateFormWithArticle(article: any): void {
    // Fill in basic fields
    const titleInput = document.getElementById('article-title') as HTMLInputElement;
    const sourceInput = document.getElementById('article-source') as HTMLInputElement;
    const urlInput = document.getElementById('article-url') as HTMLInputElement;
    const notesInput = document.getElementById('article-notes') as HTMLTextAreaElement;
    
    if (titleInput) titleInput.value = article.title || '';
    if (sourceInput) sourceInput.value = article.source || '';
    if (urlInput) urlInput.value = article.url || '';
    if (notesInput) notesInput.value = article.processing_notes || '';

    // Switch to text paste mode and fill content
    const pasteRadio = document.querySelector('input[name="upload-method"][value="paste"]') as HTMLInputElement;
    if (pasteRadio) {
      pasteRadio.checked = true;
      this.toggleUploadMethod();
      
      const contentTextarea = document.getElementById('article-content') as HTMLTextAreaElement;
      if (contentTextarea) {
        contentTextarea.value = article.content || '';
      }
    }

    // Refresh modal title after populating form
    this.updateModalTitle();
  }

  /**
   * Reset form to initial state
   */
  private resetForm() {
    const form = document.getElementById('article-upload-form') as HTMLFormElement;
    form?.reset();
    
    this.clearAllErrors();
    this.clearSelectedFile();
    this.toggleUploadMethod(); // Reset to file upload mode
    this.currentProjectId = null;
    this.isEditMode = false;
    this.currentArticle = null;
  }

  /**
   * Validate title input
   */
  private validateTitle(): boolean {
    const titleInput = document.getElementById('article-title') as HTMLInputElement;
    const errorElement = document.getElementById('article-title-error');
    
    if (!titleInput || !errorElement) return false;

    const title = titleInput.value.trim();
    
    if (title.length === 0) {
      errorElement.textContent = 'Article title is required';
      return false;
    }
    
    if (title.length < 5) {
      errorElement.textContent = 'Title must be at least 5 characters';
      return false;
    }
    
    if (title.length > 200) {
      errorElement.textContent = 'Title must be less than 200 characters';
      return false;
    }

    errorElement.textContent = '';
    return true;
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(event: Event) {
    event.preventDefault();

    if (!this.currentProjectId) {
      this.showError('No project selected');
      return;
    }

    // Validate form
    const isTitleValid = this.validateTitle();
    const uploadMethod = document.querySelector('input[name="upload-method"]:checked') as HTMLInputElement;
    
    let contentValid = false;
    let articleContent = '';
    
    if (uploadMethod.value === 'file') {
      const fileInput = document.getElementById('article-file') as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        this.showFileError('Please select a file to upload');
        return;
      }
      contentValid = true;
      // File content will be processed by the main process
    } else {
      const contentInput = document.getElementById('article-content') as HTMLTextAreaElement;
      articleContent = contentInput.value.trim();
      
      if (articleContent.length === 0) {
        this.showContentError('Please enter the article content');
        return;
      }
      
      if (articleContent.length < 100) {
        this.showContentError('Article content seems too short (minimum 100 characters)');
        return;
      }
      
      contentValid = true;
    }

    if (!isTitleValid || !contentValid) {
      return;
    }

    // Get form data
    const titleInput = document.getElementById('article-title') as HTMLInputElement;
    const sourceInput = document.getElementById('article-source') as HTMLInputElement;
    const urlInput = document.getElementById('article-url') as HTMLInputElement;
    const notesInput = document.getElementById('article-notes') as HTMLTextAreaElement;

    const articleData = {
      title: titleInput.value.trim(),
      source: sourceInput.value.trim() || undefined,
      url: urlInput.value.trim() || undefined,
      content: articleContent || undefined,
      processing_notes: notesInput.value.trim() || undefined,
      project_id: this.currentProjectId,
      uploaded_by: 'temp-user-id' // TODO: Get from session
    };

    try {
      // Disable submit button
      const submitBtn = document.querySelector('#article-upload-form button[type="submit"]') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      let result;
      
      if (this.isEditMode && this.currentArticle) {
        // Update existing article (only supports text content for editing)
        console.log('Updating article:', this.currentArticle.id, articleData);
        console.log('Edit mode confirmed:', { isEditMode: this.isEditMode, currentArticle: this.currentArticle });
        try {
          // @ts-ignore  
          result = await window.electronAPI.database.updateNewsArticle(this.currentArticle.id, articleData);
          console.log('Update result:', result);
        } catch (updateError) {
          console.error('Direct update error:', updateError);
          throw updateError;
        }
      } else if (uploadMethod.value === 'file') {
        // Handle file upload for new articles
        const fileInput = document.getElementById('article-file') as HTMLInputElement;
        const file = fileInput.files![0];
        
        // Convert file to base64 for IPC transport
        const fileData = await this.fileToBase64(file);
        
        // @ts-ignore
        result = await window.electronAPI.database.uploadNewsArticleFile({
          ...articleData,
          fileName: file.name,
          fileData: fileData,
          fileType: file.type || 'text/plain'
        });
      } else {
        // Handle text paste for new articles
        result = await window.electronAPI.database.createNewsArticle(articleData);
      }

      if (result.success) {
        this.showSuccess(this.isEditMode ? 'News article updated successfully!' : 'News article uploaded successfully!');
        this.close();
        
        // Refresh project view if applicable
        this.refreshProjectView();
      } else {
        console.error('Operation failed:', result);
        this.showError(result.error || (this.isEditMode ? 'Failed to update article' : 'Failed to upload article'));
      }
    } catch (error) {
      console.error(this.isEditMode ? 'Article update failed:' : 'Article upload failed:', error);
      this.showError(this.isEditMode ? 'Failed to update article. Please try again.' : 'Failed to upload article. Please try again.');
    } finally {
      // Re-enable submit button
      const submitBtn = document.querySelector('#article-upload-form button[type="submit"]') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = this.isEditMode ? 'Save Changes' : 'Upload Article';
      }
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Show file error
   */
  private showFileError(message: string) {
    const errorElement = document.getElementById('article-file-error');
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  /**
   * Clear file error
   */
  private clearFileError() {
    const errorElement = document.getElementById('article-file-error');
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  /**
   * Show content error
   */
  private showContentError(message: string) {
    const errorElement = document.getElementById('article-content-error');
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  /**
   * Clear all error messages
   */
  private clearAllErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(element => {
      element.textContent = '';
    });
  }

  /**
   * Show success message
   */
  private showSuccess(message: string) {
    alert(`✅ ${message}`);
  }

  /**
   * Show error message
   */
  private showError(message: string) {
    alert(`❌ Error: ${message}`);
  }

  /**
   * Refresh project view
   */
  private refreshProjectView() {
    window.dispatchEvent(new CustomEvent('refreshProjectView'));
  }

  /**
   * Check if modal is open
   */
  public isModalOpen(): boolean {
    return this.isOpen;
  }
}

// Export singleton instance
export const newsArticleUpload = new NewsArticleUpload();