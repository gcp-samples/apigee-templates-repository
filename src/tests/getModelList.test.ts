import { describe, it, expect } from "vitest";
const { getModelList } = require("../ai-functions/getModelList.js");

describe("getModelList", () => {
  it("should generate OpenAI models list format from quota data", () => {
    const quotaData = [
      {
        llmOperations: [
          { model: "gemini-1.5-pro" },
          { model: "gemini-1.5-flash" }
        ]
      }
    ];

    const result = getModelList(quotaData);
    expect(result.object).toBe("list");
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe("gemini-1.5-pro");
    expect(result.data[1].id).toBe("gemini-1.5-flash");
  });

  it("should deduplicate models and handle null input", () => {
    const quotaData = [
      { llmOperations: [{ model: "gpt-4o" }] },
      { llmOperations: [{ model: "gpt-4o" }] }
    ];
    const result = getModelList(quotaData);
    expect(result.data).toHaveLength(1);

    expect(getModelList(null)).toEqual({ object: "list", data: [] });
  });
});
