import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  MenuItem,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';
import AuthShell from '../../components/auth/AuthShell.tsx';

const signUpSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    roleName: z.string().min(1, 'Please select a role'),
    companyName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.roleName === 'Company Owner' &&
      (!data.companyName || data.companyName.trim().length < 2)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company Name is required for Company Owner',
        path: ['companyName'],
      });
    }
  });

type SignUpInputs = z.infer<typeof signUpSchema>;

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

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SignUpInputs>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      roleName: 'Company Owner',
      companyName: '',
    },
  });

  const roleName = useWatch({ control, name: 'roleName' });

  const mutation = useMutation({
    mutationFn: async (credentials: SignUpInputs) => {
      const { data } = await apiClient.post<{
        success: boolean;
        message: string;
        email: string;
        requiresVerification?: boolean;
      }>('/auth/register', credentials);
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Verification code sent to your email!');
      navigate('/verify-email', { state: { email: variables.email } });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string'
          ? err.response.data
          : 'Registration failed. Please try again.');
      toast.error(message);
    },
  });

  const onSubmit = (data: SignUpInputs) => {
    mutation.mutate({
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      roleName: data.roleName,
      companyName: data.companyName ? data.companyName.trim() : undefined,
    });
  };

  return (
    <AuthShell
      mode="signup"
      title="Create Enterprise Account"
      subtitle="Initialize your organization workspace, branch networks, and point-of-sale registers."
      visualHeadline="Powering Scalable Retail & Warehouse Operations"
      visualDescription="Stockora Enterprise Pro brings unified inventory intelligence, sub-second POS registers, multi-warehouse logistics, and real-time offline sync to your business."
      highlights={[
        'Omnichannel POS with hardware peripheral integration',
        'Multi-warehouse logistics with real-time stock allocation',
        'Isolated multi-tenant data architecture with 99.99% SLA',
        'Autonomous demand forecasting & automated supplier replenishment',
      ]}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        {/* ========================================================
            SECTION 1: ACCOUNT CREDENTIALS
            ======================================================== */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#a78bfa',
              fontWeight: 800,
              letterSpacing: '0.06em',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
            }}
          >
            1. Account Credentials
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            <TextField
              id="username"
              label="Username"
              autoComplete="username"
              fullWidth
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
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
                    <PersonOutlineRoundedIcon sx={{ color: '#a78bfa', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

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
          </Box>

          <TextField
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={
              errors.password?.message ||
              'Min. 8 characters with uppercase, lowercase, number & symbol'
            }
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
        </Box>

        {/* ========================================================
            SECTION 2: WORKSPACE & ORGANIZATION
            ======================================================== */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#34d399',
              fontWeight: 800,
              letterSpacing: '0.06em',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
            }}
          >
            2. Workspace & Organization
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '5fr 7fr' },
              gap: 1.5,
            }}
          >
            <TextField
              select
              id="roleName"
              label="Workspace Role"
              fullWidth
              value={roleName || ''}
              {...register('roleName')}
              onChange={(e) => setValue('roleName', e.target.value, { shouldValidate: true })}
              error={!!errors.roleName}
              helperText={errors.roleName?.message}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AdminPanelSettingsOutlinedIcon sx={{ color: '#34d399', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            >
              <MenuItem value="Company Owner">Company Owner</MenuItem>
              <MenuItem value="Branch Manager">Branch Manager</MenuItem>
              <MenuItem value="Warehouse Manager">Warehouse Manager</MenuItem>
              <MenuItem value="Cashier">Cashier</MenuItem>
            </TextField>

            <TextField
              id="companyName"
              label={roleName === 'Company Owner' ? 'Company Name *' : 'Company Name (Optional)'}
              placeholder="e.g. Truson Logistics Limited"
              fullWidth
              {...register('companyName')}
              error={!!errors.companyName}
              helperText={errors.companyName?.message}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                'aria-required': roleName === 'Company Owner' ? 'true' : 'false',
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessOutlinedIcon sx={{ color: '#34d399', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />
          </Box>
        </Box>

        {/* ========================================================
            SECTION 3: PRIMARY ACTION
            ======================================================== */}
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
          {mutation.isPending ? 'Initializing Workspace...' : 'Register Enterprise Account'}
        </Button>

        {/* ========================================================
            SECTION 4: FOOTER LINKS
            ======================================================== */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.25,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            pt: 2,
            mt: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Already registered?
            </Typography>
            <Link
              onClick={() => navigate('/login')}
              sx={{
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#a78bfa',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': { color: '#c4b5fd' },
              }}
            >
              Sign In to Workspace
            </Link>
          </Box>

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
    </AuthShell>
  );
}
