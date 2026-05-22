'use client';

import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AuthLayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="bg-neutral-50 min-h-screen flex flex-col">
      {children}
    </div>
  );
}
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute type="auth">
      <AuthLayoutContent>
        {children}
      </AuthLayoutContent>
    </ProtectedRoute>
  );
}





