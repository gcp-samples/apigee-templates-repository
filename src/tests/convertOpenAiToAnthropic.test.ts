import { describe, it, expect } from "vitest";
const { convertOpenAiToAnthropic } = require("../ai-functions/convertOpenAiToAnthropic.js");

describe("convertOpenAiToAnthropic", () => {
  it("should extract system prompt, convert messages, and set vertex anthropic_version", () => {
    const oai = {
      model: "claude-3-5-sonnet-20241022",
      messages: [
        { role: "system", content: "System instructions" },
        { role: "user", content: "User prompt" }
      ],
      temperature: 0.5,
      max_tokens: 1000
    };

    const routeInfo = {
      targetRoute: "googlecloud",
      cleanModelName: "claude-3-5-sonnet-v2@20241022"
    };

    const anthropic = convertOpenAiToAnthropic(oai, routeInfo);
    expect(anthropic.anthropic_version).toBe("vertex-2023-10-16");
    expect(anthropic.system).toBe("System instructions");
    expect(anthropic.messages[0]).toEqual({ role: "user", content: "User prompt" });
    expect(anthropic.max_tokens).toBe(1000);
    expect(anthropic.temperature).toBe(0.5);
  });

  it("should handle bedrock targetRoute anthropic_version", () => {
    const anthropic = convertOpenAiToAnthropic({ messages: [] }, { targetRoute: "aws-bedrock" });
    expect(anthropic.anthropic_version).toBe("bedrock-2023-05-31");
  });

  it("should convert data URL image parts to base64 image objects", () => {
    const oai = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Look at this:" },
            { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgo=" } }
          ]
        }
      ]
    };
    const anthropic = convertOpenAiToAnthropic(oai);
    expect(anthropic.messages[0].content).toHaveLength(2);
    expect(anthropic.messages[0].content[1]).toEqual({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: "iVBORw0KGgo="
      }
    });
  });
});
