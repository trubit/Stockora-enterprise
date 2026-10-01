import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imageHeight?: number | string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  maxWidth?: number | string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are currently no records matching your request.',
  icon = <InboxIcon sx={{ fontSize: 44, color: '#8b5cf6' }} />,
  imageSrc,
  imageAlt = 'Empty state illustration',
  imageHeight = 160,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  maxWidth = 520,
}) => {
  return (
    <Box
      sx={{
        py: { xs: 4, sm: 6 },
        px: { xs: 2.5, sm: 4 },
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
        mx: 'auto',
        maxWidth,
      }}
    >
      {/* Contextual Real Photography or Icon */}
      {imageSrc ? (
        <Box
          sx={{
            width: '100%',
            maxWidth: 360,
            height: imageHeight,
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            mb: 2.5,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt={imageAlt}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          {/* Subtle bottom gradient scrim so text transition is soft */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(7, 9, 14, 0.1) 0%, rgba(7, 9, 14, 0.65) 100%)',
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            p: 2,
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          color: '#f8fafc',
          mb: 1,
          letterSpacing: '-0.01em',
          fontSize: { xs: '1rem', sm: '1.15rem' },
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: '#94a3b8',
          maxWidth: 440,
          mb: actionLabel || secondaryActionLabel ? 3 : 0,
          lineHeight: 1.6,
          fontSize: '0.875rem',
        }}
      >
        {description}
      </Typography>

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {actionLabel && onAction && (
            <Button
              variant="contained"
              color="primary"
              onClick={onAction}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '10px',
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  boxShadow: '0 6px 18px rgba(139, 92, 246, 0.45)',
                },
              }}
            >
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outlined"
              onClick={onSecondaryAction}
              sx={{
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '10px',
                px: 2.5,
                py: 1,
                fontSize: '0.875rem',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                },
              }}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default EmptyState;
