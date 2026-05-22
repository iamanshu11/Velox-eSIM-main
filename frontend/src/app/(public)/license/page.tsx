import Container from '@/components/Container';

export default function LicensePage() {
  return (
    <div className="bg-neutral-50">
      <section className="py-20 bg-linear-to-br from-primary-50 to-primary-100">
        <Container>
          <h1 className="text-5xl font-black text-gray-900 mb-4">License & Attribution</h1>
          <p className="text-gray-700">Last updated: February 4, 2026</p>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="max-w-3xl mx-auto space-y-8 text-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Platform License</h2>
              <p>
                Velox eSIM is licensed under the proprietary license. You may not reproduce, copy, distribute, or transmit any 
                content from this website or service without the express written permission of Velox eSIM.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Content Ownership</h2>
              <p>
                Unless otherwise stated, Velox eSIM and/or its licensors own the intellectual property rights for all material 
                on Velox eSIM. All intellectual property rights are reserved. You may view and print pages from the website for 
                personal use, subject to restrictions set in these terms and conditions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Content</h2>
              <p>
                This site may contain content (including text, images, data, etc.) provided by third parties, including but not 
                limited to eSIM operators and carriers. Such content is subject to the terms of use of those third parties.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Open Source Software</h2>
              <p className="mb-4">
                Velox eSIM uses the following open-source software:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Next.js</strong> - React framework (MIT License)</li>
                <li><strong>React</strong> - UI library (MIT License)</li>
                <li><strong>Tailwind CSS</strong> - CSS framework (MIT License)</li>
                <li><strong>Framer Motion</strong> - Animation library (MIT License)</li>
                <li><strong>Stripe</strong> - Payment processing (Stripe License)</li>
                <li><strong>PostgreSQL</strong> - Database (PostgreSQL License)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. MIT License</h2>
              <p className="mb-4">
                The MIT License is a permissive free software license. Here&apos;s a summary of the MIT License:
              </p>
              <p className="mb-4 p-4 bg-gray-50 rounded border border-gray-300 font-mono text-sm">
                MIT License<br/><br/>
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
                documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation 
                the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Generated Content</h2>
              <p>
                By posting or submitting content on Velox eSIM, you grant Velox eSIM a worldwide, non-exclusive, royalty-free 
                license to use, reproduce, adapt, publish, and distribute your content in any media or form.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Trademark</h2>
              <p>
                Velox eSIM and the Velox eSIM logo are trademarks of Velox eSIM. You may not use these trademarks without the 
                prior written permission of Velox eSIM.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Compliance</h2>
              <p>
                You agree to comply with all applicable laws, rules, and regulations regarding your use of Velox eSIM and its content. 
                You specifically agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Infringe or violate any intellectual property rights</li>
                <li>Upload or transmit viruses or other harmful code</li>
                <li>Harass or cause distress to other users</li>
                <li>Impersonate or misrepresent your identity</li>
                <li>Interfere with or disrupt the site or its services</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact & Inquiries</h2>
              <p>
                If you have questions regarding this License & Attribution, please contact:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> legal@veloxesim.com<br />
                <strong>Address:</strong> San Francisco, CA, United States
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

