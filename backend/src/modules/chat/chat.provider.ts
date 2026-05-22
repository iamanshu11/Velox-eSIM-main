import axios from "axios";
import { config, secrets } from "@config/env";
import { LunaKnowledgeResult, LunaUserContext } from "./chat.types";

interface ProviderInput {
  systemPrompt: string;
  message: string;
  history: Array<{ role: string; content: string }>;
  knowledge: LunaKnowledgeResult[];
  userContext?: LunaUserContext | null;
}

interface ProviderOutput {
  answer: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

const cleanAssistantAnswer = (answer: string): string => {
  if (!answer) {
    return answer;
  }

  const lines = answer
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const filtered = lines.filter((line) => {
    const lower = line.toLowerCase();
    if (lower === "sources" || lower === "source") {
      return false;
    }
    if (lower.startsWith("approved knowledge")) {
      return false;
    }
    if (lower.startsWith("approved user context")) {
      return false;
    }
    return true;
  });

  return filtered.join("\n");
};

export class LunaProvider {
  static isConfigured(): boolean {
    return Boolean(config.chat_feature_enabled && secrets.ai_api_key);
  }

  static async generateReply(input: ProviderInput): Promise<ProviderOutput> {
    if (!this.isConfigured()) {
      throw new Error("AI chat provider is not configured.");
    }

    try {
      const response = await axios.post(
        `${config.ai_base_url}/chat/completions`,
        {
          model: config.ai_model,
          temperature: 0.2,
          messages: [
            { role: "system", content: input.systemPrompt },
            ...input.history.map((message) => ({ role: message.role, content: message.content })),
            { role: "user", content: input.message },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${secrets.ai_api_key}`,
            "Content-Type": "application/json",
          },
          timeout: 25000,
        },
      );

      const answer = response.data?.choices?.[0]?.message?.content?.trim();

      if (!answer) {
        throw new Error("AI chat provider returned an empty response.");
      }

      return {
        answer: cleanAssistantAnswer(answer),
        model: response.data?.model || config.ai_model,
        inputTokens: response.data?.usage?.prompt_tokens,
        outputTokens: response.data?.usage?.completion_tokens,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "AI chat provider request failed.";
      throw new Error(errorMessage);
    }
  }
}