
import { analyzeBridgeRoute } from "../../src/tools/analyze_bridge_route";

describe("analyze_bridge_route", () => {
  it("returns a recommended route", async () => {
    const result = await analyzeBridgeRoute({
      fromChain: "ethereum",
      toChain: "polygon",
      token: "usdc",
      amount: "1000",
    });
    expect(result.success).toBe(true);
    expect(result.data.recommendedRoute).toBeDefined();
    expect(parseFloat(result.data.recommendedRoute.totalCost)).toBeGreaterThan(
      0
    );
    expect(result.data.recommendedRoute.bridges).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
  });

  it("handles invalid inputs gracefully", async () => {
    const result = await analyzeBridgeRoute({
      fromChain: "",
      toChain: "polygon",
      token: "usdc",
      amount: "0",
    });
    expect(result.success).toBe(true);
  });
});
