'use client';

import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Link from 'next/link';
import { useState } from 'react';
import { Briefcase, ArrowRight, Users, Zap, Globe, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CareersPage() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const jobs = [
    {
      id: 1,
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      type: 'Full-time',
      description: 'Build scalable backend systems for millions of eSIM users worldwide.',
    },
    {
      id: 2,
      title: 'Product Manager',
      department: 'Product',
      type: 'Full-time',
      description: 'Shape the future of global connectivity with innovative eSIM products.',
    },
    {
      id: 3,
      title: 'Customer Support Specialist',
      department: 'Support',
      type: 'Full-time',
      description: 'Provide 24/7 support to our global customer base.',
    },
    {
      id: 4,
      title: 'Frontend Engineer',
      department: 'Engineering',
      type: 'Full-time',
      description: 'Create beautiful, responsive interfaces for the eSIM platform.',
    },
    {
      id: 5,
      title: 'Data Analyst',
      department: 'Analytics',
      type: 'Full-time',
      description: 'Drive insights and optimize platform performance through data analysis.',
    },
    {
      id: 6,
      title: 'Marketing Manager',
      department: 'Marketing',
      type: 'Full-time',
      description: 'Lead marketing initiatives to expand our global presence.',
    },
  ];

  const benefits = [
    { 
      icon: Zap, 
      title: 'Competitive Salary', 
      description: 'Industry-leading compensation packages with performance bonuses' 
    },
    { 
      icon: Heart, 
      title: 'Health Benefits', 
      description: 'Comprehensive health, dental, vision, and wellness coverage' 
    },
    { 
      icon: Globe, 
      title: 'Remote Work', 
      description: 'Work from anywhere with flexible schedules and time zones' 
    },
    { 
      icon: Briefcase, 
      title: 'Professional Growth', 
      description: 'Continuous learning, mentorship, and career development' 
    },
    { 
      icon: Users, 
      title: 'Equity Ownership', 
      description: 'Participate in company growth with stock options' 
    },
    { 
      icon: Zap, 
      title: 'Unlimited PTO', 
      description: 'Take the time you need - we trust our team' 
    },
  ];

  const departments = ['All', 'Engineering', 'Product', 'Support', 'Analytics', 'Marketing'];
  
  const filteredJobs = selectedDept 
    ? jobs.filter(job => job.department === selectedDept)
    : jobs;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-28 bg-linear-to-br from-primary-50 via-white to-primary-100">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute -top-40 right-10 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000" />
        </div>

        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center max-w-3xl mx-auto"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 border border-primary-200">
              <Users className="w-4 h-4 text-primary-700" />
              <span className="text-sm font-semibold text-primary-700">We&apos;re Hiring</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black mb-6 text-gray-900 leading-tight">
              Join Our Mission
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Help us revolutionize global connectivity. Build the future of eSIM technology with a passionate, talented team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#positions" className="group">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 flex items-center justify-center gap-2 group-hover:gap-3 transition-all duration-300">
                  View Positions
                  <ArrowRight className="w-5 h-5 transition-transform" />
                </Button>
              </Link>
              <Link href="mailto:careers@veloxesim.com" className="group">
                <Button variant="outline" className="px-8 py-4">
                  Get In Touch
                </Button>
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Why Join Velox eSIM?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer a world-class workplace with competitive compensation, benefits, and endless opportunities for growth.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {benefits.map((benefit, idx) => {
              const IconComponent = benefit.icon;
              return (
                <motion.div key={benefit.title || idx} variants={itemVariants}>
                  <Card className="p-8 h-full hover:shadow-lg hover:border-primary-400 transition-all duration-300 group">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 group-hover:bg-primary-200 transition-colors duration-300">
                      <IconComponent className="w-6 h-6 text-primary-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </section>

      {/* Open Positions Section */}
      <section id="positions" className="py-24 bg-gray-50">
        <Container>
          <div className="mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-8">Open Positions</h2>
            
            {/* Department Filter */}
            <div className="flex flex-wrap gap-3 mb-12">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept === 'All' ? null : dept)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                    (!selectedDept && dept === 'All') || selectedDept === dept
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border-2 border-neutral-300 text-gray-900 hover:border-gray-900'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {filteredJobs.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-6"
            >
              {filteredJobs.map((job) => (
                <motion.div key={job.id} variants={itemVariants}>
                  <Card className="p-8 hover:shadow-md hover:border-primary-400 transition-all duration-300 group cursor-pointer">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-100 text-xs font-bold text-primary-700 uppercase tracking-wide">
                          {job.department}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {job.title}
                        </h3>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-700 transition-colors shrink-0 mt-2" />
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">{job.description}</p>

                    <div className="flex items-center gap-4 pt-6 border-t border-neutral-200">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Type</p>
                          <p className="text-gray-900 font-medium">{job.type}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No positions available in {selectedDept} department right now.</p>
            </div>
          )}
        </Container>
      </section>

      {/* Culture Section */}
      <section className="py-24">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Our Culture</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We believe in building a diverse, inclusive workplace where everyone can thrive and make an impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Innovation First</h3>
                <p className="text-gray-700 leading-relaxed">
                  We challenge the status quo and embrace new ideas. Every team member is encouraged to contribute 
                  and drive meaningful changes to our platform.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Global Community</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our team spans continents. We celebrate diversity and bring different perspectives to solve problems uniquely.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Continuous Learning</h3>
                <p className="text-gray-700 leading-relaxed">
                  We invest in your growth. Access to training, mentorship, and opportunities to expand your skillset.
                </p>
              </div>
            </div>

            <div className="relative h-96 rounded-2xl bg-neutral-200 border border-neutral-300 flex items-center justify-center group overflow-hidden">
              <div className="text-gray-400 text-center">
                <p className="font-semibold">Team Culture</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="relative rounded-3xl bg-linear-to-r from-primary-600 to-primary-700 p-12 md:p-16 text-white text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Make an Impact?</h2>
              <p className="text-lg text-primary-100 mb-8">
                Join our team and help bring global connectivity to millions of users worldwide.
              </p>
              <Link href="mailto:careers@veloxesim.com">
                <Button className="bg-white hover:bg-gray-100 text-primary-700 font-bold px-10 py-4">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
