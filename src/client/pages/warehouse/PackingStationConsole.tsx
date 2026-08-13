import { useState } from 'react';
import { Box, Typography, Grid, Button, TextField, MenuItem, Paper } from '@mui/material';
import PackIcon from '@mui/icons-material/Inventory';
import { api } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function PackingStationConsole() {
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [packagingType, setPackagingType] = useState('BOX_MED');
  const [weight, setWeight] = useState(1.5);
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [carrier, setCarrier] = useState('FedEx Express');

  const handleCreatePackage = async () => {
    if (!orderId || !orderNumber) {
      toast.error('Please enter order ID and Order Number.');
      return;
    }
    try {
      const res = await api.post('/warehouses/packing', {
        warehouseId: 'default-wh',
        orderId,
        orderNumber,
        packagingType,
        weight,
        length,
        width,
        height,
        carrier,
        items: [{ productId: 'prod-1', sku: 'SKU-01', name: 'Packed Item', quantity: 1 }],
      });

      toast.success(`Package [${res.data.packageNumber}] created and order marked PACKED!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to pack order');
    }
  };

  return (
    <Box sx={{ p: 3, background: '#0b0f19', minHeight: '100vh', color: '#f3f4f6' }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <PackIcon fontSize="large" /> Packing Station Console
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Pack picked items into shipping containers, record package weight & dimensions, and
          prepare for carrier dispatch.
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 3,
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.05)',
          maxWidth: 600,
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
          Package Details
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            fullWidth
          />
          <TextField
            label="Order Number (e.g. STK-2026-001)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Packaging Type"
            value={packagingType}
            onChange={(e) => setPackagingType(e.target.value)}
            fullWidth
          >
            {['BOX_SMALL', 'BOX_MED', 'BOX_LARGE', 'ENVELOPE', 'PALLET'].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Weight (kg)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Length (cm)"
                type="number"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Width (cm)"
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            size="large"
            onClick={handleCreatePackage}
            sx={{ mt: 1, background: '#6366f1' }}
          >
            Confirm Package & Mark Packed
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
