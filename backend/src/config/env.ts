import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  API_URL: z.string().url().default('http://localhost:5000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_SSL_MODE: z.enum(['disable', 'prefer', 'require']).default('prefer'),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  SENDGRID_API_KEY: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_PUBLIC_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),

  ESIM_WEBHOOK_SECRET: z.string().optional().default(''),

  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_S3_BUCKET: z.string().optional().default(''),
  AWS_S3_REGION: z.string().default('us-east-1'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_PHONE_NUMBER: z.string().optional().default(''),

  ESIM_ACCESS_CODE: z.string().optional().default(''),
  ESIM_API_KEY: z.string().optional().default(''),
  ESIM_SECRET_KEY: z.string().optional().default(''),

  CHAT_FEATURE_ENABLED: z.string().default('true').transform((value) => value === 'true'),
  AI_PROVIDER: z.string().default('openai-compatible'),
  AI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().default('gpt-4.1-mini'),
  AI_API_KEY: z.string().optional().default(''),
});
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    console.error('❌ Environment validation failed:\n', errors);
    console.error('\n⚠️ CRITICAL: Some required environment variables are missing');
    console.error('Please ensure all required variables are set in your environment or .env file');
    process.exit(1);
  }

  return result.data;
}

const validatedEnv = validateEnv();
export const config = {
  node_env: validatedEnv.NODE_ENV,
  port: validatedEnv.PORT,
  api_url: validatedEnv.API_URL,
  frontend_url: validatedEnv.FRONTEND_URL,

  aws_s3_bucket: validatedEnv.AWS_S3_BUCKET,
  aws_s3_region: validatedEnv.AWS_S3_REGION,

  redis_url: validatedEnv.REDIS_URL,

  jwt_expires_in: validatedEnv.JWT_EXPIRES_IN,

  chat_feature_enabled: validatedEnv.CHAT_FEATURE_ENABLED,
  ai_provider: validatedEnv.AI_PROVIDER,
  ai_base_url: validatedEnv.AI_BASE_URL,
  ai_model: validatedEnv.AI_MODEL,
};
export const secrets = {
  database_url: validatedEnv.DATABASE_URL,
  db_ssl_mode: validatedEnv.DB_SSL_MODE,
  jwt_secret: validatedEnv.JWT_SECRET,
  sendgrid_api_key: validatedEnv.SENDGRID_API_KEY,
  stripe_secret_key: validatedEnv.STRIPE_SECRET_KEY,
  stripe_public_key: validatedEnv.STRIPE_PUBLIC_KEY,
  stripe_webhook_secret: validatedEnv.STRIPE_WEBHOOK_SECRET,
  aws_access_key_id: validatedEnv.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: validatedEnv.AWS_SECRET_ACCESS_KEY,
  twilio_account_sid: validatedEnv.TWILIO_ACCOUNT_SID,
  twilio_auth_token: validatedEnv.TWILIO_AUTH_TOKEN,
  twilio_phone_number: validatedEnv.TWILIO_PHONE_NUMBER,
  esim_access_code: validatedEnv.ESIM_ACCESS_CODE,
  esim_api_key: validatedEnv.ESIM_API_KEY,
  esim_secret_key: validatedEnv.ESIM_SECRET_KEY,
  ai_api_key: validatedEnv.AI_API_KEY,
};
export default config;
