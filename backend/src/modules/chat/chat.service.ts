import statusCode from "http-status-codes";
import { Prisma } from "@prisma/client";
import db from "@config/database";
import { AppError } from "@utils/errors";
import { buildLunaSystemPrompt } from "./chat.prompt";
import { LunaProvider } from "./chat.provider";
import { searchKnowledgeBase } from "./chat.knowledge";
import {
  buildSuggestedActions,
  buildTicketPreview,
  createSupportEscalation,
  getUserContextSummary,
  summarizeOperationalHints,
  getRecommendedPackages,
} from "./chat.tools";
import {
  LunaAction,
  LunaCitation,
  LunaMessagePayload,
  LunaResponse,
  LunaSessionPayload,
} from "./chat.types";

const isAdminRole = (role?: string): boolean => role === "ADMIN" || role === "SUPER_ADMIN";
const toJson = <T>(value: T): Prisma.InputJsonValue => value as unknown as Prisma.InputJsonValue;

const isOffTopic = (message: string): boolean => {
  const normalized = message.toLowerCase().trim();
  const greetingKeywords = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon',
    'good evening', 'thanks', 'thank you', 'please', 'sure', 'ok', 'okay',
    'yes', 'no', 'yep', 'nope', 'maybe', 'hmm'
  ];

  if (greetingKeywords.some(greeting => normalized === greeting ||
      normalized.startsWith(greeting + ' ') || 
      normalized.endsWith(' ' + greeting))) {
    return false;
  }
  const onTopicKeywords = [
    'esim', 'sim', 'plan', 'wallet', 'balance', 'top-up', 'topup', 'credit',
    'order', 'cancel', 'refund', 'activation', 'activate', 'data', 'internet',
    'connectivity', 'profile', 'account', 'settings', 'purchase', 'buy', 'price',
    'country', 'region', 'coverage', 'device', 'phone', 'help', 'support',
    'issue', 'problem', 'error', 'troubleshoot', 'dashboard', 'transaction',
    'history', 'subscription', 'renewal', 'expire', 'expiry', 'deactivate',
    'upgrade', 'downgrade', 'how', 'what', 'where', 'when', 'why', 'can i',
    'do i', 'should i', 'velox esim', 'velox', 'luna', 'ticket',
    'create ticket', 'book ticket', 'submit ticket'
  ];
  
  const offTopicKeywords = [
    'song', 'music', 'movie', 'film', 'actor', 'actress', 'singer', 'band',
    'love', 'poem', 'poetry', 'recipe', 'cook', 'book', 'author', 'story',
    'joke', 'funny', 'game', 'sports', 'cricket', 'football', 'basketball',
    'weather', 'news', 'politics', 'government', 'president', 'minister',
    'math', 'science', 'chemistry', 'physics', 'history', 'geography',
    'philosophy', 'religion', 'god', 'spiritual', 'astrology', 'horoscope',
    'bitcoin', 'crypto', 'stock', 'investment', 'business', 'economics',
    'birthday', 'anniversary', 'advice', 'relationships', 'dating', 'marriage'
  ];
  
  const hasOffTopicKeyword = offTopicKeywords.some(keyword => normalized.includes(keyword));
  const hasOnTopicKeyword = onTopicKeywords.some(keyword => normalized.includes(keyword));
  if (hasOffTopicKeyword && !hasOnTopicKeyword) {
    return true;
  }
  
  return false;
};

const validatePackagePricesInResponse = (
  response: string,
  realPackages: Array<{ price: number }>
): { isValid: boolean; warning?: string } => {
  if (!realPackages || realPackages.length === 0) {
    return { isValid: true };
  }

  const priceMatches = response.match(/\$?(\d+\.\d{2})/g) || [];
  const responsePrices = new Set(
    priceMatches.map((p) => parseFloat(p.replace('$', '').replace(/,/g, ''))),
  );
  const validPrices = new Set(realPackages.map((pkg) => parseFloat((pkg.price / 100).toFixed(2))));

  for (const price of responsePrices) {
    if (!validPrices.has(price)) {
      return {
        isValid: false,
        warning: `Response contains price $${price.toFixed(2)} that doesn't match any real packages.`,
      };
    }
  }

  return { isValid: true };
};

export class LunaService {
  static async createSession(input: LunaSessionPayload & { userId?: string }) {
    return db.chatSession.create({
      data: {
        userId: input.userId,
        channel: input.channel || (input.userId ? "dashboard" : "public"),
        title: input.title,
        context: toJson(input.pageContext || {}),
        lastMessageAt: new Date(),
      },
    });
  }

  static async listUserSessions(userId: string) {
    return db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  static async getSessionMessages(sessionId: string, userId?: string, role?: string) {
    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      throw new AppError(statusCode.NOT_FOUND, "Chat session not found");
    }

    if (session.userId && session.userId !== userId && !isAdminRole(role)) {
      throw new AppError(statusCode.FORBIDDEN, "You do not have access to this chat session");
    }

    return session.messages;
  }

  static async deleteSession(sessionId: string, userId: string, role?: string) {
    const session = await db.chatSession.findUnique({ where: { id: sessionId } });

    if (!session) {
      throw new AppError(statusCode.NOT_FOUND, "Chat session not found");
    }

    if (session.userId !== userId && !isAdminRole(role)) {
      throw new AppError(statusCode.FORBIDDEN, "You do not have access to delete this chat session");
    }

    await db.chatSession.delete({ where: { id: sessionId } });

    return { id: sessionId, deleted: true };
  }

  static async sendMessage(input: LunaMessagePayload & { userId?: string; role?: string }): Promise<LunaResponse> {
    const session = input.sessionId
      ? await db.chatSession.findUnique({ where: { id: input.sessionId } })
      : await this.createSession({
          userId: input.userId,
          channel: input.pageContext?.area || (input.userId ? "dashboard" : "public"),
          pageContext: input.pageContext,
        });

    if (!session) {
      throw new AppError(statusCode.NOT_FOUND, "Chat session not found");
    }

    if (session.userId && session.userId !== input.userId && !isAdminRole(input.role)) {
      throw new AppError(statusCode.FORBIDDEN, "You do not have access to this chat session");
    }

    const trimmedMessage = input.message.trim();
    if (!trimmedMessage) {
      throw new AppError(statusCode.BAD_REQUEST, "Message is required");
    }

    if (isOffTopic(trimmedMessage)) {
      await db.chatMessage.create({
        data: {
          sessionId: session.id,
          userId: input.userId,
          role: "user",
          content: trimmedMessage,
        },
      });

      const guardrailResponse = "I'm here to help with eSIM and Velox eSIM questions. Is there anything about your eSIM plans, wallet, orders, activation, or account settings I can help you with?";

      await db.chatMessage.create({
        data: {
          sessionId: session.id,
          userId: input.userId,
          role: "assistant",
          content: guardrailResponse,
          citations: toJson([]),
          actions: toJson([]),
          model: "guardrail",
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: 0,
          toolName: "guardrail",
          toolResult: toJson({ reason: "off-topic-detected" }),
        },
      });

      await db.chatSession.update({
        where: { id: session.id },
        data: {
          lastMessageAt: new Date(),
          title: session.title || trimmedMessage.slice(0, 80),
          context: toJson(input.pageContext || session.context || {}),
        },
      });

      return {
        sessionId: session.id,
        answer: guardrailResponse,
        citations: [],
        actions: [],
        escalationOffered: false,
        model: "guardrail",
      };
    }

    const startedAt = Date.now();

    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        userId: input.userId,
        role: "user",
        content: trimmedMessage,
      },
    });

    const [history, knowledge, userContext, operationalHints, recommendedPackages] = await Promise.all([
      db.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      searchKnowledgeBase(trimmedMessage, 4),
      input.userId ? getUserContextSummary(input.userId) : Promise.resolve(null),
      summarizeOperationalHints(trimmedMessage, input.userId),
      getRecommendedPackages(trimmedMessage, 5).catch(() => []),
    ]);

    const prompt = buildLunaSystemPrompt({
      pageContext: input.pageContext,
      knowledge,
      userContext: userContext
        ? {
            summary: `${userContext.summary}\n\nOperational hints:\n${operationalHints}`,
            data: userContext.data,
          }
        : null,
      recommendedPackages,
    });

    const providerResponse = await LunaProvider.generateReply({
      systemPrompt: prompt,
      message: trimmedMessage,
      history: history.reverse().map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
      knowledge,
      userContext,
    });

    if (recommendedPackages && recommendedPackages.length > 0) {
      const validation = validatePackagePricesInResponse(providerResponse.answer, recommendedPackages);
      if (!validation.isValid) {
        console.warn('[ChatWidget] Price validation warning:', validation.warning);
      }
    }

    const citations: LunaCitation[] = Array.from(
      new Map(
        knowledge.map((entry) => [
          entry.slug,
          {
            title: entry.title,
            sourceType: entry.sourceType,
            slug: entry.slug,
          } as LunaCitation,
        ]),
      ).values(),
    ).slice(0, 3);

    const actions: LunaAction[] = await buildSuggestedActions({
      message: trimmedMessage,
      userId: input.userId,
      pageContext: input.pageContext,
      recommendedPackages,
    });

    const ticketPreview = await buildTicketPreview({
      sessionId: session.id,
      userId: input.userId,
      message: trimmedMessage,
      chatHistory: history.reverse().map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    });

    if (ticketPreview && input.userId) {
      actions.push(ticketPreview);
    }

    const aiAnswerLower = providerResponse.answer.toLowerCase();
    const liveChatIntentPhrases = [
      'real agent', 'live agent', 'live chat', 'human agent', 'support agent',
      'connect you to', 'transfer you to', 'noted your request to chat',
      'allow some time for the support team', 'agent will be with you',
    ];
    const hasLiveChatIntent = liveChatIntentPhrases.some((phrase) => aiAnswerLower.includes(phrase));
    if (hasLiveChatIntent && input.userId && !actions.some((a) => a.type === 'live-chat')) {
      actions.push({
        type: 'live-chat',
        label: 'Connect to live agent',
        payload: { reason: 'User escalated from Luna assistant' },
      });
    }

    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        userId: input.userId,
        role: "assistant",
        content: providerResponse.answer,
        citations: toJson(citations),
        actions: toJson(actions),
        model: providerResponse.model,
        inputTokens: providerResponse.inputTokens,
        outputTokens: providerResponse.outputTokens,
        latencyMs: Date.now() - startedAt,
        toolName: "knowledge+context",
        toolResult: toJson({
          knowledgeCount: knowledge.length,
          usedUserContext: Boolean(userContext),
          operationalHints,
        }),
      },
    });

    await db.chatSession.update({
      where: { id: session.id },
      data: {
        lastMessageAt: new Date(),
        title: session.title || trimmedMessage.slice(0, 80),
        context: toJson(input.pageContext || session.context || {}),
      },
    });

    return {
      sessionId: session.id,
      answer: providerResponse.answer,
      citations,
      actions,
      escalationOffered: actions.some((action) => action.type === 'ticket' || action.type === 'live-chat'),
      model: providerResponse.model,
    };
  }

  static async saveFeedback(input: {
    sessionId: string;
    messageId?: string;
    rating: string;
    comment?: string;
    userId?: string;
  }) {
    return db.chatFeedback.create({
      data: {
        sessionId: input.sessionId,
        messageId: input.messageId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment,
      },
    });
  }

  static async escalate(input: {
    sessionId: string;
    userId: string;
    role?: string;
    reason: string;
  }) {
    const session = await db.chatSession.findUnique({ where: { id: input.sessionId } });

    if (!session) {
      throw new AppError(statusCode.NOT_FOUND, "Chat session not found");
    }

    if (session.userId && session.userId !== input.userId && !isAdminRole(input.role)) {
      throw new AppError(statusCode.FORBIDDEN, "You do not have access to this chat session");
    }

    return createSupportEscalation({
      sessionId: input.sessionId,
      userId: input.userId,
      reason: input.reason,
    });
  }

  static async getAnalytics() {
    const [sessions, messages, positiveFeedback, escalations] = await Promise.all([
      db.chatSession.count(),
      db.chatMessage.count(),
      db.chatFeedback.count({ where: { rating: "up" } }),
      db.chatEscalation.count(),
    ]);

    return {
      sessions,
      messages,
      positiveFeedback,
      escalations,
    };
  }
}
