import { Prisma } from "@prisma/client";
import db from "@config/database";
import { LunaKnowledgeResult } from "./chat.types";

interface DefaultKnowledgeDocument {
  sourceType: string;
  title: string;
  slug: string;
  content: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_KNOWLEDGE_DOCUMENTS: DefaultKnowledgeDocument[] = [
  {
    sourceType: "faq",
    title: "Getting Started With eSIM Plans",
    slug: "getting-started-esim",
    content:
      "Users can browse countries, compare plans, and buy an eSIM with wallet funds. After purchase, they receive an order number and eSIM profile details. If an eSIM is not activated yet, the user can still cancel it if the order is eligible and the platform allows refund processing.",
  },
  {
    sourceType: "faq",
    title: "Browsing And Selecting eSIM Packages",
    slug: "browsing-packages",
    content:
      "Velox eSIM offers local, regional, and global eSIM packages. Users can filter by country, data amount, duration, and price. Local packages offer coverage in a single country. Regional packages cover multiple countries in a region. Global packages work in 120+ or 130+ destinations worldwide.",
  },
  {
    sourceType: "faq",
    title: "Popular eSIM Plans And Pricing",
    slug: "popular-plans-pricing",
    content:
      "Velox eSIM offers eSIM packages for multiple countries and regions. Prices vary based on data volume (measured in GB) and validity period (ranging from daily to monthly). When you ask about a specific country or region, Luna will show you all available packages with real-time pricing, data amounts, and validity. Users can compare plans side-by-side to find the best value for their needs.",
  },
  {
    sourceType: "faq",
    title: "Checking Package Coverage And Details",
    slug: "package-coverage-details",
    content:
      "Each eSIM package shows supported countries, operators, data volume in GB, validity period, and price. Users can click 'Coverage' to see which countries and networks are supported. Check if your destination country is included before purchasing to ensure connectivity.",
  },
  {
    sourceType: "policy",
    title: "Cancellation And Refund Guidance",
    slug: "cancellation-refund-guidance",
    content:
      "Users and admins can cancel eligible eSIM profiles. When an eligible eSIM is cancelled, the system refunds the proportional purchase amount back to the user wallet. Already cancelled or deleted eSIMs cannot be cancelled again. Duplicate refunds are blocked.",
  },
  {
    sourceType: "faq",
    title: "Wallet And Payment Help",
    slug: "wallet-payment-help",
    content:
      "Wallet balance is the primary payment method for eSIM purchases. Top-ups increase the wallet balance. eSIM purchases deduct from the wallet. Refunds are credited back into the wallet and can be reviewed in transaction history.",
  },
  {
    sourceType: "support_article",
    title: "Troubleshooting No Data Or Activation Issues",
    slug: "troubleshooting-data-issues",
    content:
      "When a user reports no data, check whether the eSIM is activated, whether the profile is expired or cancelled, and whether APN or device settings need review. If the issue cannot be solved with account context and standard guidance, open a support ticket for manual review.",
  },
  {
    sourceType: "support_article",
    title: "Orders And Profile Lookup",
    slug: "orders-profile-lookup",
    content:
      "Order-level details are stored in the platform database, while live profile details can come from the eSIM provider. The chatbot should only access user-safe order, wallet, transaction, and support data through backend-approved tools.",
  },
  {
    sourceType: "policy",
    title: "Luna Guardrails",
    slug: "luna-guardrails",
    content:
      "Luna must never expose secrets, tokens, or internal-only data. It can summarize account state, guide users to the correct dashboard page, and escalate to support when confidence is low or a manual action is required. Luna can recommend packages and provide direct checkout links when users express interest in purchasing.",
  },
];

let seedPromise: Promise<void> | null = null;

const toJson = <T>(value: T): Prisma.InputJsonValue => value as unknown as Prisma.InputJsonValue;

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const tokenize = (value: string): string[] => {
  const normalized = normalize(value);
  if (!normalized) {
    return [];
  }

  return Array.from(new Set(normalized.split(" ").filter((token) => token.length > 2)));
};

const splitIntoChunks = (content: string): string[] => {
  const paragraphs = content.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (`${current} ${paragraph}`.trim().length > 380 && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = `${current} ${paragraph}`.trim();
    }
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks;
};

export const ensureKnowledgeBaseSeeded = async (): Promise<void> => {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    const existingCount = await db.knowledgeDocument.count();
    if (existingCount > 0) {
      return;
    }

    for (const document of DEFAULT_KNOWLEDGE_DOCUMENTS) {
      const created = await db.knowledgeDocument.create({
        data: {
          sourceType: document.sourceType,
          title: document.title,
          slug: document.slug,
          content: document.content,
          metadata: toJson(document.metadata || {}),
          isPublished: true,
        },
      });

      const chunks = splitIntoChunks(document.content);

      if (chunks.length > 0) {
        await db.knowledgeChunk.createMany({
          data: chunks.map((chunkText, index) => ({
            documentId: created.id,
            chunkIndex: index,
            chunkText,
            keywords: tokenize(`${document.title} ${chunkText}`),
            metadata: toJson({ slug: document.slug }),
          })),
        });
      }
    }
  })();

  return seedPromise;
};

const scoreChunk = (queryTokens: string[], text: string, keywords: string[], title: string): number => {
  if (queryTokens.length === 0) {
    return 0;
  }

  const normalizedText = normalize(text);
  const normalizedTitle = normalize(title);
  let score = 0;

  for (const token of queryTokens) {
    if (keywords.includes(token)) {
      score += 3;
    }
    if (normalizedTitle.includes(token)) {
      score += 2;
    }
    if (normalizedText.includes(token)) {
      score += 1;
    }
  }

  return score;
};

export const searchKnowledgeBase = async (
  query: string,
  take: number = 4,
): Promise<LunaKnowledgeResult[]> => {
  await ensureKnowledgeBaseSeeded();

  const queryTokens = tokenize(query);
  const chunks = await db.knowledgeChunk.findMany({
    include: {
      document: true,
    },
  });

  return chunks
    .map((chunk) => ({
      title: chunk.document.title,
      slug: chunk.document.slug,
      sourceType: chunk.document.sourceType,
      excerpt: chunk.chunkText,
      score: scoreChunk(queryTokens, chunk.chunkText, chunk.keywords, chunk.document.title),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, take);
};