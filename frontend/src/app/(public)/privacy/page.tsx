import Container from '@/components/Container';

export default function PrivacyPage() {
  return (
    <div className="bg-neutral-50">
      <section className="py-20 bg-linear-to-br from-primary-50 to-primary-100">
        <Container>
          <h1 className="text-5xl font-black text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-700">Last updated: February 4, 2026</p>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="max-w-3xl mx-auto space-y-8 text-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p>
                Velox eSIM (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how 
                we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="mb-4">We may collect information about you in a variety of ways:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Name, email, phone number, address, payment information</li>
                <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, interactions with content</li>
                <li><strong>Location Data:</strong> General location based on IP address (with consent)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To process your eSIM orders and payments</li>
                <li>To provide customer support and respond to inquiries</li>
                <li>To improve our services and user experience</li>
                <li>To send promotional emails (with consent)</li>
                <li>To comply with legal obligations</li>
                <li>To detect and prevent fraud</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share your data with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Service providers (payment processors, hosting providers)</li>
                <li>eSIM operators and carriers</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners (with your consent)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Security</h2>
              <p>
                We implement industry-standard security measures to protect your information. However, no method of transmission 
                over the Internet is 100% secure. Please contact us if you have security concerns.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> privacy@veloxesim.com<br />
                <strong>Address:</strong> San Francisco, CA, United States
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

