import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Paper,
  Tabs,
  Tab,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BusinessIcon from '@mui/icons-material/Business';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useRegionalSettings } from '../hooks/useRegionalSettings.js';
import { ENTERPRISE_IMAGERY } from '../constants/imagery.ts';

// Interactive demonstration catalog for the live POS terminal simulator
const demoProducts = [
  { id: '1', name: 'Whole Milk 1L', category: 'Dairy', sku: 'DRY-0192', price: 2.49, inStock: 142 },
  {
    id: '2',
    name: 'Sourdough Bread',
    category: 'Bakery',
    sku: 'BKY-4821',
    price: 3.99,
    inStock: 48,
  },
  {
    id: '3',
    name: 'Espresso Coffee 500g',
    category: 'Beverages',
    sku: 'BEV-8820',
    price: 12.99,
    inStock: 89,
  },
  {
    id: '4',
    name: 'Organic Honey 250g',
    category: 'Pantry',
    sku: 'PNT-3319',
    price: 7.5,
    inStock: 34,
  },
];

export const LandingPage: React.FC = () => {
  const { formatAmount } = useRegionalSettings();
  const navigate = useNavigate();

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Workflow tab switcher in visual showcase
  const [workflowTab, setWorkflowTab] = useState(0);

  // Feature search filter query
  const [featureSearch, setFeatureSearch] = useState('');

  // Interactive POS Simulator Cart state
  const [cart, setCart] = useState<
    { id: string; name: string; sku: string; price: number; qty: number }[]
  >([
    { id: '1', name: 'Whole Milk 1L', sku: 'DRY-0192', price: 2.49, qty: 2 },
    { id: '3', name: 'Espresso Coffee 500g', sku: 'BEV-8820', price: 12.99, qty: 1 },
  ]);

  // Checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('TXN-89421');

  const addToCart = (product: (typeof demoProducts)[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [
        ...prev,
        { id: product.id, name: product.name, sku: product.sku, price: product.price, qty: 1 },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const handleSimulateCheckout = () => {
    setReceiptNumber(`TXN-${Math.floor(10000 + Math.random() * 90000)}`);
    setCheckoutModalOpen(true);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.075;
  const total = subtotal + tax;

  // Filtered features list
  const coreFeatures = [
    {
      icon: <InventoryIcon sx={{ fontSize: 32, color: '#10b981' }} />,
      title: 'Multi-Warehouse Inventory Control',
      badge: 'Real-Time Sync',
      desc: 'Track live stock across all branches and central storage. Reconcile inventory, initiate inter-branch transfers, and prevent blind stockouts.',
      benefit: 'Eliminate overstocking and keep shelves balanced across physical stores.',
    },
    {
      icon: <PointOfSaleIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />,
      title: 'High-Speed Point of Sale (POS)',
      badge: 'Sub-Second',
      desc: 'Process customer transactions rapidly with barcode scanner integration, split cash/card tenders, and automated printed receipts.',
      benefit: 'Speed up checkout queues by 4x and protect revenue during peak periods.',
    },
    {
      icon: <StorefrontIcon sx={{ fontSize: 32, color: '#38bdf8' }} />,
      title: 'Master Product Catalog',
      badge: 'SKU & Barcodes',
      desc: 'Centralize SKUs, categories, supplier records, cost prices, and retail markups in a single, verified database.',
      benefit: 'Maintain consistent pricing and margin policies across all selling channels.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
      title: 'Sales Tracking & Back Office',
      badge: 'Audit Trail',
      desc: 'Full visibility into completed transactions, cashier shift reconciliation, customer receipts, and streamlined return processing.',
      benefit: 'Gain granular operational oversight of daily register intake and margins.',
    },
    {
      icon: <CompareArrowsIcon sx={{ fontSize: 32, color: '#ec4899' }} />,
      title: 'Stock Adjustments & Waste Tracking',
      badge: 'Shrinkage Defense',
      desc: 'Record cycle counts, damage write-offs, and shrinkage audits with mandatory employee reason codes and verification trails.',
      benefit: 'Identify causes of shrinkage quickly and hold staff accountable for stock.',
    },
    {
      icon: <PeopleOutlineIcon sx={{ fontSize: 32, color: '#06b6d4' }} />,
      title: 'Customer Directory & CRM',
      badge: 'Customer 360',
      desc: 'Centralized customer purchase profiles, outstanding balances, loyalty point tracking, and targeted buyer segmentation.',
      benefit: 'Increase repeat store visits and build personalized merchant relationships.',
    },
    {
      icon: <ShieldOutlinedIcon sx={{ fontSize: 32, color: '#a855f7' }} />,
      title: 'Granular Role-Based Permissions (RBAC)',
      badge: 'Data Security',
      desc: 'Enforce the principle of least privilege. Cashiers access only register terminals; only store owners and accountants see financial ledgers.',
      benefit: 'Protect your financial records and ensure staff execute only authorized tasks.',
    },
    {
      icon: <SignalCellularAltIcon sx={{ fontSize: 32, color: '#14b8a6' }} />,
      title: 'Executive Analytics & Telemetry',
      badge: 'Live Reports',
      desc: 'Real-time gross margin tracking, tax liability breakdowns, revenue velocity charts, and exportable financial reports.',
      benefit: 'Know your profitability and inventory valuation at any second of the business day.',
    },
  ];

  const filteredFeatures = coreFeatures.filter(
    (f) =>
      f.title.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.desc.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.benefit.toLowerCase().includes(featureSearch.toLowerCase())
  );

  return (
    <Box
      sx={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f8fafc', overflowX: 'hidden' }}
    >
      {/* =========================================================================
          PHASE 2: REDESIGNED EDGE-TO-EDGE HERO SECTION
          ========================================================================= */}
      <Box
        component="section"
        id="hero"
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: { xs: '100vh', md: '94vh' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          backgroundColor: '#030712',
        }}
      >
        {/* Layer 1: Mandatory Edge-to-Edge Genuine Photograph */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${ENTERPRISE_IMAGERY.warehouseLogistics.src})`,
            backgroundSize: 'cover',
            backgroundPosition: { xs: 'center 20%', md: 'center 32%' },
            backgroundRepeat: 'no-repeat',
            zIndex: 1,
            transform: 'scale(1.02)', // Smooth edge bleed without gaps
          }}
          aria-hidden="true"
        />

        {/* Layer 2: Transparent Dark Gradient Overlay (Preserves Image Visibility & Contrast) */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            background: `
              linear-gradient(180deg, 
                rgba(3, 7, 18, 0.88) 0%, 
                rgba(7, 11, 22, 0.74) 38%, 
                rgba(3, 7, 18, 0.90) 78%, 
                #030712 100%
              ),
              radial-gradient(ellipse at 50% 25%, rgba(139, 92, 246, 0.16) 0%, transparent 65%),
              radial-gradient(ellipse at 80% 85%, rgba(16, 185, 129, 0.10) 0%, transparent 55%)
            `,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        {/* Layer 3: Sticky Top Navbar Sits Above Image & Overlay */}
        <Box
          component="nav"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(3, 7, 18, 0.82)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            py: 2,
            px: { xs: 2, sm: 3, md: 4 },
          }}
          role="navigation"
          aria-label="Main Navigation"
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Brand Logo & Title */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => navigate('/landing')}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 24px rgba(139, 92, 246, 0.45)',
                    p: 0.5,
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="Stockora Enterprise Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      // Fallback to Icon if image doesn't load
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <PointOfSaleIcon sx={{ color: '#ffffff', fontSize: 24, display: 'none' }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      background: 'linear-gradient(90deg, #ffffff 0%, #e2e8f0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Stockora
                  </Typography>
                  <Typography
                    component="span"
                    variant="subtitle2"
                    sx={{
                      color: '#10b981',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '6px',
                      px: 0.75,
                      py: 0.1,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    }}
                  >
                    Enterprise Pro
                  </Typography>
                </Box>
              </Box>

              {/* Desktop Navigation Links */}
              <Box
                sx={{
                  display: { xs: 'none', lg: 'flex' },
                  alignItems: 'center',
                  gap: 3.5,
                }}
              >
                <Button
                  href="#business-problems"
                  sx={{
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  Why Stockora
                </Button>
                <Button
                  href="#how-it-works"
                  sx={{
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  How It Works
                </Button>
                <Button
                  href="#features"
                  sx={{
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  Core Features
                </Button>
                <Button
                  href="#pos-preview"
                  sx={{
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  Live Simulator
                </Button>
                <Button
                  href="#who-its-for"
                  sx={{
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  Solutions
                </Button>
                <Button
                  href="#security"
                  sx={{
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  Security
                </Button>
                <Button
                  href="#pricing"
                  sx={{
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffffff' },
                  }}
                >
                  Pricing
                </Button>
              </Box>

              {/* Action Buttons & Mobile Hamburger */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: '#c4b5fd',
                    fontWeight: 700,
                    px: 2,
                    '&:hover': { color: '#ffffff', backgroundColor: 'rgba(139, 92, 246, 0.12)' },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/signup')}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    fontWeight: 700,
                    borderRadius: '10px',
                    px: { xs: 2, sm: 3 },
                    py: 1,
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.45)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 28px rgba(139, 92, 246, 0.65)',
                    },
                  }}
                >
                  Get Started
                </Button>

                {/* Mobile Menu Icon */}
                <IconButton
                  sx={{ display: { xs: 'flex', lg: 'none' }, color: '#f8fafc', ml: 0.5 }}
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Mobile Slide-Out Drawer Navigation */}
        <Drawer
          anchor="right"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          PaperProps={{
            sx: {
              width: '80%',
              maxWidth: 320,
              backgroundColor: '#07090e',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              p: 3,
            },
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
              Stockora Navigation
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: '#9ca3af' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />
          <List>
            {[
              { label: 'Why Stockora', href: '#business-problems' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Core Features', href: '#features' },
              { label: 'Live POS Simulator', href: '#pos-preview' },
              { label: 'Who It Is For', href: '#who-its-for' },
              { label: 'Security & Isolation', href: '#security' },
              { label: 'Pricing Plans', href: '#pricing' },
            ].map((item) => (
              <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component="a"
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{
                    borderRadius: 2,
                    '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.12)' },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 600, color: '#e2e8f0' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/signup');
            }}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
              fontWeight: 800,
              py: 1.2,
              borderRadius: '10px',
              mb: 1.5,
            }}
          >
            Create Company Account
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/login');
            }}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#f8fafc',
              fontWeight: 700,
              py: 1.2,
              borderRadius: '10px',
            }}
          >
            Sign In to Terminal
          </Button>
        </Drawer>

        {/* Hero Content (Above Overlay, Fully Interactive, z-index: 3) */}
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 3,
            pt: { xs: 6, sm: 8, md: 10 },
            pb: { xs: 8, md: 10 },
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Top Operational Pill Badge */}
          <Chip
            icon={<AutoAwesomeIcon sx={{ color: '#34d399 !important', fontSize: 16 }} />}
            label="Enterprise-Grade Inventory, POS & Multi-Branch Platform"
            sx={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontWeight: 700,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              mb: 3,
              py: 0.75,
              px: 1.5,
              backdropFilter: 'blur(10px)',
            }}
          />

          {/* Primary Mandated Hero Headline */}
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4.2rem' },
              lineHeight: { xs: 1.15, sm: 1.12, md: 1.08 },
              letterSpacing: '-0.03em',
              maxWidth: '960px',
              mx: 'auto',
              mb: 3,
              color: '#ffffff',
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.65)',
            }}
          >
            Run Your Business Smarter with{' '}
            <Typography
              component="span"
              variant="inherit"
              sx={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Stockora Enterprise Pro
            </Typography>
          </Typography>

          {/* Mandated Supporting Description */}
          <Typography
            variant="h6"
            sx={{
              color: '#cbd5e1',
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: '820px',
              mx: 'auto',
              mb: 4.5,
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.28rem' },
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)',
            }}
          >
            Manage inventory, track sales, control stock across your business, and understand your
            business performance from one central platform.
          </Typography>

          {/* Call-to-Action Group */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
              mb: 6,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
                fontWeight: 800,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                borderRadius: '12px',
                px: { xs: 3.5, sm: 4.5 },
                py: { xs: 1.4, sm: 1.7 },
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 44px rgba(139, 92, 246, 0.7)',
                },
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="#how-it-works"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.25)',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(8px)',
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                borderRadius: '12px',
                px: { xs: 3, sm: 4 },
                py: { xs: 1.4, sm: 1.7 },
                '&:hover': {
                  borderColor: '#8b5cf6',
                  backgroundColor: 'rgba(139, 92, 246, 0.16)',
                },
              }}
            >
              Explore How It Works
            </Button>
            <Button
              variant="text"
              size="large"
              href="#pos-preview"
              startIcon={<ShoppingCartCheckoutIcon sx={{ color: '#34d399' }} />}
              sx={{
                color: '#94a3b8',
                fontWeight: 700,
                px: 2.5,
                py: 1.4,
                '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Test POS Simulator
            </Button>
          </Box>

          {/* Trust Indicators Bar */}
          <Paper
            elevation={0}
            sx={{
              maxWidth: 960,
              width: '100%',
              backgroundColor: 'rgba(11, 15, 26, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              p: { xs: 2, sm: 2.5 },
            }}
          >
            <Grid container spacing={2} alignItems="center" justifyContent="space-around">
              {[
                {
                  icon: <CheckCircleOutlineIcon sx={{ color: '#10b981' }} />,
                  text: 'Multi-Warehouse Sync',
                },
                { icon: <SpeedIcon sx={{ color: '#38bdf8' }} />, text: 'Sub-Second Barcode POS' },
                {
                  icon: <ShieldOutlinedIcon sx={{ color: '#a78bfa' }} />,
                  text: 'Tenant-Isolated RBAC',
                },
                {
                  icon: <ReceiptLongIcon sx={{ color: '#f59e0b' }} />,
                  text: 'Offline Resilient Transactions',
                },
              ].map((badge, idx) => (
                <Grid item xs={6} sm={3} key={idx}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
                  >
                    {badge.icon}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: '#e2e8f0',
                        fontSize: { xs: '0.78rem', sm: '0.85rem' },
                      }}
                    >
                      {badge.text}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Container>

        {/* Ambient bottom gradient blend into page body */}
        <Box
          sx={{
            height: '40px',
            background: 'linear-gradient(to bottom, transparent, #030712)',
            zIndex: 3,
          }}
          aria-hidden="true"
        />
      </Box>

      {/* =========================================================================
          PHASE 3, SECTION 1: THE BUSINESS PROBLEM (WHY BUSINESSES NEED STOCKORA)
          ========================================================================= */}
      <Box
        component="section"
        id="business-problems"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: '#030712',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#ef4444',
                fontWeight: 800,
                letterSpacing: '0.12em',
                display: 'block',
                mb: 1,
              }}
            >
              OPERATIONAL BOTTLENECKS
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
              The Everyday Challenges of Growing Commerce
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94a3af', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              Without a synchronized system, retail storefronts and warehouse hubs operate in
              disconnected silos, leaking profit through stockouts, inventory discrepancies, and
              slow checkout registers.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                icon: <WarningAmberIcon sx={{ fontSize: 32, color: '#ef4444' }} />,
                problem: 'Blind Stockouts & Overstocking',
                problemDesc:
                  'Without cross-branch visibility, fast-selling goods run out at one storefront while remaining stuck unsold at another, tying up precious cash flow.',
                solution:
                  'Stockora synchronizes multi-location inventory counts in real time, alerting managers to reorder safety levels before items run out.',
              },
              {
                icon: <SpeedIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
                problem: 'Slow Checkouts & Network Outages',
                problemDesc:
                  'Legacy registers freeze when internet connections drop or require manual SKU searches, creating agonizing lines that drive shoppers away.',
                solution:
                  'Our high-speed POS terminal features sub-second barcode lookup and seamless offline IndexedDB caching, so you never stop selling.',
              },
              {
                icon: <CompareArrowsIcon sx={{ fontSize: 32, color: '#38bdf8' }} />,
                problem: 'Untracked Shrinkage & Discrepancies',
                problemDesc:
                  'Paper inventory sheets make it impossible to pinpoint whether discrepancies arose from supplier shortfalls, cashier mistakes, or unlogged damages.',
                solution:
                  'Strict audit logs, mandatory adjustment reason codes, and verified receiving workflows ensure complete accountability.',
              },
              {
                icon: <SignalCellularAltIcon sx={{ fontSize: 32, color: '#a855f7' }} />,
                problem: 'Fragmented Business Visibility',
                problemDesc:
                  'Business owners wait until the end of the month to reconcile sales receipts with accounting ledgers, leaving margins up to guesswork.',
                solution:
                  'Live financial telemetry, gross margin calculators, and executive summaries display your exact profit position continuously.',
              },
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Card
                  className="glass-panel"
                  sx={{
                    height: '100%',
                    p: 3.5,
                    borderRadius: '20px',
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      {item.icon}
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                        {item.problem}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3af', lineHeight: 1.6, mb: 3 }}>
                      {item.problemDesc}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                      <Typography
                        variant="caption"
                        sx={{ color: '#34d399', fontWeight: 800, letterSpacing: '0.05em' }}
                      >
                        THE STOCKORA SOLUTION
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.85rem' }}
                    >
                      {item.solution}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          PHASE 3, SECTION 2: HOW IT WORKS (STEP-BY-STEP CUSTOMER JOURNEY)
          ========================================================================= */}
      <Box
        component="section"
        id="how-it-works"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: 'rgba(11, 15, 26, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#8b5cf6',
                fontWeight: 800,
                letterSpacing: '0.12em',
                display: 'block',
                mb: 1,
              }}
            >
              HOW STOCKORA WORKS
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
              From Setup to Daily Scale in 4 Simple Steps
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94a3af', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              Discover how Stockora Enterprise Pro structures your daily commerce workflow,
              protecting accuracy at every operational step.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                step: '01',
                title: 'Set up your company',
                desc: 'Create your owner account, name your enterprise, add branch storefronts or distribution warehouses, and configure regional currencies and tax rates.',
                highlight: 'Fast onboarding wizard with localized multi-currency settings.',
                actionText: 'Register Company',
                route: '/signup',
              },
              {
                step: '02',
                title: 'Add products & stock',
                desc: 'Organize your catalog by category. Assign SKU numbers and barcodes, establish purchase costs, retail margins, and allocate initial stock quantities per location.',
                highlight: 'Master catalog with bulk import, batch tracking, and low-stock limits.',
                actionText: 'Explore Catalog',
                route: '/signup',
              },
              {
                step: '03',
                title: 'Record sales on POS',
                desc: 'Cashiers ring up items with sub-second barcode scans. Split payments across cash, card, and transfers, generate receipts, and keep transacting even during network dropouts.',
                highlight: 'Offline IndexedDB local cache with automatic sync upon reconnect.',
                actionText: 'See POS Simulator',
                route: '#pos-preview',
              },
              {
                step: '04',
                title: 'Monitor performance',
                desc: 'Track live gross profits, revenue velocity, low-inventory alerts, and complete audit trail logs from the centralized executive reporting console.',
                highlight: 'Real-time telemetry and financial visibility across all locations.',
                actionText: 'View Features',
                route: '#features',
              },
            ].map((stepItem, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper
                  sx={{
                    p: 3.5,
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, border-color 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'rgba(139, 92, 246, 0.5)',
                    },
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background:
                          'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2.5,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#34d399' }}>
                        {stepItem.step}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1.5 }}>
                      {stepItem.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3af', lineHeight: 1.6, mb: 2.5 }}>
                      {stepItem.desc}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      pt: 2,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: '#a78bfa', fontWeight: 600, display: 'block', mb: 1.5 }}
                    >
                      {stepItem.highlight}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        if (stepItem.route.startsWith('#')) {
                          const el = document.querySelector(stepItem.route);
                          el?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          navigate(stepItem.route);
                        }
                      }}
                      sx={{
                        color: '#34d399',
                        fontWeight: 700,
                        p: 0,
                        '&:hover': { color: '#10b981', backgroundColor: 'transparent' },
                      }}
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                    >
                      {stepItem.actionText}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          PHASE 3, SECTION 3: CORE FEATURES (VERIFIED FUNCTIONALITY)
          ========================================================================= */}
      <Box
        component="section"
        id="features"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: '#030712',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 5 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#10b981',
                fontWeight: 800,
                letterSpacing: '0.12em',
                display: 'block',
                mb: 1,
              }}
            >
              VERIFIED PLATFORM CAPABILITIES
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
              Everything Your Operations Require
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94a3af', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              Every feature listed below is verified in the active codebase and ready to deploy for
              your multi-location business.
            </Typography>

            {/* Quick Filter Search Input */}
            <Box sx={{ mt: 3, maxWidth: 420, mx: 'auto' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search capabilities (e.g. POS, inventory, barcode, RBAC)..."
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: 3,
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                  },
                }}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            {filteredFeatures.map((f, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card
                  className="glass-panel"
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          display: 'inline-flex',
                        }}
                      >
                        {f.icon}
                      </Box>
                      <Chip
                        label={f.badge}
                        size="small"
                        sx={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(139, 92, 246, 0.15)',
                          color: '#c4b5fd',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 800, color: '#f8fafc', mb: 1, lineHeight: 1.3 }}
                    >
                      {f.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3af', lineHeight: 1.6, mb: 2 }}>
                      {f.desc}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      pt: 1.5,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600 }}>
                      Benefit: {f.benefit}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          PHASE 3, SECTION 4: SHOW THE PRODUCT VISUALLY & INTERACTIVE SIMULATOR
          ========================================================================= */}
      <Box
        component="section"
        id="pos-preview"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: 'rgba(11, 15, 26, 0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 5 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#38bdf8',
                fontWeight: 800,
                letterSpacing: '0.12em',
                display: 'block',
                mb: 1,
              }}
            >
              INTERACTIVE DEMONSTRATION
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
              Experience the Stockora Platform
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94a3af', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              Test our live POS terminal simulator directly below, or switch tabs to explore
              verified workflows from inventory, sales telemetry, and warehouse operations.
            </Typography>

            {/* Workflow Switcher Tabs */}
            <Tabs
              value={workflowTab}
              onChange={(_, val) => setWorkflowTab(val)}
              centered
              sx={{
                mt: 3,
                '& .MuiTab-root': {
                  color: '#9ca3af',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  '&.Mui-selected': { color: '#34d399' },
                },
                '& .MuiTabs-indicator': { backgroundColor: '#10b981', height: 3, borderRadius: 2 },
              }}
            >
              <Tab label="Live POS Terminal Simulator" />
              <Tab label="Inventory Catalog Overview" />
              <Tab label="Sales Telemetry & Margin KPIs" />
              <Tab label="Warehouse & Multi-Branch Flow" />
            </Tabs>
          </Box>

          {/* TAB 0: INTERACTIVE MINI POS PREVIEW TERMINAL */}
          {workflowTab === 0 && (
            <Card
              className="glass-panel"
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: '24px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ReceiptLongIcon sx={{ color: '#10b981', fontSize: 28 }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                    Live Point of Sale Simulator
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label="Active Simulator Terminal #01"
                    color="secondary"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  {cart.length > 0 && (
                    <Button
                      size="small"
                      onClick={clearCart}
                      sx={{ color: '#ef4444', fontSize: '0.75rem' }}
                    >
                      Clear Cart
                    </Button>
                  )}
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Demo Catalog Grid */}
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ color: '#94a3af', mb: 2, fontWeight: 700 }}>
                    CLICK ANY PRODUCT BELOW TO SIMULATE BARCODE SCANNING:
                  </Typography>
                  <Grid container spacing={2}>
                    {demoProducts.map((p) => (
                      <Grid item xs={12} sm={6} key={p.id}>
                        <Card
                          onClick={() => addToCart(p)}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#8b5cf6',
                              transform: 'translateY(-2px)',
                              backgroundColor: 'rgba(139, 92, 246, 0.12)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Chip
                                label={p.category}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: '20px',
                                  backgroundColor: 'rgba(255,255,255,0.08)',
                                  color: '#e2e8f0',
                                }}
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {p.sku}
                                </Typography>
                                <AddShoppingCartIcon sx={{ fontSize: 18, color: '#10b981' }} />
                              </Box>
                            </Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700, color: '#f8fafc' }}
                            >
                              {p.name}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'baseline',
                                mt: 1,
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#34d399' }}>
                                {formatAmount(p.price)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3af' }}>
                                Stock: {p.inStock} units
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Demo Cart & Register Panel */}
                <Grid item xs={12} md={5}>
                  <Paper
                    sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(7, 9, 14, 0.9)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 380,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                          Current Transaction Cart
                        </Typography>
                        <Chip
                          label={`${cart.reduce((a, c) => a + c.qty, 0)} Items`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            fontWeight: 700,
                          }}
                        />
                      </Box>

                      {/* Items list */}
                      <Box
                        sx={{
                          minHeight: '140px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          pr: 0.5,
                          mb: 2,
                        }}
                      >
                        {cart.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                            <Typography variant="body2">
                              Cart is empty. Click a product to add it.
                            </Typography>
                          </Box>
                        ) : (
                          cart.map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                py: 1,
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600, color: '#f8fafc' }}
                                >
                                  {item.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3af' }}>
                                  {formatAmount(item.price)} × {item.qty} ({item.sku})
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 700, color: '#34d399' }}
                                >
                                  {formatAmount(item.price * item.qty)}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => removeFromCart(item.id)}
                                  sx={{ color: '#ef4444' }}
                                  aria-label={`Remove one ${item.name}`}
                                >
                                  <RemoveCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>

                    {/* Receipt Calculation & Actions */}
                    <Box>
                      <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.08)' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#94a3af' }}>
                          Subtotal
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                          {formatAmount(subtotal)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#94a3af' }}>
                          VAT / Sales Tax (7.5%)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                          {formatAmount(tax)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff' }}>
                          Grand Total
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981' }}>
                          {formatAmount(total)}
                        </Typography>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        disabled={cart.length === 0}
                        onClick={handleSimulateCheckout}
                        startIcon={<ShoppingCartCheckoutIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          fontWeight: 800,
                          py: 1.3,
                          borderRadius: '10px',
                          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          },
                        }}
                      >
                        Simulate Checkout & Print Receipt
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Card>
          )}

          {/* TAB 1: INVENTORY & STOCK OVERVIEW */}
          {workflowTab === 1 && (
            <Card
              className="glass-panel"
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: '24px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <InventoryIcon sx={{ color: '#10b981', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                      Real-Time Inventory Catalog
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#94a3af', lineHeight: 1.7, mb: 3 }}>
                    The stock engine coordinates items across multiple branches with automated
                    safety stock thresholds. Receive notifications whenever an item dips below safe
                    levels before it hits zero.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[
                      {
                        sku: 'DRY-0192',
                        name: 'Whole Milk 1L',
                        stock: '142 units',
                        status: 'In Stock',
                        color: '#10b981',
                      },
                      {
                        sku: 'BKY-4821',
                        name: 'Sourdough Bread',
                        stock: '8 units',
                        status: 'Low Stock Alert',
                        color: '#f59e0b',
                      },
                      {
                        sku: 'BEV-8820',
                        name: 'Espresso Coffee 500g',
                        stock: '89 units',
                        status: 'In Stock',
                        color: '#10b981',
                      },
                      {
                        sku: 'PNT-3319',
                        name: 'Organic Honey 250g',
                        stock: '3 units',
                        status: 'Reorder Required',
                        color: '#ef4444',
                      },
                    ].map((row, idx) => (
                      <Paper
                        key={idx}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            SKU: {row.sku}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                            {row.stock}
                          </Typography>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              height: 18,
                              backgroundColor: `${row.color}15`,
                              color: row.color,
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                      height: 340,
                    }}
                  >
                    <img
                      src={ENTERPRISE_IMAGERY.warehouseLogistics.src}
                      alt={ENTERPRISE_IMAGERY.warehouseLogistics.alt}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}

          {/* TAB 2: SALES TELEMETRY & MARGIN KPIS */}
          {workflowTab === 2 && (
            <Card
              className="glass-panel"
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: '24px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <SignalCellularAltIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                      Executive Performance Telemetry
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#94a3af', lineHeight: 1.7, mb: 3 }}>
                    Know your gross profit margins, daily register turnover, and top-moving product
                    categories at a glance without waiting for end-of-quarter financial audits.
                  </Typography>

                  <Grid container spacing={2}>
                    {[
                      {
                        label: "Today's Gross Sales",
                        val: '$4,892.40',
                        sub: '+18.2% vs yesterday',
                        color: '#10b981',
                      },
                      {
                        label: 'Avg Margin %',
                        val: '38.4%',
                        sub: 'Healthy target range',
                        color: '#38bdf8',
                      },
                      {
                        label: 'Active Terminals',
                        val: '6 Terminals',
                        sub: 'Zero latency detected',
                        color: '#a78bfa',
                      },
                      {
                        label: 'Stockout Risk Items',
                        val: '2 SKUs',
                        sub: 'Automated reorders drafted',
                        color: '#f59e0b',
                      },
                    ].map((kpi, idx) => (
                      <Grid item xs={6} key={idx}>
                        <Paper
                          sx={{
                            p: 2,
                            backgroundColor: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#94a3af', fontWeight: 600 }}>
                            {kpi.label}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 800, color: kpi.color, my: 0.5 }}
                          >
                            {kpi.val}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: '#64748b', fontSize: '0.7rem' }}
                          >
                            {kpi.sub}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                      height: 340,
                    }}
                  >
                    <img
                      src={ENTERPRISE_IMAGERY.dashboardHero.src}
                      alt={ENTERPRISE_IMAGERY.dashboardHero.alt}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}

          {/* TAB 3: WAREHOUSE & MULTI-BRANCH LOGISTICS */}
          {workflowTab === 3 && (
            <Card
              className="glass-panel"
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: '24px',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <BusinessIcon sx={{ color: '#a855f7', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                      Multi-Branch & Warehouse Governance
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#94a3af', lineHeight: 1.7, mb: 3 }}>
                    Coordinate physical store branches and warehouse hubs with inter-location stock
                    transfer orders. Track dispatch status, receiving verification, and branch-level
                    inventory value seamlessly.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[
                      {
                        step: 'Branch Stock Request',
                        detail: 'Store #2 requests 50 units of Whole Milk 1L',
                      },
                      {
                        step: 'Central Hub Dispatch',
                        detail: 'Warehouse verifies picking & generates transfer manifest',
                      },
                      {
                        step: 'Receiving Scan Verification',
                        detail: 'Store manager scans barcodes upon delivery to intake stock',
                      },
                    ].map((step, idx) => (
                      <Paper
                        key={idx}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(168, 85, 247, 0.2)',
                            color: '#c084fc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                            {step.step}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3af' }}>
                            {step.detail}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                      height: 340,
                    }}
                  >
                    <img
                      src={ENTERPRISE_IMAGERY.teamOperations.src}
                      alt={ENTERPRISE_IMAGERY.teamOperations.alt}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}
        </Container>
      </Box>

      {/* Simulated Checkout Receipt Dialog */}
      <Dialog
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#07090e',
            color: '#f8fafc',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '16px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 2, pb: 1 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1,
            }}
          >
            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Transaction Successful!
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3af' }}>
            Receipt #{receiptNumber} · {new Date().toLocaleDateString()}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}
            >
              Itemized Receipt Line Items:
            </Typography>
            {cart.map((item) => (
              <Box
                key={item.id}
                sx={{ display: 'flex', justifyContent: 'space-between', my: 0.75 }}
              >
                <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                  {item.name} × {item.qty}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {formatAmount(item.price * item.qty)}
                </Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#94a3af' }}>
              Subtotal:
            </Typography>
            <Typography variant="body2" sx={{ color: '#f8fafc' }}>
              {formatAmount(subtotal)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#94a3af' }}>
              Sales Tax (7.5%):
            </Typography>
            <Typography variant="body2" sx={{ color: '#f8fafc' }}>
              {formatAmount(tax)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff' }}>
              Amount Tendered:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#10b981' }}>
              {formatAmount(total)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setCheckoutModalOpen(false)}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
              fontWeight: 800,
              borderRadius: '8px',
            }}
          >
            Close Receipt & Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================================================================
          PHASE 3, SECTION 5: WHO STOCKORA IS FOR
          ========================================================================= */}
      <Box
        component="section"
        id="who-its-for"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: '#030712',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#8b5cf6',
                fontWeight: 800,
                letterSpacing: '0.12em',
                display: 'block',
                mb: 1,
              }}
            >
              TAILORED SOLUTIONS
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
              Built for High-Volume Operating Environments
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94a3af', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              Stockora Enterprise Pro is designed for commercial operators where fast checkout and
              stock precision directly drive revenue and customer satisfaction.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                title: 'Multi-Location Retail Stores',
                tag: 'Apparel, Specialty, Electronics',
                img: ENTERPRISE_IMAGERY.retailCustomer.src,
                alt: ENTERPRISE_IMAGERY.retailCustomer.alt,
                desc: 'Keep master product catalogs, pricing tiers, and inventory synchronized across all branch storefronts with unified register policies.',
              },
              {
                title: 'Wholesale & Logistics Warehouses',
                tag: 'Distribution & B2B Storage',
                img: ENTERPRISE_IMAGERY.warehouseLogistics.src,
                alt: ENTERPRISE_IMAGERY.warehouseLogistics.alt,
                desc: 'Manage pallet receiving, warehouse bay tracking, inter-branch replenishment transfers, and vendor purchase orders.',
              },
              {
                title: 'Supermarkets & High-Traffic Stores',
                tag: 'Grocery & Convenience Outlets',
                img: ENTERPRISE_IMAGERY.teamOperations.src,
                alt: ENTERPRISE_IMAGERY.teamOperations.alt,
                desc: 'Execute rapid barcode lookup, multi-tender split payments, cash drawer reconciliation shifts, and offline checkout continuity.',
              },
              {
                title: 'Multi-Entity Enterprise Franchises',
                tag: 'Corporate & Regional Holdings',
                img: ENTERPRISE_IMAGERY.dashboardHero.src,
                alt: ENTERPRISE_IMAGERY.dashboardHero.alt,
                desc: 'Oversee multiple legal business subsidiaries under one executive login while enforcing strict role boundaries per branch.',
              },
            ].map((persona, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  className="glass-panel"
                  sx={{
                    height: '100%',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ height: 160, overflow: 'hidden' }}>
                      <img
                        src={persona.img}
                        alt={persona.alt}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                        }}
                        loading="lazy"
                      />
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                      <Chip
                        label={persona.tag}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          backgroundColor: 'rgba(139, 92, 246, 0.15)',
                          color: '#c4b5fd',
                          fontWeight: 700,
                          mb: 1.5,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, color: '#f8fafc', mb: 1, fontSize: '1rem' }}
                      >
                        {persona.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3af', lineHeight: 1.6 }}>
                        {persona.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          PHASE 3, SECTION 6: SECURITY AND COMPANY DATA
          ========================================================================= */}
      <Box
        component="section"
        id="security"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: 'rgba(11, 15, 26, 0.5)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#10b981',
                fontWeight: 800,
                letterSpacing: '0.12em',
                display: 'block',
                mb: 1,
              }}
            >
              DATA INTEGRITY & PRIVACY
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
              Enterprise Security & Tenant Isolation
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94a3af', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              Stockora enforces strict architectural controls to ensure your commercial records
              remain confidential, audit-logged, and isolated from other companies.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                icon: <SecurityIcon sx={{ fontSize: 32, color: '#10b981' }} />,
                title: 'Strict Multi-Tenant Isolation',
                desc: 'Every database query and inventory operation is strictly scoped by company tenant ID, ensuring zero data leakage between different businesses.',
              },
              {
                icon: <ShieldOutlinedIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />,
                title: 'Granular Role-Based Access Control',
                desc: 'Principle of least privilege is enforced on every endpoint. Cashiers can only access checkout terminals; financial summaries are reserved for owners.',
              },
              {
                icon: <LockOutlinedIcon sx={{ fontSize: 32, color: '#38bdf8' }} />,
                title: 'Cryptographic Session Security',
                desc: 'Industry-standard JWT tokens with secure cookie refresh handling and Bcrypt password hashing protect user accounts and prevent token tampering.',
              },
              {
                icon: <ReceiptLongIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
                title: 'Immutable Audit Logging',
                desc: 'Critical inventory adjustments, price modifications, and cashier register sessions are logged with user IDs, timestamps, and reason codes.',
              },
            ].map((sec, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                  }}
                >
                  <Box sx={{ mb: 2 }}>{sec.icon}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                    {sec.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3af', lineHeight: 1.6 }}>
                    {sec.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================================================================
          PHASE 3, SECTION 7: PRICING & CONVERSION SECTION
          ========================================================================= */}
      <Box
        component="section"
        id="pricing"
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: '#030712',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#8b5cf6',
                fontWeight: 800,
                letterSpacing: '0.12em',
                display: 'block',
                mb: 1,
              }}
            >
              TRANSPARENT PRICING
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
              Scalable Plans for Every Growth Stage
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: '#94a3af', fontSize: '1.05rem', lineHeight: 1.7 }}
            >
              Predictable monthly pricing with no surprise transaction fees. Upgrade as your
              storefront footprint expands.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 8 }}>
            {[
              {
                title: 'Starter',
                price: '$49',
                desc: 'Ideal for single-store retail merchants and independent shop owners.',
                features: [
                  '1 Active POS Register Terminal',
                  'Up to 1,000 Product SKUs',
                  'Offline Sync Mode with IndexedDB',
                  'Essential Daily Sales Reports',
                  'Basic Barcode Lookup Support',
                ],
                buttonText: 'Start Free Trial',
                highlight: false,
              },
              {
                title: 'Growth Enterprise',
                price: '$149',
                desc: 'Designed for expanding businesses with multiple branches or warehouse hubs.',
                features: [
                  '5 Active POS Register Terminals',
                  'Unlimited Master Product SKUs',
                  'Multi-Warehouse Inventory Transfers',
                  'Granular Role-Based Permissions (RBAC)',
                  'Customer CRM & Loyalty Points',
                  'Real-Time Gross Margin Telemetry',
                ],
                buttonText: 'Get Started Now',
                highlight: true,
              },
              {
                title: 'Custom Enterprise',
                price: 'Custom',
                desc: 'Tailored for large regional retail chains, franchises, and logistics distributors.',
                features: [
                  'Unlimited POS Register Terminals',
                  'Multi-Company Subsidiary Governance',
                  'Custom ERP & Ledger Connectors',
                  'Dedicated Priority Account Support',
                  'Custom Audit Log Export Formats',
                ],
                buttonText: 'Contact Enterprise Sales',
                highlight: false,
              },
            ].map((plan, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card
                  className="glass-panel"
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '20px',
                    borderColor: plan.highlight ? '#8b5cf6 !important' : 'rgba(255,255,255,0.08)',
                    boxShadow: plan.highlight
                      ? '0 12px 40px rgba(139, 92, 246, 0.35) !important'
                      : 'none',
                    position: 'relative',
                  }}
                >
                  {plan.highlight && (
                    <Chip
                      label="MOST POPULAR"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                      }}
                    />
                  )}

                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mb: 1 }}>
                      {plan.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 900, color: plan.highlight ? '#34d399' : '#ffffff', mb: 1 }}
                    >
                      {plan.price}
                      {plan.price !== 'Custom' && (
                        <Typography component="span" variant="body2" sx={{ color: '#9ca3af' }}>
                          /month
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
                      {plan.desc}
                    </Typography>
                    <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                    <Box sx={{ mb: 4 }}>
                      {plan.features.map((feat, fIdx) => (
                        <Box
                          key={fIdx}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}
                        >
                          <CheckCircleIcon
                            sx={{ color: plan.highlight ? '#34d399' : '#8b5cf6', fontSize: 18 }}
                          />
                          <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                            {feat}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant={plan.highlight ? 'contained' : 'outlined'}
                    onClick={() => navigate('/signup')}
                    sx={{
                      py: 1.4,
                      fontWeight: 800,
                      borderRadius: '12px',
                      background: plan.highlight
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)'
                        : 'transparent',
                    }}
                  >
                    {plan.buttonText}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* High-Impact Final Conversion Callout */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: '24px',
              background:
                'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#f8fafc', mb: 2 }}>
              Ready to Run Your Business Smarter?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#cbd5e1',
                maxWidth: 680,
                mx: 'auto',
                mb: 4,
                fontSize: '1.1rem',
                lineHeight: 1.7,
              }}
            >
              Join retail and warehouse leaders using Stockora Enterprise Pro to take complete
              control of their inventory, accelerate POS checkouts, and protect their margins.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  borderRadius: '12px',
                  px: 4.5,
                  py: 1.6,
                  boxShadow: '0 8px 30px rgba(139, 92, 246, 0.45)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(139, 92, 246, 0.65)',
                  },
                }}
              >
                Get Started Now
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.6,
                  '&:hover': {
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  },
                }}
              >
                Sign In to Terminal
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* =========================================================================
          PHASE 3, SECTION 8: CLEAN, ORGANIZED FOOTER
          ========================================================================= */}
      <Box
        component="footer"
        sx={{
          py: 8,
          backgroundColor: '#030712',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
        role="contentinfo"
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* Brand identity column */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 0.5,
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="Stockora Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                  Stockora{' '}
                  <Typography component="span" variant="inherit" sx={{ color: '#10b981' }}>
                    Enterprise
                  </Typography>
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: '#9ca3af', lineHeight: 1.6, mb: 3, maxWidth: 300 }}
              >
                Mission-critical inventory management, point-of-sale, and multi-branch operations
                platform for modern commerce leaders.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                  }}
                />
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700 }}>
                  All Systems Operational
                </Typography>
              </Box>
            </Grid>

            {/* Core Solutions column */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
                Solutions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Button
                  href="#pos-preview"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Point of Sale (POS)
                </Button>
                <Button
                  href="#features"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Multi-Warehouse
                </Button>
                <Button
                  href="#features"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Catalog & SKUs
                </Button>
                <Button
                  href="#who-its-for"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Branch Logistics
                </Button>
              </Box>
            </Grid>

            {/* Platform links */}
            <Grid item xs={6} sm={3} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
                Platform
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Button
                  href="#how-it-works"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  How It Works
                </Button>
                <Button
                  href="#pos-preview"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Live Simulator
                </Button>
                <Button
                  href="#security"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Security & Multi-Tenancy
                </Button>
                <Button
                  href="#pricing"
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Pricing Plans
                </Button>
              </Box>
            </Grid>

            {/* Authentication & Account column */}
            <Grid item xs={6} sm={3} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
                Account & Access
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Button
                  onClick={() => navigate('/login')}
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Sign In to Account
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Register Company
                </Button>
                <Button
                  onClick={() => navigate('/forgot-password')}
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#9ca3af', fontSize: '0.85rem' }}
                >
                  Reset Password
                </Button>
                <Button
                  onClick={() => navigate('/pos')}
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    color: '#10b981',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  Direct POS Terminal
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 3 }} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              © {new Date().getFullYear()} Stockora Enterprise Inc. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Offline Sync Active
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Strict Multi-Tenant Isolation
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Role-Based Access Control
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
