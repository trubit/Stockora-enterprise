import { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Card, CardContent, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';
import type { Branch } from '../../../shared/types.js';

export default function BranchList() {
  const [open, setOpen] = useState(false);
  const { data: branches = [], refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await apiClient.get<Branch[]>('/org/branches');
      return data;
    },
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', code: '', address: '', phone: '' },
  });

  const createMutation = useMutation({
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    mutationFn: async (newBranch: any) => {
      // For multi-tenant support, bind to a placeholder company ID
      return await apiClient.post('/org/branches', { companyId: '507f1f77bcf86cd799439011', ...newBranch });
    },
    onSuccess: () => {
      toast.success('Branch added successfully!');
      setOpen(false);
      reset();
      refetch();
    },
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Branches Manager
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ fontWeight: 700 }}>
          Add Branch
        </Button>
      </Box>

      <Grid container spacing={3}>
        {branches.map((b) => (
          <Grid item xs={12} sm={6} md={4} key={b.id}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {b.name}
                  </Typography>
                  <Chip label={b.code} size="small" color="primary" />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {b.address || 'No address registered'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Phone: {b.phone || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Register New Branch</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Branch Name" fullWidth {...register('name', { required: true })} />
            <TextField label="Branch Code (e.g., HQ-01)" fullWidth {...register('code', { required: true })} />
            <TextField label="Address" fullWidth {...register('address')} />
            <TextField label="Phone Number" fullWidth {...register('phone')} />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={createMutation.isPending}>
              Register
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
