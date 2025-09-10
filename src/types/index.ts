export interface BridgeRoute {
  id: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedTime: number;
  totalCost: string;
  riskScore: number;
  bridges: string[];
}

export interface RiskAssessment {
  score: number;
  confidence: number;
  factors: string[];
  recommendation: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface YieldOpportunity {
  protocol: string;
  apy: number;
  tvl: string;
  chain: string;
  token: string;
  riskLevel: string;
}

export interface MCPToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}