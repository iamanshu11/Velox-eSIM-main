import React from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "./Container";

const Footer: React.FC = () => {
  return (
    <footer className="relative z-30 bg-white text-slate-900 py-12 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/logo.svg"
                alt="Velox eSIM"
                width={160}
                height={50}
                className="object-contain"
                style={{ aspectRatio: "583/182" }}
              />
            </div>
            <p className="text-slate-600 leading-relaxed">
              The fastest and most reliable eSIM platform for global
              connectivity solutions. Connect anywhere, anytime.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-900">Product</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>
                <Link
                  href="/esim"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Get eSIM
                </Link>
              </li>
              <li>
                <Link
                  href="/coverage"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Coverage
                </Link>
              </li>
              <li>
                <Link
                  href="/device-compatibility"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Device Compatibility
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-900">Company</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                <span className="text-slate-600 font-medium">Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-900">Support</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer graphic */}
        <div className="relative w-full py-8">
          <Image
            src="/images/footer.svg"
            alt="Footer Branding"
            width={1200}
            height={300}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-center items-center shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]">
          <p className="text-slate-600 text-sm">
            &copy; 2026 Velox eSIM. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
