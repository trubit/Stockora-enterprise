import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client.ts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PageHeader from '../../components/PageHeader.tsx';
import { toast } from 'react-hot-toast';

export default function LoyaltyDashboard() {
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [rewardReason, setRewardReason] = useState('');

  const {
    data: customers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['loyalty-customers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return res.data;
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId || !pointsToRedeem || !rewardReason) {
        throw new Error('Please fill in all fields.');
      }
      const res = await apiClient.post('/crm/loyalty/redeem', {
        customerId: selectedCustomerId,
        pointsToRedeem: Number(pointsToRedeem),
        rewardReason,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Loyalty points redeemed successfully!');
      setRedeemModalOpen(false);
      setPointsToRedeem('');
      setRewardReason('');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to redeem points.');
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Loyalty Program & Rewards System"
        subtitle="Tier Thresholds (Bronze, Silver, Gold, Platinum), Points Earning & Redemption History"
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #cd7f32' }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Bronze Tier
            </Typography>
            <Typography variant="h6">0 - 499 Points</Typography>
            <Typography variant="caption" color="textSecondary">
              Base 1.0x Point Earning
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #c0c0c0' }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Silver Tier
            </Typography>
            <Typography variant="h6">500 - 1,999 Points</Typography>
            <Typography variant="caption" color="textSecondary">
              1.25x Multiplier
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #ffd700' }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Gold Tier
            </Typography>
            <Typography variant="h6">2,000 - 4,999 Points</Typography>
            <Typography variant="caption" color="textSecondary">
              1.5x Multiplier
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #e5e4e2' }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Platinum Tier
            </Typography>
            <Typography variant="h6">5,000+ Points</Typography>
            <Typography variant="caption" color="textSecondary">
              2.0x Double Multiplier
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<CardGiftcardIcon />}
          onClick={() => setRedeemModalOpen(true)}
        >
          Redeem Rewards Points
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Customer Loyalty Accounts
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {(customers || []).map((cust: any) => (
                <Grid item xs={12} sm={6} md={4} key={cust._id}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {cust.name}
                      </Typography>
                      <Chip label={cust.loyaltyTier || 'BRONZE'} size="small" color="warning" />
                    </Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Email: {cust.email}
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ mt: 1, fontWeight: 700 }}>
                      {cust.loyaltyPoints || 0} Points
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Redeem Points Modal */}
      <Dialog
        open={redeemModalOpen}
        onClose={() => setRedeemModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Redeem Loyalty Points</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={selectedCustomerId}
              label="Select Customer"
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {(customers || []).map((c: any) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name} ({c.loyaltyPoints || 0} Points Available)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Points to Redeem"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Reward / Reason (e.g., $10 Store Voucher)"
            value={rewardReason}
            onChange={(e) => setRewardReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedeemModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={redeemMutation.isPending}
            onClick={() => redeemMutation.mutate()}
          >
            Confirm Redemption
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
