import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  Chip,
} from '@mui/material';
import type { Theme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PosIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import OnlineIcon from '@mui/icons-material/SignalCellularAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import BranchIcon from '@mui/icons-material/Storefront';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessIcon from '@mui/icons-material/Business';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import AdjustIcon from '@mui/icons-material/Adjust';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import PaymentsIcon from '@mui/icons-material/Payments';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import UsbIcon from '@mui/icons-material/Usb';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useAuthStore } from '../store/auth.ts';
import { apiClient } from '../api/client.ts';
import QuickSearchModal from './QuickSearchModal.tsx';
import SearchIcon from '@mui/icons-material/Search';

const drawerWidth = 260;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, setUser, clearSession } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (accessToken && !user) {
        try {
          const { data } = await apiClient.get('/users/profile');
          setUser(data);
        } catch {
          clearSession();
          navigate('/login');
        }
      }
    };
    fetchUserProfile();
  }, [accessToken, user, setUser, clearSession, navigate]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'POS Terminal', icon: <PosIcon />, path: '/pos' },
    { text: 'Products Catalog', icon: <CategoryIcon />, path: '/products' },
    { text: 'Inventory Catalog', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Stock Adjustments', icon: <AdjustIcon />, path: '/adjustments' },
    { text: 'Warehouse Transfers', icon: <SwapHorizIcon />, path: '/transfers' },
    { text: 'Purchase Orders', icon: <ShoppingCartIcon />, path: '/purchase-orders' },
    { text: 'Receiving AP', icon: <ReceiptIcon />, path: '/receiving' },
    { text: 'Sales Orders', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: 'Sales Returns & RMAs', icon: <AssignmentReturnIcon />, path: '/returns' },
    { text: 'Marketing & Loyalty', icon: <LoyaltyIcon />, path: '/marketing' },
    { text: 'Communication Center', icon: <NotificationsActiveIcon />, path: '/communication' },
    { text: 'Financial Reports', icon: <PaymentsIcon />, path: '/finance' },
    { text: 'AI Assistant & Forecasts', icon: <AutoAwesomeIcon />, path: '/ai-assistant' },
    { text: 'My Profile', icon: <AccountCircleIcon />, path: '/profile' },
  ];

  const isAdmin = user?.roleName === 'Company Owner' || user?.roleName === 'Super Administrator';
  const adminItems = [
    { text: 'Company Settings', icon: <BusinessIcon />, path: '/company' },
    { text: 'Branches List', icon: <BranchIcon />, path: '/branches' },
    { text: 'Currency & Tax Settings', icon: <PaymentsIcon />, path: '/currency' },
    { text: 'Hardware Terminals', icon: <UsbIcon />, path: '/hardware' },
    { text: 'Integrations & ERP', icon: <CloudQueueIcon />, path: '/integrations' },
    { text: '3D Warehouse Visualizer', icon: <WarehouseIcon />, path: '/warehouse-visualizer' },
    { text: 'Master Data', icon: <SettingsIcon />, path: '/master-data' },
    { text: 'Suppliers Directory', icon: <LocalShippingIcon />, path: '/suppliers' },
    { text: 'Customers Directory', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Scheduler Monitor', icon: <QueryBuilderIcon />, path: '/scheduler' },
    { text: 'Admin Console', icon: <AdminPanelSettingsIcon />, path: '/console' },
  ];

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0a0d16',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.04) 0px, transparent 50%)',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src="/logo.png"
          sx={{
            bgcolor: 'primary.main',
            width: 40,
            height: 40,
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              className="gradient-text"
              sx={{ fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.1 }}
            >
              STOCKORA
            </Typography>
            <Chip
              label="PRO MAX"
              size="small"
              sx={{
                height: 16,
                fontSize: '0.55rem',
                fontWeight: 900,
                color: '#fff',
                background: 'linear-gradient(90deg, #c084fc 0%, #6366f1 100%)',
                border: 'none',
                borderRadius: '4px',
                px: 0.5,
                '& .MuiChip-label': { px: 0.5 },
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.02em' }}>
            ENTERPRISE PLATFORM
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  className={isActive ? 'premium-sidebar-item active' : 'premium-sidebar-item'}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '8px',
                    color: isActive ? '#ffffff' : 'text.secondary',
                    bgcolor: isActive ? 'rgba(139, 92, 246, 0.08) !important' : 'transparent',
                    borderLeft: isActive ? '3px solid #8b5cf6' : '3px solid transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      color: '#ffffff',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ color: isActive ? 'primary.light' : 'text.secondary', minWidth: 38 }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '0.01em',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          {isAdmin && (
            <>
              <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.03)' }} />
              <Typography variant="caption" sx={{ px: 2.5, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.08em', display: 'block', mb: 1, fontSize: '0.68rem' }}>
                ADMINISTRATION
              </Typography>
              {adminItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      className={isActive ? 'premium-sidebar-item active' : 'premium-sidebar-item'}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: '8px',
                        color: isActive ? '#ffffff' : 'text.secondary',
                        bgcolor: isActive ? 'rgba(139, 92, 246, 0.08) !important' : 'transparent',
                        borderLeft: isActive ? '3px solid #8b5cf6' : '3px solid transparent',
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          color: '#ffffff',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{ color: isActive ? 'primary.light' : 'text.secondary', minWidth: 38 }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 700 : 500,
                          letterSpacing: '0.01em',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </>
          )}

          <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.03)' }} />
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
              sx={{
                borderRadius: '8px',
                color: 'error.light',
                mx: '8px',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.06)',
                  color: 'error.main',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Sign Out"
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
      {/* Footer Profile */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.1)' }}>
        <Avatar
          src={user?.avatarUrl || undefined}
          sx={{
            cursor: 'pointer',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.25)',
            border: '2px solid rgba(139, 92, 246, 0.3)',
          }}
          onClick={() => navigate('/profile')}
        >
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden', cursor: 'pointer', flexGrow: 1 }} onClick={() => navigate('/profile')}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: '0.825rem' }}>
            {user?.username || 'Guest User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.7rem' }}>
            {user?.roleName || 'Employee'}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => navigate('/profile')}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#07090e' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        className="glass-panel"
        sx={{
          zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
          boxShadow: 'none',
          background: 'rgba(7, 9, 14, 0.75) !important',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05) !important',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BranchIcon sx={{ color: 'primary.light', fontSize: '1.25rem' }} />
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.01em' }}
              >
                HQ Division (Toronto)
              </Typography>
            </Box>
          </Box>

          {/* Quick Search Jump Bar */}
          <Chip
            icon={<SearchIcon style={{ color: '#8b5cf6', fontSize: 16 }} />}
            label="Search modules... (Ctrl+K)"
            onClick={() => setSearchOpen(true)}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: '#9ca3af',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontWeight: 600,
              fontSize: '0.78rem',
              px: 1,
              py: 1.8,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
                color: '#ffffff',
              },
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            {/* System Status Indicators */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5 }}>
              <Tooltip
                title={
                  isOnline ? 'System Online (Vite/Server Connection Stable)' : 'Offline Mode Active'
                }
              >
                <Badge
                  variant="dot"
                  color={isOnline ? 'success' : 'error'}
                  sx={{
                    '& .MuiBadge-badge': {
                      animation: isOnline ? 'ripple 1.2s infinite ease-in-out' : 'none',
                    },
                    '@keyframes ripple': {
                      '0%': { transform: 'scale(.8)', opacity: 1 },
                      '100%': { transform: 'scale(2.4)', opacity: 0 },
                    },
                  }}
                >
                  <OnlineIcon sx={{ color: isOnline ? 'secondary.main' : 'error.main', fontSize: '1.15rem' }} />
                </Badge>
              </Tooltip>
              <Typography variant="caption" sx={{ color: isOnline ? 'secondary.light' : 'error.light', fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Typography>
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' }, borderColor: 'rgba(255,255,255,0.06)' }}
            />

            {/* Shift/Operational Info */}
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: { xs: 'none', md: 'block' },
                bgcolor: 'rgba(255,255,255,0.02)',
                px: 1.5,
                py: 0.5,
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              SHIFT: 08:00 - 16:00
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawers */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.04)',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, sm: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          overflowY: 'auto',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Box className="animate-fade-in">
          <Outlet />
        </Box>
      </Box>

      {/* Global Quick Jump Modal */}
      <QuickSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}
