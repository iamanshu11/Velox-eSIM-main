"use client";

import CheckoutOrderSummary from "@/components/CheckoutOrderSummary";
import CheckoutPaymentMethods from "@/components/CheckoutPaymentMethods";
import CheckoutSecurityInfo from "@/components/CheckoutSecurityInfo";
import CheckoutSummary from "@/components/CheckoutSummary";
import Container from "@/components/Container";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";
import WalletTopUpModal from "@/components/WalletTopUpModal";
import { apiClient } from "@/lib/apiClient";
import logger from "@/lib/logger";
import { RootState } from "@/store";
import { clearSelectedPlan, setSelectedPlan } from "@/store/slices/planSlice";
import { useGetWalletBalanceQuery } from "@/store/slices/walletSlice";
import { Order, Plan } from "@/types";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiSlice } from "@/store/slices/apiSlice";

interface SelectedPlan {
  id: string | null;
  packageCode: string;
  name?: string;
  description?: string;
  price: number;
  duration: number;
  volume: number;
  countryCode: string;
  country: string;
  dataAmount: number;
  validity: number;
  operatorName: string;
  dataUnit?: string;
  validityUnit?: string;
  features?: string[];
  isActive?: boolean;
}

export default function CheckoutContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isInitialized = useSelector((state: RootState) => state.auth.isInitialized);

  const [selectedPlan, setSelectedPlanLocal] = useState<SelectedPlan | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planInitialized, setPlanInitialized] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [isInitialized, isAuthenticated, router]);
  const { data: walletData, isLoading: walletLoading } = useGetWalletBalanceQuery(undefined, {
    skip: !isAuthenticated,
  });
  const walletBalance = walletData?.balance || 0;

  const fetchRenewalOrder = async (orderId: string) => {
    try {
      const response = await apiClient.get<any>(`/orders/${orderId}`);
      const orderData = response?.data || response;
      
      logger.info('[Checkout] Renewal order fetched', {
        orderId,
        orderData: JSON.stringify(orderData),
      });

      const metadata = orderData?.metadata || {};
      const packageCode = metadata?.packageCode || '';
      const unitPrice = metadata?.unitPrice || orderData?.totalAmount || 0;
      const quantity = metadata?.quantity || 1;

      if (!packageCode) {
        setError('Invalid renewal order - missing package information');
        return null;
      }
      const plan: SelectedPlan = {
        id: orderId,
        packageCode,
        price: unitPrice,
        duration: 30,
        volume: 0,
        countryCode: '',
        country: '',
        dataAmount: 0,
        validity: 30,
        operatorName: 'Velox eSIM',
      };

      return { plan, quantity };
    } catch (err) {
      logger.error('[Checkout] Failed to fetch renewal order', {
        orderId,
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Failed to load renewal order. Please try again.');
      return null;
    }
  };

  const getPlanFromParams = (): SelectedPlan | null => {
    const planId = searchParams.get('planId');
    const packageCode = searchParams.get('packageCode');
    const price = searchParams.get('price');
    const duration = searchParams.get('duration');
    const volume = searchParams.get('volume');
    const countryCode = searchParams.get('countryCode');
    const country = searchParams.get('country');
    const dataAmount = searchParams.get('dataAmount');
    const validity = searchParams.get('validity');
    const operatorName = searchParams.get('operatorName');

    if (!packageCode || !price) {
      logger.warn('[Checkout] Missing required plan parameters', {
        planId,
        packageCode,
        price,
        duration,
        volume,
        countryCode,
        dataAmount,
        validity,
      });
      return null;
    }

    const volumeValue = volume ? parseInt(volume, 10) : 0;
    const parsedDataAmount = dataAmount ? parseFloat(dataAmount) : 0;
    const resolvedDataAmount = parsedDataAmount || (volumeValue > 0 ? Math.round((volumeValue / 1024 / 1024 / 1024) * 100) / 100 : 0);

    return {
      id: planId,
      packageCode,
      price: parseFloat(price) / 100, 
      duration: duration ? parseInt(duration, 10) : 30,
      volume: volumeValue,
      countryCode: countryCode || '',
      country: country || '',
      dataAmount: resolvedDataAmount,
      validity: validity ? parseInt(validity, 10) : 30,
      operatorName: operatorName || 'Network Operator',
    };
  };

  const packageCode = searchParams.get('packageCode');
  const price = searchParams.get('price');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const initializePlan = async () => {
      if (orderId && !packageCode) {
        const renewalData = await fetchRenewalOrder(orderId);
        if (renewalData) {
          setSelectedPlanLocal(renewalData.plan);
          dispatch(setSelectedPlan(renewalData.plan as Plan));
          setQuantity(renewalData.quantity);
        }
        setPlanInitialized(true);
        return;
      }
      const paramPlan = getPlanFromParams();
      
      if (paramPlan) {
        setSelectedPlanLocal(paramPlan);
        dispatch(setSelectedPlan(paramPlan as Plan));
        setQuantity(1);
        setPlanInitialized(true);
      } else {
        if (planInitialized) {
          router.push('/dashboard/esims');
        }
      }
    };

    initializePlan();
  }, [orderId, packageCode, price, dispatch, planInitialized]);

  const handleBackClick = () => {
    dispatch(clearSelectedPlan());
    router.back();
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleProceedToCheckout = async () => {
    if (!selectedPlan) {
      setError('No plan selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('[Checkout] Creating order', {
        packageCode: selectedPlan.packageCode,
        paymentMethod: 'wallet',
        unitPrice: selectedPlan.price,
      });

      const response = await apiClient.post<{ data: Order }>('/orders', {
        packageCode: selectedPlan.packageCode,
        paymentMethod: 'wallet',
        quantity: quantity,
      });

      logger.info('[Checkout] API Response received', {
        response: JSON.stringify(response),
      });
      const orderData = response?.data || response;
      
      if (orderData?.id || (orderData as any)?.orderNo) {
        logger.info('[Checkout] Order created successfully', {
          orderId: orderData.id,
          orderNo: (orderData as any)?.orderNo,
          totalAmount: (orderData as any)?.totalAmount,
        });
        dispatch(apiSlice.util.invalidateTags(['eSIM']));
        const orderId = orderData.id || (orderData as any)?.orderNo;
        const params = new URLSearchParams({
          orderId,
          orderAmount: ((orderData as any)?.totalAmount || 0).toString(),
          packageCode: selectedPlan?.packageCode || '',
        });
        router.push(`/checkout/success?${params.toString()}`);
      } else {
        logger.error('[Checkout] Invalid order response', {
          response: orderData,
          hasId: !!orderData?.id,
          hasOrderNo: !!orderData?.orderNo,
        });
        throw new Error('Invalid order response - no order ID returned');
      }
    } catch (err) {
      let errorMessage = 'Failed to create order';
      let errorStatus: number | undefined;
      let errorDetails: any = {};

      if (err instanceof Error) {
        errorMessage = err.message;
        errorStatus = (err as any).status || (err as any).statusCode;
        errorDetails = {
          name: err.name,
          message: err.message,
          code: (err as any).code,
          status: errorStatus,
        };
      } else if (typeof err === 'object' && err !== null) {
        const errObj = err as any;
        errorMessage = errObj.message || errObj.error || JSON.stringify(errObj);
        errorStatus = errObj.status || errObj.statusCode;
        errorDetails = errObj;
      }
      
      setError(errorMessage);
      logger.error('[Checkout] Order creation failed', {
        message: errorMessage,
        status: errorStatus,
        details: errorDetails,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!planInitialized) {
    return (
      <Container className="py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center min-h-100"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </motion.div>
      </Container>
    );
  }

  return (
    <ErrorBoundaryWrapper>
      <Container className="py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-primary-700 hover:text-primary-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to eSIMs
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"
          >
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Checkout Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            {selectedPlan && (
              <CheckoutOrderSummary
                plan={selectedPlan as any}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
              />
            )}

            {/* Payment Method */}
            <div className="mt-8">
              <CheckoutPaymentMethods
                walletBalance={walletBalance}
                walletLoading={walletLoading}
                totalPrice={(selectedPlan?.price || 0) * quantity}
              />
            </div>

            {/* Security Info */}
            <div className="mt-8">
              <CheckoutSecurityInfo />
            </div>
          </div>

          {/* Checkout Summary Sidebar */}
          <div>
            <CheckoutSummary
              quantity={quantity}
              unitPrice={selectedPlan?.price || 0}
              totalPrice={(selectedPlan?.price || 0) * quantity}
              walletBalance={walletBalance}
              isLoading={loading}
              onCheckout={handleProceedToCheckout}
              onTopUp={() => setIsTopUpModalOpen(true)}
              canCheckout={true}
              dataAmount={selectedPlan?.dataAmount}
              validity={selectedPlan?.validity}
              country={selectedPlan?.country}
            />
          </div>
        </div>
      </Container>

      {/* Wallet Top-Up Modal */}
      <WalletTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        onSuccess={() => {
          setIsTopUpModalOpen(false);
        }}
      />
    </ErrorBoundaryWrapper>
  );
}

