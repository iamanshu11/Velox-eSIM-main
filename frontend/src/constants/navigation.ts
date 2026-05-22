export const NAVIGATION_ITEMS = [
  {
    label: 'Home',
    href: '/',
    public: true,
  },
  {
    label: 'Plans',
    href: '/esim',
    public: true,
  },
  {
    label: 'Pricing',
    href: '/pricing',
    public: true,
  },
  {
    label: 'Contact',
    href: '/contact',
    public: true,
  },
] as const

export const DASHBOARD_NAVIGATION_ITEMS = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: 'BarChart3',
  },
  {
    label: 'eSIMs',
    href: '/dashboard/esims',
    icon: 'Smartphone',
  },
  {
    label: 'Payments',
    href: '/dashboard/payments',
    icon: 'CreditCard',
  },
  {
    label: 'Support',
    href: '/dashboard/support',
    icon: 'MessageCircle',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: 'Settings',
  },
] as const

export const ADMIN_NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'BarChart3',
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: 'ShoppingCart',
  },
  {
    label: 'eSIMs',
    href: '/admin/esims',
    icon: 'Smartphone',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: 'Users',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: 'LineChart',
  },
  {
    label: 'Tickets',
    href: '/admin/tickets',
    icon: 'HelpCircle',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
] as const

export const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { label: 'Plans', href: '/plans' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Features', href: '/#features' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Refund Policy', href: '/refunds' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'FAQ', href: '/faq' },
      { label: 'API Reference', href: '/api' },
      { label: 'Community', href: '/community' },
    ],
  },
] as const

export const SOCIAL_LINKS = [
  {
    platform: 'twitter',
    url: 'https://twitter.com',
    icon: 'Twitter',
  },
  {
    platform: 'linkedin',
    url: 'https://linkedin.com',
    icon: 'Linkedin',
  },
  {
    platform: 'github',
    url: 'https://github.com',
    icon: 'Github',
  },
  {
    platform: 'facebook',
    url: 'https://facebook.com',
    icon: 'Facebook',
  },
] as const

const NAVIGATION = {
  NAVIGATION_ITEMS,
  DASHBOARD_NAVIGATION_ITEMS,
  ADMIN_NAVIGATION_ITEMS,
  FOOTER_SECTIONS,
  SOCIAL_LINKS,
}

export default NAVIGATION
