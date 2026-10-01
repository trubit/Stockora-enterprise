import { Box, Container, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignOutCard from '../../components/auth/SignOutCard.tsx';

export default function SignOut() {
  const navigate = useNavigate();

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
        overflow: 'hidden',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 5 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '15%',
          left: '25%',
          width: { xs: 280, md: 450 },
          height: { xs: 280, md: 450 },
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0) 70%)',
          filter: 'blur(50px)',
          zIndex: 0,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '15%',
          right: '25%',
          width: { xs: 280, md: 450 },
          height: { xs: 280, md: 450 },
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0) 70%)',
          filter: 'blur(50px)',
          zIndex: 0,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ zIndex: 1, px: { xs: 0, sm: 2 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <SignOutCard variant="standalone" />

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              onClick={() => navigate('/')}
              sx={{
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '0.825rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': { color: '#f3f4f6' },
              }}
            >
              ← Return to Stockora Enterprise Dashboard
            </Link>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
