import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Chip } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CloseIcon from '@mui/icons-material/Close';
import { subscribeInstallable, promptPWAInstall } from '../registerServiceWorker.ts';

export const PWAInstallBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in session storage
    if (sessionStorage.getItem('stockora_pwa_dismissed') === 'true') {
      setIsDismissed(true);
      return;
    }

    const unsubscribe = subscribeInstallable((installable) => {
      setCanInstall(installable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleInstall = async () => {
    const outcome = await promptPWAInstall();
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setCanInstall(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('stockora_pwa_dismissed', 'true');
  };

  if (!canInstall || isDismissed) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: { xs: 16, sm: 24 },
        zIndex: 1300,
        maxWidth: 420,
        width: 'calc(100% - 32px)',
        p: 2,
        borderRadius: '16px',
        bgcolor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          bgcolor: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <InstallMobileIcon sx={{ color: '#a78bfa', fontSize: 24 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            Install Stockora Pro
          </Typography>
          <Chip
            label="OFFLINE POS"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.625rem',
              fontWeight: 800,
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.3 }}>
          Add to desktop or home screen for faster checkout & offline sync.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleInstall}
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'none',
            borderRadius: '8px',
            px: 1.75,
            py: 0.6,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
          }}
        >
          Install
        </Button>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{ color: '#64748b', '&:hover': { color: '#cbd5e1' } }}
          aria-label="Dismiss install prompt"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default PWAInstallBanner;
