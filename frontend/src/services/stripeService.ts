import { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiClient } from '@/lib/apiClient';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    );
  }
  return stripePromise;
};

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  status: string;
}

export interface TopUpPayload {
  amount: number;
}

export const stripeService = {
async getInstance(): Promise<Stripe | null> {
    return getStripe();
  },
async createTopUpIntent(amount: number): Promise<PaymentIntentResponse> {
    try {
      const response = await apiClient.post<PaymentIntentResponse>('/payments/topup/intent', {
        amount,
      });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
      throw new Error(errorMessage);
    }
  },
async confirmPayment(
    stripe: Stripe,
    elements: any,
    clientSecret: string,
    options?: Record<string, unknown>,
  ) {
    return stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement('card'),
        billing_details: {
          name: options?.name as string,
          email: options?.email as string,
        },
      },
    });
  },
async confirmPaymentIntent(
    stripe: Stripe,
    clientSecret: string,
    data?: Record<string, unknown>,
  ) {
    return stripe.confirmPayment({
      clientSecret,
      confirmParams: data as any,
      redirect: 'if_required',
    });
  },
};

export default stripeService;
