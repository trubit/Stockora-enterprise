import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Chip } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  badgeText?: string;
  badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  category = 'Stockora',
  badgeText,
  badgeColor = 'primary',
  action,
}) => {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.3)' }} />}
          aria-label="breadcrumb"
          sx={{ mb: 0.5 }}
        >
          <Link underline="hover" color="inherit" href="/" sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {category}
          </Link>
          <Typography sx={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
            {title}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>

          {badgeText && (
            <Chip
              label={badgeText}
              color={badgeColor}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                borderRadius: '6px',
                height: '22px',
                px: 0.5,
              }}
            />
          )}
        </Box>

        {subtitle && (
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5, maxWidth: '650px' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>{action}</Box>}
    </Box>
  );
};

export default PageHeader;
