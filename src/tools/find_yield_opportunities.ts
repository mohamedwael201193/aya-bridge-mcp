import { MCPToolResponse, YieldOpportunity } from '../types/index';
import { callComput3AI } from '../services/comput3_client';
import { getYieldData } from '../services/defi_data';

export async function findYieldOpportunities(args: {
  token: string;
  amount: string;
  riskTolerance?: string;
}): Promise<MCPToolResponse> {
  try {
    const { token, amount, riskTolerance = 'medium' } = args;

    // Get current yield data
    const yieldData = await getYieldData(token);
    
    // Call Comput3.ai for AI-powered yield optimization
    const aiOptimization = await callComput3AI({
      model: 'yield_optimizer',
      input: {
        token,
        amount: parseFloat(amount),
        riskTolerance,
        currentMarketConditions: yieldData,
        timestamp: Date.now()
      }
    });

    // Process AI recommendations
    const topProtocols = aiOptimization.prediction?.topProtocols || yieldData.slice(0, 5);
    const optimalAllocation = aiOptimization.prediction?.optimalAllocation?.[riskTolerance] || {
      aave: 60,
      compound: 40
    };

    const opportunities: YieldOpportunity[] = topProtocols.map((protocol: any) => ({
      protocol: protocol.name || protocol.protocol,
      apy: protocol.apy,
      tvl: protocol.tvl || '$1B+',
      chain: protocol.chain || 'ethereum',
      token,
      riskLevel: protocol.riskLevel || protocol.risk || 'medium'
    }));

    return {
      success: true,
      data: {
        opportunities,
        aiRecommendation: {
          strategy: riskTolerance,
          optimalAllocation,
          projectedYield: {
            daily: `$${(parseFloat(amount) * 0.12 / 365).toFixed(2)}`,
            monthly: `$${(parseFloat(amount) * 0.12 / 12).toFixed(2)}`,
            yearly: `$${(parseFloat(amount) * 0.12).toFixed(2)}`
          }
        },
        marketAnalysis: {
          averageAPY: (opportunities.reduce((sum, opp) => sum + opp.apy, 0) / opportunities.length).toFixed(2) + '%',
          riskDistribution: {
            low: opportunities.filter(o => o.riskLevel === 'low').length,
            medium: opportunities.filter(o => o.riskLevel === 'medium').length,
            high: opportunities.filter(o => o.riskLevel === 'high').length
          },
          recommendation: `Based on ${riskTolerance} risk tolerance, diversify across ${opportunities.length} protocols`
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