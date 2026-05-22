'use client';

import Container from '@/components/Container';
import Button from '@/components/Button';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, Share2, Plane, Sparkles, DollarSign, MapPin, Shield, Smartphone } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  icon: string;
  content: string;
}

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  Plane: <Plane className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  DollarSign: <DollarSign className="w-8 h-8" />,
  MapPin: <MapPin className="w-8 h-8" />,
  Shield: <Shield className="w-8 h-8" />,
  Smartphone: <Smartphone className="w-8 h-8" />,
};

const ARTICLES_DB: Record<number, Article> = {
  1: {
    id: 1,
    title: '5 Essential Travel Tips for Digital Nomads',
    excerpt: 'Discover the best practices for staying connected while traveling the world.',
    author: 'Sarah Johnson',
    date: 'Feb 2, 2026',
    icon: 'Plane',
    category: 'Travel',
    readTime: '5 min read',
    content: `
      # 5 Essential Travel Tips for Digital Nomads

      ## Stay Connected Anywhere

      Digital nomads need reliable connectivity above all else. With eSIM technology, you can now maintain a consistent internet connection across multiple countries without the hassle of physical SIM cards.

      ### Tip 1: Choose eSIMs with Multiple Country Coverage

      Look for eSIM plans that cover multiple countries in the regions you plan to visit. This not only saves money but also ensures you don't have connectivity gaps between destinations.

      ### Tip 2: Always Have a Backup Plan

      Keep a secondary phone or SIM card as backup. Even with the best eSIM providers, having a failsafe ensures you're never completely cut off from communication.

      ### Tip 3: Understand Data Limits

      Different eSIM plans come with various data limits. For video conferencing and cloud work, ensure you have sufficient data allowance. Consider plans with unlimited data if you stream frequently.

      ### Tip 4: Test Before Major Trips

      Always test your eSIM setup before embarking on major projects or client calls. A test period helps identify any issues beforehand.

      ### Tip 5: Keep Documentation Digital

      Store all your eSIM details, activation codes, and provider information in a secure cloud location. This ensures you can troubleshoot or reactivate services from anywhere.

      ## Conclusion

      Digital nomads who embrace eSIM technology gain unprecedented flexibility and reliability in their travels. By following these tips, you'll ensure seamless connectivity wherever your adventures take you.
    `,
  },
  2: {
    id: 2,
    title: 'The Future of eSIM Technology',
    excerpt: 'Exploring the latest innovations in global connectivity solutions.',
    author: 'Mike Chen',
    date: 'Jan 28, 2026',
    icon: 'Sparkles',
    category: 'Technology',
    readTime: '7 min read',
    content: `
      # The Future of eSIM Technology

      ## A Revolution in Progress

      eSIM technology is rapidly transforming how the world connects. What started as a niche feature is now becoming the standard for next-generation connectivity.

      ### Key Innovations on the Horizon

      **5G Integration**: eSIMs are becoming integral to 5G rollouts globally, enabling faster data speeds and lower latency.

      **IoT Expansion**: Beyond phones, eSIMs are powering billions of IoT devices, creating a truly connected world.

      **Dual eSIM Support**: Future devices will support multiple active eSIM profiles simultaneously, allowing seamless switching between providers.

      ### Industry Adoption

      Major telecommunications companies are investing billions in eSIM infrastructure. This shift signals confidence in the technology's future and commitment to universal connectivity.

      ### Consumer Benefits

      - **Flexibility**: Switch providers instantly without physical changes
      - **Cost Savings**: Global roaming becomes significantly cheaper
      - **Sustainability**: Reduced plastic waste from SIM card manufacturing
      - **Convenience**: Activate plans instantly from anywhere

      ## Looking Ahead

      As we move toward 2030, eSIM technology will likely become the default connectivity method worldwide. Early adopters are already experiencing the benefits that will soon be universally expected.

      The future of connectivity is digital, and eSIMs are leading the charge.
    `,
  },
  3: {
    id: 3,
    title: 'Budget Travel: How eSIMs Save You Money',
    excerpt: 'Learn how to save up to 70% on roaming charges with strategic eSIM planning.',
    author: 'Emma Davis',
    date: 'Jan 15, 2026',
    icon: 'DollarSign',
    category: 'Budget',
    readTime: '6 min read',
    content: `
      # Budget Travel: How eSIMs Save You Money

      ## The Money Talk

      Roaming charges have historically been one of the biggest expenses for travelers. eSIM technology is changing that equation dramatically.

      ### The Cost Comparison

      **Traditional Roaming**: $5-15 per GB or $50-100+ per day for unlimited data

      **eSIM Plans**: $10-30 per month for country-specific plans or $20-50 for multi-country regional plans

      ### Real Savings Examples

      - **2-week Europe trip**: Traditional roaming ~$500-700 vs eSIM ~$60-80
      - **1-month Asia tour**: Traditional roaming ~$1000+ vs eSIM ~$100-150
      - **Quarterly global travel**: Traditional roaming ~$3000+ vs eSIM ~$500

      ### Strategic Planning Tips

      1. **Choose Regional Plans**: Multi-country plans offer better value than individual country plans
      2. **Buy Local Data**: At your destination, local eSIM plans are often cheaper than international plans
      3. **Share Data**: Many providers offer family plans with shared data pools
      4. **Plan Ahead**: Book plans before traveling for better rates

      ### Hidden Benefits

      Beyond direct savings, eSIMs reduce stress and increase flexibility. No more hunting for SIM cards at the airport or dealing with language barriers when purchasing local SIMs.

      ## The Bottom Line

      For budget-conscious travelers, eSIMs aren't just convenient—they're economically transformative. Start using them and watch your travel budget stretch further than ever before.
    `,
  },
  4: {
    id: 4,
    title: 'Top 10 eSIM-Friendly Destinations',
    excerpt: 'Countries with the best eSIM coverage and infrastructure for travelers.',
    author: 'Lisa Wong',
    date: 'Jan 8, 2026',
    icon: 'MapPin',
    category: 'Destinations',
    readTime: '4 min read',
    content: `
      # Top 10 eSIM-Friendly Destinations

      ## Best Places to Use eSIM Technology

      Not all countries support eSIM equally. Here are the top destinations where eSIM technology is most accessible and useful.

      ### 1. Singapore
      - Universal eSIM support across all major carriers
      - Fastest 5G connectivity in Asia
      - Affordable data plans starting at $3/day

      ### 2. Japan
      - Extensive eSIM coverage in urban and rural areas
      - Excellent 4G/5G infrastructure
      - Multiple provider options with English support

      ### 3. United States
      - All major carriers support eSIM
      - Competitive pricing with unlimited plans
      - Wide 5G coverage

      ### 4. United Kingdom
      - Strong eSIM adoption rate
      - Good coverage outside London
      - Multiple provider options

      ### 5. Australia
      - Excellent coverage in major cities
      - Reliable outback connectivity (selected areas)
      - Affordable international rates

      ### 6. Germany
      - Leading European eSIM adoption
      - Fast speeds and reliable coverage
      - Good value plans

      ### 7. France
      - Paris and major cities well-covered
      - Growing rural coverage
      - Competitive European rates

      ### 8. Canada
      - All major carriers support eSIM
      - Excellent North American roaming
      - Good coverage nationwide

      ### 9. South Korea
      - World-class 5G infrastructure
      - Excellent eSIM support
      - Affordable data plans

      ### 10. United Arab Emirates
      - High-speed connectivity
      - Strong eSIM provider options
      - Good value for Middle East region

      ## Planning Your eSIM Travel

      When visiting these destinations, prioritize eSIM-compatible phones and research plans in advance. Most major providers offer coverage in these countries with competitive rates.
    `,
  },
  5: {
    id: 5,
    title: 'Data Security: Protecting Your Connection',
    excerpt: 'Everything you need to know about staying secure on eSIM networks worldwide.',
    author: 'John Smith',
    date: 'Dec 28, 2025',
    icon: 'Shield',
    category: 'Security',
    readTime: '8 min read',
    content: `
      # Data Security: Protecting Your Connection

      ## Security Matters

      While eSIMs offer convenience, security remains paramount. Here's everything you need to know about protecting your connection and data.

      ### eSIM Security Benefits

      **No Physical Interception**: Unlike physical SIMs, eSIMs can't be physically stolen or cloned as easily.

      **Remote Management**: You can remotely disable or activate profiles, providing better control.

      **Encryption**: Modern eSIMs use advanced encryption protocols.

      ### Potential Vulnerabilities

      1. **SIM Swapping**: An attacker convinces your carrier to transfer your number
      2. **Malware**: Compromised apps can access SIM data
      3. **Network Attacks**: Insecure Wi-Fi networks can compromise data

      ### Protection Strategies

      **Use VPN**: Always use a reputable VPN when on public networks

      **Enable 2FA**: Two-factor authentication adds an extra security layer

      **Monitor Accounts**: Regularly check your carrier account for unauthorized changes

      **Update Software**: Keep your phone and apps updated

      **Use Strong Passwords**: For carrier and email accounts associated with your eSIM

      ### Best Practices

      - Never share your eSIM QR code with unknown parties
      - Disable automatic connection to open networks
      - Use carrier-provided security apps
      - Backup important data before traveling

      ### What To Do If Compromised

      If you suspect eSIM compromise:
      1. Contact your provider immediately
      2. Change passwords for associated accounts
      3. Enable account protections
      4. Consider removing and re-provisioning your eSIM

      ## Conclusion

      eSIM security is strong by design, but your behavior matters most. Follow these guidelines and travel with confidence knowing your connection is protected.
    `,
  },
  6: {
    id: 6,
    title: 'eSIM vs Physical SIM: A Complete Comparison',
    excerpt: 'Understand the advantages and disadvantages of making the switch to eSIM.',
    author: 'Alex Rodriguez',
    date: 'Dec 15, 2025',
    icon: 'Smartphone',
    category: 'Education',
    readTime: '6 min read',
    content: `
      # eSIM vs Physical SIM: A Complete Comparison

      ## The Great Debate

      As eSIM technology matures, many users wonder if they should make the switch. Let's compare these technologies objectively.

      ### eSIM Advantages

      **Convenience**: Activate instantly without physical cards or carrier visits

      **Flexibility**: Switch carriers without changing phones or numbers

      **Space**: No physical slot needed; phones can be thinner or have dual profiles

      **Global Roaming**: Seamless international connectivity

      **Cost**: Often cheaper than international roaming with physical SIMs

      **Environmental**: Reduces plastic waste and manufacturing carbon footprint

      ### Physical SIM Advantages

      **Compatibility**: Works with older devices

      **Backup**: Physical card is a tangible backup

      **Local Purchase**: Can easily buy SIMs in any country

      **Simplicity**: Straightforward process for non-tech-savvy users

      **No Account Issues**: Not dependent on carrier account management

      ### Feature Comparison Table

      | Feature | eSIM | Physical SIM |
      |---------|------|-------------|
      | Activation | Instant (minutes) | 1-2 hours |
      | Switching Carriers | Seconds | Days |
      | Physical Backup | No | Yes |
      | Dual Active Profile | Yes | No |
      | International Support | 190+ countries | Limited |
      | Device Requirements | Newer phones | Any phone |
      | Cost | Lower | Higher (roaming) |

      ### Should You Switch?

      **Switch to eSIM if you**:
      - Travel frequently internationally
      - Want flexibility in carrier selection
      - Use multiple profiles simultaneously
      - Care about environmental impact

      **Stick with Physical SIM if you**:
      - Use older devices
      - Rarely travel internationally
      - Prefer simplicity
      - Want tangible backups

      ## The Future Is Hybrid

      The future likely includes both technologies coexisting for the foreseeable future. New devices increasingly support dual eSIM or eSIM + physical SIM combinations, giving users the best of both worlds.

      ### Conclusion

      Neither technology is universally superior. Your choice depends on your lifestyle, preferences, and device compatibility. Forward-thinking travelers should consider upgrading to eSIM-compatible devices to future-proof their connectivity options.
    `,
  },
};

export default function ArticlePage() {
  const params = useParams();
  const articleId = parseInt(params.id as string);
  const article = ARTICLES_DB[articleId];
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!article) {
    return (
      <Container>
        <div className="py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Link href="/magazine">
            <Button className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Magazine
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className="bg-neutral-50">
      {/* Back Button */}
      <Container>
        <div className="pt-8 pb-6">
          <Link href="/magazine" className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Back to Magazine
          </Link>
        </div>
      </Container>

      {/* Hero Section */}
      <section className="py-12 bg-linear-to-br from-gray-50 to-gray-100">
        <Container>
          <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-2 bg-primary-100 text-primary-900 rounded-full text-sm font-semibold mb-4">
                {article.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
                {article.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {article.excerpt}
              </p>

              {/* Article Metadata */}
              <div className="flex flex-wrap justify-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{article.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Hero Image */}
      <div className="h-96 bg-linear-to-br from-primary-100 to-purple-100 flex items-center justify-center">
        {ICON_COMPONENTS[article.icon]}
      </div>

      {/* Article Content */}
      <section className="py-16">
        <Container>
          <div className="max-w-3xl mx-auto">
            <article className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-a:text-primary-700 prose-strong:font-semibold">
              {article.content.split('\n').map((line, i) => {
                if (line.startsWith('#')) {
                  const level = line.match(/^#+/)?.[0].length || 1;
                  const text = line.replace(/^#+\s/, '');
                  if (level === 1) return <h1 key={i} className="text-4xl font-black mb-6 mt-8 text-gray-900">{text}</h1>;
                  if (level === 2) return <h2 key={i} className="text-3xl font-bold mb-4 mt-8 text-gray-900">{text}</h2>;
                  if (level === 3) return <h3 key={i} className="text-2xl font-bold mb-3 mt-6 text-gray-900">{text}</h3>;
                }
                if (line.startsWith('|')) {
                  return null;
                }
                if (line.trim() === '') return <div key={i} />;
                return <p key={i} className="mb-4 text-gray-700 leading-relaxed">{line}</p>;
              })}
            </article>

            {/* Share Section */}
            <div className="mt-12 pt-12 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Share this article</h3>
                <div className="flex gap-4">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Related Articles Suggestion */}
            <div className="mt-12 pt-12 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-gray-900">More Articles</h3>
              <Link href="/magazine">
                <Button className="inline-flex items-center gap-2">
                  Back to All Articles
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

