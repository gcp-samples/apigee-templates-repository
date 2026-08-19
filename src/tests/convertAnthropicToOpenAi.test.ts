import { describe, it, expect } from "vitest";
const { convertAnthropicToOpenAi } = require("../ai-functions/convertAnthropicToOpenAi.js");

describe("convertAnthropicToOpenAi", () => {
  it("should convert Anthropic response to OpenAI chat completion format", () => {
    const anthropicResp = {
      id: "msg_123456789",
      model: "claude-3-5-sonnet",
      content: [{ type: "text", text: "Claude final response" }],
      stop_reason: "end_turn",
      usage: {
        input_tokens: 25,
        output_tokens: 35
      }
    };

    const res = convertAnthropicToOpenAi(anthropicResp, "claude-3-5-sonnet");
    expect(res.openAiResponse.id).toBe("chatcmpl-123456789");
    expect(res.openAiResponse.choices[0].message.content).toBe("Claude final response");
    expect(res.openAiResponse.choices[0].finish_reason).toBe("stop");
    expect(res.usageData.requestTokenCount).toBe(25);
    expect(res.usageData.responseTokenCount).toBe(35);
    expect(res.usageData.totalTokenCount).toBe(60);
  });
});
