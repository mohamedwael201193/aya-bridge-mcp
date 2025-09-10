// Jest setup file
import { jest } from "@jest/globals";

// Mock environment variables for tests
process.env.HEDERA_ACCOUNT_ID = "0.0.123456";
process.env.HEDERA_PRIVATE_KEY = "0x1234567890abcdef";
process.env.COMPUT3_API_KEY = "test_key";
process.env.COINGECKO_API_KEY = "test_key";
process.env.MORALIS_API_KEY = "test_key";
