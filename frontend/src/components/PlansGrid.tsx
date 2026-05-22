"use client";

import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Loader from "@/components/Loader";
import CountryFlagIcon from "@/components/CountryFlagIcon";
import { planService } from "@/services/planService";
import { Plan } from "@/types";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setSelectedPlan } from "@/store/slices/planSlice";

interface PlansGridProps {
  limit?: number;
  featured?: boolean;
  showFilters?: boolean;
  onPlanSelect?: (plan: Plan) => void;
}

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
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function PlansGrid({
  limit,
  featured = false,
  showFilters = true,
  onPlanSelect,
}: PlansGridProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [countries, setCountries] = useState<string[]>([]);

  const handleSelectPlan = (plan: Plan) => {
    if (onPlanSelect) {
      onPlanSelect(plan);
    } else {
      dispatch(setSelectedPlan(plan));
      router.push('/checkout');
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        let allPlans = await planService.getAllPlans();

        if (featured) {
          const countryMap = new Map<string, Plan>();
          allPlans.forEach((plan) => {
            const key = plan.countryCode;
            const existing = countryMap.get(key);
            if (!existing || plan.price < existing.price) {
              countryMap.set(key, plan);
            }
          });
          allPlans = Array.from(countryMap.values()).slice(0, 6);
        } else if (limit) {
          allPlans = allPlans.slice(0, limit);
        }

        setPlans(allPlans);
        setFilteredPlans(allPlans);

        const uniqueCountries = Array.from(
          new Set(allPlans.map((p) => p.countryCode).filter(Boolean)),
        ).sort();
        setCountries(uniqueCountries);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [limit, featured]);

  useEffect(() => {
    let filtered = plans;

    if (selectedCountry !== "ALL") {
      filtered = filtered.filter((p) => p.countryCode === selectedCountry);
    }

    setFilteredPlans(filtered);
  }, [selectedCountry, plans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div>
      {showFilters && !featured && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full md:w-64 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
          >
            <option value="ALL">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </motion.div>
      )}

      {filteredPlans.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600">No plans available</p>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {filteredPlans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={itemVariants}
              className="h-full"
            >
              <Card className="h-full p-6 shadow-md hover:shadow-lg hover:shadow-gray-400/20 transition-all duration-300 flex flex-col group">
                {/* Header with Country Badge */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-neutral-200">
                  <div className="flex-1 flex items-center gap-3">
                    <CountryFlagIcon countryCode={plan.countryCode} size={32} />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {plan.countryCode}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {plan.originalPrice && plan.originalPrice < plan.price && (
                    <div className="shrink-0">
                      <Badge variant="success" className="text-xs">
                        New
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Key Stats - Highlighted */}
                <div className="space-y-2 mb-6 grow">
                  {/* Data */}
                  <div className="flex items-center justify-between p-3 bg-neutral-100 rounded-lg border border-neutral-300">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-gray-900" />
                      <span className="text-sm font-medium text-gray-700">
                        Data
                      </span>
                    </div>
                    <span className="font-bold text-lg text-gray-900">
                      {plan.dataAmount}
                      <span className="text-sm text-gray-600 font-normal">
                        {" "}
                        {plan.dataUnit}
                      </span>
                    </span>
                  </div>

                  {/* Validity */}
                  <div className="flex items-center justify-between p-3 bg-neutral-100 rounded-lg border border-neutral-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-900" />
                      <span className="text-sm font-medium text-gray-700">
                        Valid
                      </span>
                    </div>
                    <span className="font-bold text-lg text-gray-900">
                      {plan.validity}
                      <span className="text-sm text-gray-600 font-normal">
                        {" "}
                        {plan.validityUnit}
                      </span>
                    </span>
                  </div>

                  {/* Network Speed */}
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Speed
                      </span>
                    </div>
                    <span className="font-bold text-sm text-gray-900">
                      {plan.operatorName.replace("Network: ", "")}
                    </span>
                  </div>
                </div>

                {/* Price - Most Prominent */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="text-right">
                    <div className="text-4xl font-bold text-gray-900">
                      ${plan.price.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button onClick={() => handleSelectPlan(plan)} className="w-full">
                  Select Plan
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default PlansGrid;
