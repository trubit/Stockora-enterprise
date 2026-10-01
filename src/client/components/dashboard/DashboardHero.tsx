import React from 'react';
import { Box, Typography, Button, Chip, Stack } from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.ts';
import { useTenantStore } from '../../store/tenant.ts';
import { Can } from '../auth/Can.tsx';
import { ENTERPRISE_IMAGERY } from '../../constants/imagery.ts';

interface DashboardHeroProps {
  workspaceName: string;
  totalProductsCount: number;
  totalSalesCount: number;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  workspaceName,
  totalProductsCount,
  totalSalesCount,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeTenant } = useTenantStore();

  const operatorName = user?.name || user?.username || 'Enterprise Operator';
  const roleName = user?.roleName || user?.role || 'Operator';
  const isFreshCompany = totalProductsCount === 0 && totalSalesCount === 0;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, rgba(20, 24, 38, 0.95) 0%, rgba(10, 13, 22, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
        mb: 3.5,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'stretch',
      }}
    >
      {/* Content Side */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2.5, sm: 3.5, lg: 4 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        {/* Status Badges */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}
        >
          <Chip
            size="small"
            icon={<VerifiedUserIcon style={{ fontSize: 14, color: '#10b981' }} />}
            label={`${workspaceName} • ${activeTenant?.status || 'ONLINE'}`}
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontWeight: 700,
              fontSize: '0.725rem',
            }}
          />
          <Chip
            size="small"
            icon={<CloudDoneIcon style={{ fontSize: 14, color: '#8b5cf6' }} />}
            label="Real-Time Sync Active"
            sx={{
              bgcolor: 'rgba(139, 92, 246, 0.1)',
              color: '#c4b5fd',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontWeight: 600,
              fontSize: '0.725rem',
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          />
          <Chip
            size="small"
            label={`Role: ${roleName}`}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: '0.725rem',
            }}
          />
        </Stack>

        {/* Heading */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.35rem', sm: '1.75rem', lg: '2rem' },
            letterSpacing: '-0.02em',
            color: '#f8fafc',
            mb: 1,
            lineHeight: 1.25,
          }}
        >
          Welcome back, {operatorName}
        </Typography>

        {/* Subtitle / Contextual Message */}
        <Typography
          variant="body1"
          sx={{
            color: '#94a3b8',
            maxWidth: 620,
            mb: 3,
            fontSize: { xs: '0.85rem', sm: '0.925rem' },
            lineHeight: 1.6,
          }}
        >
          {isFreshCompany
            ? 'Your enterprise workspace is initialized and ready. Add inventory products or launch point-of-sale terminals to stream live transactions.'
            : 'Operational storefronts, real-time multi-branch stock levels, and POS terminal transactions are actively synchronizing across all channels.'}
        </Typography>

        {/* Quick CTA Actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Can permission="transactions:write">
            <Button
              variant="contained"
              startIcon={<PointOfSaleIcon />}
              onClick={() => navigate('/pos')}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '10px',
                px: 3,
                py: 1.1,
                fontSize: '0.875rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
                boxShadow: '0 4px 18px rgba(139, 92, 246, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #059669 100%)',
                  boxShadow: '0 6px 22px rgba(139, 92, 246, 0.5)',
                },
              }}
            >
              Launch POS Checkout
            </Button>
          </Can>

          <Can permission="products:read">
            <Button
              variant="outlined"
              startIcon={<Inventory2Icon />}
              onClick={() => navigate('/inventory')}
              sx={{
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '10px',
                px: 2.5,
                py: 1.1,
                fontSize: '0.875rem',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              View Inventory Catalog
            </Button>
          </Can>
        </Stack>
      </Box>

      {/* Visual Photography Panel (Desktop/Tablet) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: { md: 280, lg: 340 },
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={ENTERPRISE_IMAGERY.dashboardHero.src}
          alt={ENTERPRISE_IMAGERY.dashboardHero.alt}
          loading="eager"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            display: 'block',
          }}
        />
        {/* Soft edge gradient to blend seamlessly into card */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              md: 'linear-gradient(90deg, rgba(20, 24, 38, 0.95) 0%, rgba(20, 24, 38, 0.2) 40%, rgba(10, 13, 22, 0.4) 100%)',
            },
          }}
        />

        {/* Small attribution chip */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            px: 1.2,
            py: 0.4,
            borderRadius: '6px',
            bgcolor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 600 }}
          >
            Enterprise Operations
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardHero;
