import { MCPToolResponse } from '../types/index';
import { getBridgeStatus } from '../services/bridge_clients';
import { logToHedera } from '../services/hedera_client';

export async function monitorBridgeStatus(args: {
  txHash: string;
  fromChain: string;
}): Promise<MCPToolResponse> {
  try {
    const { txHash, fromChain } = args;

    // Get bridge status
    const status = await getBridgeStatus(txHash, fromChain);

    // Log status check to Hedera
    await logToHedera({
      type: 'status_check',
      txHash,
      fromChain,
      status: status.status,
      timestamp: Date.now()
    });

    return {
      success: true,
      data: {
        status: status.status, // 'pending', 'confirmed', 'completed', 'failed'
        confirmations: status.confirmations,
        requiredConfirmations: status.requiredConfirmations,
        estimatedCompletion: status.estimatedCompletion,
        bridgeDetails: {
          fromChain,
          toChain: status.toChain,
          progress: status.progress || '50%',
          steps: [
            { step: 'Transaction Submitted', completed: true, timestamp: status.submittedAt },
            { step: 'Source Chain Confirmed', completed: status.confirmations >= status.requiredConfirmations, timestamp: status.confirmedAt },
            { step: 'Bridge Processing', completed: status.status === 'completed', timestamp: status.bridgeStarted },
            { step: 'Destination Chain Delivery', completed: status.status === 'completed', timestamp: status.completedAt }
          ]
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