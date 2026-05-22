import axios, { AxiosError, AxiosInstance } from 'axios'
import { secrets } from '@/config/env'

const STRIPE_API_KEY = secrets.stripe_secret_key
const SENDGRID_API_KEY = secrets.sendgrid_api_key

class ExternalAPI {
  private stripeClient: AxiosInstance
  private sendgridClient: AxiosInstance

  constructor() {
    this.stripeClient = axios.create({
      baseURL: 'https://api.stripe.com/v1',
      auth: {
        username: STRIPE_API_KEY,
        password: '',
      },
    })

    this.sendgridClient = axios.create({
      baseURL: 'https://api.sendgrid.com/v3',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
  }
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.stripeClient.post('/payment_intents', {
        amount: Math.round(amount * 100),
        currency,
        metadata,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.stripeClient.post(
        `/payment_intents/${paymentIntentId}/confirm`,
        {
          payment_method: paymentMethodId,
        }
      )
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.stripeClient.post('/refunds', {
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.stripeClient.get(`/payment_intents/${paymentIntentId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<Record<string, unknown>> {
    try {
      const response = await this.stripeClient.post('/customers', {
        email,
        name,
        metadata,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }
  async sendEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    from: string = 'noreply@veloxesim.com'
  ): Promise<Record<string, unknown>> {
    try {
      const recipients = Array.isArray(to) ? to : [to]
      const response = await this.sendgridClient.post('/mail/send', {
        personalizations: recipients.map((email) => ({
          to: [{ email }],
        })),
        from: { email: from },
        subject,
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
          {
            type: 'text/plain',
            value: textContent || htmlContent.replace(/<[^>]*>/g, ''),
          },
        ],
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async sendTemplatedEmail(
    to: string | string[],
    templateId: string,
    dynamicData?: Record<string, unknown>,
    from: string = 'noreply@veloxesim.com'
  ): Promise<Record<string, unknown>> {
    try {
      const recipients = Array.isArray(to) ? to : [to]
      const response = await this.sendgridClient.post('/mail/send', {
        personalizations: recipients.map((email) => ({
          to: [{ email }],
          dynamic_template_data: dynamicData,
        })),
        from: { email: from },
        template_id: templateId,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  async addContactToList(email: string, firstName?: string, lastName?: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.sendgridClient.put('/marketing/contacts', {
        contacts: [
          {
            email,
            first_name: firstName,
            last_name: lastName,
          },
        ],
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError)
    }
  }

  private handleError(error: AxiosError): never {
    interface APIErrorResponse {
      message?: string;
    }
    const responseData = error.response?.data as APIErrorResponse | undefined;
    const message = responseData?.message || error.message || 'API Error'
    const status = error.response?.status || 500

    interface APIError extends Error {
      statusCode?: number;
      originalError?: AxiosError;
    }
    const apiError: APIError = new Error(message)
    apiError.statusCode = status
    apiError.originalError = error

    throw apiError
  }
}

export default new ExternalAPI()

