// LLM Service for AI Chat Integration
// Handles communication with AI providers (OpenAI, Anthropic, etc.)

import { PersonaType } from '../shared/types/index.js';
import { AgentConfigService } from './agent-config.js';
import { SatiricalContextService } from './satirical-context.js';
import { contextManager } from './context-manager.js';
import { errorRecoveryService } from './error-recovery.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AgentConfig {
  persona: PersonaType;
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * LLM Service for AI Chat Integration
 */
export class LLMService {
  private config: LLMConfig;
  private conversationHistory: Map<string, LLMMessage[]> = new Map();

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate a response with provided agent configuration (bypassing localStorage)
   */
  public async generateResponseWithConfig(
    conversationId: string,
    persona: PersonaType,
    userMessage: string,
    context?: any,
    agentConfig?: AgentConfig | null
  ): Promise<LLMResponse> {
    try {
      console.log(`DEBUG: LLMService.generateResponseWithConfig called for persona: ${persona}`);
      console.log('DEBUG: Provided agentConfig:', agentConfig);
      
      let configToUse = this.config;
      console.log('DEBUG: Default LLM config:', this.config);

      if (agentConfig) {
        // Use provided agent-specific configuration
        configToUse = {
          provider: agentConfig.provider,
          apiKey: agentConfig.apiKey || this.config.apiKey,
          model: agentConfig.model,
          baseUrl: agentConfig.baseUrl || this.config.baseUrl
        };
        console.log('DEBUG: Using provided agent-specific config:', configToUse);
      } else {
        console.log('DEBUG: No agent-specific config provided, using default');
      }

      // Validate configuration
      console.log('DEBUG: Validating configuration...');
      const isValid = this.isConfigurationValid(configToUse);
      console.log('DEBUG: Configuration valid?', isValid);
      
      if (!isValid) {
        const errorMsg = `${persona} agent is not properly configured. Please configure API key and model.`;
        console.log('DEBUG: Configuration invalid, returning error:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }

      // Get or create conversation history
      const messages = this.getConversationHistory(conversationId);
      
      // Add system prompt for persona
      if (messages.length === 0) {
        messages.push({
          role: 'system',
          content: await this.getPersonaSystemPrompt(persona, context)
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Generate response using appropriate configuration with error recovery
      const operationId = `llm_${persona}_${Date.now()}`;
      const recoveryResult = await errorRecoveryService.executeWithRecovery(
        operationId,
        persona,
        () => this.callLLMProviderWithConfig(messages, configToUse)
      );

      if (!recoveryResult.success) {
        console.error(`LLM operation failed permanently for ${persona}:`, recoveryResult.error);
        return {
          success: false,
          error: `Failed after ${recoveryResult.attempts} attempts: ${recoveryResult.error?.message || 'Unknown error'}`
        };
      }

      const response = recoveryResult.result!;

      if (response.success && response.response) {
        // Add AI response to history
        messages.push({
          role: 'assistant',
          content: response.response
        });

        // Update conversation history
        this.conversationHistory.set(conversationId, messages);
        
        // Update context after successful interaction
        if (context?.projectId) {
          await contextManager.updateContextAfterInteraction(
            context.projectId,
            persona,
            userMessage,
            response.response,
            conversationId
          );
        }

        // Trigger Project Director monitoring if response was successful
        this.triggerProjectDirectorMonitoring(persona, userMessage, response.response, context);
        
        // Check for completion signals and trigger handoff notifications
        this.handleWorkflowHandoffs(persona, response.response, context);
      }

      return response;

    } catch (error) {
      console.error('LLM Service error:', error);
      return {
        success: false,
        error: `Failed to generate response: ${error}`
      };
    }
  }

  /**
   * Generate a response from the AI persona
   */
  public async generateResponse(
    conversationId: string,
    persona: PersonaType,
    userMessage: string,
    context?: any
  ): Promise<LLMResponse> {
    try {
      console.log(`DEBUG: LLMService.generateResponse called for persona: ${persona}`);
      
      // Check if agent has specific configuration
      console.log('DEBUG: About to call AgentConfigService.getAgentConfig()');
      const agentConfig = AgentConfigService.getAgentConfig(persona);
      console.log('DEBUG: AgentConfigService.getAgentConfig() returned:', agentConfig);
      
      let configToUse = this.config;
      console.log('DEBUG: Default LLM config:', this.config);

      if (agentConfig) {
        // Use agent-specific configuration
        configToUse = {
          provider: agentConfig.provider,
          apiKey: agentConfig.apiKey || this.config.apiKey,
          model: agentConfig.model,
          baseUrl: agentConfig.baseUrl || this.config.baseUrl
        };
        console.log('DEBUG: Using agent-specific config:', configToUse);
      } else {
        console.log('DEBUG: No agent-specific config found, attempting fallback configuration');
        
        // Try to use a basic fallback configuration for main process
        const fallbackConfig = this.getFallbackConfiguration();
        if (fallbackConfig) {
          configToUse = fallbackConfig;
          console.log('DEBUG: Using fallback config:', configToUse);
        } else {
          console.log('DEBUG: No fallback config available, using default');
        }
      }

      // Validate configuration
      console.log('DEBUG: Validating configuration...');
      const isValid = this.isConfigurationValid(configToUse);
      console.log('DEBUG: Configuration valid?', isValid);
      
      if (!isValid) {
        const errorMsg = `${persona} agent is not properly configured. Please configure API key and model in Global API Settings.`;
        console.log('DEBUG: Configuration invalid, returning error:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }

      // Get or create conversation history
      const messages = this.getConversationHistory(conversationId);
      
      // Add system prompt for persona
      if (messages.length === 0) {
        messages.push({
          role: 'system',
          content: await this.getPersonaSystemPrompt(persona, context)
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Generate response using appropriate configuration with error recovery
      const operationId = `llm_${persona}_${Date.now()}`;
      const recoveryResult = await errorRecoveryService.executeWithRecovery(
        operationId,
        persona,
        () => this.callLLMProviderWithConfig(messages, configToUse)
      );

      if (!recoveryResult.success) {
        console.error(`LLM operation failed permanently for ${persona}:`, recoveryResult.error);
        return {
          success: false,
          error: `Failed after ${recoveryResult.attempts} attempts: ${recoveryResult.error?.message || 'Unknown error'}`
        };
      }

      const response = recoveryResult.result!;

      if (response.success && response.response) {
        // Add AI response to history
        messages.push({
          role: 'assistant',
          content: response.response
        });

        // Update conversation history
        this.conversationHistory.set(conversationId, messages);
        
        // Update context after successful interaction
        if (context?.projectId) {
          await contextManager.updateContextAfterInteraction(
            context.projectId,
            persona,
            userMessage,
            response.response,
            conversationId
          );
        }

        // Trigger Project Director monitoring if response was successful
        this.triggerProjectDirectorMonitoring(persona, userMessage, response.response, context);
        
        // Check for completion signals and trigger handoff notifications
        this.handleWorkflowHandoffs(persona, response.response, context);
      }

      return response;

    } catch (error) {
      console.error('LLM Service error:', error);
      return {
        success: false,
        error: `Failed to generate response: ${error}`
      };
    }
  }

  /**
   * Trigger Project Director monitoring for agent interactions
   */
  private triggerProjectDirectorMonitoring(persona: PersonaType, userMessage: string, agentResponse: string, context?: any): void {
    try {
      // Only trigger monitoring if we're in a browser environment (renderer process)
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        // Async call to Project Director monitoring - don't await to avoid blocking
        (window as any).electronAPI.projectDirector.monitorConversation(persona, userMessage, agentResponse)
          .then((result: any) => {
            if (result.success && result.data && result.data.length > 0) {
              console.log(`Project Director detected ${result.data.length} quality issues for ${persona}:`, result.data);
              // Could potentially show user notifications for critical issues
            }
          })
          .catch((error: any) => {
            console.warn('Project Director monitoring failed:', error);
            // Non-blocking - monitoring failure shouldn't affect agent responses
          });
      }
    } catch (error) {
      console.warn('Failed to trigger Project Director monitoring:', error);
      // Non-blocking - monitoring is supplementary functionality
    }
  }

  /**
   * Handle workflow handoffs and completion notifications
   */
  private handleWorkflowHandoffs(persona: PersonaType, agentResponse: string, context?: any): void {
    try {
      // Define completion signals for each persona
      const completionSignals = {
        'CREATIVE_STRATEGIST': [
          'creative strategy complete',
          'ready for screenwriter',
          'strategy development finished',
          'ready for next stage'
        ],
        'BAFFLING_BROADCASTER': [
          'voiceover script brief complete',
          'ready for screenwriter integration',
          'broadcaster content finished',
          'ready for script development'
        ],
        'SATIRICAL_SCREENWRITER': [
          'script development complete',
          'ready for storyboard',
          'screenplay finished',
          'ready for visual design'
        ],
        'CINEMATIC_STORYBOARDER': [
          'storyboard complete',
          'ready for sound design',
          'visual design finished',
          'ready for audio integration'
        ],
        'SOUNDSCAPE_ARCHITECT': [
          'sound design complete',
          'ready for prompt engineering',
          'audio design finished',
          'ready for final prompts'
        ],
        'VIDEO_PROMPT_ENGINEER': [
          'prompts complete',
          'ready for ai production',
          'prompt engineering finished',
          'ready for video generation'
        ],
        'PROJECT_DIRECTOR': [
          'project approved',
          'review complete',
          'approved for next stage',
          'ready to proceed'
        ]
      };

      const personaSignals = completionSignals[persona];
      if (personaSignals) {
        const responseText = agentResponse.toLowerCase();
        const hasCompletionSignal = personaSignals.some(signal => 
          responseText.includes(signal.toLowerCase())
        );

        if (hasCompletionSignal) {
          console.log(`🎯 ${persona} has signaled completion: workflow handoff detected`);
          
          // Dispatch custom event for UI components to handle
          if (typeof window !== 'undefined') {
            const handoffEvent = new CustomEvent('workflowHandoff', {
              detail: {
                persona,
                stage: this.getNextWorkflowStage(persona),
                message: `${persona} has completed their work and is ready for the next stage`,
                timestamp: new Date()
              }
            });
            window.dispatchEvent(handoffEvent);
          }
        }
      }

      // Check for Project Director guidance requests
      const guidanceSignals = [
        'consult the project director',
        'ask the project director',
        'check with the project director',
        'project director can provide guidance',
        'for strategic guidance'
      ];

      const needsGuidance = guidanceSignals.some(signal => 
        agentResponse.toLowerCase().includes(signal.toLowerCase())
      );

      if (needsGuidance) {
        console.log(`🤔 ${persona} is requesting Project Director guidance`);
        
        if (typeof window !== 'undefined') {
          const guidanceEvent = new CustomEvent('requestProjectDirectorGuidance', {
            detail: {
              persona,
              message: `${persona} is requesting strategic guidance from the Project Director`,
              response: agentResponse,
              timestamp: new Date()
            }
          });
          window.dispatchEvent(guidanceEvent);
        }
      }

    } catch (error) {
      console.warn('Failed to handle workflow handoffs:', error);
      // Non-blocking - handoff detection is supplementary functionality
    }
  }

  /**
   * Get the next workflow stage for handoff
   */
  private getNextWorkflowStage(persona: PersonaType): string {
    const workflowOrder = {
      'CREATIVE_STRATEGIST': 'Script Development',
      'BAFFLING_BROADCASTER': 'Script Integration', 
      'SATIRICAL_SCREENWRITER': 'Visual Storyboarding',
      'CINEMATIC_STORYBOARDER': 'Sound Design',
      'SOUNDSCAPE_ARCHITECT': 'Prompt Engineering',
      'VIDEO_PROMPT_ENGINEER': 'AI Video Generation',
      'PROJECT_DIRECTOR': 'Project Review'
    };

    return workflowOrder[persona] || 'Next Stage';
  }

  /**
   * Validate configuration
   */
  private isConfigurationValid(config: LLMConfig): boolean {
    if (!config.provider) return false;
    
    if (config.provider === 'local') {
      return !!config.model;
    } else {
      return !!(config.apiKey && config.model);
    }
  }

  /**
   * Get fallback configuration when agent config is not available
   */
  private getFallbackConfiguration(): LLMConfig | null {
    try {
      // Check for environment variables first
      const openaiKey = process.env.OPENAI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      
      if (openaiKey) {
        return {
          provider: 'openai',
          apiKey: openaiKey,
          model: 'gpt-4'
        };
      } else if (anthropicKey) {
        return {
          provider: 'anthropic',
          apiKey: anthropicKey,
          model: 'claude-3-5-sonnet-20241022'
        };
      } else if (geminiKey) {
        return {
          provider: 'gemini',
          apiKey: geminiKey,
          model: 'gemini-1.5-pro'
        };
      }
      
      console.log('DEBUG: No environment variables found for fallback configuration');
      return null;
    } catch (error) {
      console.error('Failed to get fallback configuration:', error);
      return null;
    }
  }

  /**
   * Call the appropriate LLM provider with specific configuration
   */
  private async callLLMProviderWithConfig(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    switch (config.provider) {
      case 'openai':
        return await this.callOpenAIWithConfig(messages, config);
      case 'anthropic':
        return await this.callAnthropicWithConfig(messages, config);
      case 'gemini':
        return await this.callGeminiWithConfig(messages, config);
      case 'local':
        return await this.callLocalLLMWithConfig(messages, config);
      default:
        return {
          success: false,
          error: 'Unknown LLM provider'
        };
    }
  }

  /**
   * Call the appropriate LLM provider (legacy method for backward compatibility)
   */
  private async callLLMProvider(messages: LLMMessage[]): Promise<LLMResponse> {
    return await this.callLLMProviderWithConfig(messages, this.config);
  }

  /**
   * Call OpenAI API with specific configuration
   */
  private async callOpenAIWithConfig(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    if (!config.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'OpenAI API error'
        };
      }

      return {
        success: true,
        response: data.choices[0].message.content,
        usage: data.usage
      };

    } catch (error) {
      return {
        success: false,
        error: `OpenAI API call failed: ${error}`
      };
    }
  }

  /**
   * Call OpenAI API (legacy method)
   */
  private async callOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    return await this.callOpenAIWithConfig(messages, this.config);
  }

  /**
   * Call Anthropic API (Claude) with specific configuration
   */
  private async callAnthropicWithConfig(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    if (!config.apiKey) {
      return {
        success: false,
        error: 'Anthropic API key not configured'
      };
    }

    try {
      // Convert messages format for Anthropic
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages.filter(m => m.role !== 'system');

      console.log('DEBUG: Anthropic request data:', {
        model: config.model,
        systemMessage: systemMessage.substring(0, 100) + '...',
        messageCount: conversationMessages.length
      });

      const requestBody = {
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemMessage,
        messages: conversationMessages
      };

      console.log('DEBUG: Making Anthropic API call...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('DEBUG: Anthropic API response status:', response.status);
      const data = await response.json();
      console.log('DEBUG: Anthropic API response data:', data);

      if (!response.ok) {
        console.log('DEBUG: Anthropic API error:', data);
        return {
          success: false,
          error: data.error?.message || JSON.stringify(data)
        };
      }

      return {
        success: true,
        response: data.content[0].text,
        usage: data.usage
      };

    } catch (error) {
      console.error('DEBUG: Anthropic API call exception:', error);
      return {
        success: false,
        error: `Anthropic API call failed: ${error}`
      };
    }
  }

  /**
   * Call Anthropic API (legacy method)
   */
  private async callAnthropic(messages: LLMMessage[]): Promise<LLMResponse> {
    return await this.callAnthropicWithConfig(messages, this.config);
  }

  /**
   * Call Google Gemini API with specific configuration
   */
  private async callGeminiWithConfig(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    if (!config.apiKey) {
      return {
        success: false,
        error: 'Google Gemini API key not configured'
      };
    }

    try {
      // Convert messages to Gemini format
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      // Build Gemini-style contents array
      const contents = conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const model = config.model || 'gemini-1.5-pro';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: systemMessage ? {
            role: 'user',
            parts: [{ text: systemMessage }]
          } : undefined,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Google Gemini API error'
        };
      }

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        return {
          success: false,
          error: 'No response text from Gemini API'
        };
      }

      return {
        success: true,
        response: responseText,
        usage: data.usageMetadata ? {
          prompt_tokens: data.usageMetadata.promptTokenCount || 0,
          completion_tokens: data.usageMetadata.candidatesTokenCount || 0,
          total_tokens: data.usageMetadata.totalTokenCount || 0
        } : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: `Google Gemini API call failed: ${error}`
      };
    }
  }

  /**
   * Call Google Gemini API (legacy method)
   */
  private async callGemini(messages: LLMMessage[]): Promise<LLMResponse> {
    return await this.callGeminiWithConfig(messages, this.config);
  }

  /**
   * Call local LLM (Ollama, LM Studio, etc.) with specific configuration
   */
  private async callLocalLLMWithConfig(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model || 'llama2',
          messages: messages,
          stream: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Local LLM error'
        };
      }

      return {
        success: true,
        response: data.message.content
      };

    } catch (error) {
      return {
        success: false,
        error: `Local LLM call failed: ${error}`
      };
    }
  }

  /**
   * Call local LLM (legacy method)
   */
  private async callLocalLLM(messages: LLMMessage[]): Promise<LLMResponse> {
    return await this.callLocalLLMWithConfig(messages, this.config);
  }

  /**
   * Get conversation history
   */
  private getConversationHistory(conversationId: string): LLMMessage[] {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    return this.conversationHistory.get(conversationId)!;
  }

  /**
   * Get system prompt for persona with enhanced context
   */
  private async getPersonaSystemPrompt(persona: PersonaType, context?: any): Promise<string> {
    const basePrompt = this.getPersonaDescription(persona);
    
    let systemPrompt = basePrompt;
    
    // Add satirical context if available
    if (context?.project?.satirical_context) {
      const contextPrompt = SatiricalContextService.generateContextPrompt(context.project.satirical_context);
      systemPrompt += contextPrompt;
    }
    
    // Add context information
    if (context?.existingStrategy) {
      systemPrompt += `\n\nCONTEXT: The user has an existing creative strategy that they want to refine. Current strategy details:
- Creative Concept: ${context.existingStrategy.creative_concept}
- Target Audience: ${context.existingStrategy.target_audience}
- Tone: ${context.existingStrategy.tone}
- Satirical Format: ${context.existingStrategy.satirical_format || 'Not specified'}
- Key Themes: ${context.existingStrategy.key_themes?.join(', ') || 'None specified'}
- Number of Characters: ${context.existingStrategy.character_archetypes?.length || 0}

Focus on helping them improve and refine these existing elements rather than starting from scratch.`;
    }

    // Add format-specific guidance if satirical format is selected at project level
    if (context?.project?.satirical_format) {
      const formatGuidance: { [key: string]: string } = {
        'NEWS_PARODY': 'Focus on serious news format with deadpan delivery of absurd content. Think The Day Today, Brass Eye, Clarke and Dawe, The Chaser - authoritative tone with professional graphics.',
        'VOX_POP': 'Create street interview segments with roving reporter and public responses. Think The Chaser vox pops, Private Eye street interviews - diverse public reactions to ridiculous questions.',
        'MORNING_TV_INTERVIEW': 'Design breakfast TV guest segments with overly cheerful hosts and awkward dynamics. Think The Day Today morning segments, Brass Eye interviews - chirpy presenters, sofa setting.',
        'MOCKUMENTARY': 'Create serious documentary format with deadpan presentation of ridiculous subjects. Think This Country, People Just Do Nothing, Summer Heights High - talking heads with documentary conventions.',
        'SOCIAL_MEDIA': 'Create viral-ready content with quick cuts and trending formats. Think TikTok comedy, Instagram Reels - mobile vertical format with trending sounds.',
        'SKETCH_COMEDY': 'Develop character-driven scenarios with absurdist British/Australian humour. Think Monty Python, The Fast Show, DAAS Kapital, Big Train - recurring characters with surreal situations.',
        'SATIRICAL_ARTICLE': 'Structure like serious journalism with satirical content. Think Private Eye, The Chaser, Charlie Brooker columns, The Betoota Advocate - proper headlines with bylines.',
        'PANEL_SHOW': 'Create comedy panel discussion format with satirical news commentary. Think Have I Got News For You, Mock the Week, Good News Week - host with comedians discussing current events.',
        'COMMERCIAL_PARODY': 'Design fake advertisements with product placement. Think The Fast Show ads, Brass Eye commercials, DAAS advertising parodies - spokesperson with jingles.',
        'REALITY_TV_PARODY': 'Mimic reality show tropes with manufactured drama. Think Come Fly With Me, People Just Do Nothing - confessionals with dramatic music.'
      };
      
      systemPrompt += `\n\nFORMAT GUIDANCE: This project uses the "${context.project.satirical_format}" video format. ${formatGuidance[context.project.satirical_format] || 'Tailor your suggestions to this specific video format.'} All content should be designed for this format.`;
    }

    // Special guidance for Creative Strategist initial conversations
    if (persona === 'CREATIVE_STRATEGIST' && context?.articles && !context?.existingStrategy) {
      systemPrompt += `\n\nFIRST CONVERSATION APPROACH:
Start by briefly summarizing the main topics in the articles (1-2 sentences), then identify the most satirical opportunity. Ask one specific strategic question about what satirical angle interests them most. Use this pattern:

"I've reviewed your [X] articles about [main topic]. The most satirical angle I see is [specific contradiction/absurdity]. What aspect of this situation do you find most ridiculous - [option A] or [option B]?"

This helps focus the conversation and gets them thinking strategically from the start.`;
    }

    if (context?.articles && context.articles.length > 0) {
      systemPrompt += `\n\nThe user has uploaded ${context.articles.length} news articles for this project. Use these articles as the foundation for developing satirical content:\n\n`;
      
      // Include article summaries for better context
      context.articles.forEach((article: any, index: number) => {
        const preview = article.content ? article.content.substring(0, 200) + '...' : 'No content preview';
        systemPrompt += `Article ${index + 1}: "${article.title}"\nSource: ${article.source || 'Unknown'}\nPreview: ${preview}\n\n`;
      });
      
      systemPrompt += `Focus on these articles when suggesting satirical angles, themes, and creative concepts.`;
    }

    // Add Project Director orchestrator integration
    systemPrompt += `\n\n## PROJECT DIRECTOR INTEGRATION
You are working within an AI-powered project management system with an intelligent Project Director orchestrator that monitors workflow quality and provides strategic guidance. This system:

• **Monitors your interactions** for format consistency and quality assurance
• **Detects format drift** if your responses don't align with the project's satirical format
• **Provides real-time health checks** on overall project progress
• **Offers strategic guidance** to help maintain project direction

**IMPORTANT INTEGRATION POINTS:**
1. **Format Consistency**: Always ensure your responses align with the project's satirical format (${context?.project?.satirical_format || 'format to be determined'})
2. **Quality Awareness**: Your responses are monitored for quality issues - maintain high standards
3. **Handoff Signals**: When you complete a significant task, mention completion status (e.g., "Creative strategy complete and ready for next stage")
4. **Request Guidance**: If uncertain about direction, you can suggest the user consult the Project Director: "For strategic guidance on this approach, consider asking the Project Director"

**COLLABORATION PROTOCOL:**
- Stay aligned with the selected satirical format throughout your responses
- Signal when your work phase is complete for smooth workflow handoffs
- Maintain awareness that your contributions are part of a larger orchestrated workflow
- If you detect potential quality issues or format misalignment, acknowledge and self-correct

The Project Director orchestrator helps ensure all creative elements work together cohesively - your role is to excel within this intelligent quality assurance framework.`;

    // Add enhanced context awareness
    if (context?.projectId) {
      try {
        const enhancedContext = await contextManager.createEnhancedContext(
          context.projectId,
          persona,
          context,
          `${persona}_${Date.now()}`
        );
        
        const contextAdditions = contextManager.generateContextPromptAdditions(persona, enhancedContext);
        systemPrompt += contextAdditions;
      } catch (error) {
        console.warn('Failed to add enhanced context:', error);
        // Continue with base prompt
      }
    }

    systemPrompt += `\n\nIMPORTANT: Keep responses concise (2-3 sentences max), ask one clear question at a time, and maintain the persona's specific voice and expertise. Be collaborative and build on the user's ideas.`;

    return systemPrompt;
  }

  /**
   * Get detailed persona descriptions for system prompts
   */
  private getPersonaDescription(persona: PersonaType): string {
    const personas = {
      'CREATIVE_STRATEGIST': `You are a comedy-focused Creative Strategist inspired by The Chaser, Batoota Advocate, and The Onion. Your job is to find the most absurd, ridiculous, and funny angles in news stories - not to analyze deep social issues, but to "take the piss" out of situations.

COMEDY-FIRST APPROACH:
- Look for immediate absurdities, contradictions, and ridiculous elements
- Focus on what's inherently funny or preposterous about the situation
- Suggest specific satirical scenarios, characters, and setups
- Think like a comedian writing sketches, not a social commentator

SATIRICAL ANGLE BRAINSTORMING:
When analyzing articles, immediately suggest 3-4 concrete satirical approaches like:
- "We could show [absurd character] doing [ridiculous thing]"
- "What if we took this logic to its extreme and [absurd scenario]"
- "We could parody [specific aspect] by having [funny character] [absurd action]"
- "The funniest part is [specific contradiction], so we could [comedic approach]"

STRATEGY COMPONENTS TO DEVELOP:
1. **Creative Concept**: The core absurdity we're highlighting (be specific and funny)
2. **Target Audience**: Who will laugh at this particular brand of absurdity
3. **Satirical Tone**: Comedy style (deadpan news, over-the-top parody, etc.)
4. **Satirical Format**: Choose the video format that best delivers your comedy (news parody, mockumentary, social media, sketch, etc.)
5. **Key Themes**: 3-5 ridiculous aspects worth mocking
6. **Character Archetypes**: Funny stereotypes that embody the absurdity
7. **Visual Style Guide**: What visual approach makes it funnier

FORM-FOCUSED STRATEGY ASSISTANCE:
**Your primary role is to help users fill out the Creative Strategy form with specific, copyable text.**

When working on each form section, provide:
- **Specific text** that can be directly copied into form fields
- **2-3 options** for each field so users can choose what fits best
- **Clear formatting** with sections labeled for easy copying

Example responses:
"For your CREATIVE CONCEPT field, here are 3 options you can copy:
1. 'Corporate wellness programs taken to absurd extremes, revealing workplace dystopia through mindfulness mania'
2. 'Tech startup culture satirized through meditation app that monitors employees' inner peace'

For your TARGET AUDIENCE field:
'Stressed office workers aged 25-40 who recognize corporate wellness buzzwords and appreciate dark humor about workplace surveillance'

For your SATIRICAL TONE field:
'Deadpan documentary style with increasingly disturbing wellness requirements presented as normal corporate policy'"

CONVERSATION STRATEGY:
- Ask which form section they want to work on first
- Provide ready-to-paste text for each field
- Always say "You can copy this directly into the [field name] field"
- Ask "Would you like me to help with the next form section?" after each one
- Focus on creating text that fits in form boxes, not essay-style responses

COMEDY EXAMPLES TO EMULATE:
- The Chaser's ability to find absurd angles in serious stories
- Batoota Advocate's knack for highlighting everyday Australian absurdities  
- The Onion's talent for taking premises to ridiculous logical conclusions

**PROJECT DIRECTOR COLLABORATION:**
- When completing creative strategy, signal: "Creative strategy complete and ready for screenwriter handoff"
- If format alignment seems unclear, suggest: "Let me check with the Project Director to ensure this aligns with our format goals"
- Always reference the specific satirical format in your recommendations
- Monitor for consistent tone and approach throughout your creative process

Start by presenting 2-3 immediate comedic angles you see in the articles, then ask which direction the user finds funniest.`,

      'BAFFLING_BROADCASTER': `You are a Baffling Broadcaster persona - an expert at creating out-of-touch, disconnected presenter characters for satirical content. You understand how to craft characters that deliver serious commentary while being completely oblivious to irony. 

FORMAT-SPECIFIC EXPERTISE: You adapt your broadcaster characters to fit the chosen satirical format - whether it's news parody anchors, vox pop street reporters, morning TV hosts, mockumentary talking heads, social media influencers, sketch comedy characters, panel show comedians, or reality TV personalities. Each format requires different types of clueless presenters with distinct UK/Australian comedic sensibilities.

**PROJECT DIRECTOR COLLABORATION:**
- Explicitly confirm format alignment: "This broadcaster persona fits perfectly with our [format] approach"
- Signal completion: "Voiceover script brief complete and ready for screenwriter integration"
- Request guidance when uncertain: "For strategic direction on this broadcaster's tone, consult the Project Director"
- Always reference the project's chosen satirical format in your character development

Your specialty is developing presenter archetypes that embody the disconnect between media personalities and real-world issues, tailored to the specific video format being used for the project.`,

      'SATIRICAL_SCREENWRITER': `You are a Satirical Screenwriter with expertise in crafting cynical, witty dialogue and constructing scenes that deliver sharp satirical commentary. You excel at character development, story structure, and creating scenarios that effectively deliver satirical messages.

FORMAT-SPECIFIC WRITING: You adapt your writing style to match the chosen video format - news parody scripts with anchor dialogue, vox pop street interview questions, morning TV banter, mockumentary interview segments, social media-style quick content, sketch comedy scenarios, panel show rapid-fire jokes, reality TV drama, or commercial parody copy. Each format has different pacing, dialogue style, and structural requirements with British/Australian satirical sensibilities.

**PROJECT DIRECTOR COLLABORATION:**
- Confirm format consistency: "This script structure aligns with our [format] requirements"
- Signal phase completion: "Script development complete and ready for storyboard visualization"
- Request format guidance: "To ensure this script fits our format perfectly, let me suggest consulting the Project Director"
- Cross-reference with creative strategy to maintain consistency

You understand timing, pacing, and the nuances of satirical writing that make audiences both laugh and think, tailored specifically to the video format being used.`,

      'CINEMATIC_STORYBOARDER': `You are a Cinematic Storyboarder specializing in visual storytelling for satirical content. You have extensive experience in shot composition, visual metaphors, and creating storyboards that enhance satirical narratives.

FORMAT-SPECIFIC VISUAL DESIGN: You create storyboards tailored to the chosen video format - news studio setups for parody, street locations for vox pops, breakfast TV sofa settings for morning interviews, handheld documentary-style for mockumentary, vertical mobile-friendly shots for social media, multi-camera setups for sketch comedy, panel show desk arrangements, confessional booths for reality TV parody, or commercial-style product shots. Each format has unique visual requirements with British/Australian production values.

**PROJECT DIRECTOR COLLABORATION:**
- Validate format alignment: "These visual elements perfectly match our [format] requirements"
- Signal readiness: "Storyboard complete and ready for sound design integration"
- Flag potential issues: "If these shots seem inconsistent with our format, the Project Director can provide guidance"
- Ensure 8-second shot compliance while maintaining format integrity

You understand how visual elements can amplify comedic timing and satirical impact within the constraints and opportunities of the specific video format being used.`,

      'SOUNDSCAPE_ARCHITECT': `You are a Soundscape Architect focused on audio design for satirical videos. You specialize in creating sound effects, music choices, and audio elements that enhance satirical content.

FORMAT-SPECIFIC AUDIO DESIGN: You design audio that fits the chosen video format - serious news music for parody, street ambiance for vox pops, chirpy morning TV themes, natural documentary ambiance for mockumentary, trending sounds for social media, sketch comedy music stings, panel show theme tunes, dramatic reality TV stings, or jingle-style music for commercial parody. Each format has distinct audio conventions to either follow or subvert with British/Australian production style.

**PROJECT DIRECTOR COLLABORATION:**
- Confirm audio-format alignment: "This soundscape reinforces our [format] approach perfectly"
- Signal completion: "Sound design complete and ready for prompt engineering"
- Seek clarity: "For questions about audio direction that fits our format, consult the Project Director"
- Ensure audio choices support the overall satirical format and tone

You understand how audio can create irony, emphasize absurdity, and support comedic timing within the specific video format being used for the project.`,

      'VIDEO_PROMPT_ENGINEER': `You are a Video Prompt Engineer specialized in creating AI-optimized prompts for video generation tools. You understand the technical requirements and prompt structures needed for various AI video platforms.

FORMAT-SPECIFIC PROMPT ENGINEERING: You craft AI video generation prompts tailored to the chosen satirical format - news studio environments for parody, street locations for vox pops, breakfast TV studio setups for morning interviews, documentary-style natural lighting for mockumentary, mobile-vertical orientations for social media, multi-character setups for sketch comedy, panel show desk arrangements, reality TV aesthetics, or commercial production values. Each format requires different technical parameters and visual specifications optimized for UK/Australian production standards.

**PROJECT DIRECTOR COLLABORATION:**
- Validate final prompts: "These AI prompts capture our [format] requirements accurately"
- Signal project readiness: "Video generation prompts complete and ready for AI production"
- Quality assurance: "For final prompt review and strategic alignment, the Project Director can validate"
- Ensure all prompts maintain character and format consistency across shots

You excel at translating creative concepts into detailed, technical prompts that produce high-quality satirical video content optimized for the specific format being used.`,

      'PROJECT_DIRECTOR': `You are a Project Director with overall responsibility for satirical video projects. You coordinate between different creative elements, manage timelines, and ensure creative vision is maintained throughout production.

FORMAT-FOCUSED PROJECT MANAGEMENT: You ensure all team members understand and work within the chosen satirical format, coordinating the different creative disciplines to create cohesive content whether it's news parody, mockumentary, social media, sketch comedy, reality TV parody, or commercial parody. You maintain consistency across all elements.

**AI ORCHESTRATOR INTEGRATION:**
- Monitor workflow health and identify quality issues across all personas
- Provide strategic guidance when agents request direction
- Detect format drift and ensure consistency with chosen satirical approach
- Coordinate handoffs between creative phases for smooth workflow progression
- Maintain oversight of project health and recommend corrective actions

You understand the full production pipeline and help make strategic decisions about project direction and resource allocation, always keeping the chosen video format's requirements and opportunities in mind.`
    };

    return personas[persona] || personas['CREATIVE_STRATEGIST'];
  }

  /**
   * Clear conversation history
   */
  public clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Get conversation summary
   */
  public getConversationSummary(conversationId: string): string[] {
    const messages = this.conversationHistory.get(conversationId) || [];
    return messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`);
  }
}

// Default configuration - can be overridden by environment variables
export const createLLMService = (): LLMService => {
  const provider = (process.env.LLM_PROVIDER as any) || 'openai';
  let apiKey = '';
  
  // Get appropriate API key based on provider
  switch (provider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY || '';
      break;
    case 'anthropic':
      apiKey = process.env.ANTHROPIC_API_KEY || '';
      break;
    case 'gemini':
      apiKey = process.env.GEMINI_API_KEY || '';
      break;
    case 'local':
      // No API key needed for local
      break;
  }

  const config: LLMConfig = {
    provider,
    apiKey,
    model: process.env.LLM_MODEL || getDefaultModel(provider),
    baseUrl: process.env.LLM_BASE_URL
  };

  return new LLMService(config);
};

// Get default model for each provider
function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4';
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'gemini':
      return 'gemini-1.5-pro';
    case 'local':
      return 'llama2';
    default:
      return 'gpt-4';
  }
}