import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Link,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../api/client.ts';
import { useAuthStore } from '../../store/auth.ts';
import { useTenantStore } from '../../store/tenant.ts';
import AuthShell from '../../components/auth/AuthShell.tsx';
import type { AuthResponse } from '../../../shared/types.js';

const signInSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Please enter a valid email address')),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

type SignInInputs = z.infer<typeof signInSchema>;

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(11, 15, 26, 0.65)',
    borderRadius: 2.5,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(139, 92, 246, 0.35)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#8b5cf6',
      borderWidth: '1px',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 16px rgba(139, 92, 246, 0.18)',
    },
  },
};

export default function SignIn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInputs>({
    resolver: zodResolver(signInSchema),
  });

  const mutation = useMutation({
    mutationFn: async (credentials: SignInInputs) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });
      return data;
    },
    onSuccess: async (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);

      // Synchronize active tenant and invalidate queries for immediate UI hydration
      await Promise.allSettled([
        useTenantStore.getState().fetchCurrentTenant(),
        useTenantStore.getState().fetchUserTenants(),
        queryClient.invalidateQueries({ queryKey: ['tenants'] }),
        queryClient.invalidateQueries({ queryKey: ['current-tenant'] }),
        queryClient.invalidateQueries({ queryKey: ['user-tenants'] }),
        queryClient.invalidateQueries({ queryKey: ['auth'] }),
      ]);

      toast.success(`Logged in as ${data.user.username} (${data.user.roleName})!`);
      navigate('/');
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string'
          ? err.response.data
          : 'Sign in failed. Please check your credentials.');
      toast.error(message);
    },
  });

  const onSubmit = (data: SignInInputs) => {
    mutation.mutate(data);
  };

  return (
    <AuthShell
      mode="signin"
      title="Sign In to Workspace"
      subtitle="Enter your authorized credentials to access your tenant dashboard and POS registers."
      visualHeadline="Mission-Critical Inventory & POS Control"
      visualDescription="Log in to manage live POS transactions, warehouse stock distributions, automated ledger audits, and procurement pipelines."
      highlights={[
        'High-throughput POS terminal register synchronization',
        'End-to-end encrypted multi-tenant session isolation',
        'Sub-second catalog lookups & barcode scanner support',
        'Live low-stock telemetry & automated replenishment',
      ]}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <TextField
          id="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          fullWidth
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            autoCapitalize: 'none',
            autoCorrect: 'off',
            spellCheck: 'false',
            'aria-required': 'true',
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />

        <TextField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          fullWidth
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            autoCapitalize: 'none',
            autoCorrect: 'off',
            spellCheck: 'false',
            'aria-required': 'true',
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  size="small"
                  sx={{ color: '#9ca3af', '&:hover': { color: '#f3f4f6' } }}
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ fontSize: 20 }} />
                  ) : (
                    <Visibility sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />

        <Button
          variant="contained"
          type="submit"
          fullWidth
          disabled={mutation.isPending}
          startIcon={
            mutation.isPending ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : null
          }
          sx={{
            py: 1.5,
            mt: 0.5,
            fontWeight: 700,
            borderRadius: 2.5,
            textTransform: 'none',
            fontSize: '0.95rem',
            letterSpacing: '0.01em',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
            transition: 'all 0.25s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)',
              boxShadow: '0 6px 24px rgba(124, 58, 237, 0.5)',
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              background: 'rgba(124, 58, 237, 0.4)',
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        >
          {mutation.isPending ? 'Verifying Credentials...' : 'Sign In to Workspace'}
        </Button>

        {/* Secondary Links */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.75,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            pt: 2.25,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link
              onClick={() => navigate('/forgot-password')}
              sx={{
                cursor: 'pointer',
                fontSize: '0.825rem',
                color: '#9ca3af',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': { color: '#a78bfa' },
              }}
            >
              Forgot Password?
            </Link>
            <Link
              onClick={() => navigate('/signup')}
              sx={{
                cursor: 'pointer',
                fontSize: '0.825rem',
                color: '#a78bfa',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': { color: '#c4b5fd' },
              }}
            >
              Create Account
            </Link>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
            <Link
              onClick={() => navigate('/landing')}
              sx={{
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '0.8rem',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                transition: 'color 0.2s',
                '&:hover': { color: '#34d399' },
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
              Back to Enterprise Landing Page
            </Link>
          </Box>
        </Box>
      </Box>
    </AuthShell>
  );
}
