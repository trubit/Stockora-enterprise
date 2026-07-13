import { Box, Card, CardContent, Typography, TextField, Button, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: { email: string }) => {
    toast.success(`If an account matches ${data.email}, a reset link has been sent.`);
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card sx={{ width: 400, boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center' }}>
              Recover Password
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Enter your email to request a reset link
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <TextField label="Email Address" fullWidth {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
              <Button variant="contained" type="submit" fullWidth sx={{ py: 1.5, fontWeight: 700 }}>
                Send Reset Link
              </Button>
            </form>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Link onClick={() => navigate('/login')} sx={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                Back to Sign In
              </Link>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
