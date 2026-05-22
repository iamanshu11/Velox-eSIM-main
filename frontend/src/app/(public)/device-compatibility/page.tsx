'use client';

import Link from 'next/link';
import { CheckCircle, AlertCircle, HelpCircle, Smartphone, ArrowRight } from 'lucide-react';
import Container from '@/components/Container';
import Card from '@/components/Card';

const BRANDS = [
  { category: 'Apple', devices: ['iPhone 11 & later', 'iPad (6th gen) & later', 'Apple Watch Series 5 & later'] },
  { category: 'Samsung', devices: ['Galaxy S20 & later', 'Galaxy Tab S6 & later', 'Galaxy Z series'] },
  { category: 'Google', devices: ['Pixel 4 & later', 'Pixel Tablet'] },
  { category: 'OnePlus', devices: ['OnePlus 7T & later'] },
  { category: 'Motorola', devices: ['Moto Razr 5G & later', 'Edge series'] },
  { category: 'Xiaomi', devices: ['XiaoMi 11 & later'] },
  { category: 'Huawei', devices: ['P40 & later', 'P50 & later'] },
  { category: 'Others', devices: ['Sony Xperia 5 II & later', 'Lenovo Tab P11 Pro', 'Surface Duo'] },
];

const FAQS = [
  {
    question: 'How can I find out if my device supports eSIMs?',
    answer: 'You can usually check by going to the SIMs section of your device\'s settings. Look for an "Add eSIM" or "Download eSIM" option. For Apple devices, check under Cellular or Mobile settings. For Samsung devices, check the SIM Manager. For Pixel devices, check the SIMs menu.',
    icon: HelpCircle,
  },
  {
    question: 'What does "carrier-locked" or "network-locked" mean?',
    answer: 'Carrier-locked or network-locked devices are restricted to using networks and SIMs from one mobile provider only. If your device is carrier or network-locked, you cannot use our eSIM services. You can check your device\'s settings or contact your primary mobile provider to confirm if your device is locked.',
    icon: AlertCircle,
  },
  {
    question: 'Can I use eSIM with a jailbroken or rooted device?',
    answer: 'As a security measure, our app may not work on devices that are jailbroken or rooted. If your device is rooted or jailbroken, you will need to use another device to download and manage eSIMs through our app. However, you can still purchase an eSIM to use on a device that is not jailbroken or rooted.',
    icon: AlertCircle,
  },
  {
    question: 'Do I need both physical SIM and eSIM?',
    answer: 'Most modern devices support dual SIM functionality, allowing you to use both a physical SIM and an eSIM simultaneously. This is particularly useful for travelers who want to maintain their home SIM while using a local eSIM. However, some older devices may only support one or the other.',
    icon: HelpCircle,
  },
  {
    question: 'Can I use eSIM on tablets and smartwatches?',
    answer: 'Yes! Many tablets and smartwatches support eSIMs. Popular models include iPad, Samsung Galaxy Tab, Apple Watch (Series 5 and later), and compatible Samsung Galaxy Watches. Check your device specifications to confirm eSIM support.',
    icon: CheckCircle,
  },
];

const REQUIREMENTS = [
  {
    title: 'Device Support',
    description: 'Your device must support eSIM technology',
    icon: Smartphone,
    features: [
      'Modern smartphones (generally released in 2018 or later)',
      'Tablets with cellular connectivity',
      'Smartwatches with eSIM support',
    ],
  },
  {
    title: 'Carrier Status',
    description: 'Device must not be carrier or network locked',
    icon: AlertCircle,
    features: [
      'Check device settings for lock status',
      'Contact your provider if unsure',
      'Unlocked devices work universally',
    ],
  },
  {
    title: 'Security Status',
    description: 'Device must not be jailbroken or rooted',
    icon: CheckCircle,
    features: [
      'No modified operating systems',
      'Stock OS or official updates only',
      'Required for app-based eSIM management',
    ],
  },
];

export default function DeviceCompatibilityPage() {
  return (
    <main className="bg-neutral-50">
      {/* Hero Section */}
      <section className="bg-linear-to-b from-primary-50 to-white py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Device Compatibility
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Check if your device supports eSIM and learn about requirements for using our service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#check-compatibility">
                <button className="px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition inline-flex items-center gap-2">
                  Check Compatibility
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="#faqs">
                <button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition">
                  View FAQs
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Requirements Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Basic Requirements
            </h2>
            <p className="text-gray-600">
              To use eSIM with our service, your device must meet three key requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REQUIREMENTS.map((req, idx) => {
              const Icon = req.icon;
              return (
                <Card key={idx}>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-700" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">{req.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{req.description}</p>
                    <ul className="space-y-2">
                      {req.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Check Compatibility Section */}
      <section id="check-compatibility" className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-8">
              How to Check If Your Device Supports eSIM
            </h2>

            <div className="space-y-6">
              {/* Apple */}
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Apple Devices</h3>
                </div>
                <div className="p-6">
                  <ol className="space-y-4 list-decimal list-inside">
                    <li className="text-gray-700">
                      Open <span className="font-semibold">Settings</span>
                    </li>
                    <li className="text-gray-700">
                      Go to <span className="font-semibold">Cellular</span> or <span className="font-semibold">Mobile Cellular</span>
                    </li>
                    <li className="text-gray-700">
                      Look for an <span className="font-semibold">Add eSIM</span> option
                    </li>
                    <li className="text-gray-700">
                      If you see this option, your device supports eSIM
                    </li>
                  </ol>
                  <p className="mt-4 p-3 bg-primary-50 rounded-lg text-sm text-primary-900">
                    Supported iPhones: iPhone 11 and later | Supported iPads: iPad with A2 chip or later
                  </p>
                </div>
              </Card>

              {/* Samsung */}
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Samsung Devices</h3>
                </div>
                <div className="p-6">
                  <ol className="space-y-4 list-decimal list-inside">
                    <li className="text-gray-700">
                      Open <span className="font-semibold">Settings</span>
                    </li>
                    <li className="text-gray-700">
                      Go to <span className="font-semibold">Connections</span>
                    </li>
                    <li className="text-gray-700">
                      Tap <span className="font-semibold">SIM Manager</span> or <span className="font-semibold">Mobile Networks</span>
                    </li>
                    <li className="text-gray-700">
                      Look for an <span className="font-semibold">Add eSIM</span> option
                    </li>
                  </ol>
                  <p className="mt-4 p-3 bg-primary-50 rounded-lg text-sm text-primary-900">
                    Supported models: Galaxy S20 and later, Galaxy Z series, Galaxy Tab S6 and later
                  </p>
                </div>
              </Card>

              {/* Google Pixel */}
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Google Pixel Devices</h3>
                </div>
                <div className="p-6">
                  <ol className="space-y-4 list-decimal list-inside">
                    <li className="text-gray-700">
                      Open <span className="font-semibold">Settings</span>
                    </li>
                    <li className="text-gray-700">
                      Go to <span className="font-semibold">Network & Internet</span>
                    </li>
                    <li className="text-gray-700">
                      Tap <span className="font-semibold">SIMs</span>
                    </li>
                    <li className="text-gray-700">
                      Look for a <span className="font-semibold">Download a new eSIM</span> option
                    </li>
                  </ol>
                  <p className="mt-4 p-3 bg-primary-50 rounded-lg text-sm text-primary-900">
                    Supported models: Pixel 4 and later, Pixel Tablet
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Supported Brands */}
      <section className="py-16 md:py-24 bg-gray-50">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Popular Brands With eSIM Support
            </h2>
            <p className="text-gray-600">
              These brands manufacture devices that support eSIM technology. Check your specific model for compatibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BRANDS.map((brand, idx) => (
              <Card key={idx}>
                <div className="p-6">
                  <h3 className="font-black text-lg text-gray-900 mb-4">{brand.category}</h3>
                  <ul className="space-y-2">
                    {brand.devices.map((device, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <Smartphone className="w-4 h-4 text-primary-700" />
                        {device}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-gray-900">
              <span className="font-semibold">Note:</span> These are examples of supported devices. Most flagship and mid-range smartphones from major manufacturers released in 2018 or later support eSIM. For a complete list of supported models, check your device manufacturer&apos;s specifications.
            </p>
          </div>
        </Container>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {FAQS.map((faq, idx) => {
                const Icon = faq.icon;
                return (
                  <Card key={idx}>
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <Icon className="w-6 h-6 text-primary-700 mt-1 shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-800">
        <Container>
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-100 mb-8">
              If your device is compatible, you can purchase your first eSIM today and enjoy global connectivity.
            </p>
            <Link href="/esim">
              <button className="px-8 py-3 bg-white text-primary-700 rounded-lg font-bold hover:bg-primary-50 transition inline-flex items-center gap-2">
                Browse eSIM Plans
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}

