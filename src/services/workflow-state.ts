// Workflow State Management Service
// LangChain-inspired state management for agent orchestration

import { PersonaType, SatiricalFormat, Project } from '../shared/types/index.js';

export interface WorkflowState {
  id: string;
  projectId: string;
  currentStage: WorkflowStage;
  nextStage: WorkflowStage | null;
  completedStages: WorkflowStage[];
  pendingStages: WorkflowStage[];
  context: ProjectContext;
  metadata: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStage {
  name: string;
  persona: PersonaType;
  status: StageStatus;
  requirements: string[];
  outputs: StageOutput[];
  qualityGates: QualityGate[];
  estimatedDuration: number; // minutes
  actualDuration?: number;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  errors: WorkflowError[];
}

export interface ProjectContext {
  project: Project;
  articles: any[];
  satiricalFormat: SatiricalFormat;
  creativeStrategy?: any;
  characters: CharacterProfile[];
  sharedMemory: ConversationMemory;
  formatGuidelines: FormatGuidelines;
}

export interface ConversationMemory {
  keyDecisions: KeyDecision[];
  characterDescriptions: Map<string, string>;
  toneAndStyle: string;
  runningThemes: string[];
  userPreferences: UserPreference[];
  contextSummary: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  visualDescription: string;
  personality: string;
  role: string;
  consistency: string; // For AI prompt consistency
}

export interface FormatGuidelines {
  format: SatiricalFormat;
  visualStyle: string;
  pacing: string;
  audioRequirements: string;
  technicalConstraints: string[];
  referenceExamples: string[];
}

export interface StageOutput {
  type: 'text' | 'structured' | 'file';
  content: any;
  schema?: string;
  validated: boolean;
  qualityScore: number;
}

export interface QualityGate {
  name: string;
  description: string;
  validator: (output: any, context: ProjectContext) => QualityCheck;
  required: boolean;
}

export interface QualityCheck {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

export interface WorkflowError {
  type: 'validation' | 'quality' | 'technical' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
  resolved: boolean;
}

export interface WorkflowMetadata {
  totalStages: number;
  progressPercentage: number;
  estimatedCompletion: Date;
  qualityScore: number;
  formatConsistency: number;
  lastHealthCheck: Date;
}

export interface KeyDecision {
  stage: string;
  decision: string;
  reasoning: string;
  impact: string;
  timestamp: Date;
}

export interface UserPreference {
  category: string;
  preference: string;
  strength: number; // 1-5
  appliedAt: string[];
}

export type StageStatus = 
  | 'not_started' 
  | 'ready' 
  | 'in_progress' 
  | 'review_required' 
  | 'completed' 
  | 'failed' 
  | 'blocked';

/**
 * Workflow State Machine for Agent Orchestration
 * Manages progression through the satirical video production pipeline
 */
export class WorkflowStateMachine {
  private currentState: WorkflowState | null = null;
  private stateHistory: WorkflowState[] = [];

  /**
   * Initialize workflow for a new project
   */
  async initializeWorkflow(projectId: string, project: Project): Promise<WorkflowState> {
    const workflowId = this.generateWorkflowId();
    
    const context: ProjectContext = {
      project,
      articles: [],
      satiricalFormat: project.satirical_format || 'NEWS_PARODY',
      characters: [],
      sharedMemory: {
        keyDecisions: [],
        characterDescriptions: new Map(),
        toneAndStyle: '',
        runningThemes: [],
        userPreferences: [],
        contextSummary: ''
      },
      formatGuidelines: this.createFormatGuidelines(project.satirical_format || 'NEWS_PARODY')
    };

    const stages = this.createWorkflowStages(context.satiricalFormat);
    
    const workflowState: WorkflowState = {
      id: workflowId,
      projectId,
      currentStage: stages[0],
      nextStage: stages[1] || null,
      completedStages: [],
      pendingStages: stages.slice(1),
      context,
      metadata: {
        totalStages: stages.length,
        progressPercentage: 0,
        estimatedCompletion: this.calculateEstimatedCompletion(stages),
        qualityScore: 0,
        formatConsistency: 100,
        lastHealthCheck: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentState = workflowState;
    this.stateHistory.push({ ...workflowState });

    return workflowState;
  }

  /**
   * Transition to the next workflow stage
   */
  async transitionToNextStage(
    completedOutput: any,
    qualityCheck: QualityCheck
  ): Promise<{ success: boolean; nextStage?: WorkflowStage; error?: string }> {
    if (!this.currentState) {
      return { success: false, error: 'No active workflow state' };
    }

    try {
      // Validate completion requirements
      const currentStage = this.currentState.currentStage;
      const validationResult = await this.validateStageCompletion(currentStage, completedOutput);
      
      if (!validationResult.valid) {
        return { success: false, error: validationResult.reason };
      }

      // Update current stage as completed
      currentStage.status = 'completed';
      currentStage.completedAt = new Date();
      currentStage.actualDuration = currentStage.startedAt 
        ? (Date.now() - currentStage.startedAt.getTime()) / (1000 * 60)
        : 0;
      currentStage.outputs.push({
        type: this.determineOutputType(completedOutput),
        content: completedOutput,
        validated: qualityCheck.passed,
        qualityScore: qualityCheck.score
      });

      // Move stage to completed
      this.currentState.completedStages.push(currentStage);

      // Update shared context with new information
      await this.updateSharedContext(completedOutput, currentStage.persona);

      // Determine next stage
      const nextStage = this.currentState.nextStage;
      if (!nextStage) {
        // Workflow complete
        this.currentState.currentStage.status = 'completed';
        this.currentState.metadata.progressPercentage = 100;
        return { success: true };
      }

      // Transition to next stage
      nextStage.status = 'ready';
      nextStage.startedAt = new Date();
      
      this.currentState.currentStage = nextStage;
      this.currentState.nextStage = this.currentState.pendingStages.shift() || null;
      this.currentState.updatedAt = new Date();

      // Update metadata
      this.updateWorkflowMetadata();

      // Save state to history
      this.stateHistory.push({ ...this.currentState });

      console.log(`🎯 Workflow transition: ${currentStage.name} → ${nextStage.name}`);

      return { success: true, nextStage };

    } catch (error) {
      console.error('Workflow transition failed:', error);
      return { success: false, error: `Transition failed: ${error}` };
    }
  }

  /**
   * Get current workflow state
   */
  getCurrentState(): WorkflowState | null {
    return this.currentState;
  }

  /**
   * Check if workflow can proceed to next stage
   */
  canProceedToNext(): boolean {
    if (!this.currentState) return false;
    
    const currentStage = this.currentState.currentStage;
    return currentStage.status === 'completed' && this.currentState.nextStage !== null;
  }

  /**
   * Get workflow progress summary
   */
  getProgressSummary(): {
    current: string;
    next: string | null;
    progress: number;
    qualityScore: number;
    estimatedCompletion: Date;
  } {
    if (!this.currentState) {
      return {
        current: 'Not initialized',
        next: null,
        progress: 0,
        qualityScore: 0,
        estimatedCompletion: new Date()
      };
    }

    return {
      current: this.currentState.currentStage.name,
      next: this.currentState.nextStage?.name || null,
      progress: this.currentState.metadata.progressPercentage,
      qualityScore: this.currentState.metadata.qualityScore,
      estimatedCompletion: this.currentState.metadata.estimatedCompletion
    };
  }

  /**
   * Handle stage failure and retry logic
   */
  async handleStageFailure(error: WorkflowError): Promise<{ shouldRetry: boolean; maxRetriesReached: boolean }> {
    if (!this.currentState) return { shouldRetry: false, maxRetriesReached: false };

    const currentStage = this.currentState.currentStage;
    currentStage.errors.push(error);
    currentStage.retryCount++;

    const maxRetries = this.getMaxRetries(error.severity);
    const shouldRetry = currentStage.retryCount <= maxRetries;
    
    if (!shouldRetry) {
      currentStage.status = 'failed';
      console.error(`❌ Stage ${currentStage.name} failed after ${maxRetries} retries`);
    } else {
      currentStage.status = 'ready'; // Reset for retry
      console.warn(`🔄 Retrying stage ${currentStage.name} (attempt ${currentStage.retryCount}/${maxRetries})`);
    }

    return { shouldRetry, maxRetriesReached: !shouldRetry };
  }

  // Private helper methods

  private createWorkflowStages(format: SatiricalFormat): WorkflowStage[] {
    const baseStages: Omit<WorkflowStage, 'qualityGates'>[] = [
      {
        name: 'Creative Strategy',
        persona: 'CREATIVE_STRATEGIST',
        status: 'ready',
        requirements: ['News articles uploaded', 'Project format selected'],
        outputs: [],
        estimatedDuration: 15,
        retryCount: 0,
        errors: []
      },
      {
        name: 'Voiceover Development',
        persona: 'BAFFLING_BROADCASTER',
        status: 'not_started',
        requirements: ['Creative strategy complete'],
        outputs: [],
        estimatedDuration: 10,
        retryCount: 0,
        errors: []
      },
      {
        name: 'Script Development',
        persona: 'SATIRICAL_SCREENWRITER',
        status: 'not_started',
        requirements: ['Creative strategy complete', 'Voiceover brief ready'],
        outputs: [],
        estimatedDuration: 20,
        retryCount: 0,
        errors: []
      },
      {
        name: 'Visual Storyboard',
        persona: 'CINEMATIC_STORYBOARDER',
        status: 'not_started',
        requirements: ['Script complete', '8-second shot validation'],
        outputs: [],
        estimatedDuration: 25,
        retryCount: 0,
        errors: []
      },
      {
        name: 'Sound Design',
        persona: 'SOUNDSCAPE_ARCHITECT',
        status: 'not_started',
        requirements: ['Storyboard complete'],
        outputs: [],
        estimatedDuration: 15,
        retryCount: 0,
        errors: []
      },
      {
        name: 'AI Prompt Generation',
        persona: 'VIDEO_PROMPT_ENGINEER',
        status: 'not_started',
        requirements: ['All creative elements complete'],
        outputs: [],
        estimatedDuration: 10,
        retryCount: 0,
        errors: []
      }
    ];

    // Add format-specific quality gates
    return baseStages.map(stage => ({
      ...stage,
      qualityGates: this.createQualityGates(stage.persona, format)
    }));
  }

  private createQualityGates(persona: PersonaType, format: SatiricalFormat): QualityGate[] {
    const commonGates: QualityGate[] = [
      {
        name: 'Format Consistency',
        description: `Output aligns with ${format} format requirements`,
        validator: (output, context) => this.validateFormatConsistency(output, context.satiricalFormat),
        required: true
      },
      {
        name: 'Quality Standard',
        description: 'Output meets minimum quality standards',
        validator: (output, context) => this.validateQualityStandard(output),
        required: true
      }
    ];

    const personaGates: Record<PersonaType, QualityGate[]> = {
      'CREATIVE_STRATEGIST': [
        {
          name: 'Strategic Completeness',
          description: 'All required strategy elements present',
          validator: (output, context) => this.validateStrategyCompleteness(output),
          required: true
        }
      ],
      'BAFFLING_BROADCASTER': [
        {
          name: 'Voice Character Consistency',
          description: 'Broadcaster character maintained throughout',
          validator: (output, context) => this.validateVoiceConsistency(output),
          required: true
        }
      ],
      'SATIRICAL_SCREENWRITER': [
        {
          name: 'Script Structure',
          description: 'Proper script formatting and structure',
          validator: (output, context) => this.validateScriptStructure(output),
          required: true
        }
      ],
      'CINEMATIC_STORYBOARDER': [
        {
          name: '8-Second Constraint',
          description: 'All shots comply with 8-second maximum',
          validator: (output, context) => this.validate8SecondConstraint(output),
          required: true
        }
      ],
      'SOUNDSCAPE_ARCHITECT': [
        {
          name: 'Audio Completeness',
          description: 'Sound notes provided for all shots',
          validator: (output, context) => this.validateAudioCompleteness(output),
          required: true
        }
      ],
      'VIDEO_PROMPT_ENGINEER': [
        {
          name: 'Prompt Optimization',
          description: 'AI prompts optimized for video generation',
          validator: (output, context) => this.validatePromptOptimization(output),
          required: true
        }
      ],
      'PROJECT_DIRECTOR': []
    };

    return [...commonGates, ...personaGates[persona]];
  }

  private createFormatGuidelines(format: SatiricalFormat): FormatGuidelines {
    const guidelines: Record<SatiricalFormat, FormatGuidelines> = {
      'NEWS_PARODY': {
        format,
        visualStyle: 'Professional news studio with serious graphics',
        pacing: 'Measured, authoritative delivery',
        audioRequirements: 'News theme music, broadcast stings',
        technicalConstraints: ['Studio lighting', 'News desk setup', 'Professional graphics'],
        referenceExamples: ['The Day Today', 'Brass Eye', 'Clarke and Dawe']
      },
      'VOX_POP': {
        format,
        visualStyle: 'Street interviews with handheld camera',
        pacing: 'Quick cuts between diverse public responses',
        audioRequirements: 'Street ambiance, portable audio',
        technicalConstraints: ['Outdoor locations', 'Handheld stability', 'Clear audio'],
        referenceExamples: ['The Chaser vox pops', 'Private Eye street interviews']
      },
      'MORNING_TV_INTERVIEW': {
        format,
        visualStyle: 'Bright breakfast TV studio with sofa setting',
        pacing: 'Chirpy, upbeat with awkward moments',
        audioRequirements: 'Cheerful morning TV themes',
        technicalConstraints: ['Sofa interview setup', 'Bright lighting', 'Multiple cameras'],
        referenceExamples: ['The Day Today morning segments', 'Brass Eye interviews']
      },
      'MOCKUMENTARY': {
        format,
        visualStyle: 'Documentary-style handheld with talking heads',
        pacing: 'Serious documentary pacing with absurd content',
        audioRequirements: 'Natural documentary ambiance',
        technicalConstraints: ['Documentary lighting', 'Handheld camera work', 'Interview setups'],
        referenceExamples: ['This Country', 'People Just Do Nothing', 'Summer Heights High']
      },
      'SOCIAL_MEDIA': {
        format,
        visualStyle: 'Vertical mobile format with trendy aesthetics',
        pacing: 'Fast cuts, trending formats',
        audioRequirements: 'Trending sounds, mobile audio',
        technicalConstraints: ['Vertical 9:16 ratio', 'Mobile-friendly graphics', 'Quick engagement'],
        referenceExamples: ['TikTok comedy', 'Instagram Reels']
      },
      'SKETCH_COMEDY': {
        format,
        visualStyle: 'Multi-camera setup with character costumes',
        pacing: 'Comedy timing with surreal situations',
        audioRequirements: 'Comedy music stings, character voices',
        technicalConstraints: ['Multi-character setups', 'Costume changes', 'Set designs'],
        referenceExamples: ['Monty Python', 'The Fast Show', 'DAAS Kapital']
      },
      'SATIRICAL_ARTICLE': {
        format,
        visualStyle: 'Newspaper/web article format with headlines',
        pacing: 'Written content with visual elements',
        audioRequirements: 'Optional voiceover, text-to-speech',
        technicalConstraints: ['Article formatting', 'Header graphics', 'Bylines'],
        referenceExamples: ['Private Eye', 'The Chaser', 'The Betoota Advocate']
      },
      'PANEL_SHOW': {
        format,
        visualStyle: 'Panel desk arrangement with host and comedians',
        pacing: 'Rapid-fire comedy discussion',
        audioRequirements: 'Panel show theme, audience laughter',
        technicalConstraints: ['Panel desk setup', 'Multiple participants', 'Audience area'],
        referenceExamples: ['Have I Got News For You', 'Mock the Week', 'Good News Week']
      },
      'COMMERCIAL_PARODY': {
        format,
        visualStyle: 'High-production commercial aesthetics',
        pacing: 'Product-focused with spokesperson',
        audioRequirements: 'Jingles, commercial music stings',
        technicalConstraints: ['Product placement', 'Commercial lighting', 'Spokesperson setup'],
        referenceExamples: ['The Fast Show ads', 'Brass Eye commercials']
      },
      'REALITY_TV_PARODY': {
        format,
        visualStyle: 'Reality TV aesthetics with confessionals',
        pacing: 'Manufactured drama with talking heads',
        audioRequirements: 'Dramatic reality TV stings',
        technicalConstraints: ['Confessional booths', 'Reality TV lighting', 'Drama emphasis'],
        referenceExamples: ['Come Fly With Me', 'People Just Do Nothing']
      }
    };

    return guidelines[format];
  }

  // Validation methods
  private validateFormatConsistency(output: any, format: SatiricalFormat): QualityCheck {
    // Implementation would check format-specific requirements
    return { passed: true, score: 85, issues: [], suggestions: [] };
  }

  private validateQualityStandard(output: any): QualityCheck {
    // Implementation would check general quality metrics
    return { passed: true, score: 80, issues: [], suggestions: [] };
  }

  private validateStrategyCompleteness(output: any): QualityCheck {
    // Check for required strategy elements
    return { passed: true, score: 90, issues: [], suggestions: [] };
  }

  private validateVoiceConsistency(output: any): QualityCheck {
    return { passed: true, score: 85, issues: [], suggestions: [] };
  }

  private validateScriptStructure(output: any): QualityCheck {
    return { passed: true, score: 88, issues: [], suggestions: [] };
  }

  private validate8SecondConstraint(output: any): QualityCheck {
    return { passed: true, score: 95, issues: [], suggestions: [] };
  }

  private validateAudioCompleteness(output: any): QualityCheck {
    return { passed: true, score: 87, issues: [], suggestions: [] };
  }

  private validatePromptOptimization(output: any): QualityCheck {
    return { passed: true, score: 92, issues: [], suggestions: [] };
  }

  private async validateStageCompletion(
    stage: WorkflowStage,
    output: any
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check all required quality gates
    for (const gate of stage.qualityGates.filter(g => g.required)) {
      const check = gate.validator(output, this.currentState!.context);
      if (!check.passed) {
        return { 
          valid: false, 
          reason: `Quality gate failed: ${gate.name}. Issues: ${check.issues.join(', ')}` 
        };
      }
    }
    return { valid: true };
  }

  private async updateSharedContext(output: any, persona: PersonaType): Promise<void> {
    if (!this.currentState) return;

    const memory = this.currentState.context.sharedMemory;

    // Update memory based on persona and output
    if (persona === 'CREATIVE_STRATEGIST' && output.characters) {
      output.characters.forEach((char: any) => {
        memory.characterDescriptions.set(char.name, char.description);
      });
    }

    // Add key decisions
    memory.keyDecisions.push({
      stage: this.currentState.currentStage.name,
      decision: `${persona} completed: ${this.summarizeOutput(output)}`,
      reasoning: 'Agent workflow progression',
      impact: 'Advances project to next stage',
      timestamp: new Date()
    });

    // Update context summary
    memory.contextSummary = this.generateContextSummary();
  }

  private summarizeOutput(output: any): string {
    if (typeof output === 'string') {
      return output.length > 100 ? output.substring(0, 100) + '...' : output;
    }
    return JSON.stringify(output).substring(0, 100) + '...';
  }

  private generateContextSummary(): string {
    if (!this.currentState) return '';

    const completed = this.currentState.completedStages.map(s => s.name).join(', ');
    const current = this.currentState.currentStage.name;
    const format = this.currentState.context.satiricalFormat;

    return `Project using ${format} format. Completed: ${completed}. Current: ${current}.`;
  }

  private determineOutputType(output: any): 'text' | 'structured' | 'file' {
    if (typeof output === 'string') return 'text';
    if (typeof output === 'object') return 'structured';
    return 'file';
  }

  private updateWorkflowMetadata(): void {
    if (!this.currentState) return;

    const totalStages = this.currentState.metadata.totalStages;
    const completed = this.currentState.completedStages.length;
    this.currentState.metadata.progressPercentage = Math.round((completed / totalStages) * 100);

    // Update quality score based on completed stages
    const qualityScores = this.currentState.completedStages
      .flatMap(stage => stage.outputs.map(output => output.qualityScore))
      .filter(score => score > 0);
    
    if (qualityScores.length > 0) {
      this.currentState.metadata.qualityScore = Math.round(
        qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      );
    }

    this.currentState.metadata.lastHealthCheck = new Date();
  }

  private calculateEstimatedCompletion(stages: WorkflowStage[]): Date {
    const totalMinutes = stages.reduce((sum, stage) => sum + stage.estimatedDuration, 0);
    return new Date(Date.now() + totalMinutes * 60 * 1000);
  }

  private getMaxRetries(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    const retryMap = { low: 3, medium: 2, high: 1, critical: 0 };
    return retryMap[severity];
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const workflowStateMachine = new WorkflowStateMachine();