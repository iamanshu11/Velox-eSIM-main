'use client';

import Container from '@/components/Container';
import { useState, useEffect } from 'react';
import { Linkedin, Twitter, Github } from 'lucide-react';

export default function TeamPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const team = [
    {
      id: '1',
      name: 'John Smith',
      role: 'CEO & Founder',
      bio: 'Visionary leader with 10+ years in telecom industry, passionate about global connectivity',
      gradient: 'from-gray-600 to-gray-700',
      social: { linkedin: '#', twitter: '#', github: '#' },
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'CTO',
      bio: 'Expert in cloud infrastructure and APIs with proven track record at Fortune 500',
      gradient: 'from-gray-700 to-gray-800',
      social: { linkedin: '#', twitter: '#', github: '#' },
    },
    {
      id: '3',
      name: 'Mike Chen',
      role: 'Head of Operations',
      bio: 'Ensures seamless eSIM delivery across 190+ countries with zero downtime',
      gradient: 'from-neutral-600 to-neutral-700',
      social: { linkedin: '#', twitter: '#', github: '#' },
    },
    {
      id: '4',
      name: 'Emma Davis',
      role: 'Customer Success Lead',
      bio: 'Dedicated to customer satisfaction with 98% satisfaction rate achievement',
      gradient: 'from-gray-500 to-gray-600',
      social: { linkedin: '#', twitter: '#', github: '#' },
    },
    {
      id: '5',
      name: 'Alex Rodriguez',
      role: 'Product Manager',
      bio: 'Drives innovation in our platform with focus on user experience and scalability',
      gradient: 'from-neutral-700 to-gray-800',
      social: { linkedin: '#', twitter: '#', github: '#' },
    },
    {
      id: '6',
      name: 'Lisa Wong',
      role: 'Marketing Director',
      bio: 'Building our global brand presence with strategic campaigns and partnerships',
      gradient: 'from-gray-600 to-gray-700',
      social: { linkedin: '#', twitter: '#', github: '#' },
    },
  ];

  return (
    <div className="bg-dark-900">
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-linear-to-br from-gray-500/20 via-gray-500/10 to-gray-500/20 blur-3xl" />

        <Container>
          <div className={`relative z-10 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              Meet Our Elite Team
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Passionate professionals united by a single mission: revolutionizing global eSIM connectivity
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <div
                key={member.id}
                className={`group rounded-2xl bg-linear-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 overflow-hidden hover:border-primary-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-600/20 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: isLoaded ? `${150 * i}ms` : '0ms' }}
              >
                <div className={`h-40 bg-linear-to-br ${member.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-4">
                      <a href={member.social.linkedin} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <Linkedin className="w-5 h-5 text-white" />
                      </a>
                      <a href={member.social.twitter} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <Twitter className="w-5 h-5 text-white" />
                      </a>
                      <a href={member.social.github} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <Github className="w-5 h-5 text-white" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1 group-hover:text-primary-300 transition-colors">{member.name}</h3>
                  <p className={`text-sm font-semibold bg-linear-to-r ${member.gradient} bg-clip-text text-transparent mb-3`}>
                    {member.role}
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <Container>
          <div className="rounded-2xl bg-linear-to-r from-primary-700/20 to-primary-900/20 border border-primary-500/30 p-12 backdrop-blur-sm">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { number: '50+', label: 'Team Members' },
                { number: '100+', label: 'Partner Companies' },
                { number: '2M+', label: 'Happy Customers' },
                { number: '99.9%', label: 'Service Uptime' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl font-black text-transparent bg-linear-to-r from-primary-400 to-primary-700 bg-clip-text">
                    {stat.number}
                  </div>
                  <p className="text-gray-400 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}





