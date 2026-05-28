import React, { ReactNode } from 'react';
import Footer from './Footer';
import HeaderWrapper from './HeaderWrapper';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

// Header is fixed at top-3 (~12px) with a ~52px pill = ~64px from top of viewport.
// pt-20 (80px) gives comfortable clearance on all screen sizes.
const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="flex flex-col min-h-screen bg-primary-50">
      <HeaderWrapper />
      <main className="flex-1 pt-20">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
