// Enhanced Context Manager for Agent Communication
// Implements LangChain-inspired context passing and memory management

import { PersonaType, SatiricalFormat } from '../shared/types/index.js';
import { ProjectContext, ConversationMemory, CharacterProfile, KeyDecision, UserPreference } from './workflow-state.js';

export interface ContextSnapshot {
  id: string;
  projectId: string;
  timestamp: Date;
  context: ProjectContext;
  conversationSummary: string;
  characterConsistency: Map<string, string>;
  formatConstraints: string[];
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  formatConsistency: number; // 0-100
  characterConsistency: number; // 0-100
  toneConsistency: number; // 0-100
  overallQuality: number; // 0-100
  issueCount: number;
}

export interface ContextTransferPackage {
  fromPersona: PersonaType;
  toPersona: PersonaType;
  transferredContext: any;
  contextSummary: string;
  continuityInstructions: string[];
  qualityRequirements: string[];
  formatReminders: string[];
}

export interface ConversationContext {
  conversationId: string;
  participantPersonas: PersonaType[];
  messageHistory: ContextMessage[];
  sharedState: any;
  lastActivity: Date;
}

export interface ContextMessage {
  id: string;
  persona: PersonaType | 'USER' | 'SYSTEM';
  content: string;
  timestamp: Date;
  contextMarkers: string[];
  references: string[];
  qualityScore?: number;
}

/**
 * Enhanced Context Manager
 * Manages shared context, memory, and continuity between AI agents
 */
export class ContextManager {
  private contextSnapshots: Map<string, ContextSnapshot[]> = new Map();
  private activeContexts: Map<string, ConversationContext> = new Map();
  private characterProfiles: Map<string, CharacterProfile> = new Map();
  private formatConstraints: Map<SatiricalFormat, string[]> = new Map();

  constructor() {
    this.initializeFormatConstraints();
  }

  /**
   * Create enhanced context for agent interaction
   */
  async createEnhancedContext(
    projectId: string,
    persona: PersonaType,
    baseContext: any,
    conversationId: string
  ): Promise<any> {
    try {
      // Get current workflow state
      const contextSnapshot = await this.getLatestContextSnapshot(projectId);
      
      // Get conversation history with context
      const conversationContext = this.getConversationContext(conversationId);
      
      // Build enhanced context package
      const enhancedContext = {
        ...baseContext,
        
        // Workflow continuity
        workflowState: contextSnapshot?.context || baseContext,
        previousStageOutputs: this.getPreviousStageOutputs(contextSnapshot, persona),
        
        // Character consistency
        characterProfiles: this.getRelevantCharacterProfiles(projectId),
        characterConsistency: this.generateCharacterConsistencyReminders(),
        
        // Format compliance
        formatConstraints: this.getFormatConstraints(baseContext?.project?.satirical_format),
        formatGuidelines: this.getDetailedFormatGuidelines(baseContext?.project?.satirical_format),
        
        // Conversation memory
        conversationMemory: conversationContext?.sharedState || {},
        recentDecisions: this.getRecentKeyDecisions(projectId, 5),
        
        // Quality context
        qualityMetrics: contextSnapshot?.qualityMetrics || this.getDefaultQualityMetrics(),
        qualityRequirements: this.getQualityRequirements(persona),
        
        // Collaboration context
        collaborationInstructions: this.getCollaborationInstructions(persona, baseContext?.project?.satirical_format),
        handoffPreparation: this.getHandoffPreparation(persona),
        
        // Memory and continuity
        contextSummary: this.generateContextSummary(projectId, persona),
        runningThemes: this.getRunningThemes(projectId),
        userPreferences: this.getUserPreferences(projectId)
      };

      // Log context creation for debugging
      console.log(`📋 Enhanced context created for ${persona}:`, {
        characterProfiles: enhancedContext.characterProfiles?.length || 0,
        formatConstraints: enhancedContext.formatConstraints?.length || 0,
        recentDecisions: enhancedContext.recentDecisions?.length || 0,
        contextSummary: enhancedContext.contextSummary?.substring(0, 100) + '...'
      });

      return enhancedContext;

    } catch (error) {
      console.error('Failed to create enhanced context:', error);
      return baseContext; // Fallback to base context
    }
  }

  /**
   * Update context after agent interaction
   */
  async updateContextAfterInteraction(
    projectId: string,
    persona: PersonaType,
    userMessage: string,
    agentResponse: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Extract context markers from response
      const contextMarkers = this.extractContextMarkers(agentResponse);
      
      // Update conversation context
      await this.updateConversationContext(conversationId, {
        persona,
        content: agentResponse,
        contextMarkers,
        references: this.extractReferences(agentResponse),
        qualityScore: this.assessResponseQuality(agentResponse)
      });

      // Update character consistency if characters mentioned
      await this.updateCharacterConsistency(projectId, agentResponse);

      // Update shared memory
      await this.updateSharedMemory(projectId, persona, userMessage, agentResponse);

      // Create new context snapshot
      await this.createContextSnapshot(projectId, persona);

      console.log(`📝 Context updated after ${persona} interaction`);

    } catch (error) {
      console.error('Failed to update context:', error);
      // Non-blocking - context updates are supplementary
    }
  }

  /**
   * Prepare context transfer between agents
   */
  async prepareContextTransfer(
    projectId: string,
    fromPersona: PersonaType,
    toPersona: PersonaType,
    transferredOutput: any
  ): Promise<ContextTransferPackage> {
    const contextSnapshot = await this.getLatestContextSnapshot(projectId);
    
    const transferPackage: ContextTransferPackage = {
      fromPersona,
      toPersona,
      transferredContext: transferredOutput,
      contextSummary: this.generateTransferSummary(fromPersona, toPersona, transferredOutput),
      continuityInstructions: this.generateContinuityInstructions(fromPersona, toPersona, contextSnapshot),
      qualityRequirements: this.getQualityRequirements(toPersona),
      formatReminders: this.getFormatReminders(contextSnapshot?.context?.satiricalFormat)
    };

    console.log(`🔄 Context transfer prepared: ${fromPersona} → ${toPersona}`);
    return transferPackage;
  }

  /**
   * Get conversation memory for enhanced prompts
   */
  getConversationMemory(projectId: string): ConversationMemory {
    const contextSnapshot = this.getLatestContextSnapshot(projectId);
    return contextSnapshot?.context?.sharedMemory || {
      keyDecisions: [],
      characterDescriptions: new Map(),
      toneAndStyle: '',
      runningThemes: [],
      userPreferences: [],
      contextSummary: ''
    };
  }

  /**
   * Generate context-aware system prompt additions
   */
  generateContextPromptAdditions(
    persona: PersonaType,
    enhancedContext: any
  ): string {
    let contextPrompt = '\n\n## ENHANCED CONTEXT AWARENESS\n';

    // Character consistency reminders
    if (enhancedContext.characterProfiles && enhancedContext.characterProfiles.length > 0) {
      contextPrompt += '\n### CHARACTER CONSISTENCY\n';
      enhancedContext.characterProfiles.forEach((char: CharacterProfile) => {
        contextPrompt += `• **${char.name}**: ${char.description} (Visual: ${char.visualDescription})\n`;
      });
      contextPrompt += '\n⚠️ CRITICAL: Maintain exact character descriptions and visual consistency across all responses.\n';
    }

    // Previous stage context
    if (enhancedContext.previousStageOutputs) {
      contextPrompt += '\n### WORKFLOW CONTINUITY\n';
      contextPrompt += `Previous stage outputs: ${enhancedContext.previousStageOutputs}\n`;
      contextPrompt += '🔗 Build upon previous work while maintaining consistency.\n';
    }

    // Format constraints
    if (enhancedContext.formatConstraints && enhancedContext.formatConstraints.length > 0) {
      contextPrompt += '\n### FORMAT COMPLIANCE\n';
      enhancedContext.formatConstraints.forEach((constraint: string) => {
        contextPrompt += `• ${constraint}\n`;
      });
      contextPrompt += '\n🎬 Ensure all suggestions strictly adhere to format requirements.\n';
    }

    // Quality requirements
    if (enhancedContext.qualityRequirements) {
      contextPrompt += '\n### QUALITY STANDARDS\n';
      enhancedContext.qualityRequirements.forEach((req: string) => {
        contextPrompt += `• ${req}\n`;
      });
      contextPrompt += '\n✨ Maintain high quality standards in all outputs.\n';
    }

    // Recent decisions context
    if (enhancedContext.recentDecisions && enhancedContext.recentDecisions.length > 0) {
      contextPrompt += '\n### RECENT PROJECT DECISIONS\n';
      enhancedContext.recentDecisions.slice(0, 3).forEach((decision: KeyDecision) => {
        contextPrompt += `• ${decision.decision} (${decision.reasoning})\n`;
      });
      contextPrompt += '\n📋 Consider recent decisions in your recommendations.\n';
    }

    // User preferences
    if (enhancedContext.userPreferences && enhancedContext.userPreferences.length > 0) {
      contextPrompt += '\n### USER PREFERENCES\n';
      enhancedContext.userPreferences.forEach((pref: UserPreference) => {
        contextPrompt += `• ${pref.preference} (${pref.category})\n`;
      });
      contextPrompt += '\n👤 Respect established user preferences.\n';
    }

    // Context summary for quick reference
    if (enhancedContext.contextSummary) {
      contextPrompt += '\n### PROJECT CONTEXT SUMMARY\n';
      contextPrompt += enhancedContext.contextSummary + '\n';
    }

    return contextPrompt;
  }

  // Private helper methods

  private async getLatestContextSnapshot(projectId: string): Promise<ContextSnapshot | null> {
    const snapshots = this.contextSnapshots.get(projectId);
    return snapshots && snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  }

  private getConversationContext(conversationId: string): ConversationContext | null {
    return this.activeContexts.get(conversationId) || null;
  }

  private getPreviousStageOutputs(snapshot: ContextSnapshot | null, currentPersona: PersonaType): string {
    if (!snapshot) return 'No previous stage outputs available.';
    
    // This would be expanded to get actual previous outputs based on workflow state
    return 'Previous stages completed successfully with approved outputs.';
  }

  private getRelevantCharacterProfiles(projectId: string): CharacterProfile[] {
    // Would retrieve character profiles from project context
    return Array.from(this.characterProfiles.values());
  }

  private generateCharacterConsistencyReminders(): string[] {
    return [
      'Use exact character names and descriptions from previous stages',
      'Maintain visual consistency for character appearance',
      'Keep personality traits consistent across all interactions',
      'Reference established character relationships and dynamics'
    ];
  }

  private getFormatConstraints(format?: SatiricalFormat): string[] {
    if (!format) return [];
    return this.formatConstraints.get(format) || [];
  }

  private getDetailedFormatGuidelines(format?: SatiricalFormat): any {
    if (!format) return null;
    
    // This would return detailed format guidelines
    return {
      format,
      specificRequirements: this.getFormatConstraints(format),
      examples: this.getFormatExamples(format),
      technicalSpecs: this.getFormatTechnicalSpecs(format)
    };
  }

  private getRecentKeyDecisions(projectId: string, count: number): KeyDecision[] {
    const snapshot = this.getLatestContextSnapshot(projectId);
    if (!snapshot?.context?.sharedMemory?.keyDecisions) return [];
    
    return snapshot.context.sharedMemory.keyDecisions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      formatConsistency: 100,
      characterConsistency: 100,
      toneConsistency: 100,
      overallQuality: 100,
      issueCount: 0
    };
  }

  private getQualityRequirements(persona: PersonaType): string[] {
    const commonRequirements = [
      'Maintain format consistency throughout response',
      'Ensure character consistency if characters are mentioned',
      'Provide clear, actionable guidance',
      'Reference project context appropriately'
    ];

    const personaSpecific: Record<PersonaType, string[]> = {
      'CREATIVE_STRATEGIST': [
        'Identify specific satirical opportunities',
        'Provide concrete creative direction',
        'Suggest format-appropriate approaches'
      ],
      'BAFFLING_BROADCASTER': [
        'Maintain consistent broadcaster persona',
        'Create format-appropriate voiceover style',
        'Show oblivious disconnect from reality'
      ],
      'SATIRICAL_SCREENWRITER': [
        'Follow proper script formatting',
        'Develop consistent character voices',
        'Maintain narrative coherence'
      ],
      'CINEMATIC_STORYBOARDER': [
        'Respect 8-second shot limitations',
        'Provide detailed visual descriptions',
        'Consider technical production constraints'
      ],
      'SOUNDSCAPE_ARCHITECT': [
        'Specify audio for each visual element',
        'Maintain audio style consistency',
        'Consider format-specific audio requirements'
      ],
      'VIDEO_PROMPT_ENGINEER': [
        'Optimize for AI video generation',
        'Ensure character visual consistency',
        'Include all necessary prompt elements'
      ],
      'PROJECT_DIRECTOR': [
        'Provide strategic oversight',
        'Maintain project coherence',
        'Guide quality standards'
      ]
    };

    return [...commonRequirements, ...personaSpecific[persona]];
  }

  private getCollaborationInstructions(persona: PersonaType, format?: SatiricalFormat): string[] {
    return [
      'Signal clearly when your stage is complete',
      'Reference previous stage work appropriately',
      'Maintain format consistency with chosen style',
      'Prepare work for smooth handoff to next stage'
    ];
  }

  private getHandoffPreparation(persona: PersonaType): string[] {
    const handoffMap: Record<PersonaType, string[]> = {
      'CREATIVE_STRATEGIST': [
        'Ensure creative strategy is complete and approved',
        'Provide clear direction for script development',
        'Establish character foundations for consistency'
      ],
      'BAFFLING_BROADCASTER': [
        'Complete voiceover style and tone guidance',
        'Provide integration points for script development',
        'Establish presenter character consistency'
      ],
      'SATIRICAL_SCREENWRITER': [
        'Deliver complete script with scene breakdowns',
        'Establish shot-by-shot structure for storyboarding',
        'Confirm character development and dialogue'
      ],
      'CINEMATIC_STORYBOARDER': [
        'Provide detailed visual specifications',
        'Confirm all shots meet 8-second constraint',
        'Prepare visual elements for sound design integration'
      ],
      'SOUNDSCAPE_ARCHITECT': [
        'Complete audio specifications for all shots',
        'Provide integration guidance for final prompts',
        'Ensure audio complements visual elements'
      ],
      'VIDEO_PROMPT_ENGINEER': [
        'Generate optimized prompts for all shots',
        'Ensure character and format consistency',
        'Prepare prompts for AI video generation'
      ],
      'PROJECT_DIRECTOR': []
    };

    return handoffMap[persona];
  }

  private generateContextSummary(projectId: string, persona: PersonaType): string {
    const snapshot = this.getLatestContextSnapshot(projectId);
    if (!snapshot) return 'New project starting with initial context.';

    return snapshot.conversationSummary || 'Project context being established.';
  }

  private getRunningThemes(projectId: string): string[] {
    const snapshot = this.getLatestContextSnapshot(projectId);
    return snapshot?.context?.sharedMemory?.runningThemes || [];
  }

  private getUserPreferences(projectId: string): UserPreference[] {
    const snapshot = this.getLatestContextSnapshot(projectId);
    return snapshot?.context?.sharedMemory?.userPreferences || [];
  }

  private extractContextMarkers(response: string): string[] {
    // Extract context markers like character names, themes, format elements
    const markers: string[] = [];
    
    // Look for character name patterns
    const characterPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
    let match;
    while ((match = characterPattern.exec(response)) !== null) {
      markers.push(`character:${match[1]}`);
    }

    // Look for format-specific terms
    const formatTerms = ['news anchor', 'reporter', 'presenter', 'host', 'interviewer'];
    formatTerms.forEach(term => {
      if (response.toLowerCase().includes(term)) {
        markers.push(`format:${term}`);
      }
    });

    return [...new Set(markers)]; // Remove duplicates
  }

  private extractReferences(response: string): string[] {
    // Extract references to previous work, characters, or project elements
    const references: string[] = [];
    
    const referencePatterns = [
      /(?:from|in) the (\w+(?:\s+\w+)*)/gi,
      /as mentioned (?:in|by) (\w+(?:\s+\w+)*)/gi,
      /building on (\w+(?:\s+\w+)*)/gi
    ];

    referencePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        references.push(match[1]);
      }
    });

    return [...new Set(references)];
  }

  private assessResponseQuality(response: string): number {
    // Basic quality assessment
    let score = 50; // Base score

    // Length check
    if (response.length > 100) score += 10;
    if (response.length > 300) score += 10;

    // Structure check
    if (response.includes('\n')) score += 5;
    if (response.match(/\d+\./)) score += 10; // Numbered lists

    // Format awareness check
    const formatTerms = ['format', 'style', 'approach', 'satirical'];
    formatTerms.forEach(term => {
      if (response.toLowerCase().includes(term)) score += 5;
    });

    return Math.min(score, 100);
  }

  private async updateConversationContext(
    conversationId: string,
    message: Omit<ContextMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    let context = this.activeContexts.get(conversationId);
    
    if (!context) {
      context = {
        conversationId,
        participantPersonas: [message.persona] as PersonaType[],
        messageHistory: [],
        sharedState: {},
        lastActivity: new Date()
      };
      this.activeContexts.set(conversationId, context);
    }

    const contextMessage: ContextMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date()
    };

    context.messageHistory.push(contextMessage);
    context.lastActivity = new Date();

    // Keep only recent messages to manage memory
    if (context.messageHistory.length > 50) {
      context.messageHistory = context.messageHistory.slice(-30);
    }
  }

  private async updateCharacterConsistency(projectId: string, response: string): Promise<void> {
    // Extract character mentions and update consistency tracking
    const characterMentions = this.extractCharacterMentions(response);
    
    characterMentions.forEach(mention => {
      const profile = this.characterProfiles.get(mention.name);
      if (profile) {
        // Update character profile with any new information
        if (mention.description && mention.description !== profile.description) {
          console.warn(`⚠️ Character description inconsistency detected for ${mention.name}`);
        }
      } else {
        // Create new character profile
        const newProfile: CharacterProfile = {
          id: this.generateCharacterId(),
          name: mention.name,
          description: mention.description || '',
          visualDescription: mention.visualDescription || '',
          personality: mention.personality || '',
          role: mention.role || '',
          consistency: mention.name // For AI prompt consistency
        };
        this.characterProfiles.set(mention.name, newProfile);
      }
    });
  }

  private async updateSharedMemory(
    projectId: string,
    persona: PersonaType,
    userMessage: string,
    agentResponse: string
  ): Promise<void> {
    // This would update the shared memory with new information
    // Implementation would extract themes, decisions, preferences from the interaction
    console.log(`📚 Updating shared memory after ${persona} interaction`);
  }

  private async createContextSnapshot(projectId: string, persona: PersonaType): Promise<void> {
    const snapshot: ContextSnapshot = {
      id: this.generateSnapshotId(),
      projectId,
      timestamp: new Date(),
      context: {} as ProjectContext, // Would be populated with actual context
      conversationSummary: `${persona} interaction completed`,
      characterConsistency: this.characterProfiles,
      formatConstraints: [],
      qualityMetrics: this.getDefaultQualityMetrics()
    };

    let snapshots = this.contextSnapshots.get(projectId);
    if (!snapshots) {
      snapshots = [];
      this.contextSnapshots.set(projectId, snapshots);
    }

    snapshots.push(snapshot);

    // Keep only recent snapshots
    if (snapshots.length > 20) {
      this.contextSnapshots.set(projectId, snapshots.slice(-10));
    }
  }

  private generateTransferSummary(
    fromPersona: PersonaType,
    toPersona: PersonaType,
    output: any
  ): string {
    return `${fromPersona} completed their work and is transferring to ${toPersona}. Output: ${this.summarizeOutput(output)}`;
  }

  private generateContinuityInstructions(
    fromPersona: PersonaType,
    toPersona: PersonaType,
    snapshot: ContextSnapshot | null
  ): string[] {
    return [
      `Build upon the work completed by ${fromPersona}`,
      'Maintain character and format consistency',
      'Reference established project elements appropriately',
      'Prepare output for next stage requirements'
    ];
  }

  private getFormatReminders(format?: SatiricalFormat): string[] {
    if (!format) return [];
    
    return [
      `Ensure all content aligns with ${format} format`,
      'Maintain visual and audio style consistency',
      'Reference format-specific examples and conventions',
      'Consider technical constraints for this format'
    ];
  }

  private initializeFormatConstraints(): void {
    this.formatConstraints.set('NEWS_PARODY', [
      'Authoritative presenter tone',
      'Professional news studio setup',
      'Serious graphics and lower thirds',
      'News-style pacing and delivery'
    ]);

    this.formatConstraints.set('VOX_POP', [
      'Street interview setting',
      'Diverse public participants',
      'Handheld camera aesthetic',
      'Quick cuts between responses'
    ]);

    this.formatConstraints.set('MORNING_TV_INTERVIEW', [
      'Bright breakfast TV studio',
      'Sofa interview arrangement',
      'Chirpy presenter personality',
      'Upbeat morning energy'
    ]);

    // Add other formats...
  }

  private getFormatExamples(format: SatiricalFormat): string[] {
    const examples: Record<SatiricalFormat, string[]> = {
      'NEWS_PARODY': ['The Day Today', 'Brass Eye', 'Clarke and Dawe'],
      'VOX_POP': ['The Chaser vox pops', 'Private Eye street interviews'],
      'MORNING_TV_INTERVIEW': ['The Day Today morning segments', 'Brass Eye interviews'],
      // Add other formats...
    } as any;

    return examples[format] || [];
  }

  private getFormatTechnicalSpecs(format: SatiricalFormat): any {
    // Return technical specifications for the format
    return {
      aspectRatio: '16:9',
      duration: 'Variable',
      shotLimit: '8 seconds maximum',
      audioRequirements: 'Format-specific'
    };
  }

  private extractCharacterMentions(response: string): any[] {
    // Extract character mentions with context
    return []; // Implementation would parse response for character information
  }

  private summarizeOutput(output: any): string {
    if (typeof output === 'string') {
      return output.length > 100 ? output.substring(0, 100) + '...' : output;
    }
    return JSON.stringify(output).substring(0, 100) + '...';
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCharacterId(): string {
    return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const contextManager = new ContextManager();