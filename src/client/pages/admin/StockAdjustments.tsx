import { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';
import type { Product } from '../../../shared/types.js';
import { motion } from 'framer-motion';

const textFieldStyle = {};

interface Adjustment {
  _id: string;
  adjustmentNumber: string;
  productId: {
    _id: string;
    name: string;
    sku: string;
  } | string;
  type: 'ADD' | 'REMOVE' | 'SET';
  reason: 'COUNT_MISMATCH' | 'DAMAGED' | 'EXPIRED' | 'THEFT' | 'PROMOTION';
  quantity: number;
  notes?: string;
  userId: {
    username: string;
  } | string;
  createdAt: string;
}

interface AdjustmentForm {
  productId: string;
  type: 'ADD' | 'REMOVE' | 'SET';
  reason: 'COUNT_MISMATCH' | 'DAMAGED' | 'EXPIRED' | 'THEFT' | 'PROMOTION';
  quantity: number;
  notes?: string;
}

export default function StockAdjustments() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch adjustments/movements
  const { data: movements = [], refetch } = useQuery<Adjustment[]>({
    queryKey: ['movements'],
    queryFn: async () => {
      const { data } = await apiClient.get<Adjustment[]>('/inventory/movements');
      return data;
    },
  });

  // Fetch products list for selection
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products');
      return data;
    },
  });

  const { register, handleSubmit, reset } = useForm<AdjustmentForm>({
    defaultValues: {
      productId: '',
      type: 'ADD',
      reason: 'COUNT_MISMATCH',
      quantity: 1,
      notes: '',
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async (payload: AdjustmentForm) => {
      return await apiClient.post('/inventory/adjust', payload);
    },
    onSuccess: () => {
      toast.success('Stock adjustment completed successfully!');
      setOpen(false);
      reset();
      refetch();
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { error?: string } } };
      const msg = apiErr.response?.data?.error || 'Failed to adjust stock.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: AdjustmentForm) => {
    adjustMutation.mutate({
      ...data,
      quantity: Number(data.quantity),
    });
  };

  // Only list movements that are of type ADJUSTMENT for clarity, or show all
  const filteredAdjustments = movements.filter((m: Adjustment) => {
    const prodName = typeof m.productId === 'object' && m.productId ? m.productId.name : '';
    const prodSku = typeof m.productId === 'object' && m.productId ? m.productId.sku : '';
    const adjNum = m.adjustmentNumber || m.notes || '';
    const matchSearch =
      prodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prodSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adjNum.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Inventory Adjustments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: 2.5,
              textTransform: 'none',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              '&:hover': {
                background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.45)',
              },
            }}
          >
            Create Adjustment
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Perform custom stock audits, record damaged/expired items, and log audit adjustments.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Search Adjustments by Product Name, SKU, or notes..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={textFieldStyle}
          />
        </Box>

        <TableContainer
          component={Paper}
          className="glass-panel"
          sx={{
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            borderRadius: 3,
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(17, 24, 39, 0.5)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Qty Changed</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Reason / Notes</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Auditor</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary', border: 'none' }}>
                    No stock adjustments logged.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdjustments.map((adj) => (
                  <TableRow key={adj._id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', py: 2 }}>
                      {typeof adj.productId === 'object' && adj.productId ? (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{adj.productId.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{adj.productId.sku}</Typography>
                        </Box>
                      ) : (
                        'Unknown Product'
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Chip
                        label={adj.quantity > 0 ? 'ADD' : 'REMOVE'}
                        size="small"
                        color={adj.quantity > 0 ? 'success' : 'error'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 700 }}>
                      {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{adj.notes || 'Manual Adjustment'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 500 }}>
                      {typeof adj.userId === 'object' && adj.userId ? adj.userId.username : 'System'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      {new Date(adj.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(23, 27, 44, 0.98) 0%, rgba(11, 13, 26, 0.99) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 4,
            },
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Create Inventory Stock Adjustment
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Select Catalog Product"
                    fullWidth
                    defaultValue=""
                    {...register('productId', { required: true })}
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  >
                    {products.map((p) => (
                      <MenuItem key={p._id || p.id} value={p._id || p.id}>
                        {p.name} ({p.sku}) — Stock: {p.quantity}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Adjustment Type"
                    fullWidth
                    defaultValue="ADD"
                    {...register('type', { required: true })}
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="ADD">Add Stock (+)</MenuItem>
                    <MenuItem value="REMOVE">Remove Stock (-)</MenuItem>
                    <MenuItem value="SET">Set Explicit Stock (=)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Adjustment Reason"
                    fullWidth
                    defaultValue="COUNT_MISMATCH"
                    {...register('reason', { required: true })}
                    sx={textFieldStyle}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="COUNT_MISMATCH">Audit Count Mismatch</MenuItem>
                    <MenuItem value="DAMAGED">Damaged Goods</MenuItem>
                    <MenuItem value="EXPIRED">Expired Shelf-Life</MenuItem>
                    <MenuItem value="THEFT">Shrinkage / Theft</MenuItem>
                    <MenuItem value="PROMOTION">Promotional Giveaway</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Quantity" type="number" fullWidth {...register('quantity', { required: true, min: 1 })} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Audit Notes / Reason explanation" multiline rows={3} fullWidth {...register('notes')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1.5 }}>
              <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
              <Button variant="contained" type="submit" startIcon={<SettingsBackupRestoreIcon />} sx={{ px: 4, py: 1.2, fontWeight: 700, background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)' }}>
                Complete Adjustment
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </motion.div>
    </Box>
  );
}
