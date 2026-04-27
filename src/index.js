// filepath: src/index.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { LangChainTracer } from 'langsmith/trace.js';

// LangSmith configuration
const LANGCHAIN_TRACER = new LangChainTracer({
  projectName: 'pest-scheme-mcp-server',
  endpoint: process.env.LANGCHAIN_ENDPOINT,
  apiKey: process.env.LANGCHAIN_API_KEY,
});

// In-memory storage for API key
let apiKey = process.env.API_KEY || '';

// Sample pest data
const pests = [
  { id: '1', name: 'Aphid', category: 'Insect', damage: 'Sucks sap from plants', treatment: 'Insecticidal soap' },
  { id: '2', name: 'Whitefly', category: 'Insect', damage: 'Yellowing leaves', treatment: 'Yellow sticky traps' },
  { id: '3', name: 'Spider Mite', category: 'Arachnid', damage: 'Webbing on plants', treatment: 'Neem oil' },
  { id: '4', name: 'Caterpillar', category: 'Insect', damage: 'Eats leaves', treatment: 'Bt spray' },
  { id: '5', name: 'Scale', category: 'Insect', damage: 'Sticky honeydew', treatment: 'Horticultural oil' },
  { id: '6', name: 'Mealybug', category: 'Insect', damage: 'White cottony masses', treatment: 'Rubbing alcohol' },
  { id: '7', name: 'Thrips', category: 'Insect', damage: 'Silvering leaves', treatment: 'Spinosad' },
  { id: '8', name: 'Root Knot Nematode', category: 'Nematode', damage: 'Stunted growth', treatment: 'Solarization' },
];

// Sample scheme data
const schemes = [
  { id: '1', name: 'PM-KISAN', type: 'Central', benefit: '₹6000/year to farmers', eligibility: 'Small marginal farmers' },
  { id: '2', name: 'PMFBY', type: 'Central', benefit: 'Crop insurance coverage', eligibility: 'All farmers' },
  { id: '3', name: 'Kisan Credit Card', type: 'Central', benefit: 'Credit up to ₹3 lakh', eligibility: 'Farmers with land' },
  { id: '4', name: 'Soil Health Card', type: 'Central', benefit: 'Soil testing & recommendations', eligibility: 'All farmers' },
  { id: '5', name: 'Fasal Bima Yojana', type: 'Central', benefit: 'Low premium crop insurance', eligibility: 'Loanee farmers' },
  { id: '6', name: 'Agricultural Infrastructure Fund', type: 'Central', benefit: '3% interest subsidy', eligibility: 'FPOs, agripreneurs' },
  { id: '7', name: 'PM-Kisan Samman Nidhi', type: 'Central', benefit: '₹6000 annually', eligibility: 'Landholding farmers' },
  { id: '8', name: 'Sub-Mission on Agricultural Extension', type: 'Central', benefit: 'Farmer training & education', eligibility: 'All farmers' },
];

// Tool definitions
const tools = [
  {
    name: 'get_pests',
    description: 'Get information about agricultural pests and their treatments. Use this tool to search for pest information including name, category, damage description, and treatment options.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter pests by name or category',
        },
        category: {
          type: 'string',
          description: 'Filter by pest category (Insect, Arachnid, Nematode)',
        },
      },
    },
  },
  {
    name: 'get_schemes',
    description: 'Get information about government agricultural schemes and subsidies. Use this tool to search for scheme information including name, type, benefits, and eligibility criteria.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to filter schemes by name or type',
        },
        type: {
          type: 'string',
          description: 'Filter by scheme type (Central, State)',
        },
      },
    },
  },
  {
    name: 'set_api_key',
    description: 'Set the API key for authentication. Use this tool to configure your API key before making authenticated requests.',
    inputSchema: {
      type: 'object',
      properties: {
        api_key: {
          type: 'string',
          description: 'The API key to store for authentication',
        },
      },
      required: ['api_key'],
    },
  },
  {
    name: 'get_api_key',
    description: 'Get the current API key status. Use this to check if an API key has been configured.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Server class
class PestSchemeServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pest-scheme-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // LangSmith trace for each tool call
      const trace = {
        name: name,
        run_id: Date.now().toString(),
        inputs: args,
      };
      
      try {
        let result;
        
        switch (name) {
          case 'get_pests':
            result = this.handleGetPests(args);
            break;
          case 'get_schemes':
            result = this.handleGetSchemes(args);
            break;
          case 'set_api_key':
            result = this.handleSetApiKey(args);
            break;
          case 'get_api_key':
            result = this.handleGetApiKey();
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        // Log to LangSmith if configured
        if (process.env.LANGCHAIN_API_KEY) {
          console.error(`[LangSmith] Trace: ${JSON.stringify({ ...trace, outputs: result })}`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }),
            },
          ],
        };
      }
    });
  }

  handleGetPests(args) {
    let result = [...pests];
    
    if (args?.search) {
      const search = args.search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search) ||
          p.damage.toLowerCase().includes(search)
      );
    }
    
    if (args?.category) {
      const category = args.category.toLowerCase();
      result = result.filter(p => p.category.toLowerCase() === category);
    }
    
    return {
      success: true,
      count: result.length,
      data: result,
    };
  }

  handleGetSchemes(args) {
    let result = [...schemes];
    
    if (args?.search) {
      const search = args.search.toLowerCase();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(search) ||
          s.type.toLowerCase().includes(search) ||
          s.benefit.toLowerCase().includes(search)
      );
    }
    
    if (args?.type) {
      const type = args.type.toLowerCase();
      result = result.filter(s => s.type.toLowerCase() === type);
    }
    
    return {
      success: true,
      count: result.length,
      data: result,
    };
  }

  handleSetApiKey(args) {
    apiKey = args.api_key;
    return {
      success: true,
      message: 'API key has been set successfully',
    };
  }

  handleGetApiKey() {
    return {
      success: true,
      configured: apiKey.length > 0,
      message: apiKey.length > 0 ? 'API key is configured' : 'No API key configured',
    };
  }

  async connect() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Pest & Scheme MCP Server running on stdio');
  }
}

// Start server
const server = new PestSchemeServer();
server.connect().catch(console.error);