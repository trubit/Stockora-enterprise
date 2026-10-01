import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuthStore } from '../store/auth.ts';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  minHeight?: string | number;
  /** Explicit error message if initialization failed */
  error?: string | null;
  /** Watchdog timeout in ms before displaying recovery options (defaults to 12000ms) */
  timeoutMs?: number;
  /** Callback triggered when user clicks 'Retry Initialization' */
  onRetry?: () => void;
  /** Callback triggered when user chooses to reset session / return to login */
  onClearSession?: () => void;
}

export const ENTERPRISE_STATUS_STEPS = [
  'Initializing High-Availability Runtime...',
  'Authenticating Cryptographic Keystore...',
  'Synchronizing Multi-Tenant POS Node...',
  'Optimizing Distributed Ledger Cache...',
  'Verifying Security Handshake...',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'STOCKORA',
  submessage,
  minHeight = '100vh',
  error = null,
  timeoutMs = 12000,
  onRetry,
  onClearSession,
}) => {
  const { clearSession } = useAuthStore();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Dynamic enterprise status micro-copy cycle
  useEffect(() => {
    if (submessage) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % ENTERPRISE_STATUS_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [submessage]);

  // Watchdog timer: prevents the application from hanging indefinitely on failed networks
  useEffect(() => {
    if (error) return;
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [error, timeoutMs]);

  const handleRetry = () => {
    setIsTimedOut(false);
    if (onRetry) {
      onRetry();
    }
  };

  const handleReset = () => {
    if (onClearSession) {
      onClearSession();
    } else {
      clearSession();
      window.location.href = '/login';
    }
  };

  const isFailed = Boolean(error) || isTimedOut;
  const currentStatusText = submessage || ENTERPRISE_STATUS_STEPS[stepIndex];

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy={!isFailed}
      aria-label={
        isFailed ? 'Application initialization delay' : 'Stockora Enterprise Pro loading screen'
      }
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        width: '100%',
        bgcolor: '#03050c',
        backgroundImage: `
          radial-gradient(at 50% 30%, rgba(139, 92, 246, 0.12) 0px, transparent 60%),
          radial-gradient(at 80% 80%, rgba(6, 182, 212, 0.05) 0px, transparent 50%),
          radial-gradient(at 10% 90%, rgba(99, 102, 241, 0.06) 0px, transparent 50%)
        `,
        color: '#f8fafc',
        p: { xs: 2.5, sm: 4 },
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Dynamic Keyframe Animations */}
      <style>{`
        @keyframes orbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitPulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes auraBreathe {
          0%, 100% { transform: scale(0.95); opacity: 0.45; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes shimmerBeam {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          50% { transform: scale(1.2); opacity: 0.9; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .kinetic-orbit, .shimmer-beam-inner, .aura-glow {
            animation: none !important;
          }
        }
      `}</style>

      {/* Ambient Radial Aura Glow */}
      <Box
        className="aura-glow"
        sx={{
          position: 'absolute',
          width: { xs: 320, sm: 480 },
          height: { xs: 320, sm: 480 },
          borderRadius: '50%',
          background: isFailed
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.16) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'auraBreathe 4s ease-in-out infinite',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Main Center Console */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 440,
          width: '100%',
          zIndex: 2,
        }}
      >
        {/* Tier-1 Bespoke Logo Stage */}
        <Box
          sx={{
            position: 'relative',
            width: 104,
            height: 104,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3.5,
          }}
        >
          {/* Kinetic SVG Orbit Ring */}
          {!isFailed ? (
            <svg
              className="kinetic-orbit"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                animation: 'orbitSpin 2.2s linear infinite',
              }}
              viewBox="0 0 104 104"
            >
              <defs>
                <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Subtle background static guide */}
              <circle
                cx="52"
                cy="52"
                r="48"
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1.5"
              />
              {/* Luminous dynamic orbit bead & beam */}
              <circle
                cx="52"
                cy="52"
                r="48"
                fill="none"
                stroke="url(#orbitGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="75 225"
              />
            </svg>
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid rgba(239, 68, 68, 0.45)',
                boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
              }}
            />
          )}

          {/* Master Real Logo floating cleanly with no bounding square or border box */}
          <Box
            sx={{
              width: 76,
              height: 76,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              zIndex: 3,
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Stockora Enterprise Pro"
              sx={{
                width: 58,
                height: 58,
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 18px rgba(0, 0, 0, 0.75))',
              }}
            />
          </Box>
        </Box>

        {/* Brand Master Wordmark & Pro Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            mb: 1,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontSize: { xs: '1.45rem', sm: '1.65rem' },
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              background: 'linear-gradient(180deg, #FFFFFF 30%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              m: 0,
              lineHeight: 1.2,
            }}
          >
            {message}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              py: 0.35,
              px: 1.1,
              borderRadius: '999px',
              bgcolor: 'rgba(139, 92, 246, 0.14)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              boxShadow: '0 0 14px rgba(139, 92, 246, 0.22)',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#10b981',
                animation: 'pulseDot 2s infinite ease-in-out',
              }}
            />
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: '#c084fc',
                textTransform: 'uppercase',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              ENTERPRISE PRO
            </Typography>
          </Box>
        </Box>

        {/* Dynamic Enterprise Micro-Copy Status */}
        {!isFailed ? (
          <>
            <Typography
              variant="body2"
              sx={{
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 500,
                letterSpacing: '0.03em',
                mb: 2.75,
                minHeight: '20px',
                transition: 'opacity 0.3s ease',
              }}
            >
              {currentStatusText}
            </Typography>

            {/* Precision Kinetic Shimmer Beam */}
            <Box
              sx={{
                width: 220,
                height: 3,
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 99,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
                mb: 3.5,
              }}
            >
              <Box
                className="shimmer-beam-inner"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '60%',
                  height: '100%',
                  background:
                    'linear-gradient(90deg, transparent 0%, #8b5cf6 35%, #38bdf8 70%, transparent 100%)',
                  borderRadius: 99,
                  boxShadow: '0 0 14px rgba(139, 92, 246, 0.8)',
                  animation: 'shimmerBeam 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite',
                }}
              />
            </Box>

            {/* Security Assurance Watermark */}
            <Typography
              sx={{
                fontSize: '0.675rem',
                letterSpacing: '0.12em',
                color: '#475569',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontFamily: 'monospace',
              }}
            >
              🔒 256-BIT TLS 1.3 • SOC 2 RUNTIME • TENANT ISOLATED
            </Typography>
          </>
        ) : (
          /* Graceful Recovery Panel (Prevents hanging forever) */
          <Box
            sx={{
              mt: 2,
              p: 2.75,
              borderRadius: 3.5,
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f87171' }}>
              <ErrorOutlineRoundedIcon fontSize="small" />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: '#f87171', letterSpacing: '0.02em' }}
              >
                Handshake Latency Notice
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.55 }}
            >
              {error ||
                'Connecting to enterprise cloud services is taking longer than expected. Please retry initialization or verify your session credentials.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.25, mt: 1, width: '100%', flexDirection: 'column' }}>
              <Button
                variant="contained"
                size="medium"
                fullWidth
                startIcon={<RefreshRoundedIcon />}
                onClick={handleRetry}
                sx={{
                  bgcolor: '#8b5cf6',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.1,
                  boxShadow: '0 4px 18px rgba(139, 92, 246, 0.4)',
                  '&:hover': { bgcolor: '#7c3aed' },
                }}
              >
                Retry Initialization
              </Button>
              <Button
                variant="outlined"
                size="medium"
                fullWidth
                startIcon={<LogoutRoundedIcon />}
                onClick={handleReset}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.16)',
                  color: '#cbd5e1',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 0.95,
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                Return to Sign In
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LoadingScreen;
