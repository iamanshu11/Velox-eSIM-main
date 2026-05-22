import db from "@config/database";
import { walletService } from "@modules/wallet/wallet.service";
import { SupportService } from "@modules/support/support.service";
import { getAllDataPackages, DataPackage, getSupportedLocations } from "@modules/esim/esim.service";
import { LunaAction, LunaUserContext, ChatPageContext } from "./chat.types";

const containsAny = (value: string, keywords: string[]): boolean => {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};
const parseCountryFromMessage = async (message: string): Promise<string | null> => {
  const normalized = message.toLowerCase();
  
  try {
    const locations = await getSupportedLocations().catch(() => []);

    const locationMap: Record<string, string> = {};
    
    for (const location of locations) {
      locationMap[location.name.toLowerCase()] = location.code;
      locationMap[location.code.toLowerCase()] = location.code;
      
      if (location.subLocationList) {
        for (const subLoc of location.subLocationList) {
          locationMap[subLoc.name.toLowerCase()] = location.code;
          locationMap[subLoc.code.toLowerCase()] = location.code;
        }
      }
    }

    for (const [locationName, code] of Object.entries(locationMap)) {
      if (normalized.includes(locationName)) {
        return code;
      }
    }
  } catch (error) {
    console.error('[ChatWidget] Failed to fetch locations for country detection:', error);
  }

  const commonAliases: Record<string, string> = {
    'usa': 'US',
    'america': 'US',
    'us': 'US',
    'uk': 'GB',
    'united kingdom': 'GB',
    'england': 'GB',
    'france': 'FR',
    'germany': 'DE',
    'spain': 'ES',
    'italy': 'IT',
    'india': 'IN',
    'japan': 'JP',
    'canada': 'CA',
    'australia': 'AU',
    'singapore': 'SG',
    'thailand': 'TH',
    'vietnam': 'VN',
    'indonesia': 'ID',
    'philippines': 'PH',
    'mexico': 'MX',
    'brazil': 'BR',
    'dubai': 'AE',
    'uae': 'AE',
    'united arab emirates': 'AE',
    'bangladesh': 'BD',
    'hong kong': 'HK',
    'south korea': 'KR',
    'taiwan': 'TW',
    'pakistan': 'PK',
    'sri lanka': 'LK',
    'malaysia': 'MY',
    'turkey': 'TR',
    'egypt': 'EG',
    'south africa': 'ZA',
    'nigeria': 'NG',
    'kenya': 'KE',
  };
  
  for (const [keyword, code] of Object.entries(commonAliases)) {
    if (normalized.includes(keyword)) {
      return code;
    }
  }
  
  return null;
};

export const getRecommendedPackages = async (
  message: string,
  limit: number = 100,
): Promise<DataPackage[]> => {
  try {
    const countryCode = await parseCountryFromMessage(message);
    
    if (countryCode) {
      const packages = await getAllDataPackages(
        { locationCode: countryCode },
        1,
        500,
      );
      return packages.slice(0, limit);
    }

    const packages = await getAllDataPackages({}, 1, 500);
    return packages.slice(0, limit);
  } catch (error) {
    console.error('[ChatWidget] Failed to fetch packages:', error);
    return [];
  }
};

export const getUserContextSummary = async (userId: string): Promise<LunaUserContext> => {
  const [user, wallet, orders, transactions, tickets] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        countryName: true,
      },
    }),
    walletService.getWallet(userId).catch(() => null),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNo: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        metadata: true,
      },
    }),
    db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        transactionType: true,
        amount: true,
        status: true,
        reference: true,
        createdAt: true,
      },
    }),
    db.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const orderLines = orders.length
    ? orders
        .map(
          (order) =>
            `Order ${order.orderNo}: status ${order.status}, payment ${order.paymentStatus}, amount ${order.totalAmount ?? 0} ${order.currency}`,
        )
        .join("\n")
    : "No recent orders.";

  const transactionLines = transactions.length
    ? transactions
        .map(
          (transaction) =>
            `${transaction.transactionType} ${transaction.amount} (${transaction.status}) reference ${transaction.reference || "n/a"}`,
        )
        .join("\n")
    : "No recent transactions.";

  const ticketLines = tickets.length
    ? tickets.map((ticket) => `${ticket.subject} (${ticket.status})`).join("\n")
    : "No recent support tickets.";

  return {
    summary: [
      `User: ${user?.name || "Customer"} (${user?.email || "unknown email"})`,
      `Role: ${user?.role || "CUSTOMER"}`,
      `Country: ${user?.countryName || "unknown"}`,
      `Wallet balance: ${wallet?.balance ?? 0} ${wallet?.currency || "USD"}`,
      `Recent orders:\n${orderLines}`,
      `Recent transactions:\n${transactionLines}`,
      `Recent support tickets:\n${ticketLines}`,
    ].join("\n\n"),
    data: {
      user,
      wallet,
      orders,
      transactions,
      tickets,
    },
  };
};

export const buildSuggestedActions = async (input: {
  message: string;
  userId?: string;
  pageContext?: ChatPageContext;
  recommendedPackages?: DataPackage[];
}): Promise<LunaAction[]> => {
  const actions: LunaAction[] = [];
  const message = input.message.toLowerCase();

  if (!input.userId) {
    actions.push({
      type: "navigate",
      label: "Log in for account-specific help",
      payload: { path: "/login" },
    });
  }

  if (containsAny(message, ["cancel", "refund", "esim", "activate"])) {
    actions.push({
      type: "navigate",
      label: "Open My eSIMs",
      payload: { path: "/dashboard/esims" },
    });
  }

  if (containsAny(message, ["wallet", "balance", "top up", "topup"])) {
    actions.push({
      type: "navigate",
      label: "Open Wallet",
      payload: { path: "/dashboard/wallet" },
    });
  }

  if (containsAny(message, ["payment", "transaction", "receipt", "invoice"])) {
    actions.push({
      type: "navigate",
      label: "Open Payments",
      payload: { path: "/dashboard/payments" },
    });
  }

  if (input.recommendedPackages && input.recommendedPackages.length > 0) {
    for (const pkg of input.recommendedPackages) {
      const priceUsd = (pkg.price / 100).toFixed(2);
      const volumeGb = (pkg.volume / (1024 * 1024 * 1024)).toFixed(1);
      const label = `Buy: ${pkg.name} - $${priceUsd} (${volumeGb}GB, ${pkg.duration}${pkg.durationUnit})`;
      
      const checkoutUrl = `/checkout?packageCode=${encodeURIComponent(pkg.packageCode)}&price=${pkg.price}&volume=${pkg.volume}&duration=${pkg.duration}&location=${encodeURIComponent(pkg.location || '')}`;
      
      actions.push({
        type: "navigate",
        label,
        payload: {
          path: checkoutUrl,
          packageCode: pkg.packageCode,
          price: pkg.price,
          volume: pkg.volume,
        },
      });
    }
  }

  if (containsAny(message, ["support", "agent", "human", "ticket", "help me manually"])) {
    actions.push({
      type: "ticket",
      label: "Escalate to support",
      payload: { reason: input.message },
    });
  }

  if (actions.length <= 3 && input.pageContext?.area === "public") {
    actions.push({
      type: "navigate",
      label: "Browse eSIM plans",
      payload: { path: "/esim" },
    });
  }

  return actions.slice(0, 15);
};

const detectTicketCreationIntent = (message: string): boolean => {
  const normalized = message.toLowerCase();
  const ticketKeywords = [
    'create a ticket',
    'create ticket',
    'submit a ticket',
    'submit ticket',
    'book a ticket',
    'book ticket',
    'raise a ticket',
    'raise ticket',
    'open a ticket',
    'open ticket',
    'file a ticket',
    'file ticket',
    'new ticket',
  ];

  return ticketKeywords.some((keyword) => normalized.includes(keyword));
};

const detectTicketPriority = (conversationText: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' => {
  const normalized = conversationText.toLowerCase();
  const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediate', 'broken', 'not working', 'blocked', 'cannot', 'unable'];
  const highKeywords = ['important', 'issue', 'problem', 'error', 'fail', 'lost', 'missing'];
  const mediumKeywords = ['question', 'help', 'assistance', 'support', 'activate', 'setup'];

  if (urgentKeywords.some((keyword) => normalized.includes(keyword))) return 'URGENT';
  if (highKeywords.some((keyword) => normalized.includes(keyword))) return 'HIGH';
  if (mediumKeywords.some((keyword) => normalized.includes(keyword))) return 'MEDIUM';
  return 'LOW';
};

export const buildTicketPreview = async (input: {
  sessionId: string;
  userId?: string;
  message: string;
  chatHistory: Array<{ role: string; content: string }>;
}): Promise<LunaAction | null> => {
  if (!detectTicketCreationIntent(input.message)) {
    return null;
  }

  const userMessages = input.chatHistory
    .filter((msg) => msg.role === 'user')
    .map((msg) => msg.content);

  const lastUserMessage = userMessages[userMessages.length - 1] || '';
  const conversationText = input.chatHistory.map((msg) => msg.content).join(' ');
  const priority = detectTicketPriority(conversationText);

  const ticket = {
    subject: lastUserMessage.slice(0, 60) || 'Support Request',
    description: input.chatHistory
      .map((msg) => `${msg.role === 'user' ? 'You' : 'Luna'}: ${msg.content}`)
      .join('\n\n'),
    category: 'connectivity',
    priority,
  };

  return {
    type: 'ticket-preview',
    label: 'Submit Support Ticket',
    payload: {
      sessionId: input.sessionId,
      ticket,
    },
  };
};

export const summarizeOperationalHints = async (
  message: string,
  userId?: string,
): Promise<string> => {
  if (!userId) {
    return "No authenticated operational hints available.";
  }

  if (containsAny(message, ["cancel", "refund"])) {
    const refundableOrders = await db.order.findMany({
      where: {
        userId,
        paymentStatus: {
          not: "refunded",
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        orderNo: true,
        paymentStatus: true,
        status: true,
        metadata: true,
      },
    });

    if (refundableOrders.length === 0) {
      return "No recent refundable orders were found in the account context.";
    }

    return `Potentially relevant orders for cancellation or refund: ${refundableOrders
      .map((order) => `${order.orderNo} (${order.status}/${order.paymentStatus})`)
      .join(", ")}.`;
  }

  if (containsAny(message, ["support", "agent", "human"])) {
    return "The user may need a support escalation. Offer the support ticket action if the answer is not enough.";
  }

  return "No special operational hints were triggered.";
};

export const createSupportEscalation = async (input: {
  sessionId: string;
  userId: string;
  reason: string;
}) => {
  const ticket = await SupportService.createTicket({
    userId: input.userId,
    subject: "Luna escalation",
    message: input.reason,
    category: "chatbot",
  });

  const escalation = await db.chatEscalation.create({
    data: {
      sessionId: input.sessionId,
      userId: input.userId,
      supportTicketId: ticket.id,
      reason: input.reason,
      status: "open",
    },
  });

  await db.activityLog.create({
    data: {
      userId: input.userId,
      action: "LUNA_ESCALATION_CREATED",
      resource: "chat",
      module: "chat",
      details: `Luna escalated session ${input.sessionId} to support ticket ${ticket.id}`,
    },
  });

  return {
    escalation,
    ticket,
  };
};
