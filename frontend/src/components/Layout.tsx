import React, { ReactNode } from 'react';
import Footer from './Footer';
import HeaderWrapper from './HeaderWrapper';

interface LayoutProps {
  children: ReactNode;
  headerProps?: any;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="flex flex-col min-h-screen bg-primary-50">
      <HeaderWrapper />
      <main className="flex-1 pt-16">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;

