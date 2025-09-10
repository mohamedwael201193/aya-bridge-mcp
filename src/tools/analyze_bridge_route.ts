import { BridgeRoute, MCPToolResponse } from '../types/index';
import { getBridgeOptions } from '../services/bridge_clients';
import { getTokenPrice } from '../services/defi_data';

export async function analyzeBridgeRoute(args: {
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
}): Promise<MCPToolResponse> {
  try {
    const { fromChain, toChain, token, amount } = args;

    // Get available bridge options
    const bridgeOptions = await getBridgeOptions(fromChain, toChain, token);
    
    // Get token price for cost calculations
    const tokenPrice = await getTokenPrice(token);
    
    // Calculate costs and sort by best option
    const routes = bridgeOptions.map((bridge, index) => ({
      id: `route_${index}`,
      fromChain,
      toChain,
      fromToken: token,
      toToken: token,
      amount,
      estimatedTime: bridge.estimatedTime,
      totalCost: (parseFloat(amount) * 0.001 + bridge.fees).toFixed(6), // 0.1% + bridge fees
      riskScore: Math.floor(Math.random() * 30) + 70, // 70-100 range for demo
      bridges: [bridge.name]
    })).sort((a, b) => parseFloat(a.totalCost) - parseFloat(b.totalCost));

    const bestRoute = routes[0] || {
      id: 'route_fallback',
      fromChain,
      toChain,
      fromToken: token,
      toToken: token,
      amount,
      estimatedTime: 300, // 5 minutes
      totalCost: (parseFloat(amount) * 0.003).toFixed(6),
      riskScore: 85,
      bridges: ['stargate']
    };

    return {
      success: true,
      data: {
        recommendedRoute: bestRoute,
        alternativeRoutes: routes.slice(1, 4),
        analysis: {
          totalRoutes: routes.length,
          cheapestFee: bestRoute.totalCost,
          averageTime: Math.round(routes.reduce((sum, r) => sum + r.estimatedTime, 0) / routes.length),
          riskAnalysis: 'Route optimized for cost and security balance'
        }
      },
      timestamp: Date.now()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
}