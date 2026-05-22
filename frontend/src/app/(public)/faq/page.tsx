'use client';

import Container from '@/components/Container';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  category: string;
  items: {
    question: string;
    answer: string;
  }[];
}

export default function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      items: [
        {
          question: 'What is an eSIM?',
          answer: 'An eSIM (embedded SIM) is a digital SIM card that allows you to connect to mobile networks without needing a physical SIM card. You can have multiple eSIMs on compatible devices and switch between them instantly. Velox eSIM lets you activate plans in 190+ countries with just a few taps.',
        },
        {
          question: 'Is my device compatible with eSIM?',
          answer: 'Most modern smartphones support eSIM, including iPhone XS and newer, Samsung Galaxy S20 and newer, Google Pixel 3 and newer, and many other recent devices. Visit our Device Compatibility page to check if your specific device is supported, or contact our support team for assistance.',
        },
        {
          question: 'How do I activate my eSIM?',
          answer: 'Activating your Velox eSIM is simple: 1) Purchase your plan through our app, 2) You\'ll receive an activation QR code via email, 3) Go to Settings > Mobile/Cellular > Add eSIM, 4) Scan the QR code or enter the activation code manually, 5) Follow the on-screen instructions to complete setup. Your eSIM will be active within seconds.',
        },
        {
          question: 'How long does activation take?',
          answer: 'Velox eSIM activates instantly upon completion of the setup process. Most users are connected within 30 seconds to 2 minutes. You\'ll see a confirmation notification on your device when your eSIM is ready to use.',
        },
      ],
    },
    {
      category: 'Plans & Pricing',
      items: [
        {
          question: 'What plans are available?',
          answer: 'We offer flexible data plans ranging from 0.5GB to 100GB+, with validity periods from 3 days to 365 days. Each plan is tailored to specific countries or regions. You can view all available plans for your destination in our app before purchase.',
        },
        {
          question: 'Are there any hidden fees?',
          answer: 'No hidden fees. The price you see is the price you pay. Our pricing is transparent and includes all data, regulatory fees, and taxes. No surprise charges will appear after your purchase.',
        },
        {
          question: 'Can I share my eSIM data with others?',
          answer: 'You can enable hotspot/tethering on your device to share your Velox eSIM data connection with other devices. However, eSIM profiles themselves cannot be shared between different devices. Each device needs its own eSIM activation.',
        },
        {
          question: 'What happens if I exceed my data limit?',
          answer: 'When you reach your data limit, your connection will slow significantly. You can purchase additional data at any time through our app at the same rate. We don\'t charge overage fees—you maintain full control over your usage.',
        },
      ],
    },
    {
      category: 'Data & Connectivity',
      items: [
        {
          question: 'Will I have a local phone number?',
          answer: 'Your Velox eSIM provides a local data connection but doesn\'t include a phone number for calls/SMS by default. However, you can enable VoIP services through apps like WhatsApp, Telegram, or purchase add-on voice/SMS plans if needed.',
        },
        {
          question: 'What speeds can I expect?',
          answer: 'Speeds depend on the local network and your location. Most Velox eSIM users experience 4G/LTE speeds (10-50 Mbps). Some areas support 5G networks. Actual speeds vary based on network congestion and your distance from cell towers.',
        },
        {
          question: 'Can I use my eSIM on multiple devices?',
          answer: 'One eSIM profile can only be active on one device at a time. However, you can purchase multiple plans and activate different eSIMs on different devices. Your Velox account can manage multiple eSIM profiles.',
        },
        {
          question: 'How do I monitor my data usage?',
          answer: 'Log into the Velox eSIM app to see real-time data usage, remaining balance, and plan validity. You can also check usage through your device\'s built-in connectivity settings. We send notifications when you reach 50%, 80%, and 100% of your data limit.',
        },
      ],
    },
    {
      category: 'Support & Troubleshooting',
      items: [
        {
          question: 'My eSIM isn\'t connecting. What should I do?',
          answer: 'Try these steps: 1) Ensure airplane mode is off and WiFi is disabled, 2) Restart your device, 3) Go to Settings > Mobile Data and ensure Velox eSIM is selected as your primary network, 4) Toggle airplane mode on/off, 5) If still not working, disable your physical SIM temporarily. If issues persist, contact our 24/7 support team via live chat or email.',
        },
        {
          question: 'Can I pause my eSIM plan?',
          answer: 'You can\'t pause an active plan, but your data won\'t expire. Once purchased, your data and plan validity remain valid until fully used or expired. Purchase a new plan only when you need additional data or coverage.',
        },
        {
          question: 'How do I contact support?',
          answer: 'Our support team is available 24/7. You can reach us via: Live chat in the Velox app, Email: support@veloxesim.com, In-app support tickets, or phone. Response times typically range from minutes to a few hours depending on volume.',
        },
        {
          question: 'What if I lose my phone?',
          answer: 'Contact our support team immediately to deactivate your eSIM. Your eSIM profile can be reactivated on a new device within 24 hours. For security, always keep your Velox account password strong and enable two-factor authentication.',
        },
      ],
    },
    {
      category: 'Account & Security',
      items: [
        {
          question: 'How secure is my data?',
          answer: 'Velox eSIM uses enterprise-grade encryption and security protocols. Your data connection is secured by the same technology as traditional SIM cards. All personal information is encrypted and stored securely compliant with international data protection regulations.',
        },
        {
          question: 'Can I refund an unused plan?',
          answer: 'Once a plan is activated, it cannot be refunded. However, if there\'s a technical issue preventing you from using your plan, contact support and we\'ll work with you to resolve it or provide alternatives.',
        },
        {
          question: 'How do I delete an eSIM profile?',
          answer: 'Go to Settings > Mobile/Cellular > eSIM, select the Velox profile, and choose "Remove eSIM". You can also deactivate unused profiles through the Velox app. Removing an eSIM doesn\'t delete your account—you can always reactivate later.',
        },
        {
          question: 'Is my account information safe?',
          answer: 'Yes. We use 256-bit SSL encryption, secure password hashing, two-factor authentication, and comply with GDPR, CCPA, and other international data protection standards. Your payment information is processed through secure, PCI-compliant payment gateways.',
        },
      ],
    },
    {
      category: 'Coverage & Countries',
      items: [
        {
          question: 'Which countries are supported?',
          answer: 'Velox eSIM supports 190+ countries and territories worldwide. Coverage includes all major destinations in Europe, Asia, Africa, Americas, and Oceania. Use our coverage map in the app to check specific country and network availability.',
        },
        {
          question: 'What if a country isn\'t listed?',
          answer: 'If your destination isn\'t available, we recommend reaching out to our support team. They may be able to suggest nearby regional plans or alternative solutions. We\'re constantly expanding coverage based on user demand.',
        },
        {
          question: 'Do I get local network quality?',
          answer: 'Yes. You connect to local carrier networks in each country, so you get the same network quality as local customers. You\'re not roaming—you\'re connected to the local network directly.',
        },
        {
          question: 'Can I use my eSIM across multiple countries?',
          answer: 'Yes! Many Velox plans support multiple countries in the same region. For example, our European plan works in 30+ European countries. Check the plan details to see which countries are included. You can also purchase multiple regional plans for different destinations.',
        },
      ],
    },
  ];

  const toggleExpanded = (key: string) => {
    setExpandedIndex(expandedIndex === key ? null : key);
  };

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-linear-to-br from-primary-50 to-primary-100">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-950">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-700">
              Everything you need to know about Velox eSIM. Can't find your answer? 
              <a href="/contact" className="text-primary-600 font-semibold hover:text-primary-700"> Contact us</a>.
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            {faqs.map((category, categoryIdx) => (
              <div key={categoryIdx} className="mb-16">
                <h2 className="text-2xl font-black text-gray-950 mb-8 pb-4 border-b-2 border-primary-200">
                  {category.category}
                </h2>

                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => {
                    const key = `${categoryIdx}-${itemIdx}`;
                    const isExpanded = expandedIndex === key;

                    return (
                      <div
                        key={key}
                        className="border border-neutral-300 rounded-xl overflow-hidden bg-white hover:border-primary-300 transition-colors duration-300"
                      >
                        <button
                          onClick={() => toggleExpanded(key)}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200 font-semibold text-gray-950 text-left"
                        >
                          <span className="text-lg">{item.question}</span>
                          <ChevronDown
                            className={`w-6 h-6 text-primary-600 shrink-0 transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-6 py-5 bg-neutral-50 border-t border-neutral-200 text-gray-700 leading-relaxed">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-neutral-200">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-black text-gray-950 mb-4">Still have questions?</h2>
            <p className="text-lg text-gray-700 mb-8">
              Our support team is available 24/7 to help you with any inquiries about Velox eSIM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-300"
              >
                Contact Support
              </a>
              <a
                href="mailto:support@veloxesim.com"
                className="px-8 py-4 bg-neutral-200 text-gray-900 font-semibold rounded-lg hover:bg-neutral-300 transition-colors duration-300"
              >
                Email Us
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
