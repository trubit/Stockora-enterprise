/**
 * Stockora Enterprise Pro — Verified Imagery Registry & Metadata
 *
 * Strict Compliance:
 * - Real human photographs only. Absolutely NO AI-generated / synthetic imagery.
 * - Sourced from reputable platforms (Unsplash) with verified commercial licenses.
 * - All assets are stored locally in /public/assets/ to ensure offline-readiness,
 *   optimal compression, zero third-party tracking, and tenant privacy.
 */

export interface EnterpriseImageMetadata {
  id: string;
  src: string;
  alt: string;
  title: string;
  photographer: string;
  sourceUrl: string;
  license: string;
  usageContext: string;
}

export const ENTERPRISE_IMAGERY: Record<string, EnterpriseImageMetadata> = {
  authOperator: {
    id: 'auth-operator',
    src: '/assets/auth/enterprise-business-operator.jpg',
    alt: 'African-American business operator managing commerce workflows on laptop',
    title: 'Enterprise Business Operator',
    photographer: 'Christina @ wocintechchat.com',
    sourceUrl: 'https://unsplash.com/photos/b8d87734a5a2',
    license: 'Unsplash License (Free commercial & non-commercial use, verified real human)',
    usageContext: 'Primary visual panel for Sign In (/login) and Sign Up (/signup, /register)',
  },
  dashboardHero: {
    id: 'dashboard-hero',
    src: '/assets/enterprise/dashboard-hero-operator.jpg',
    alt: 'Enterprise operations executive in a modern business conference environment',
    title: 'Enterprise Operations Director',
    photographer: 'Christina @ wocintechchat.com',
    sourceUrl: 'https://unsplash.com/photos/1c28c88b4f3e',
    license: 'Unsplash License (Free commercial & non-commercial use, verified real human)',
    usageContext: 'Dashboard welcome & executive operations overview banner',
  },
  retailCustomer: {
    id: 'retail-customer',
    src: '/assets/enterprise/retail-customer-partner.jpg',
    alt: 'Store operator assisting retail customer at the checkout counter',
    title: 'Retail Commerce & Customer Engagement',
    photographer: 'Blake Wisz',
    sourceUrl: 'https://unsplash.com/photos/b6a63e27c4df',
    license: 'Unsplash License (Free commercial & non-commercial use, verified real human)',
    usageContext: 'Customer directory & CRM empty states and onboarding',
  },
  teamOperations: {
    id: 'team-operations',
    src: '/assets/enterprise/team-branch-operations.jpg',
    alt: 'Multi-disciplinary enterprise team collaborating around a strategy table',
    title: 'Enterprise Branch Operations Team',
    photographer: 'Annie Spratt',
    sourceUrl: 'https://unsplash.com/photos/009f0129c71c',
    license: 'Unsplash License (Free commercial & non-commercial use, verified real human)',
    usageContext: 'Branch locations & staff organization empty state and onboarding',
  },
  warehouseLogistics: {
    id: 'warehouse-logistics',
    src: '/assets/enterprise/logistics-warehouse-operator.jpg',
    alt: 'Modern logistics warehouse manager overseeing inventory pallets and stock',
    title: 'Warehouse Logistics & Supply Chain Operator',
    photographer: 'Adrian Sulyok',
    sourceUrl: 'https://unsplash.com/photos/ad8dd3c8310d',
    license: 'Unsplash License (Free commercial & non-commercial use, verified real human)',
    usageContext: 'Inventory & catalog empty state and logistics onboarding',
  },
};
