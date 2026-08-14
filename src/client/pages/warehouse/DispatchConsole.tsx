import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Button, TextField, Paper } from '@mui/material';
import DispatchIcon from '@mui/icons-material/LocalShipping';
import { api } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function DispatchConsole() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [carrier, setCarrier] = useState('DHL Express');
  const [driverName, setDriverName] = useState('John Driver');
  const [driverPhone, setDriverPhone] = useState('+1-555-0192');
  const [vehicleNumber, setVehicleNumber] = useState('TRK-9821');
  const [packageIdsInput, setPackageIdsInput] = useState('');
  const [dispatchManifest, setDispatchManifest] = useState<any>(null);

  useEffect(() => {
    api
      .get('/warehouses')
      .then((res: any) => {
        const whList = res.data || [];
        setWarehouses(whList);
        if (whList.length > 0) setSelectedWarehouseId(whList[0]._id);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleCreateManifest = async () => {
    const pkgIds = packageIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await api.post('/warehouses/dispatch', {
        warehouseId: selectedWarehouseId || 'wh-main',
        carrier,
        driverName,
        driverPhone,
        vehicleNumber,
        packageIds: pkgIds.length > 0 ? pkgIds : ['pkg-demo-1'],
      });

      setDispatchManifest(res.data);
      toast.success(`Dispatch manifest [${res.data.dispatchNumber}] created & verified!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create dispatch manifest');
    }
  };

  const handleExecuteDispatch = async () => {
    if (!dispatchManifest) return;
    try {
      await api.post(`/warehouses/dispatch/${dispatchManifest._id}/execute`);
      toast.success(
        `Dispatch [${dispatchManifest.dispatchNumber}] executed! Packages handed off to carrier.`
      );
      setDispatchManifest(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to execute dispatch');
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
          <DispatchIcon fontSize="large" /> Carrier Dispatch & Manifest Verification
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Verify outbound packages, log driver & vehicle info, and execute final carrier handoff.
        </Typography>
      </Box>

      {/* Warehouse Selector */}
      {warehouses.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          {warehouses.map((wh) => (
            <Button
              key={wh._id}
              variant={selectedWarehouseId === wh._id ? 'contained' : 'outlined'}
              onClick={() => setSelectedWarehouseId(wh._id)}
            >
              {wh.name} ({wh.code})
            </Button>
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
              Create Dispatch Manifest
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Carrier Name"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                fullWidth
              />
              <TextField
                label="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Driver Phone"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                fullWidth
              />
              <TextField
                label="Vehicle / Truck License #"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                fullWidth
              />
              <TextField
                label="Package Object IDs (comma-separated, optional)"
                value={packageIdsInput}
                onChange={(e) => setPackageIdsInput(e.target.value)}
                placeholder="65a123..., 65a456..."
                multiline
                rows={2}
                fullWidth
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleCreateManifest}
                sx={{ background: '#6366f1' }}
              >
                Verify & Generate Manifest
              </Button>
            </Box>
          </Paper>
        </Grid>

        {dispatchManifest && (
          <Grid item xs={12} md={6}>
            <Paper
              sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <Typography variant="h6" sx={{ color: '#10b981', mb: 1, fontWeight: 700 }}>
                Manifest Verified: {dispatchManifest.dispatchNumber}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Carrier: {dispatchManifest.carrier}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Driver: {dispatchManifest.driverName} ({dispatchManifest.driverPhone})
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Total Packages: {dispatchManifest.totalPackages} ({dispatchManifest.totalWeight} kg)
              </Typography>

              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleExecuteDispatch}
                sx={{ mt: 3 }}
                fullWidth
              >
                Execute Final Dispatch Handoff
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
