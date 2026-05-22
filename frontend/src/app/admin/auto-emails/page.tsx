'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Mail, Send, Settings, Truck } from 'lucide-react';
import TemplatesTab from '@/components/AutoEmails/TemplatesTab';
import AnalyticsTab from '@/components/AutoEmails/AnalyticsTab';
import ScheduleTab from '@/components/AutoEmails/ScheduleTab';
import SendTab from '@/components/AutoEmails/SendTab';
import DeliveryReportsTab from '@/components/AutoEmails/DeliveryReportsTab';

type TabType = 'templates' | 'schedule' | 'analytics' | 'send' | 'delivery';

export default function AutoEmailsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('templates');

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'templates', label: 'Templates', icon: <Mail className="w-4 h-4" /> },
    { id: 'schedule', label: 'Schedule', icon: <Settings className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'send', label: 'Send Custom', icon: <Send className="w-4 h-4" /> },
    { id: 'delivery', label: 'Delivery Reports', icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
        <p className="text-gray-600 mt-1">
          Manage automated email campaigns, templates, and delivery reports.
        </p>
      </div>

      <div className="border-b border-neutral-200 flex mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors
              border-b-2 -mb-px whitespace-nowrap cursor-pointer
              ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'schedule' && <ScheduleTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'send' && <SendTab />}
        {activeTab === 'delivery' && <DeliveryReportsTab />}
      </motion.div>
    </div>
  );
}

