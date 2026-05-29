import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PRODUCT_LINKS = [
  { label: 'Get eSIM', href: '/esim' },
  { label: 'Global Coverage', href: '/coverage' },
  { label: 'Device Compatibility', href: '/device-compatibility' },
  { label: 'FAQ', href: '/faq' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#f2f4f6] border-t border-[#debec8]/30 w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <div>
              <Image
                src="/images/logo.svg"
                alt="Velox eSIM"
                width={160}
                height={50}
                className="object-contain"
                style={{ aspectRatio: '583/182' }}
              />
            </div>
            <p className="text-[#574048] text-sm leading-relaxed">
              Global connectivity solution for modern travelers and enterprise teams.
              Fast, secure, and always reliable.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white border border-[#debec8]/50 flex items-center justify-center text-[#574048] hover:text-[#fb3d77] hover:border-[#fb3d77]/40 transition-colors"
                aria-label="Website"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </a>
              <a
                href="mailto:support@veloxesim.com"
                className="w-10 h-10 rounded-full bg-white border border-[#debec8]/50 flex items-center justify-center text-[#574048] hover:text-[#fb3d77] hover:border-[#fb3d77]/40 transition-colors"
                aria-label="Email"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-sora font-bold text-[#191c1e]">Product</h4>
            <nav className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-[#574048] hover:text-[#fb3d77] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-sora font-bold text-[#191c1e]">Company</h4>
            <nav className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-[#574048] hover:text-[#fb3d77] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-sora font-bold text-[#191c1e]">Legal</h4>
            <nav className="flex flex-col gap-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-[#574048] hover:text-[#fb3d77] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer graphic */}
        <div className="relative w-full py-6">
          <Image
            src="/images/footer.svg"
            alt="Velox eSIM"
            width={1200}
            height={300}
            className="w-full h-auto object-contain opacity-70"
          />
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#debec8]/30 text-center">
          <p className="text-sm text-[#574048]">
            © {new Date().getFullYear()} Velox Connectivity. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
