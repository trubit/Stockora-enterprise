import { Box, Card, CardContent, Typography, TextField, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must match'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

type ResetInputs = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ResetInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = () => {
    toast.success('Password updated successfully! Please log in.');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card sx={{ width: 400, boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center' }}>
              Reset Password
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <TextField label="New Password" type="password" fullWidth {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
              <TextField label="Confirm New Password" type="password" fullWidth {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
              <Button variant="contained" type="submit" fullWidth sx={{ py: 1.5, fontWeight: 700 }}>
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
