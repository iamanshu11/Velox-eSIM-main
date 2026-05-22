"use client";

import { Suspense } from "react";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import CheckoutContent from "./CheckoutContent";

function CheckoutSkeleton() {
  return (
    <Container className="py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-150"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </motion.div>
    </Container>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}

