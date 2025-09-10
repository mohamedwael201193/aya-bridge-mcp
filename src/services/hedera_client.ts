import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, PrivateKey, AccountId, TopicId } from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;
const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;

let client: Client;
let topicId: TopicId;

// Initialize Hedera client
function initializeClient() {
  if (!client) {
    client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(HEDERA_ACCOUNT_ID!),
      PrivateKey.fromString(HEDERA_PRIVATE_KEY!)
    );
  }
  return client;
}

// Create or get topic for logging
async function getLogTopic(): Promise<TopicId> {
  if (topicId) return topicId;

  try {
    const client = initializeClient();
    
    // Try to use existing topic or create new one
    const topicCreateTx = new TopicCreateTransaction()
      .setTopicMemo('AyaBridge Universal DeFi Bridge Logs')
      .setSubmitKey(PrivateKey.fromString(HEDERA_PRIVATE_KEY!));

    const topicCreateSubmit = await topicCreateTx.execute(client);
    const topicCreateReceipt = await topicCreateSubmit.getReceipt(client);
    
    topicId = topicCreateReceipt.topicId!;
    console.log(`Created Hedera topic: ${topicId.toString()}`);
    
    return topicId;
  } catch (error: any) {
    console.error('Failed to create Hedera topic:', error.message);
    // Use mock topic ID for demo
    topicId = TopicId.fromString('0.0.47583629');
    return topicId;
  }
}

export async function logToHedera(logData: any): Promise<string> {
  try {
    const client = initializeClient();
    const topic = await getLogTopic();

    const message = JSON.stringify({
      ...logData,
      service: 'AyaBridge',
      version: '1.0.0'
    });

    const topicMessageSubmitTx = new TopicMessageSubmitTransaction()
      .setTopicId(topic)
      .setMessage(message);

    const topicMessageSubmitResponse = await topicMessageSubmitTx.execute(client);
    const receipt = await topicMessageSubmitResponse.getReceipt(client);

    const logId = `${topic.toString()}-${receipt.topicSequenceNumber}`;
    console.log(`Logged to Hedera: ${logId}`);

    return logId;
  } catch (error: any) {
    console.error('Hedera logging error:', error.message);
    // Return mock ID if Hedera fails
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export async function getHederaLogs(sequenceNumber?: number): Promise<any[]> {
  try {
    // In production, would query mirror nodes
    // For demo, return mock data
    return [
      {
        sequenceNumber: 1,
        message: 'Bridge transaction initiated',
        timestamp: Date.now() - 300000
      }
    ];
  } catch (error: any) {
    console.error('Failed to retrieve Hedera logs:', error.message);
    return [];
  }
}