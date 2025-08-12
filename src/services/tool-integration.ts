// Tool Integration Framework for AI Agents
// Standardizes how agents interact with database, files, and external services

import { PersonaType, SatiricalFormat, Project } from '../shared/types/index.js';

export interface AgentTool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  permissions: ToolPermission[];
  availableFor: PersonaType[];
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validation?: (value: any) => boolean;
}

export interface ToolPermission {
  resource: 'database' | 'filesystem' | 'external_api' | 'user_interface';
  action: 'read' | 'write' | 'delete' | 'execute';
  scope?: string; // Additional scope restrictions
}

export interface ToolContext {
  projectId: string;
  persona: PersonaType;
  userId?: string;
  workflowState?: any;
  permissions: string[];
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  sideEffects?: ToolSideEffect[];
  suggestions?: string[];
}

export interface ToolSideEffect {
  type: 'database_update' | 'file_created' | 'notification_sent' | 'workflow_updated';
  description: string;
  data?: any;
}

export interface ToolRegistry {
  tools: Map<string, AgentTool>;
  permissions: Map<PersonaType, string[]>;
}

/**
 * Tool Integration Framework
 * Provides standardized tool access for AI agents
 */
export class ToolIntegrationService {
  private tools: Map<string, AgentTool> = new Map();
  private permissions: Map<PersonaType, string[]> = new Map();
  private executionHistory: Map<string, ToolExecution[]> = new Map();

  constructor() {
    this.initializePermissions();
    this.registerCoreTools();
  }

  /**
   * Register a new tool for agent use
   */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
    console.log(`🔧 Registered tool: ${tool.name} for personas: ${tool.availableFor.join(', ')}`);
  }

  /**
   * Execute tool for agent
   */
  async executeTool(
    toolName: string,
    params: any,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`
      };
    }

    // Check persona permissions
    if (!tool.availableFor.includes(context.persona)) {
      return {
        success: false,
        error: `Tool '${toolName}' not available for persona '${context.persona}'`
      };
    }

    // Validate parameters
    const validationResult = this.validateParameters(tool.parameters, params);
    if (!validationResult.valid) {
      return {
        success: false,
        error: `Parameter validation failed: ${validationResult.error}`
      };
    }

    // Check resource permissions
    const permissionCheck = this.checkPermissions(tool.permissions, context);
    if (!permissionCheck.allowed) {
      return {
        success: false,
        error: `Permission denied: ${permissionCheck.reason}`
      };
    }

    try {
      // Record execution start
      const executionId = this.recordExecutionStart(toolName, context, params);

      // Execute tool
      const result = await tool.execute(params, context);

      // Record execution completion
      this.recordExecutionCompletion(executionId, result);

      console.log(`🔧 Tool '${toolName}' executed by ${context.persona}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      return result;

    } catch (error) {
      console.error(`Tool execution error for '${toolName}':`, error);
      return {
        success: false,
        error: `Tool execution failed: ${error}`
      };
    }
  }

  /**
   * Get available tools for persona
   */
  getAvailableTools(persona: PersonaType): AgentTool[] {
    return Array.from(this.tools.values()).filter(tool => 
      tool.availableFor.includes(persona)
    );
  }

  /**
   * Generate tool documentation for agent prompts
   */
  generateToolDocumentation(persona: PersonaType): string {
    const availableTools = this.getAvailableTools(persona);
    
    if (availableTools.length === 0) {
      return 'No tools available for this persona.';
    }

    let documentation = '\n\n## AVAILABLE TOOLS\n\nYou have access to the following tools:\n\n';

    availableTools.forEach(tool => {
      documentation += `### ${tool.name}\n`;
      documentation += `${tool.description}\n\n`;
      documentation += `**Parameters:**\n`;
      
      tool.parameters.forEach(param => {
        const required = param.required ? '(required)' : '(optional)';
        documentation += `- **${param.name}** (${param.type}) ${required}: ${param.description}\n`;
      });

      documentation += '\n';
    });

    documentation += `**Usage:** To use a tool, mention it in your response with this format:\n`;
    documentation += `"I'll use the [tool_name] tool with parameters: {param1: value1, param2: value2}"\n\n`;
    documentation += `⚠️ **Important:** Only use tools when they directly help accomplish the user's request.\n`;

    return documentation;
  }

  /**
   * Get tool usage statistics
   */
  getToolUsageStatistics(persona?: PersonaType): {
    totalExecutions: number;
    successRate: number;
    popularTools: Array<{ name: string; usage: number }>;
    errorPatterns: Array<{ error: string; count: number }>;
  } {
    const allExecutions = Array.from(this.executionHistory.values()).flat();
    const relevantExecutions = persona 
      ? allExecutions.filter(exec => exec.context.persona === persona)
      : allExecutions;

    const totalExecutions = relevantExecutions.length;
    const successful = relevantExecutions.filter(exec => exec.result?.success).length;
    const successRate = totalExecutions > 0 ? (successful / totalExecutions) * 100 : 0;

    // Count tool usage
    const toolUsage = new Map<string, number>();
    relevantExecutions.forEach(exec => {
      const current = toolUsage.get(exec.toolName) || 0;
      toolUsage.set(exec.toolName, current + 1);
    });

    const popularTools = Array.from(toolUsage.entries())
      .map(([name, usage]) => ({ name, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    // Count error patterns
    const errorCounts = new Map<string, number>();
    relevantExecutions
      .filter(exec => exec.result && !exec.result.success)
      .forEach(exec => {
        const error = exec.result!.error || 'Unknown error';
        const current = errorCounts.get(error) || 0;
        errorCounts.set(error, current + 1);
      });

    const errorPatterns = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalExecutions,
      successRate,
      popularTools,
      errorPatterns
    };
  }

  // Private helper methods

  private initializePermissions(): void {
    // Define permissions for each persona
    this.permissions.set('CREATIVE_STRATEGIST', [
      'database:read:projects',
      'database:read:articles',
      'database:write:creative_strategy',
      'filesystem:write:strategy_files'
    ]);

    this.permissions.set('BAFFLING_BROADCASTER', [
      'database:read:projects',
      'database:read:creative_strategy',
      'database:write:voiceover_content',
      'filesystem:write:audio_files'
    ]);

    this.permissions.set('SATIRICAL_SCREENWRITER', [
      'database:read:projects',
      'database:read:creative_strategy',
      'database:read:voiceover_content',
      'database:write:scripts',
      'filesystem:write:script_files'
    ]);

    this.permissions.set('CINEMATIC_STORYBOARDER', [
      'database:read:projects',
      'database:read:scripts',
      'database:write:storyboards',
      'filesystem:write:visual_files'
    ]);

    this.permissions.set('SOUNDSCAPE_ARCHITECT', [
      'database:read:projects',
      'database:read:storyboards',
      'database:write:sound_design',
      'filesystem:write:audio_specs'
    ]);

    this.permissions.set('VIDEO_PROMPT_ENGINEER', [
      'database:read:projects',
      'database:read:all_stages',
      'database:write:video_prompts',
      'external_api:execute:ai_generation'
    ]);

    this.permissions.set('PROJECT_DIRECTOR', [
      'database:read:all',
      'database:write:all',
      'filesystem:read:all',
      'filesystem:write:reports',
      'user_interface:execute:notifications',
      'external_api:execute:all'
    ]);
  }

  private registerCoreTools(): void {
    // Database Tools
    this.registerTool({
      name: 'read_project_data',
      description: 'Read project information and related data',
      parameters: [
        {
          name: 'projectId',
          type: 'string',
          required: true,
          description: 'ID of the project to read'
        },
        {
          name: 'includeArticles',
          type: 'boolean',
          required: false,
          description: 'Whether to include news articles'
        }
      ],
      permissions: [
        { resource: 'database', action: 'read' }
      ],
      availableFor: ['CREATIVE_STRATEGIST', 'BAFFLING_BROADCASTER', 'SATIRICAL_SCREENWRITER', 'CINEMATIC_STORYBOARDER', 'SOUNDSCAPE_ARCHITECT', 'VIDEO_PROMPT_ENGINEER', 'PROJECT_DIRECTOR'],
      execute: this.executeReadProjectData.bind(this)
    });

    this.registerTool({
      name: 'save_creative_output',
      description: 'Save creative output to the project database',
      parameters: [
        {
          name: 'projectId',
          type: 'string',
          required: true,
          description: 'Project ID to save to'
        },
        {
          name: 'outputType',
          type: 'string',
          required: true,
          description: 'Type of output (strategy, script, storyboard, etc.)'
        },
        {
          name: 'content',
          type: 'object',
          required: true,
          description: 'The content to save'
        }
      ],
      permissions: [
        { resource: 'database', action: 'write' }
      ],
      availableFor: ['CREATIVE_STRATEGIST', 'BAFFLING_BROADCASTER', 'SATIRICAL_SCREENWRITER', 'CINEMATIC_STORYBOARDER', 'SOUNDSCAPE_ARCHITECT', 'VIDEO_PROMPT_ENGINEER'],
      execute: this.executeSaveCreativeOutput.bind(this)
    });

    // Character Management Tool
    this.registerTool({
      name: 'manage_characters',
      description: 'Create, update, or retrieve character profiles for consistency',
      parameters: [
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Action to perform: create, update, get, list'
        },
        {
          name: 'characterData',
          type: 'object',
          required: false,
          description: 'Character data for create/update operations'
        },
        {
          name: 'characterId',
          type: 'string',
          required: false,
          description: 'Character ID for get/update operations'
        }
      ],
      permissions: [
        { resource: 'database', action: 'read' },
        { resource: 'database', action: 'write' }
      ],
      availableFor: ['CREATIVE_STRATEGIST', 'SATIRICAL_SCREENWRITER', 'CINEMATIC_STORYBOARDER', 'VIDEO_PROMPT_ENGINEER', 'PROJECT_DIRECTOR'],
      execute: this.executeManageCharacters.bind(this)
    });

    // Format Validation Tool
    this.registerTool({
      name: 'validate_format_compliance',
      description: 'Validate content against satirical format requirements',
      parameters: [
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content to validate'
        },
        {
          name: 'format',
          type: 'string',
          required: true,
          description: 'Target satirical format'
        }
      ],
      permissions: [
        { resource: 'database', action: 'read' }
      ],
      availableFor: ['CREATIVE_STRATEGIST', 'BAFFLING_BROADCASTER', 'SATIRICAL_SCREENWRITER', 'CINEMATIC_STORYBOARDER', 'SOUNDSCAPE_ARCHITECT', 'VIDEO_PROMPT_ENGINEER', 'PROJECT_DIRECTOR'],
      execute: this.executeValidateFormatCompliance.bind(this)
    });

    // File Operations Tool
    this.registerTool({
      name: 'file_operations',
      description: 'Perform file system operations (read, write, list)',
      parameters: [
        {
          name: 'operation',
          type: 'string',
          required: true,
          description: 'Operation: read, write, list, delete'
        },
        {
          name: 'path',
          type: 'string',
          required: true,
          description: 'File or directory path'
        },
        {
          name: 'content',
          type: 'string',
          required: false,
          description: 'Content for write operations'
        }
      ],
      permissions: [
        { resource: 'filesystem', action: 'read' },
        { resource: 'filesystem', action: 'write' }
      ],
      availableFor: ['PROJECT_DIRECTOR', 'VIDEO_PROMPT_ENGINEER'],
      execute: this.executeFileOperations.bind(this)
    });

    // Workflow Progression Tool
    this.registerTool({
      name: 'update_workflow_state',
      description: 'Update workflow state and trigger stage transitions',
      parameters: [
        {
          name: 'projectId',
          type: 'string',
          required: true,
          description: 'Project ID'
        },
        {
          name: 'stageComplete',
          type: 'boolean',
          required: true,
          description: 'Whether current stage is complete'
        },
        {
          name: 'qualityScore',
          type: 'number',
          required: false,
          description: 'Quality score for the completed work'
        }
      ],
      permissions: [
        { resource: 'database', action: 'write' }
      ],
      availableFor: ['CREATIVE_STRATEGIST', 'BAFFLING_BROADCASTER', 'SATIRICAL_SCREENWRITER', 'CINEMATIC_STORYBOARDER', 'SOUNDSCAPE_ARCHITECT', 'VIDEO_PROMPT_ENGINEER', 'PROJECT_DIRECTOR'],
      execute: this.executeUpdateWorkflowState.bind(this)
    });

    console.log(`🔧 Registered ${this.tools.size} core tools for agent integration`);
  }

  // Tool execution methods

  private async executeReadProjectData(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      // This would interface with the database service
      const projectData = {
        project: { id: params.projectId, name: 'Sample Project' },
        articles: params.includeArticles ? ['Article 1', 'Article 2'] : []
      };

      return {
        success: true,
        data: projectData,
        suggestions: ['Use project data to maintain consistency with established elements']
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read project data: ${error}`
      };
    }
  }

  private async executeSaveCreativeOutput(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      // This would interface with the database service
      const saved = {
        id: `output_${Date.now()}`,
        projectId: params.projectId,
        type: params.outputType,
        content: params.content,
        persona: context.persona,
        timestamp: new Date()
      };

      return {
        success: true,
        data: saved,
        sideEffects: [
          {
            type: 'database_update',
            description: `Saved ${params.outputType} for project ${params.projectId}`,
            data: saved
          }
        ],
        suggestions: [`${params.outputType} saved successfully and available for next workflow stage`]
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save creative output: ${error}`
      };
    }
  }

  private async executeManageCharacters(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      switch (params.action) {
        case 'create':
          const newCharacter = {
            id: `char_${Date.now()}`,
            ...params.characterData,
            projectId: context.projectId,
            createdBy: context.persona
          };
          return {
            success: true,
            data: newCharacter,
            suggestions: ['Character created and available for consistency tracking']
          };

        case 'list':
          const characters = [
            { id: 'char_1', name: 'Sample Character', description: 'Example character' }
          ];
          return {
            success: true,
            data: characters,
            suggestions: ['Use established characters to maintain consistency']
          };

        default:
          return {
            success: false,
            error: `Unknown character action: ${params.action}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Character management failed: ${error}`
      };
    }
  }

  private async executeValidateFormatCompliance(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      // Simulate format validation
      const compliance = {
        compliant: true,
        score: 85,
        issues: [],
        suggestions: [`Content aligns well with ${params.format} format requirements`]
      };

      return {
        success: true,
        data: compliance,
        suggestions: compliance.suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: `Format validation failed: ${error}`
      };
    }
  }

  private async executeFileOperations(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      switch (params.operation) {
        case 'write':
          return {
            success: true,
            data: { path: params.path, size: params.content?.length || 0 },
            sideEffects: [
              {
                type: 'file_created',
                description: `File written to ${params.path}`,
                data: { path: params.path }
              }
            ]
          };

        case 'read':
          return {
            success: true,
            data: { content: 'Sample file content', path: params.path }
          };

        default:
          return {
            success: false,
            error: `Unknown file operation: ${params.operation}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `File operation failed: ${error}`
      };
    }
  }

  private async executeUpdateWorkflowState(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      const workflowUpdate = {
        projectId: params.projectId,
        currentStage: context.persona,
        completed: params.stageComplete,
        qualityScore: params.qualityScore || 0,
        timestamp: new Date()
      };

      return {
        success: true,
        data: workflowUpdate,
        sideEffects: [
          {
            type: 'workflow_updated',
            description: `Workflow state updated for ${context.persona}`,
            data: workflowUpdate
          }
        ],
        suggestions: params.stageComplete 
          ? ['Stage marked complete - ready for handoff to next workflow stage']
          : ['Workflow state updated - continue working on current stage']
      };
    } catch (error) {
      return {
        success: false,
        error: `Workflow update failed: ${error}`
      };
    }
  }

  private validateParameters(parameters: ToolParameter[], params: any): { valid: boolean; error?: string } {
    for (const param of parameters) {
      if (param.required && !(param.name in params)) {
        return { valid: false, error: `Required parameter '${param.name}' missing` };
      }

      if (param.name in params) {
        const value = params[param.name];
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (actualType !== param.type) {
          return { 
            valid: false, 
            error: `Parameter '${param.name}' expected ${param.type}, got ${actualType}` 
          };
        }

        if (param.validation && !param.validation(value)) {
          return { 
            valid: false, 
            error: `Parameter '${param.name}' failed validation` 
          };
        }
      }
    }

    return { valid: true };
  }

  private checkPermissions(
    requiredPermissions: ToolPermission[], 
    context: ToolContext
  ): { allowed: boolean; reason?: string } {
    const personaPermissions = this.permissions.get(context.persona) || [];

    for (const permission of requiredPermissions) {
      const permissionString = `${permission.resource}:${permission.action}`;
      const hasPermission = personaPermissions.some(p => 
        p === permissionString || 
        p === `${permission.resource}:${permission.action}:all` ||
        p === `${permission.resource}:all` ||
        p === 'all'
      );

      if (!hasPermission) {
        return { 
          allowed: false, 
          reason: `Missing permission: ${permissionString}` 
        };
      }
    }

    return { allowed: true };
  }

  private recordExecutionStart(
    toolName: string, 
    context: ToolContext, 
    params: any
  ): string {
    const executionId = this.generateExecutionId();
    const execution: ToolExecution = {
      id: executionId,
      toolName,
      context,
      params,
      startTime: new Date(),
      result: null
    };

    let executions = this.executionHistory.get(toolName);
    if (!executions) {
      executions = [];
      this.executionHistory.set(toolName, executions);
    }

    executions.push(execution);
    return executionId;
  }

  private recordExecutionCompletion(executionId: string, result: ToolResult): void {
    // Find and update the execution record
    for (const executions of this.executionHistory.values()) {
      const execution = executions.find(e => e.id === executionId);
      if (execution) {
        execution.result = result;
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        break;
      }
    }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface ToolExecution {
  id: string;
  toolName: string;
  context: ToolContext;
  params: any;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result: ToolResult | null;
}

// Export singleton instance
export const toolIntegrationService = new ToolIntegrationService();