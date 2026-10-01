import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.ts';
import { useTenantStore } from '../../store/tenant.ts';
import { apiClient } from '../../api/client.ts';

export interface SignOutCardProps {
  /** If rendered inside a modal/dialog or as a standalone card */
  variant?: 'modal' | 'standalone';
  /** Callback to close dialog or cancel sign out */
  onClose?: () => void;
}

export const SignOutCard: React.FC<SignOutCardProps> = ({ variant = 'standalone', onClose }) => {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      const refreshToken = localStorage.getItem('stockora_refresh_token');
      // Revoke the server session and refresh token securely
      await apiClient.post('/auth/logout', { refreshToken }, {
        _skipGlobalErrorToast: true,
      } as any);
    } catch {
      // Even if network or server error occurs, safely wipe local authentication state
    } finally {
      clearSession();
      // Clear tenant selection cache if present
      localStorage.removeItem('stockora_active_tenant_id');
      localStorage.removeItem('stockora_active_tenant_slug');
      setIsSigningOut(false);
      toast.success('Signed out of Stockora Enterprise Pro successfully.');
      if (onClose) {
        onClose();
      }
      navigate('/login');
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      // Return to dashboard or previous view
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  const isModal = variant === 'modal';

  return (
    <Card
      role="region"
      aria-label="Sign Out Confirmation"
      sx={{
        width: '100%',
        maxWidth: isModal ? 480 : 460,
        mx: 'auto',
        background:
          'linear-gradient(135deg, rgba(20, 24, 39, 0.95) 0%, rgba(10, 13, 24, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(239, 68, 68, 0.22)',
        borderRadius: { xs: 3, sm: 4 },
        boxShadow: isModal
          ? '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.08)'
          : '0 24px 60px rgba(0, 0, 0, 0.55), 0 0 32px rgba(239, 68, 68, 0.06)',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #8b5cf6 100%)',
          zIndex: 2,
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2.75, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2.5, sm: 3 },
        }}
      >
        {/* Header / Brand identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src="/logo.png"
              alt="Stockora Logo"
              sx={{
                width: 38,
                height: 38,
                bgcolor: 'primary.main',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    lineHeight: 1.1,
                    background: 'linear-gradient(90deg, #ffffff 0%, #c4b5fd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: '"Outfit", sans-serif',
                  }}
                >
                  STOCKORA
                </Typography>
                <Chip
                  label="PRO"
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '4px',
                    px: 0.25,
                    '& .MuiChip-label': { px: 0.5 },
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                ENTERPRISE SECURITY
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<ShieldOutlinedIcon sx={{ fontSize: '13px !important', color: '#ef4444' }} />}
            label="SESSION TERMINATION"
            size="small"
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              borderWidth: 1,
              borderStyle: 'solid',
              color: '#fca5a5',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              height: 22,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>

        {/* Heading & description */}
        <Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#f9fafb',
              fontSize: { xs: '1.25rem', sm: '1.45rem' },
              letterSpacing: '-0.015em',
              mb: 0.75,
            }}
          >
            Sign Out of Account
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#9ca3af',
              fontSize: { xs: '0.825rem', sm: '0.875rem' },
              lineHeight: 1.55,
            }}
          >
            Are you sure you want to sign out? Your active enterprise session and security tokens
            will be safely invalidated.
          </Typography>
        </Box>

        {/* Current User & Organization Context Banner */}
        {user ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              backgroundColor: 'rgba(15, 21, 36, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={user.avatarUrl || undefined}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: 'primary.dark',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.9rem' }}
                  >
                    {user.username}
                  </Typography>
                  <Chip
                    label={user.roleName || 'Member'}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      color: '#c4b5fd',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  noWrap
                  display="block"
                  sx={{ color: '#9ca3af', fontSize: '0.75rem', mt: 0.25 }}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>

            {activeTenant?.name && (
              <>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessRoundedIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: '#d1d5db', fontWeight: 600, fontSize: '0.76rem' }}
                  >
                    Organization:{' '}
                    <Box component="span" sx={{ color: '#34d399', fontWeight: 700 }}>
                      {activeTenant.name}
                    </Box>
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              backgroundColor: 'rgba(15, 21, 36, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <PersonOutlineRoundedIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              No active session profile found. Continuing will return to the sign-in screen.
            </Typography>
          </Box>
        )}

        {/* Security & Consequence Notice */}
        <Box
          sx={{
            p: 1.75,
            borderRadius: 2,
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#fca5a5',
              fontWeight: 600,
              fontSize: '0.75rem',
              lineHeight: 1.5,
              display: 'block',
            }}
          >
            Note: All active POS registers, real-time alert listeners, and cached tenant keys will
            be closed. Unsaved terminal transactions should be completed before proceeding.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: { xs: 1.5, sm: 2 },
            mt: 0.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isSigningOut}
            startIcon={<ArrowBackRoundedIcon />}
            fullWidth
            sx={{
              py: 1.4,
              borderRadius: 2.5,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: '#e5e7eb',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.25)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Stay Signed In
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmSignOut}
            disabled={isSigningOut}
            startIcon={
              isSigningOut ? (
                <CircularProgress size={18} sx={{ color: '#ffffff' }} />
              ) : (
                <LogoutRoundedIcon />
              )
            }
            fullWidth
            sx={{
              py: 1.4,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.35)',
              color: '#ffffff',
              transition: 'all 0.25s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                boxShadow: '0 6px 22px rgba(239, 68, 68, 0.5)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                background: 'rgba(239, 68, 68, 0.4)',
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SignOutCard;
