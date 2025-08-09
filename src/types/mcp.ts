import { z } from 'zod';

// MCP基础类型
export const MCPResultSchema = z.object({
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string(),
  })),
});

export const MCPErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

export type MCPResult = z.infer<typeof MCPResultSchema>;
export type MCPError = z.infer<typeof MCPErrorSchema>;

// Tool相关类型
export const ToolParameterSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.object({
    type: z.string(),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    default: z.unknown().optional(),
  })),
  required: z.array(z.string()).optional(),
});

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: ToolParameterSchema,
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ToolParameter = z.infer<typeof ToolParameterSchema>;

// Resource相关类型
export const ResourceDefinitionSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string(),
  mimeType: z.string().optional(),
});

export type ResourceDefinition = z.infer<typeof ResourceDefinitionSchema>;

// Prompt相关类型
export const PromptArgumentSchema = z.object({
  name: z.string(),
  description: z.string(),
  required: z.boolean().optional(),
});

export const PromptDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  arguments: z.array(PromptArgumentSchema).optional(),
});

export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;
export type PromptArgument = z.infer<typeof PromptArgumentSchema>;