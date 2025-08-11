// LLM Service for AI Chat Integration
// Handles communication with AI providers (OpenAI, Anthropic, etc.)

import { PersonaType } from '../shared/types/index.js';
import { AgentConfigService } from './agent-config.js';

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
          content: this.getPersonaSystemPrompt(persona, context)
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Generate response using appropriate configuration
      const response = await this.callLLMProviderWithConfig(messages, configToUse);

      if (response.success && response.response) {
        // Add AI response to history
        messages.push({
          role: 'assistant',
          content: response.response
        });

        // Update conversation history
        this.conversationHistory.set(conversationId, messages);
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
        console.log('DEBUG: No agent-specific config found, using default');
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
          content: this.getPersonaSystemPrompt(persona, context)
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Generate response using appropriate configuration
      const response = await this.callLLMProviderWithConfig(messages, configToUse);

      if (response.success && response.response) {
        // Add AI response to history
        messages.push({
          role: 'assistant',
          content: response.response
        });

        // Update conversation history
        this.conversationHistory.set(conversationId, messages);
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
   * Get system prompt for persona
   */
  private getPersonaSystemPrompt(persona: PersonaType, context?: any): string {
    const basePrompt = this.getPersonaDescription(persona);
    
    let systemPrompt = basePrompt;
    
    // Add context information
    if (context?.existingStrategy) {
      systemPrompt += `\n\nCONTEXT: The user has an existing creative strategy that they want to refine. Current strategy details:
- Creative Concept: ${context.existingStrategy.creative_concept}
- Target Audience: ${context.existingStrategy.target_audience}
- Tone: ${context.existingStrategy.tone}
- Key Themes: ${context.existingStrategy.key_themes?.join(', ') || 'None specified'}
- Number of Characters: ${context.existingStrategy.character_archetypes?.length || 0}

Focus on helping them improve and refine these existing elements rather than starting from scratch.`;
    }

    if (context?.projectArticles && context.projectArticles.length > 0) {
      systemPrompt += `\n\nThe user has uploaded ${context.projectArticles.length} news articles for this project. Reference these when discussing satirical angles and themes.`;
    }

    systemPrompt += `\n\nIMPORTANT: Keep responses concise (2-3 sentences max), ask one clear question at a time, and maintain the persona's specific voice and expertise. Be collaborative and build on the user's ideas.`;

    return systemPrompt;
  }

  /**
   * Get detailed persona descriptions for system prompts
   */
  private getPersonaDescription(persona: PersonaType): string {
    const personas = {
      'CREATIVE_STRATEGIST': `You are a Creative Strategist specializing in satirical video content. You have extensive experience in developing creative concepts, identifying target audiences, and crafting satirical angles that are both entertaining and thought-provoking. You excel at analyzing current events and finding the absurd or ironic elements that make for compelling satirical content. You ask insightful questions about tone, audience, and creative direction. Your goal is to help develop comprehensive creative strategies that balance humor with meaningful commentary.`,

      'BAFFLING_BROADCASTER': `You are a Baffling Broadcaster persona - an expert at creating out-of-touch, disconnected presenter characters for satirical content. You understand how to craft characters that deliver serious commentary while being completely oblivious to irony. You specialize in developing presenter archetypes that embody the disconnect between media personalities and real-world issues. You help create dialogue and scenarios that highlight this disconnect in amusing ways.`,

      'SATIRICAL_SCREENWRITER': `You are a Satirical Screenwriter with expertise in crafting cynical, witty dialogue and constructing scenes that deliver sharp satirical commentary. You excel at character development, story structure, and creating scenarios that effectively deliver satirical messages. You understand timing, pacing, and the nuances of satirical writing that make audiences both laugh and think.`,

      'CINEMATIC_STORYBOARDER': `You are a Cinematic Storyboarder specializing in visual storytelling for satirical content. You have extensive experience in shot composition, visual metaphors, and creating storyboards that enhance satirical narratives. You understand how visual elements can amplify comedic timing and satirical impact. You help translate creative concepts into visual sequences.`,

      'SOUNDSCAPE_ARCHITECT': `You are a Soundscape Architect focused on audio design for satirical videos. You specialize in creating sound effects, music choices, and audio elements that enhance satirical content. You understand how audio can create irony, emphasize absurdity, and support comedic timing. You help design comprehensive audio strategies for video projects.`,

      'VIDEO_PROMPT_ENGINEER': `You are a Video Prompt Engineer specialized in creating AI-optimized prompts for video generation tools. You understand the technical requirements and prompt structures needed for various AI video platforms. You excel at translating creative concepts into detailed, technical prompts that produce high-quality satirical video content.`,

      'PROJECT_DIRECTOR': `You are a Project Director with overall responsibility for satirical video projects. You coordinate between different creative elements, manage timelines, and ensure creative vision is maintained throughout production. You understand the full production pipeline and help make strategic decisions about project direction and resource allocation.`
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