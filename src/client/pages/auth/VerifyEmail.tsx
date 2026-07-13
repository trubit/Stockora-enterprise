import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function VerifyEmail() {
  const navigate = useNavigate();

  const handleVerify = () => {
    toast.success('Email verified successfully!');
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card sx={{ width: 400, boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Verify Email Address
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Confirm ownership of your registered user email address
            </Typography>
            <Button variant="contained" onClick={handleVerify} sx={{ px: 4, py: 1.5, fontWeight: 700 }}>
              Confirm Verification
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
