'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Home,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import Container from '@/components/Container';
import Layout from '@/components/Layout';

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <Layout showFooter={false}>
        <Container>
          <div className="py-12 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="inline-block mb-4">
                <CheckCircle className="w-12 h-12 text-primary-700" />
              </motion.div>
              <p className="text-gray-600">Loading success page...</p>
            </div>
          </div>
        </Container>
      </Layout>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const orderAmount = searchParams.get('orderAmount') || '0';
  const packageCode = searchParams.get('packageCode') || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Layout showFooter={false}>
      <Container>
        <div className="py-12 min-h-screen flex items-center">
          <div className="w-full max-w-2xl mx-auto">
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                type: 'spring',
                stiffness: 100,
                damping: 15,
              }}
              className="text-center mb-12"
            >
              <div className="inline-block mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="bg-linear-to-br from-green-400 to-green-600 rounded-full p-6"
                >
                  <CheckCircle className="w-16 h-16 text-white" />
                </motion.div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
              >
                Payment Successful!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-600 mb-8"
              >
                Your eSIM purchase has been completed successfully
              </motion.p>
            </motion.div>

            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-8 mb-8 bg-linear-to-br from-green-50 to-primary-50 border-green-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-green-200">
                    <span className="text-gray-700 font-medium">Package</span>
                    <span className="text-lg font-bold text-gray-900">
                      {packageCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-green-200">
                    <span className="text-gray-700 font-medium">Amount Paid</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${orderAmount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Status</span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-primary-700" />
                What's Next?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-700 font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Receive Confirmation
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Check your email for order confirmation and eSIM details
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Step 2 */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600 font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Download eSIM
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get your eSIM QR code or activation code ready
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Step 3 */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-600 font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Activate eSIM
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Install on your device and select it as your active plan
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Step 4 */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 text-orange-600 font-bold">
                        4
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Start Using
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Connect to network and enjoy data immediately
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/dashboard/esims" className="flex-1">
                <Button className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold flex items-center justify-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  View My eSIMs
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/esim" className="flex-1">
                <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold border border-gray-300 flex items-center justify-center gap-2">
                  Browse More Plans
                </Button>
              </Link>

              <Link href="/" className="flex-1">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold flex items-center justify-center gap-2">
                  <Home className="w-5 h-5" />
                  Back Home
                </Button>
              </Link>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 pt-8 border-t border-gray-200 text-center"
            >
              <p className="text-gray-600 mb-4">Need help with your purchase?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/faq"
                  className="text-primary-700 hover:text-primary-800 font-semibold flex items-center justify-center gap-1"
                >
                  FAQ
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <Link
                  href="/contact"
                  className="text-primary-700 hover:text-primary-800 font-semibold flex items-center justify-center gap-1"
                >
                  Contact Support
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </Layout>
  );
}

