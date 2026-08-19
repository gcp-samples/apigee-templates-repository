import { describe, it, expect } from "vitest";
const { parseMultipartFormData } = require("../ai-functions/parseMultipartFormData.js");

describe("parseMultipartFormData", () => {
  it("should parse standard multipart form data with boundary", () => {
    const boundary = "---------------------------974767299852498929531610575";
    const body = [
      boundary,
      'Content-Disposition: form-data; name="model"',
      "",
      "whisper-1",
      boundary,
      'Content-Disposition: form-data; name="prompt"',
      "",
      "Meeting transcription",
      boundary,
      'Content-Disposition: form-data; name="language"',
      "",
      "en",
      boundary,
      'Content-Disposition: form-data; name="file"; filename="audio.wav"',
      "Content-Type: audio/wav",
      "",
      "RIFF....WAVEfmt",
      boundary + "--"
    ].join("\r\n");

    const result = parseMultipartFormData(body, `multipart/form-data; boundary=${boundary.substring(2)}`);
    expect(result.model).toBe("whisper-1");
    expect(result.prompt).toBe("Meeting transcription");
    expect(result.language).toBe("en");
    expect(result.fileMimeType).toBe("audio/wav");
    expect(result.fileBase64).toBe(Buffer.from("RIFF....WAVEfmt").toString("base64"));
  });

  it("should parse boundary from body start if not provided in contentType", () => {
    const boundary = "--customBoundary123";
    const body = [
      boundary,
      'Content-Disposition: form-data; name="model"',
      "",
      "google/gemini-2.0-flash",
      boundary + "--"
    ].join("\n");

    const result = parseMultipartFormData(body, "multipart/form-data");
    expect(result.model).toBe("google/gemini-2.0-flash");
  });

  it("should return empty result for null or invalid body", () => {
    const res = parseMultipartFormData(null, null);
    expect(res.model).toBe("");
    expect(res.prompt).toBe("");
    expect(res.fileBase64).toBe("");
  });
});
