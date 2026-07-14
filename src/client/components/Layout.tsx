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
import { useAuthStore } from '../store/auth.ts';

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearSession } = useAuthStore();

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
    { text: 'Inventory Catalog', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'My Profile', icon: <AccountCircleIcon />, path: '/profile' },
  ];

  const isAdmin = user?.roleName === 'Company Owner' || user?.roleName === 'Super Administrator';
  const adminItems = [
    { text: 'Company Settings', icon: <BusinessIcon />, path: '/company' },
    { text: 'Branches List', icon: <BranchIcon />, path: '/branches' },
    { text: 'Master Data', icon: <SettingsIcon />, path: '/master-data' },
  ];

  const drawerContent = (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}
    >
      {/* Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src="/logo.png"
          sx={{
            bgcolor: 'primary.main',
            width: 38,
            height: 38,
            boxShadow: '0 4px 10px rgba(139, 92, 246, 0.4)',
          }}
        />
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.2 }}
          >
            STOCKORA
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Enterprise v1.0
          </Typography>
        </Box>
      </Box>
      <Divider />

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: isActive ? 'primary.light' : 'text.secondary',
                    border: isActive ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      color: 'text.primary',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ color: isActive ? 'primary.light' : 'text.secondary', minWidth: 40 }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.925rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          {isAdmin && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                ADMINISTRATION
              </Typography>
              {adminItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        color: isActive ? 'primary.light' : 'text.secondary',
                        border: isActive ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                          color: 'text.primary',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{ color: isActive ? 'primary.light' : 'text.secondary', minWidth: 40 }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.925rem',
                          fontWeight: isActive ? 600 : 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
              sx={{
                borderRadius: 2,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                  color: 'error.light',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Sign Out"
                primaryTypographyProps={{
                  fontSize: '0.925rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Divider />
      {/* Footer Profile */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={user?.avatarUrl || undefined}
          sx={{ cursor: 'pointer', bgcolor: 'secondary.main', color: 'secondary.contrastText' }}
          onClick={() => navigate('/profile')}
        >
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden', cursor: 'pointer', flexGrow: 1 }} onClick={() => navigate('/profile')}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {user?.username || 'Guest User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        className="glass-panel"
        sx={{
          zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
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
              <BranchIcon sx={{ color: 'primary.light' }} />
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ fontWeight: 700, fontSize: '1.1rem' }}
              >
                Main Branch (HQ)
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            {/* System Status Indicators */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
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
                  <OnlineIcon sx={{ color: isOnline ? 'secondary.main' : 'error.main' }} />
                </Badge>
              </Tooltip>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Typography>
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />

            {/* Notification Badge */}
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                display: { xs: 'none', md: 'block' },
              }}
            >
              Shift: 08:00 - 16:00
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
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
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
          p: { xs: 2.5, sm: 4 },
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
    </Box>
  );
}
