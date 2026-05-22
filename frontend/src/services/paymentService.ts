import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import type { ApiResponse, Payment } from '@/types';
import type { Stripe, StripeCardElement } from '@stripe/stripe-js';
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  status: string;
}
export interface CreatePurchaseIntentRequest {
  amount: number;
  packageCode: string;
  quantity: number;
}
export interface CreateTopUpIntentRequest {
  amount: number;
}
export interface PaymentConfirmRequest {
  clientSecret: string;
  stripe: Stripe;
  cardElement: StripeCardElement;
  billingDetails: {
    name: string;
    email: string;
  };
}
export interface PaymentConfirmResponse {
  success: boolean;
  intentId?: string;
  status?: string;
  error?: string;
}
export class PaymentService {
static async createPurchaseIntent(
    request: CreatePurchaseIntentRequest
  ): Promise<PaymentIntentResponse> {
    try {
      logger.info('[PaymentService] Creating purchase intent', {
        amount: request.amount,
        packageCode: request.packageCode,
        quantity: request.quantity,
      });

      const response = await apiClient.post<ApiResponse<PaymentIntentResponse>>(
        '/payments/purchase/intent',
        request
      );

      const data = response?.data;
      if (!data?.clientSecret) {
        throw new Error('No client secret returned from server');
      }

      logger.info('[PaymentService] Purchase intent created', {
        intentId: data.paymentIntentId,
      });

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create payment intent';
      logger.error('[PaymentService] Create purchase intent failed', error);
      throw new Error(errorMsg);
    }
  }
static async createTopUpIntent(amount: number): Promise<PaymentIntentResponse> {
    try {
      logger.info('[PaymentService] Creating top-up intent', { amount });

      const response = await apiClient.post<ApiResponse<PaymentIntentResponse>>(
        '/payments/topup/intent',
        { amount } as CreateTopUpIntentRequest
      );

      const data = response?.data;
      if (!data?.clientSecret) {
        throw new Error('No client secret returned from server');
      }

      logger.info('[PaymentService] Top-up intent created', {
        intentId: data.paymentIntentId,
      });

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create payment intent';
      logger.error('[PaymentService] Create top-up intent failed', error);
      throw new Error(errorMsg);
    }
  }
static async confirmCardPayment(request: PaymentConfirmRequest): Promise<PaymentConfirmResponse> {
    const { clientSecret, stripe, cardElement, billingDetails } = request;

    try {
      logger.info('[PaymentService] Confirming card payment');

      if (!stripe || !cardElement) {
        throw new Error('Stripe not initialized properly');
      }

      if (!billingDetails.name || !billingDetails.email) {
        throw new Error('Billing details incomplete');
      }
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: billingDetails,
          },
        }
      );

      if (stripeError) {
        const errorDetails = {
          type: stripeError.type || 'Unknown',
          message: stripeError.message || 'Payment failed',
          code: stripeError.code,
          charge: stripeError.charge,
          decline_code: stripeError.decline_code,
          param: stripeError.param,
        };
        logger.error('[PaymentService] Stripe error', errorDetails);
        return {
          success: false,
          error: stripeError.message || 'Payment failed',
        };
      }

      if (!paymentIntent) {
        throw new Error('No payment intent returned from Stripe');
      }
      const isSuccessful =
        paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing';

      if (isSuccessful) {
        logger.info('[PaymentService] Payment confirmed', {
          intentId: paymentIntent.id,
          status: paymentIntent.status,
        });

        return {
          success: true,
          intentId: paymentIntent.id,
          status: paymentIntent.status,
        };
      }

      return {
        success: false,
        error: `Unexpected payment status: ${paymentIntent.status}`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment confirmation failed';
      logger.error('[PaymentService] Payment confirmation error', error);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
static async completePayment(paymentId: string, transactionId: string): Promise<Payment> {
    try {
      logger.info('[PaymentService] Completing payment', { paymentId });

      const response = await apiClient.post<ApiResponse<Payment>>(
        `/payments/${paymentId}/complete`,
        { transactionId }
      );

      const data = response?.data;
      if (!data) {
        throw new Error('No payment data returned');
      }

      logger.info('[PaymentService] Payment completed', { paymentId });
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to complete payment';
      logger.error('[PaymentService] Complete payment failed', error);
      throw new Error(errorMsg);
    }
  }
static validatePaymentParams(
    amount: number,
    packageCode: string
  ): { valid: boolean; error?: string } {
    if (!amount || amount <= 0) {
      return { valid: false, error: 'Invalid payment amount' };
    }

    if (!packageCode || typeof packageCode !== 'string' || packageCode.trim().length === 0) {
      return { valid: false, error: 'Invalid package code' };
    }

    return { valid: true };
  }
static formatAmount(amount: number): string {
    return (amount / 100).toFixed(2);
  }
}

export const paymentService = {
  async createPaymentIntent(data: { orderId: string; amount: number }): Promise<PaymentIntentResponse> {
    const response = await apiClient.post<ApiResponse<PaymentIntentResponse>>(
      '/payments/purchase/intent',
      { amount: data.amount, packageCode: data.orderId, quantity: 1 }
    );
    return response.data!;
  },

  async createTopUpIntent(amount: number): Promise<PaymentIntentResponse> {
    return PaymentService.createTopUpIntent(amount);
  },

  async completePayment(paymentId: string, transactionId: string): Promise<Payment> {
    return PaymentService.completePayment(paymentId, transactionId);
  },

  async getOrderPayment(orderId: string): Promise<Payment> {
    const response = await apiClient.get<ApiResponse<Payment>>(
      `/payments/user/my-payments?orderId=${orderId}`
    );
    return response.data!;
  },

  async refundPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.post<ApiResponse<Payment>>(
      `/payments/${paymentId}/refund`,
      {}
    );
    return response.data!;
  },

  async getUserPayments(): Promise<Payment[]> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/payments/user/my-payments'
    );

    const payload = response.data;
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload.payments && Array.isArray(payload.payments)) {
      return payload.payments;
    }

    return [];
  },

  async initiatePayment(data: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    cardToken?: string;
  }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/payments/topup/intent', { amount: data.amount });
    return response.data!;
  },
};

export default paymentService;

