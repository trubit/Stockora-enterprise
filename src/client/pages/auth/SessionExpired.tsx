import { Box, Typography, Button, Container, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TimerOffOutlinedIcon from '@mui/icons-material/TimerOffOutlined';
import LoginIcon from '@mui/icons-material/Login';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

export default function SessionExpired() {
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
          {/* Timeout Crest */}
          <Box
            sx={{
              width: 76,
              height: 76,
              borderRadius: '20px',
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <TimerOffOutlinedIcon sx={{ fontSize: 36, color: '#fbbf24' }} />
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
            Session Timed Out
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
            Your authenticated enterprise operator session has reached its inactivity timeout limit.
            In compliance with security standards, credentials must be re-verified.
          </Typography>

          {/* Security Notice */}
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
            <ShieldOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              Automatic Session Guard • Tenant Isolation Enforced
            </Typography>
          </Box>

          <Box>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '12px',
                px: 3.5,
                py: 1.25,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
                boxShadow: '0 4px 18px rgba(139, 92, 246, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #059669 100%)',
                  boxShadow: '0 6px 22px rgba(139, 92, 246, 0.5)',
                },
              }}
            >
              Sign In to Resume Session
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
