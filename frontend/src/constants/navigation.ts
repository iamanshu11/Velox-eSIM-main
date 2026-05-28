export const NAVIGATION_ITEMS = [
  { label: 'Home',         href: '/' },
  { label: 'eSIM Store',   href: '/esim' },
  { label: 'How it Works', href: '/how-it-works' },
  { label: 'About',        href: '/about' },
  { label: 'Magazine',     href: '/magazine' },
  { label: 'FAQ',          href: '/faq' },
] as const

export type NavItem = (typeof NAVIGATION_ITEMS)[number]

export const DASHBOARD_NAVIGATION_ITEMS = [
  { label: 'Overview', href: '/dashboard',          icon: 'Home' },
  { label: 'My eSIMs', href: '/dashboard/esims',    icon: 'Smartphone' },
  { label: 'Wallet',   href: '/dashboard/wallet',   icon: 'Wallet' },
  { label: 'Payments', href: '/dashboard/payments', icon: 'CreditCard' },
  { label: 'Support',  href: '/dashboard/support',  icon: 'MessageSquare' },
  { label: 'Profile',  href: '/dashboard/profile',  icon: 'Settings' },
] as const

export const ADMIN_NAVIGATION_ITEMS = [
  { label: 'Dashboard',       href: '/admin',               icon: 'LayoutDashboard', exact: true },
  { label: 'My Orders',       href: '/admin/orders',        icon: 'ShoppingCart' },
  { label: 'My eSIMs',        href: '/admin/esims',         icon: 'Smartphone' },
  { label: 'Analytics',       href: '/admin/analytics',     icon: 'BarChart3' },
  { label: 'Payments',        href: '/admin/payments',      icon: 'CreditCard' },
  { label: 'Users',           href: '/admin/users',         icon: 'Users' },
  { label: 'Blog',            href: '/admin/blog',          icon: 'BookOpen' },
  { label: 'Live Chat',       href: '/admin/live-chat',     icon: 'MessageSquare' },
  { label: 'Email Marketing', href: '/admin/auto-emails',   icon: 'Mail' },
  { label: 'Support',         href: '/admin/support',       icon: 'Bell' },
  { label: 'Profile',         href: '/admin/profile',       icon: 'User' },
  { label: 'Settings',        href: '/admin/settings',      icon: 'Settings' },
] as const

export const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { label: 'Plans',    href: '/esim' },
      { label: 'Pricing',  href: '/#pricing' },
      { label: 'Features', href: '/#features' },
      { label: 'Status',   href: '/status' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',   href: '/about' },
      { label: 'Blog',    href: '/magazine' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy',   href: '/cookies' },
      { label: 'Refund Policy',   href: '/refunds' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'FAQ',           href: '/faq' },
      { label: 'API Reference', href: '/api' },
      { label: 'Community',     href: '/community' },
    ],
  },
] as const

export const SOCIAL_LINKS = [
  { platform: 'twitter',  url: 'https://twitter.com',  icon: 'Twitter' },
  { platform: 'linkedin', url: 'https://linkedin.com', icon: 'Linkedin' },
  { platform: 'github',   url: 'https://github.com',   icon: 'Github' },
  { platform: 'facebook', url: 'https://facebook.com', icon: 'Facebook' },
] as const

const NAVIGATION = {
  NAVIGATION_ITEMS,
  DASHBOARD_NAVIGATION_ITEMS,
  ADMIN_NAVIGATION_ITEMS,
  FOOTER_SECTIONS,
  SOCIAL_LINKS,
}

export default NAVIGATION
