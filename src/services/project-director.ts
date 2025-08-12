// Project Director Orchestration Service
// Provides active workflow monitoring, quality control, and strategic guidance

import { Project, PersonaType, SatiricalFormat } from '../shared/types/index.js';
import { LLMService } from './llm.js';

export interface ProjectHealthCheck {
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical';
  formatConsistency: boolean;
  workflowProgress: number; // 0-100%
  recommendations: string[];
  nextSteps: string[];
  qualityIssues: QualityIssue[];
}

export interface QualityIssue {
  type: 'format_drift' | 'consistency_error' | 'workflow_gap' | 'quality_concern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix: string;
  affectedSection: string;
}

export interface WorkflowStage {
  name: string;
  completed: boolean;
  quality: 'excellent' | 'good' | 'needs_work' | 'not_started';
  recommendations: string[];
}

/**
 * Project Director Orchestration Service
 * Provides active project management, workflow monitoring, and strategic guidance
 */
export class ProjectDirectorService {
  private llmService: LLMService | null = null;
  private activeMonitoring: boolean = false;
  private projectContext: any = null;

  constructor(llmService?: LLMService) {
    this.llmService = llmService || null;
  }

  /**
   * Initialize Project Director for a specific project
   */
  async initializeForProject(projectId: string, projectContext: any): Promise<void> {
    this.projectContext = projectContext;
    this.activeMonitoring = true;
    console.log(`Project Director initialized for project: ${projectId}`);
  }

  /**
   * Perform comprehensive project health check
   */
  async performHealthCheck(): Promise<ProjectHealthCheck> {
    if (!this.projectContext) {
      throw new Error('Project Director not initialized');
    }

    try {
      const workflowStages = await this.analyzeWorkflowProgress();
      const formatConsistency = await this.checkFormatConsistency();
      const qualityIssues = await this.identifyQualityIssues();
      
      const overallProgress = this.calculateOverallProgress(workflowStages);
      const overallHealth = this.determineOverallHealth(overallProgress, formatConsistency, qualityIssues);
      
      const recommendations = await this.generateRecommendations(workflowStages, qualityIssues);
      const nextSteps = await this.generateNextSteps(workflowStages);

      return {
        overallHealth,
        formatConsistency,
        workflowProgress: overallProgress,
        recommendations,
        nextSteps,
        qualityIssues
      };

    } catch (error) {
      console.error('Project Director health check failed:', error);
      return {
        overallHealth: 'critical',
        formatConsistency: false,
        workflowProgress: 0,
        recommendations: ['Unable to assess project health. Please check system configuration.'],
        nextSteps: ['Resolve technical issues before proceeding.'],
        qualityIssues: []
      };
    }
  }

  /**
   * Monitor agent conversation for format drift and quality issues
   */
  async monitorAgentConversation(
    persona: PersonaType, 
    userMessage: string, 
    agentResponse: string
  ): Promise<QualityIssue[]> {
    if (!this.activeMonitoring || !this.projectContext) {
      return [];
    }

    const issues: QualityIssue[] = [];

    try {
      // Check for format consistency
      if (this.projectContext.project?.satirical_format) {
        const formatCheck = await this.checkResponseFormatAlignment(
          persona, 
          agentResponse, 
          this.projectContext.project.satirical_format
        );
        if (!formatCheck.aligned) {
          issues.push({
            type: 'format_drift',
            severity: 'medium',
            description: `${persona} response doesn't align with ${this.projectContext.project.satirical_format} format`,
            suggestedFix: formatCheck.suggestion,
            affectedSection: persona
          });
        }
      }

      // Check for quality concerns
      const qualityCheck = await this.assessResponseQuality(persona, userMessage, agentResponse);
      if (qualityCheck.issues.length > 0) {
        issues.push(...qualityCheck.issues);
      }

    } catch (error) {
      console.error('Error monitoring agent conversation:', error);
    }

    return issues;
  }

  /**
   * Get strategic project guidance from Project Director
   */
  async getStrategicGuidance(query: string): Promise<string> {
    if (!this.llmService || !this.projectContext) {
      return "Project Director unavailable. Please ensure proper initialization.";
    }

    try {
      const context = {
        ...this.projectContext,
        currentHealthCheck: await this.performHealthCheck(),
        userQuery: query
      };

      const response = await this.llmService.generateResponse(
        `project_director_${Date.now()}`,
        'PROJECT_DIRECTOR',
        `The user is asking for strategic guidance: "${query}". Please provide specific, actionable advice based on the current project state and health check.`,
        context
      );

      return response.success ? response.response! : "Unable to provide guidance at this time.";

    } catch (error) {
      console.error('Error getting strategic guidance:', error);
      return "Error generating strategic guidance. Please try again.";
    }
  }

  /**
   * Analyze workflow progress across all stages
   */
  private async analyzeWorkflowProgress(): Promise<WorkflowStage[]> {
    const stages: WorkflowStage[] = [
      {
        name: 'News Articles',
        completed: (this.projectContext.articles?.length || 0) > 0,
        quality: this.assessArticlesQuality(),
        recommendations: this.getArticlesRecommendations()
      },
      {
        name: 'Creative Strategy',
        completed: !!this.projectContext.creativeStrategy,
        quality: this.assessStrategyQuality(),
        recommendations: this.getStrategyRecommendations()
      },
      {
        name: 'Script Development',
        completed: false, // TODO: Check for scripts
        quality: 'not_started',
        recommendations: ['Scripts not yet developed']
      },
      {
        name: 'Visual Storyboard',
        completed: false, // TODO: Check for storyboards
        quality: 'not_started',
        recommendations: ['Storyboards not yet created']
      },
      {
        name: 'Audio Design',
        completed: false, // TODO: Check for audio design
        quality: 'not_started',
        recommendations: ['Audio design not yet planned']
      },
      {
        name: 'Video Prompts',
        completed: false, // TODO: Check for video prompts
        quality: 'not_started',
        recommendations: ['Video generation prompts not yet created']
      }
    ];

    return stages;
  }

  /**
   * Check format consistency across project elements
   */
  private async checkFormatConsistency(): Promise<boolean> {
    if (!this.projectContext.project?.satirical_format) {
      return false; // No format set
    }

    // Check if creative strategy aligns with format
    if (this.projectContext.creativeStrategy) {
      // TODO: Implement format alignment check
      return true; // Placeholder
    }

    return true;
  }

  /**
   * Identify quality issues across the project
   */
  private async identifyQualityIssues(): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check if satirical format is set
    if (!this.projectContext.project?.satirical_format) {
      issues.push({
        type: 'workflow_gap',
        severity: 'high',
        description: 'No satirical format selected for project',
        suggestedFix: 'Select a satirical format in Project Dashboard to guide all AI agents',
        affectedSection: 'Project Setup'
      });
    }

    // Check if satirical lens is set
    if (!this.projectContext.project?.satirical_context) {
      issues.push({
        type: 'workflow_gap',
        severity: 'medium',
        description: 'No satirical lens/perspective selected',
        suggestedFix: 'Select a satirical lens in Project Dashboard for focused satirical approach',
        affectedSection: 'Project Setup'
      });
    }

    // Check article count
    if (!this.projectContext.articles || this.projectContext.articles.length === 0) {
      issues.push({
        type: 'workflow_gap',
        severity: 'high',
        description: 'No news articles uploaded',
        suggestedFix: 'Upload news articles to provide source material for satirical content',
        affectedSection: 'Content Sources'
      });
    }

    return issues;
  }

  /**
   * Calculate overall project progress percentage
   */
  private calculateOverallProgress(stages: WorkflowStage[]): number {
    const completedStages = stages.filter(stage => stage.completed).length;
    return Math.round((completedStages / stages.length) * 100);
  }

  /**
   * Determine overall project health
   */
  private determineOverallHealth(
    progress: number, 
    formatConsistency: boolean, 
    qualityIssues: QualityIssue[]
  ): 'excellent' | 'good' | 'needs_attention' | 'critical' {
    const highSeverityIssues = qualityIssues.filter(issue => issue.severity === 'high').length;
    
    if (highSeverityIssues > 0) return 'critical';
    if (progress < 25 || !formatConsistency) return 'needs_attention';
    if (progress < 75 || qualityIssues.length > 2) return 'good';
    return 'excellent';
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(stages: WorkflowStage[], qualityIssues: QualityIssue[]): Promise<string[]> {
    const recommendations: string[] = [];

    // High priority quality issues first
    qualityIssues
      .filter(issue => issue.severity === 'high')
      .forEach(issue => recommendations.push(issue.suggestedFix));

    // Workflow-based recommendations
    const nextIncompleteStage = stages.find(stage => !stage.completed);
    if (nextIncompleteStage) {
      recommendations.push(`Focus on ${nextIncompleteStage.name}: ${nextIncompleteStage.recommendations[0]}`);
    }

    // Format-specific guidance
    if (this.projectContext.project?.satirical_format) {
      recommendations.push(`Ensure all content aligns with ${this.projectContext.project.satirical_format} format`);
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Generate next steps for workflow progression
   */
  private async generateNextSteps(stages: WorkflowStage[]): Promise<string[]> {
    const nextSteps: string[] = [];
    
    const incompleteStages = stages.filter(stage => !stage.completed);
    if (incompleteStages.length > 0) {
      const nextStage = incompleteStages[0];
      nextSteps.push(`Complete ${nextStage.name}`);
      
      if (incompleteStages.length > 1) {
        nextSteps.push(`Prepare for ${incompleteStages[1].name}`);
      }
    } else {
      nextSteps.push('Review and refine all completed work');
      nextSteps.push('Prepare for video generation');
    }

    return nextSteps;
  }

  // Helper methods for quality assessment
  private assessArticlesQuality(): 'excellent' | 'good' | 'needs_work' | 'not_started' {
    if (!this.projectContext.articles) return 'not_started';
    const count = this.projectContext.articles.length;
    if (count >= 3) return 'excellent';
    if (count >= 2) return 'good';
    if (count >= 1) return 'needs_work';
    return 'not_started';
  }

  private getArticlesRecommendations(): string[] {
    const count = this.projectContext.articles?.length || 0;
    if (count === 0) return ['Upload news articles to begin satirical content creation'];
    if (count < 3) return ['Consider adding more articles for richer satirical material'];
    return ['Good selection of source material'];
  }

  private assessStrategyQuality(): 'excellent' | 'good' | 'needs_work' | 'not_started' {
    if (!this.projectContext.creativeStrategy) return 'not_started';
    return 'good'; // TODO: Implement actual quality assessment
  }

  private getStrategyRecommendations(): string[] {
    if (!this.projectContext.creativeStrategy) return ['Create Creative Strategy to guide video production'];
    return ['Creative Strategy completed'];
  }

  private async checkResponseFormatAlignment(
    persona: PersonaType, 
    response: string, 
    format: SatiricalFormat
  ): Promise<{ aligned: boolean; suggestion: string }> {
    // Simple keyword-based check (could be enhanced with LLM analysis)
    const formatKeywords = {
      'NEWS_PARODY': ['news', 'anchor', 'breaking', 'report'],
      'VOX_POP': ['street', 'interview', 'public', 'opinion'],
      'MORNING_TV_INTERVIEW': ['breakfast', 'morning', 'guest', 'sofa'],
      'PANEL_SHOW': ['panel', 'comedians', 'host', 'discussion']
    };

    const keywords = formatKeywords[format as keyof typeof formatKeywords] || [];
    const hasFormatKeywords = keywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
      aligned: hasFormatKeywords,
      suggestion: `Ensure response aligns with ${format} format conventions`
    };
  }

  private async assessResponseQuality(
    persona: PersonaType, 
    userMessage: string, 
    agentResponse: string
  ): Promise<{ issues: QualityIssue[] }> {
    const issues: QualityIssue[] = [];

    // Check response length (very basic quality check)
    if (agentResponse.length < 50) {
      issues.push({
        type: 'quality_concern',
        severity: 'low',
        description: `${persona} response seems too brief`,
        suggestedFix: 'Encourage more detailed responses from AI agents',
        affectedSection: persona
      });
    }

    return { issues };
  }
}

// Export singleton instance - will be initialized with LLM service when needed
export const projectDirectorService = new ProjectDirectorService();