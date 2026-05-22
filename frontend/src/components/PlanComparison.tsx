'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface PlanComparisonProps {
  plans: Array<{
    id: string
    name: string
    price: number
    dataVolume: number
    validity: number
    features: string[]
    popular?: boolean
  }>
  onSelectPlan?: (planId: string) => void
}

export function PlanComparison({ plans, onSelectPlan }: PlanComparisonProps) {
  const allFeatures = Array.from(
    new Set(plans.flatMap((plan) => plan.features))
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Feature
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                className={`px-6 py-4 text-center text-sm font-semibold ${
                  plan.popular
                    ? 'bg-neutral-50 text-gray-900 dark:bg-neutral-900 dark:text-gray-100'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Price Row */}
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
              Price
            </td>
            {plans.map((plan) => (
              <td
                key={plan.id}
                className={`px-6 py-4 text-center text-sm font-semibold ${
                  plan.popular
                    ? 'bg-neutral-50 text-gray-900 dark:bg-neutral-900 dark:text-gray-100'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                ${plan.price}
              </td>
            ))}
          </tr>

          {/* Data Volume Row */}
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
              Data Volume
            </td>
            {plans.map((plan) => (
              <td
                key={plan.id}
                className={`px-6 py-4 text-center text-sm ${
                  plan.popular
                    ? 'bg-neutral-50 text-gray-900 dark:bg-neutral-900 dark:text-gray-100'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {plan.dataVolume} GB
              </td>
            ))}
          </tr>

          {/* Validity Row */}
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
              Validity
            </td>
            {plans.map((plan) => (
              <td
                key={plan.id}
                className={`px-6 py-4 text-center text-sm ${
                  plan.popular
                    ? 'bg-neutral-50 text-gray-900 dark:bg-neutral-900 dark:text-gray-100'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {plan.validity} days
              </td>
            ))}
          </tr>

          {/* Features Rows */}
          {allFeatures.map((feature) => (
            <tr
              key={feature}
              className="border-b border-gray-200 dark:border-gray-700"
            >
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                {feature}
              </td>
              {plans.map((plan) => (
                <td
                  key={plan.id}
                  className={`px-6 py-4 text-center ${
                    plan.popular
                      ? 'bg-neutral-50 dark:bg-neutral-900'
                      : ''
                  }`}
                >
                  {plan.features.includes(feature) ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex justify-center"
                    >
                      <Check size={20} className="text-green-600" />
                    </motion.div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}

          {/* CTA Row */}
          <tr className="border-t-2 border-gray-200 dark:border-gray-700">
            <td className="px-6 py-6"></td>
            {plans.map((plan) => (
              <td
                key={plan.id}
                className={`px-6 py-6 text-center ${
                  plan.popular
                    ? 'bg-neutral-50 dark:bg-neutral-900'
                    : ''
                }`}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectPlan?.(plan.id)}
                  className={`rounded-lg px-6 py-2 font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  }`}
                >
                  Select Plan
                </motion.button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default PlanComparison

