'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  variant?: 'default' | 'underline' | 'pills'
}

const Tabs: React.FC<TabsProps> = ({ items, defaultTab, onChange, variant = 'default' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const variants = {
    default: 'border-b border-neutral-200',
    underline: 'border-b-2 border-gray-900',
    pills: 'gap-2',
  }

  return (
    <div className="w-full">
      <div className={`flex overflow-x-auto ${variants[variant] || variants.default}`}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && handleTabChange(item.id)}
            disabled={item.disabled}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'text-gray-900 font-bold'
                : 'text-gray-600 hover:text-gray-900'
            } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''} ${
              variant === 'pills'
                ? `rounded-lg ${activeTab === item.id ? 'bg-neutral-200' : 'hover:bg-neutral-100'}`
                : ''
            }`}
          >
            {item.label}
            {activeTab === item.id && variant !== 'pills' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="mt-4"
      >
        {items.find((item) => item.id === activeTab)?.content}
      </motion.div>
    </div>
  )
}

interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
}

const Accordion: React.FC<AccordionProps> = ({ items, allowMultiple = false }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId)
    } else {
      if (!allowMultiple) {
        newOpenItems.clear()
      }
      newOpenItems.add(itemId)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="overflow-hidden rounded-lg border border-neutral-200 dark:border-gray-700"
        >
          <button
            onClick={() => toggleItem(item.id)}
            className="flex w-full items-center justify-between bg-white px-6 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-neutral-50 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            {item.title}
            <motion.span
              animate={{ rotate: openItems.has(item.id) ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-500"
            >
              ▼
            </motion.span>
          </button>

          <motion.div
            initial={false}
            animate={{ height: openItems.has(item.id) ? 'auto' : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {item.content}
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  closeable?: boolean
  onClose?: () => void
  icon?: React.ReactNode
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  closeable = true,
  onClose,
  icon,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  const variants = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900',
      border: 'border-green-200 dark:border-green-700',
      text: 'text-green-800 dark:text-green-100',
      icon: 'Done',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-800 dark:text-red-100',
      icon: 'Error',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900',
      border: 'border-yellow-200 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-100',
      icon: '!',
    },
    info: {
      bg: 'bg-neutral-50 dark:bg-neutral-900',
      border: 'border-neutral-200 dark:border-neutral-700',
      text: 'text-gray-900 dark:text-neutral-100',
      icon: 'i',
    },
  }

  const config = variants[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border ${config.bg} ${config.border} ${config.text} p-4`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current bg-opacity-10 text-lg">
          {icon || config.icon}
        </div>
        <div className="flex-1">
          {title && <p className="font-semibold">{title}</p>}
          <p className={title ? 'mt-1 text-sm' : ''}>{message}</p>
        </div>
        {closeable && (
          <button
            onClick={handleClose}
            className="text-current opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  )
}

export { Tabs, Accordion, Alert }

