import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const COMPUT3_API_KEY = process.env.COMPUT3_API_KEY;
const COMPUT3_BASE_URL = "https://api.comput3.ai/api/v0";

interface Comput3Request {
  model: string;
  input: any;
}

interface Comput3Response {
  riskScore?: number;
  confidence?: number;
  prediction?: any;
  processingTime?: string;
  error?: string;
}

// Add caching
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function callComput3AI(
  request: Comput3Request
): Promise<Comput3Response> {
  // Check cache first
  const cacheKey = JSON.stringify(request);
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log("Using cached Comput3.ai result");
    return cached.data;
  }
  try {
    const startTime = Date.now();

    // Launch workload for GPU computation
    const launchResponse = await axios.post(
      `${COMPUT3_BASE_URL}/launch`,
      {
        expires: 300, // 5 minutes
        type: "gpu.t4",
      },
      {
        headers: {
          Authorization: `Bearer ${COMPUT3_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { workload, workload_key } = launchResponse.data;

    // Simulate ML model execution
    let result: Comput3Response = {};

    if (request.model === "bridge_risk_scorer") {
      // Risk scoring model
      const baseScore = 85;
      const factors = [
        request.input.amount > 10000 ? -10 : 0, // Large amounts are riskier
        request.input.protocol === "unknown" ? -20 : 5, // Known protocols safer
        request.input.fromChain === request.input.toChain ? -5 : 0, // Same chain weird
      ];

      result = {
        riskScore: Math.max(
          60,
          Math.min(95, baseScore + factors.reduce((a, b) => a + b, 0))
        ),
        confidence: 0.85 + Math.random() * 0.1,
        processingTime: `${Date.now() - startTime}ms`,
      };
    } else if (request.model === "gas_predictor") {
      // Gas optimization model
      const currentGas = request.input.currentGasPrice;
      const timeOfDay = request.input.timeOfDay;

      // Simulate gas price prediction based on time
      const isBusinessHours = timeOfDay >= 9 && timeOfDay <= 17;
      const congestionMultiplier = isBusinessHours ? 1.2 : 0.8;

      result = {
        prediction: {
          optimalGasPrice: Math.round(currentGas * congestionMultiplier),
          optimalTime: Date.now() + (isBusinessHours ? 300000 : 60000),
          savings: Math.random() * 10 + 2,
          confidence: 0.89,
        },
        processingTime: `${Date.now() - startTime}ms`,
      };
    } else if (request.model === "yield_optimizer") {
      // Yield farming optimization
      result = {
        prediction: {
          topProtocols: [
            { name: "Aave", apy: 12.5 + Math.random() * 5, risk: "low" },
            { name: "Compound", apy: 8.3 + Math.random() * 3, risk: "low" },
            { name: "Yearn", apy: 15.2 + Math.random() * 8, risk: "medium" },
          ],
          optimalAllocation: {
            conservative: { aave: 60, compound: 40 },
            moderate: { aave: 40, compound: 30, yearn: 30 },
            aggressive: { yearn: 70, aave: 30 },
          },
        },
        processingTime: `${Date.now() - startTime}ms`,
      };
    }

    // Stop the workload to save credits
    try {
      await axios.post(
        `${COMPUT3_BASE_URL}/stop`,
        {
          workload,
        },
        {
          headers: {
            Authorization: `Bearer ${COMPUT3_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (stopError) {
      if (
        stopError &&
        typeof stopError === "object" &&
        "message" in stopError
      ) {
        // @ts-ignore
        console.warn("Failed to stop Comput3 workload:", stopError.message);
      } else {
        console.warn("Failed to stop Comput3 workload:", stopError);
      }
    }

    // Cache the result before returning
    cache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch (error) {
    let errMsg = "";
    if (error && typeof error === "object" && "message" in error) {
      // @ts-ignore
      errMsg = error.message;
    } else {
      errMsg = String(error);
    }
    // @ts-ignore
    let apiData = undefined;
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      error.response !== null &&
      "data" in error.response
    ) {
      apiData = error.response.data;
    }
    console.error("Comput3.ai API error:", apiData || errMsg);
    // Return fallback response if API fails
    const fallbackResult = {
      riskScore: 80,
      confidence: 0.5,
      processingTime: "500ms",
      error: "Using fallback model due to API error",
    };
    // Cache fallback result too
    cache.set(cacheKey, { data: fallbackResult, timestamp: now });
    return fallbackResult;
  }
}
