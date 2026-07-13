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
        minHeight: '90vh',
        bgcolor: 'background.default',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card sx={{ width: 400, boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <img src="/logo.png" alt="Stockora Logo" style={{ height: 60, objectFit: 'contain' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', color: 'primary.main' }}>
              STOCKORA
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Sign in to manage your inventory and POS terminals
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <TextField
                label="Email Address"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={mutation.isPending}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {mutation.isPending ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Link onClick={() => navigate('/forgot-password')} sx={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                Forgot Password?
              </Link>
              <Link onClick={() => navigate('/signup')} sx={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                Create Account
              </Link>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
