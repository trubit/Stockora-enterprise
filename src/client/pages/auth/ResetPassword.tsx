import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../api/client.ts';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';

const schema = z
  .object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type ResetInputs = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResetInputs) => {
    if (!resetToken) {
      toast.error(
        'Missing password reset authorization token. Please use the Forgot Password flow.'
      );
      navigate('/forgot-password');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        resetToken,
        newPassword: data.password,
      });
      toast.success('Password updated successfully! Please log in.');
      navigate('/login');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Password reset failed. The authorization link may have expired.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
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
        py: 4,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ zIndex: 1, width: '100%', maxWidth: 440 }}
      >
        <Card
          sx={{
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            background:
              'linear-gradient(135deg, rgba(23, 27, 44, 0.75) 0%, rgba(11, 13, 26, 0.85) 100%)',
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
            },
          }}
        >
          <CardContent
            sx={{ p: { xs: 3.5, md: 5 }, display: 'flex', flexDirection: 'column', gap: 3.5 }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
                mx: 'auto',
              }}
            >
              <LockResetOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: '0.05em',
                  background: 'linear-gradient(90deg, #a78bfa 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Reset Password
              </Typography>
              <Typography
                variant="body2"
                sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}
              >
                Set a secure password for your workspace access
              </Typography>
            </Box>

            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <TextField
                label="New Password"
                type="password"
                fullWidth
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputLabelProps={{ shrink: true }}
              />

              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.6,
                  fontWeight: 800,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontSize: '0.975rem',
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Reset Password'}
              </Button>
            </form>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                pt: 2.5,
              }}
            >
              <Link
                onClick={() => navigate('/login')}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'primary.light',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                Back to Sign In
              </Link>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
