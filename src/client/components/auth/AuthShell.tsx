import React from 'react';
import { Box, Card, Typography, Avatar, Chip, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import { ENTERPRISE_IMAGERY } from '../../constants/imagery.ts';

export interface AuthShellProps {
  /** Mode indicator: 'signup' | 'signin' */
  mode: 'signup' | 'signin';
  /** Title on the form card */
  title: string;
  /** Subtitle on the form card */
  subtitle: string;
  /** Headline on the visual showcase panel */
  visualHeadline: string;
  /** Description paragraph on the visual showcase panel */
  visualDescription: string;
  /** Key capability bullets on the visual showcase panel */
  highlights: string[];
  /** Form contents */
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  mode,
  title,
  subtitle,
  visualHeadline,
  visualDescription,
  highlights,
  children,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#030712',
        position: 'relative',
        overflowX: 'hidden',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 6 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '10%',
          left: '12%',
          width: { xs: 260, md: 550 },
          height: { xs: 260, md: 550 },
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0) 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '10%',
          right: '12%',
          width: { xs: 260, md: 550 },
          height: { xs: 260, md: 550 },
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none',
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ zIndex: 1, width: '100%', maxWidth: mode === 'signup' ? 1060 : 960 }}
      >
        <Card
          role="region"
          aria-label={title}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            background:
              'linear-gradient(135deg, rgba(20, 24, 39, 0.96) 0%, rgba(10, 13, 24, 0.98) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(139, 92, 246, 0.18)',
            borderRadius: { xs: 3, sm: 4 },
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 40px rgba(139, 92, 246, 0.06)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #10b981 100%)',
              zIndex: 3,
            },
          }}
        >
          {/* ========================================================
              LEFT: VISUAL SHOWCASE PANEL (Visible on md+ screens)
              Integrates genuine real business photography with dark overlay
              ======================================================== */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: { md: mode === 'signup' ? '43%' : '45%' },
              p: { md: 4, lg: 4.5 },
              position: 'relative',
              overflow: 'hidden',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Real Professional Human Photograph (Unsplash verified: Christina @ wocintechchat.com) */}
            <Box
              component="img"
              src={ENTERPRISE_IMAGERY.authOperator.src}
              alt={ENTERPRISE_IMAGERY.authOperator.alt}
              loading="eager"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
                zIndex: 0,
                transform: 'scale(1.03)',
              }}
            />

            {/* Controlled Dark Scrim Overlay for Contrast & Typography Legibility */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(180deg, rgba(7, 10, 20, 0.76) 0%, rgba(10, 13, 24, 0.88) 50%, rgba(7, 9, 15, 0.98) 100%)',
                zIndex: 1,
              }}
            />

            {/* Subtle Brand Accent Tint */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'radial-gradient(circle at 15% 25%, rgba(139, 92, 246, 0.2) 0%, transparent 65%)',
                zIndex: 1,
                mixBlendMode: 'screen',
              }}
            />

            {/* Top Brand Identity */}
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Avatar
                  src="/logo.png"
                  alt="Stockora Logo"
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: 'primary.main',
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.45)',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        lineHeight: 1.1,
                        fontFamily: '"Outfit", sans-serif',
                        background: 'linear-gradient(90deg, #ffffff 0%, #c4b5fd 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      STOCKORA
                    </Typography>
                    <Chip
                      label="PRO"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
                        borderRadius: '4px',
                        px: 0.25,
                        border: 'none',
                        letterSpacing: '0.04em',
                        '& .MuiChip-label': { px: 0.6 },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#d1d5db',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      letterSpacing: '0.04em',
                      display: 'block',
                    }}
                  >
                    ENTERPRISE POS & INVENTORY PLATFORM
                  </Typography>
                </Box>
              </Box>

              {/* Showcase Headline & Description */}
              <Typography
                component="h2"
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontSize: { md: '1.35rem', lg: '1.5rem' },
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  lineHeight: 1.3,
                  mb: 1.5,
                  mt: 2,
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                {visualHeadline}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#e5e7eb',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  mb: 2.5,
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {visualDescription}
              </Typography>

              {/* Feature Highlight Bullets */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, my: 2 }}>
                {highlights.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                    <CheckCircleOutlineRoundedIcon
                      sx={{ fontSize: 18, color: '#34d399', mt: 0.25, flexShrink: 0 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#f3f4f6',
                        fontSize: '0.825rem',
                        fontWeight: 500,
                        lineHeight: 1.45,
                        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                      }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Bottom Showcase Trust Box */}
            <Box sx={{ position: 'relative', zIndex: 2, mt: 3 }}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(10, 13, 24, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedRoundedIcon sx={{ fontSize: 20, color: '#38bdf8' }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#ffffff',
                        fontWeight: 800,
                        display: 'block',
                        fontSize: '0.75rem',
                      }}
                    >
                      99.99% SLA
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.68rem' }}>
                      Real-time offline sync
                    </Typography>
                  </Box>
                </Box>

                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderColor: 'rgba(255,255,255,0.08)' }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HubOutlinedIcon sx={{ fontSize: 20, color: '#a78bfa' }} />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#ffffff',
                        fontWeight: 800,
                        display: 'block',
                        fontSize: '0.75rem',
                      }}
                    >
                      Multi-Tenant
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.68rem' }}>
                      Isolated branch DBs
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.75, px: 0.5 }}>
                <SecurityOutlinedIcon sx={{ fontSize: 14, color: '#10b981' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#9ca3af',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}
                >
                  ISO 27001 • SOC 2 TYPE II AUDITED
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ========================================================
              RIGHT: FORM CARD AREA
              ======================================================== */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 2.75, sm: 4, md: 4.5, lg: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {/* Mobile-only compact brand bar */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.25,
                mb: 2.5,
              }}
            >
              <Avatar
                src="/logo.png"
                alt="Stockora Logo"
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: 'primary.main',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 900,
                      fontFamily: '"Outfit", sans-serif',
                      background: 'linear-gradient(90deg, #ffffff 0%, #c4b5fd 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.1,
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
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                  Enterprise Operations Suite
                </Typography>
              </Box>
            </Box>

            {/* Form Heading & Subtitle */}
            <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.35rem', sm: '1.55rem' },
                  letterSpacing: '-0.015em',
                  color: '#f9fafb',
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#9ca3af',
                  fontSize: { xs: '0.825rem', sm: '0.875rem' },
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </Typography>
            </Box>

            {/* Interactive Form Component */}
            {children}
          </Box>
        </Card>
      </motion.div>
    </Box>
  );
};

export default AuthShell;
