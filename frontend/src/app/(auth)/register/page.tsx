'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import Input from '@/components/Input';
import Container from '@/components/Container';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/authSlice';
import logger from '@/lib/logger';
import { resolveBrowserCountryLocation } from '@/lib/browserCountryLocation';
import { validateEmail, validatePassword } from '@/utils/validators';
import FormError from '@/components/FormError';
import type { ApiResponse, User } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION_MS = 60 * 60 * 1000;
  useEffect(() => {
    if (!blockUntil || new Date() >= blockUntil) {
      return;
    }
    
    const timer = setInterval(() => {
      if (new Date() >= blockUntil) {
        setBlockUntil(null);
        setFailedAttempts(0);
        setError("");
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [blockUntil]);

  const isRateLimited = !!blockUntil && new Date() < blockUntil;
  const remainingMinutes = Math.ceil(
    ((blockUntil?.getTime() || 0) - new Date().getTime()) / 60000
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    if (isRateLimited) {
      setError(
        `Too many registration attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`
      );
      return;
    }

    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors[0] || 'Invalid password';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const location = await resolveBrowserCountryLocation();
      const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        ...(location ? { location } : {}),
      });

      if (response?.success && response?.data?.user) {
        const user = response.data.user;
        setFailedAttempts(0);
        setBlockUntil(null);
        
        dispatch(setUser(user));
        logger.info(`User ${formData.email} registered successfully`);

        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        const errorMsg = response?.message || 'Registration failed. Please try again.';
        setError(errorMsg);
        logger.error('Registration failed', {
          message: errorMsg,
          description: `Response: ${JSON.stringify(response)}`,
        });
      }
    } catch (err) {
      let errorMsg = "Registration failed. Please try again.";
      let statusCode = 0;
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const error = err as any;
        statusCode = error?.response?.status;
        if (statusCode === 429) {
          errorMsg = "Too many registration attempts. Please try again in 1 hour.";
          setFailedAttempts(MAX_ATTEMPTS);
          setBlockUntil(new Date(Date.now() + BLOCK_DURATION_MS));
        } else {
          errorMsg = 
            error?.response?.data?.error?.message || 
            error?.response?.data?.message ||       
            error?.message ||                       
            error?.statusText ||                    
            "Registration failed. Please try again.";
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          
          if (newFailedAttempts >= MAX_ATTEMPTS) {
            setBlockUntil(new Date(Date.now() + BLOCK_DURATION_MS));
          }
        }
      }
      
      setError(errorMsg);
      const errorDescription = err instanceof Error 
        ? err.message 
        : (typeof err === 'object' && err !== null
          ? (() => {
              const error = err as any;
              return `${error?.response?.status || 'Unknown'}: ${error?.response?.data?.message || error?.message || JSON.stringify(error)}`;
            })()
          : String(err));
      const errorLog: any = { message: errorMsg };
      if (statusCode) errorLog.statusCode = statusCode;
      errorLog.description = errorDescription;
      
      logger.error('Registration error:', errorLog);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-20">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="hidden md:block">
            <h1 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
              Join millions using global connectivity
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Get instant access to eSIM plans in 190+ countries. Sign up in seconds and stay connected anywhere.
            </p>
            <ul className="space-y-4">
              {[
                'Instant activation in seconds',
                'Coverage in 190+ countries',
                '24/7 customer support',
                'Transparent, no hidden fees'
              ].map((feature, idx) => (
                <li key={feature || idx} className="flex items-start gap-3">
                  <span className="text-xl text-gray-900 mt-1 font-bold">/</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-700">Join Velox eSIM today</p>
            </div>

            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-8">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Full Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    placeholder="John Doe"
                    onChange={handleChange}
                    required
                    className={`w-full ${validationErrors.name ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.name && <FormError message={validationErrors.name} className="mt-2" />}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Email Address</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    placeholder="you@example.com"
                    onChange={handleChange}
                    required
                    className={`w-full ${validationErrors.email ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.email && <FormError message={validationErrors.email} className="mt-2" />}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Password</label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    placeholder="••••••••"
                    onChange={handleChange}
                    required
                    className={`w-full ${validationErrors.password ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.password ? (
                    <FormError message={validationErrors.password} className="mt-2" />
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">Minimum 8 characters with uppercase, lowercase, number, and special character</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Confirm Password</label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    placeholder="••••••••"
                    onChange={handleChange}
                    required
                    className={`w-full ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.confirmPassword && <FormError message={validationErrors.confirmPassword} className="mt-2" />}
                </div>

                <label className="flex items-start gap-2 mt-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 mt-1"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-gray-900 hover:text-gray-700 font-semibold transition-colors underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-gray-900 hover:text-gray-700 font-semibold transition-colors underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || isRateLimited}
                >
                  {loading ? 'Creating account...' : isRateLimited ? `Blocked for ${remainingMinutes}m` : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-700 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}




