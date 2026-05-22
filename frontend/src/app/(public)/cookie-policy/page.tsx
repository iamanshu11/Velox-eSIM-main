import Container from '@/components/Container';

export default function CookiePolicyPage() {
  return (
    <div className="bg-neutral-50">
      <section className="py-20 bg-linear-to-br from-primary-50 to-primary-100">
        <Container>
          <h1 className="text-5xl font-black text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-700">Last updated: February 4, 2026</p>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="max-w-3xl mx-auto space-y-8 text-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p>
                Cookies are small files of letters and numbers that we store on your browser or the hard drive of your computer 
                if you agree. Cookies contain information that is transferred to your computer&apos;s hard drive.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Why Do We Use Cookies?</h2>
              <p className="mb-4">
                We use cookies for a variety of reasons detailed below. Unfortunately, in most cases there are no industry standard 
                options for disabling cookies without completely disabling the functionality and features they add to this site. 
                It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are 
                used to provide a service that you use.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disabling Cookies</h2>
              <p>
                You can prevent the setting of cookies by adjusting the settings on your browser. However, be aware that disabling 
                cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually 
                result in also disabling certain functionality and features of this site. Therefore it is recommended that you do 
                not disable cookies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. The Cookies We Set</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Account Related Cookies</h3>
                  <p>
                    If you create an account with us then we will use cookies for the management of the signup process and general 
                    administration. These cookies will usually be deleted when you log out however in some cases they may remain 
                    afterwards to remember your site preferences when logged out.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Login Related Cookies</h3>
                  <p>
                    We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log 
                    in every single time you visit a new page. These cookies are typically cleared when you log out to ensure that 
                    you can only access restricted features and areas when logged in.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Site Preferences Cookies</h3>
                  <p>
                    In order to provide you with a great experience on this site we provide the functionality to set your preferences 
                    for how this site runs when you use it. In order to remember your preferences we need to set cookies so that this 
                    information can be called whenever you interact with a page is affected by your preferences.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third Party Cookies</h2>
              <p>
                In some special cases we also use cookies provided by trusted third parties. The following section details which 
                third party cookies you might encounter through this site.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Google Analytics - to analyze site usage</li>
                <li>Stripe - for payment processing</li>
                <li>Facebook/Instagram - for social media integration</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. More Information</h2>
              <p>
                Hopefully that has clarified things for you. If there is something that you are not sure whether you need or not, 
                it is usually safer to leave cookies enabled in case it does interact with one of the features you use on our site.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
              <p>
                If you have any questions about our Cookie Policy, please contact us at:
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

