import { describe, it, expect } from "vitest";
const { getTargetRoute } = require("../ai-functions/getTargetRoute.js");

describe("getTargetRoute", () => {
  it("should detect provider and route from model prefixes and names", () => {
    expect(getTargetRoute("gemini-1.5-flash")).toEqual({
      provider: "google",
      region: "global",
      cleanModelName: "gemini-1.5-flash",
      targetRoute: "googlecloud"
    });

    expect(getTargetRoute("claude-3-opus")).toEqual({
      provider: "anthropic",
      region: "global",
      cleanModelName: "claude-3-opus",
      targetRoute: "anthropic"
    });

    expect(getTargetRoute("gpt-4o")).toEqual({
      provider: "openai",
      region: "global",
      cleanModelName: "gpt-4o",
      targetRoute: "openai"
    });
  });

  it("should handle provider prefix in model name", () => {
    const route = getTargetRoute("google/gemini-2.0-flash");
    expect(route.provider).toBe("google");
    expect(route.cleanModelName).toBe("gemini-2.0-flash");
  });

  it("should support custom ModelRouting config mappings", () => {
    const config = {
      models: {
        "google/gemini-pro": "google-custom-target"
      },
      mappings: {
        "google/gemini-pro": "google/gemini-1.5-pro"
      }
    };
    const route = getTargetRoute("google/gemini-pro", config);
    expect(route.mappedModelName).toBe("google/gemini-1.5-pro");
    expect(route.targetRoute).toBe("google-custom-target");
  });

  it("should return empty result for unknown or missing model", () => {
    expect(getTargetRoute("")).toEqual({
      provider: "unknown",
      region: "global",
      cleanModelName: "",
      targetRoute: ""
    });
  });
});
