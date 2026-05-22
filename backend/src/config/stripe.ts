import Stripe from 'stripe';
import { secrets } from './env';

export const stripe = new Stripe(secrets.stripe_secret_key, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export default stripe;
