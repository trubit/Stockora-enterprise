import { Box, Card, CardContent, Typography, TextField, Button, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client.ts';
import { useAuthStore } from '../../store/auth.ts';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import type { AuthResponse } from '../../../shared/types.js';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInInputs = z.infer<typeof signInSchema>;

const textFieldStyle = {};

export default function SignIn() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInInputs>({
    resolver: zodResolver(signInSchema),
  });

  const mutation = useMutation({
    mutationFn: async (credentials: SignInInputs) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      toast.success('Logged in successfully!');
      navigate('/');
    },
  });

  const onSubmit = (data: SignInInputs) => {
    mutation.mutate(data);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#030712',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '20%',
          right: '30%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ zIndex: 1 }}
      >
        <Card 
          sx={{ 
            width: 420, 
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.08)', 
            border: '1px solid rgba(139, 92, 246, 0.15)',
            background: 'linear-gradient(135deg, rgba(23, 27, 44, 0.75) 0%, rgba(11, 13, 26, 0.85) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
            }
          }}
        >
          <CardContent sx={{ p: { xs: 3.5, md: 5 }, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <img src="/logo.png" alt="Stockora Logo" style={{ height: 64, width: 64, objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(139, 92, 246, 0.3))' }} />
              </motion.div>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 900, 
                  textAlign: 'center', 
                  letterSpacing: '0.08em',
                  background: 'linear-gradient(90deg, #a78bfa 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mt: 1
                }}
              >
                STOCKORA
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>
                Sign in to manage your inventory and POS terminals
              </Typography>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <TextField
                label="Email Address"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={textFieldStyle}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={textFieldStyle}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={mutation.isPending}
                sx={{ 
                  py: 1.6, 
                  fontWeight: 800,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontSize: '0.975rem',
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
                    boxShadow: '0 6px 24px rgba(139, 92, 246, 0.45)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                {mutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', pt: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Link 
                  onClick={() => navigate('/forgot-password')} 
                  sx={{ 
                    cursor: 'pointer', 
                    fontSize: '0.85rem', 
                    color: 'text.secondary', 
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.light' } 
                  }}
                >
                  Forgot Password?
                </Link>
                <Link 
                  onClick={() => navigate('/signup')} 
                  sx={{ 
                    cursor: 'pointer', 
                    fontSize: '0.85rem', 
                    color: 'primary.light', 
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' } 
                  }}
                >
                  Create Account
                </Link>
              </Box>

              <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>
                <Link
                  onClick={() => navigate('/landing')}
                  sx={{ cursor: 'pointer', color: '#9ca3af', textDecoration: 'none', '&:hover': { color: '#34d399' } }}
                >
                  ← Back to Enterprise Landing Page
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}

