'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { removeFromWishlist, clearWishlist } from '@/store/slices/wishlistSlice';
import { setSelectedPlan } from '@/store/slices/planSlice';
import { motion } from 'framer-motion';
import CountryFlagIcon from '@/components/CountryFlagIcon';
import Button from '@/components/Button';
import { Heart, ShoppingCart, ArrowRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function WishlistPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  const handleBuyNow = (plan: any) => {
    dispatch(setSelectedPlan(plan));
    router.push('/plans');
  };

  const handleRemove = (planId: string) => {
    dispatch(removeFromWishlist(planId));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      dispatch(clearWishlist());
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-950 flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-500" />
            My Wishlist
          </h1>
          <p className="text-gray-600">Saved eSIM plans for later</p>
        </div>
        {wishlistItems.length > 0 && (
          <Button
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2"
          >
            Clear All
          </Button>
        )}
      </motion.div>

      {wishlistItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-primary-50 rounded-xl border-2 border-dashed border-primary-200"
        >
          <Heart className="w-16 h-16 text-primary-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-950 mb-2">No Wishlist Items</h2>
          <p className="text-gray-700 mb-8">
            Add eSIM plans to your wishlist to save them for later
          </p>
          <Button
            onClick={() => router.push('/esims')}
            variant="primary"
            size="lg"
            className="inline-flex items-center gap-2"
          >
            Browse Plans
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {wishlistItems.map((plan) => (
            <motion.div
              key={plan.id}
              variants={itemVariants}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="bg-linear-to-r from-primary-50 to-primary-100 p-6 relative" >
                <button
                  onClick={() => handleRemove(plan.id)}
                  className="absolute top-4 right-4 p-2 bg-white hover:bg-red-50 rounded-full text-red-500 hover:text-red-700 transition-colors"
                  title="Remove from wishlist"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>

                <div className="flex items-start gap-3 mb-3">
                  <CountryFlagIcon countryCode={plan.countryCode} size={32} />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.country}</p>
                  </div>
                </div>

                <div className="inline-block bg-primary-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ${plan.price.toFixed(2)}
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Plan Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data</p>
                    <p className="font-bold text-gray-900">
                      {plan.dataAmount} {plan.dataUnit || 'GB'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Validity</p>
                    <p className="font-bold text-gray-900">
                      {plan.validity} {plan.validityUnit || 'days'}
                    </p>
                  </div>
                </div>

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Features:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.slice(0, 2).map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                      {plan.features.length > 2 && (
                        <li className="text-gray-500">
                          + {plan.features.length - 2} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleBuyNow(plan)}
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy Now
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Stats */}
      {wishlistItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200"
        >
          <p className="text-gray-700">
            <span className="font-bold text-primary-700">{wishlistItems.length}</span> item
            {wishlistItems.length !== 1 ? 's' : ''} in your wishlist
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Total value: <span className="font-bold text-primary-700">
              ${wishlistItems.reduce((sum, plan) => sum + plan.price, 0).toFixed(2)}
            </span>
          </p>
        </motion.div>
      )}
    </div>
  );
}

