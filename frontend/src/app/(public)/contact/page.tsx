'use client';

import Container from '@/components/Container';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import logger from '@/lib/logger';
import { validateEmail } from '@/utils/validators';
import { FormError } from '@/utils/formValidation';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }
    
    try {
      await apiClient.post<any>('/support', {
        subject: formData.subject,
        message: `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`,
      });
      
      logger.info(`Contact form submitted by ${formData.email}`);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const error = err as any;
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to send message. Please try again.';
      setError(errorMsg);
      logger.error('Contact form submission failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-linear-to-br from-primary-50 to-primary-100">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">Contact Us</h1>
            <p className="text-xl text-gray-700">
              Have questions? We&apos;d love to hear from you. Get in touch with our team today.
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Info & Form */}
      <section className="py-20">
        <Container>
          <div className="grid gap-8 mb-16 max-w-md mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 mb-4">
                <Mail className="w-6 h-6 text-primary-700" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600"><a href="mailto:support@veloxesim.com" className="hover:text-primary-700">support@veloxesim.com</a></p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto rounded-2xl border-2 border-neutral-300 p-8">
            {submitted && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
                Thank you for your message! We&apos;ll get back to you soon.
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className={validationErrors.name ? 'border-red-500' : ''}
                  />
                  {validationErrors.name && <FormError message={validationErrors.name} className="mt-2" />}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className={validationErrors.email ? 'border-red-500' : ''}
                  />
                  {validationErrors.email && <FormError message={validationErrors.email} className="mt-2" />}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Subject</label>
                <Input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                  className={validationErrors.subject ? 'border-red-500' : ''}
                />
                {validationErrors.subject && <FormError message={validationErrors.subject} className="mt-2" />}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Message</label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  rows={6}
                  required
                  className={validationErrors.message ? 'border-red-500' : ''}
                />
                {validationErrors.message && <FormError message={validationErrors.message} className="mt-2" />}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </Container>
      </section>
    </div>
  );
}

