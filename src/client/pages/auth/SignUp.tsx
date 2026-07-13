import { Box, Card, CardContent, Typography, TextField, Button, Link, MenuItem } from '@mui/material';
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

const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleName: z.string().min(1, 'Please select a role'),
});

type SignUpInputs = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpInputs>({
    resolver: zodResolver(signUpSchema),
  });

  const mutation = useMutation({
    mutationFn: async (credentials: SignUpInputs) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', credentials);
      return data;
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      toast.success('Account registered successfully!');
      navigate('/');
    },
  });

  const onSubmit = (data: SignUpInputs) => {
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
            <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', color: 'primary.main' }}>
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Register to initialize your branch terminals
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <TextField
                label="Username"
                fullWidth
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
              />
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
              <TextField
                select
                label="Workspace Role"
                defaultValue=""
                fullWidth
                {...register('roleName')}
                error={!!errors.roleName}
                helperText={errors.roleName?.message}
              >
                <MenuItem value="Company Owner">Company Owner</MenuItem>
                <MenuItem value="Branch Manager">Branch Manager</MenuItem>
                <MenuItem value="Warehouse Manager">Warehouse Manager</MenuItem>
                <MenuItem value="Cashier">Cashier</MenuItem>
              </TextField>
              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={mutation.isPending}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {mutation.isPending ? 'Registering...' : 'Register'}
              </Button>
            </form>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                Already have an account? Sign In
              </Link>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
