import { Box, Typography, Button, Container, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#07090e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: '24px',
            bgcolor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Security Crest */}
          <Box
            sx={{
              width: 76,
              height: 76,
              borderRadius: '20px',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 36, color: '#f87171' }} />
          </Box>

          {/* Heading */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#f8fafc',
              mb: 1.5,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.5rem', sm: '1.85rem' },
            }}
          >
            Access Restricted
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              color: '#94a3b8',
              mb: 4,
              lineHeight: 1.6,
              fontSize: '0.925rem',
            }}
          >
            Your current workspace role does not possess the permissions required to view this
            module. Contact your organization administrator or company owner to request permission
            elevation.
          </Typography>

          {/* Compliance tag */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.75,
              borderRadius: '9999px',
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              mb: 4,
            }}
          >
            <SecurityIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              RBAC Policy Enforced • SOC 2 Type II Audited
            </Typography>
          </Box>

          <Box>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '12px',
                px: 3.5,
                py: 1.25,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                boxShadow: '0 4px 18px rgba(139, 92, 246, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  boxShadow: '0 6px 22px rgba(139, 92, 246, 0.5)',
                },
              }}
            >
              Return to Dashboard
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
