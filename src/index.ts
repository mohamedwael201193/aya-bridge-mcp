import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';

// Import all tools
import { analyzeBridgeRoute } from './tools/analyze_bridge_route';
import { calculateBridgeCosts } from './tools/calculate_bridge_costs';
import { assessBridgeRisks } from './tools/assess_bridge_risks';
import { executeBridgeTransaction } from './tools/execute_bridge_transaction';
import { monitorBridgeStatus } from './tools/monitor_bridge_status';
import { findYieldOpportunities } from './tools/find_yield_opportunities';
import { optimizeGasStrategy } from './tools/optimize_gas_strategy';
import { emergencyBridgePause } from './tools/emergency_bridge_pause';

dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'aya-bridge.log' })
  ]
});

class AyaBridgeMCPServer {
  private server: Server;
  private app: express.Application;

  constructor() {
    this.server = new Server(
      {
        name: 'aya-bridge-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.app = express();
    this.setupExpress();
    this.setupMCPHandlers();
  }

  private setupExpress() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        service: 'AyaBridge Universal DeFi Bridge MCP'
      });
    });

    // Tool listing endpoint for Aya app integration
    this.app.get('/tools', (req, res) => {
      res.json({
        tools: [
          { name: 'analyze_bridge_route', description: 'Find optimal cross-chain bridge route' },
          { name: 'calculate_bridge_costs', description: 'Calculate total fees and costs' },
          { name: 'assess_bridge_risks', description: 'AI risk scoring using Comput3.ai' },
          { name: 'execute_bridge_transaction', description: 'Execute bridge with Hedera logging' },
          { name: 'monitor_bridge_status', description: 'Track transaction status' },
          { name: 'find_yield_opportunities', description: 'AI-powered yield suggestions' },
          { name: 'optimize_gas_strategy', description: 'ML-based gas optimization' },
          { name: 'emergency_bridge_pause', description: 'Emergency stop functionality' }
        ]
      });
    });

    // Tool execution endpoint
    this.app.post('/invoke', async (req, res) => {
      try {
        const { tool, arguments: args } = req.body;
        const result = await this.executeTool(tool, args);
        res.json(result);
      } catch (error: any) {
        logger.error('Tool execution error', { error: error.message, tool: req.body.tool });
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  private setupMCPHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_bridge_route',
            description: 'Find optimal cross-chain bridge route',
            inputSchema: {
              type: 'object',
              properties: {
                fromChain: { type: 'string' },
                toChain: { type: 'string' },
                token: { type: 'string' },
                amount: { type: 'string' }
              },
              required: ['fromChain', 'toChain', 'token', 'amount']
            }
          },
          {
            name: 'calculate_bridge_costs',
            description: 'Calculate total fees, gas, and time estimates',
            inputSchema: {
              type: 'object',
              properties: {
                route: { type: 'object' },
                gasPrice: { type: 'string' }
              },
              required: ['route']
            }
          },
          {
            name: 'assess_bridge_risks',
            description: 'AI risk scoring using Comput3.ai',
            inputSchema: {
              type: 'object',
              properties: {
                protocol: { type: 'string' },
                amount: { type: 'string' },
                fromChain: { type: 'string' },
                toChain: { type: 'string' }
              },
              required: ['protocol', 'amount', 'fromChain', 'toChain']
            }
          },
          {
            name: 'execute_bridge_transaction',
            description: 'Execute bridge with Hedera logging',
            inputSchema: {
              type: 'object',
              properties: {
                route: { type: 'object' },
                userAddress: { type: 'string' }
              },
              required: ['route', 'userAddress']
            }
          },
          {
            name: 'monitor_bridge_status',
            description: 'Track transaction across chains',
            inputSchema: {
              type: 'object',
              properties: {
                txHash: { type: 'string' },
                fromChain: { type: 'string' }
              },
              required: ['txHash', 'fromChain']
            }
          },
          {
            name: 'find_yield_opportunities',
            description: 'AI-powered yield farming suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                amount: { type: 'string' },
                riskTolerance: { type: 'string' }
              },
              required: ['token', 'amount']
            }
          },
          {
            name: 'optimize_gas_strategy',
            description: 'ML-based gas optimization',
            inputSchema: {
              type: 'object',
              properties: {
                chain: { type: 'string' },
                transactionType: { type: 'string' }
              },
              required: ['chain']
            }
          },
          {
            name: 'emergency_bridge_pause',
            description: 'Emergency stop functionality',
            inputSchema: {
              type: 'object',
              properties: {
                reason: { type: 'string' },
                bridgeId: { type: 'string' }
              },
              required: ['reason']
            }
          }
        ]
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.executeTool(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        logger.error(`Tool execution error: ${name}`, { error: error.message });
        return {
          content: [
            {
              type: 'text',  
              text: JSON.stringify({ success: false, error: error.message }, null, 2)
            }
          ]
        };
      }
    });
  }

  private async executeTool(name: string, args: any) {
    logger.info(`Executing tool: ${name}`, { args });

    switch (name) {
      case 'analyze_bridge_route':
        return analyzeBridgeRoute(args);
      case 'calculate_bridge_costs':
        return calculateBridgeCosts(args);
      case 'assess_bridge_risks':
        return assessBridgeRisks(args);
      case 'execute_bridge_transaction':
        return executeBridgeTransaction(args);
      case 'monitor_bridge_status':
        return monitorBridgeStatus(args);
      case 'find_yield_opportunities':
        return findYieldOpportunities(args);
      case 'optimize_gas_strategy':
        return optimizeGasStrategy(args);
      case 'emergency_bridge_pause':
        return emergencyBridgePause(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async start() {
    // Start Express server for HTTP API
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      logger.info(`AyaBridge MCP HTTP server running on port ${port}`);
    });

    // Start MCP server for STDIO
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('AyaBridge MCP STDIO server started');
  }
}

// Start the server
const server = new AyaBridgeMCPServer();
server.start().catch(console.error);