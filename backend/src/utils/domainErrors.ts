import { AppError } from './errors';
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message);
    this.name = 'AuthorizationError';
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}
export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed') {
    super(402, message);
    this.name = 'PaymentError';
  }
}
export class ESIMAccessError extends AppError {
  constructor(message: string) {
    super(502, `eSIM Access API Error: ${message}`);
    this.name = 'ESIMAccessError';
  }
}
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(503, `${service} service is unavailable`);
    this.name = 'ServiceUnavailableError';
  }
}
export class RateLimitError extends AppError {
  retryAfter?: number;

  constructor(retryAfter?: number) {
    super(429, 'Too many requests. Please try again later.');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
export class WebhookError extends AppError {
  constructor(message: string) {
    super(400, `Webhook processing failed: ${message}`);
    this.name = 'WebhookError';
  }
}
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, `Database error: ${message}`);
    this.name = 'DatabaseError';
  }
}
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(500, `Configuration error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

