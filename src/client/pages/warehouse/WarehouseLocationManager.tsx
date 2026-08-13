import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  LocationOn as LocationIcon,
  Layers as ZoneIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { api } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function WarehouseLocationManager() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [zones, setZones] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal dialog state
  const [openZoneDialog, setOpenZoneDialog] = useState(false);
  const [openLocDialog, setOpenLocDialog] = useState(false);

  const [zoneForm, setZoneForm] = useState({
    name: '',
    code: '',
    zoneType: 'STORAGE',
    description: '',
  });
  const [locForm, setLocForm] = useState({
    zoneId: '',
    locationCode: '',
    aisle: 'A',
    rack: '01',
    shelf: '01',
    bin: '01',
    locationType: 'STORAGE',
    capacityUnits: 100,
  });

  const fetchData = async (whId: string) => {
    if (!whId) return;
    try {
      setLoading(true);
      const [zRes, lRes] = await Promise.all([
        api.get(`/warehouses/${whId}/zones`),
        api.get(`/warehouses/${whId}/locations`),
      ]);
      setZones(zRes.data || []);
      setLocations(lRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load warehouse zones and locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/warehouses').then((res) => {
      setWarehouses(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedWarehouseId(res.data[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchData(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const handleCreateZone = async () => {
    try {
      await api.post(`/warehouses/${selectedWarehouseId}/zones`, zoneForm);
      toast.success(`Zone [${zoneForm.code}] created successfully`);
      setOpenZoneDialog(false);
      fetchData(selectedWarehouseId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create zone');
    }
  };

  const handleCreateLocation = async () => {
    try {
      await api.post(`/warehouses/${selectedWarehouseId}/locations`, locForm);
      toast.success(`Location [${locForm.locationCode}] created successfully`);
      setOpenLocDialog(false);
      fetchData(selectedWarehouseId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create location');
    }
  };

  return (
    <Box sx={{ p: 3, background: '#0b0f19', minHeight: '100vh', color: '#f3f4f6' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
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
            <LocationIcon fontSize="large" /> Warehouse Hierarchy & Bins
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Manage warehouse physical zones, aisles, racks, shelves, and storage bin capacity.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ZoneIcon />}
            onClick={() => setOpenZoneDialog(true)}
            sx={{ borderColor: '#6366f1', color: '#818cf8' }}
          >
            + Add Zone
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenLocDialog(true)}
            sx={{ background: '#6366f1' }}
          >
            + Create Bin Location
          </Button>
        </Box>
      </Box>

      {/* Warehouse Selector */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        {warehouses.map((wh) => (
          <Button
            key={wh._id}
            variant={selectedWarehouseId === wh._id ? 'contained' : 'outlined'}
            onClick={() => setSelectedWarehouseId(wh._id)}
            sx={{ borderRadius: '8px' }}
          >
            {wh.name} ({wh.code})
          </Button>
        ))}
      </Box>

      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : (
        <Grid container spacing={3}>
          {/* Zones Summary */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 1.5, fontWeight: 600 }}>
              Warehouse Zones ({zones.length})
            </Typography>
            <Grid container spacing={2}>
              {zones.map((z) => (
                <Grid item xs={12} sm={6} md={3} key={z._id}>
                  <Card
                    sx={{
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#fff',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {z.code}
                        </Typography>
                        <Chip label={z.zoneType} size="small" color="primary" />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#9ca3af', my: 0.5 }}>
                        {z.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Locations Bins Grid */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: '#fff', my: 1.5, fontWeight: 600 }}>
              Active Storage Locations / Bins ({locations.length})
            </Typography>
            <Grid container spacing={2}>
              {locations.map((loc) => {
                const util =
                  loc.capacityUnits > 0
                    ? Math.round((loc.currentUnits / loc.capacityUnits) * 100)
                    : 0;
                return (
                  <Grid item xs={12} sm={6} md={3} key={loc._id}>
                    <Card
                      sx={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: '#fff',
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, color: '#818cf8' }}
                          >
                            {loc.locationCode}
                          </Typography>
                          <Chip
                            label={loc.locationType}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#6366f1', color: '#a5b4fc' }}
                          />
                        </Box>
                        <Box sx={{ my: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                            Capacity Utilization: {util}% ({loc.currentUnits}/
                            {loc.capacityUnits || '∞'} units)
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={util}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#334155',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: util > 90 ? '#ef4444' : '#10b981',
                              },
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Zone Dialog */}
      <Dialog
        open={openZoneDialog}
        onClose={() => setOpenZoneDialog(false)}
        PaperProps={{ sx: { background: '#1e293b', color: '#fff' } }}
      >
        <DialogTitle>Add Warehouse Zone</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 360, pt: 1 }}
        >
          <TextField
            label="Zone Code (e.g. Z-A)"
            value={zoneForm.code}
            onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value })}
            fullWidth
          />
          <TextField
            label="Zone Name (e.g. Storage Zone A)"
            value={zoneForm.name}
            onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Zone Type"
            value={zoneForm.zoneType}
            onChange={(e) => setZoneForm({ ...zoneForm, zoneType: e.target.value })}
            fullWidth
          >
            {[
              'RECEIVING',
              'STORAGE',
              'PICKING',
              'PACKING',
              'QUARANTINE',
              'DAMAGED',
              'RETURNS',
              'DISPATCH',
              'COLD_STORAGE',
              'HAZMAT',
            ].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenZoneDialog(false)} sx={{ color: '#9ca3af' }}>
            Cancel
          </Button>
          <Button onClick={handleCreateZone} variant="contained">
            Create Zone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Dialog */}
      <Dialog
        open={openLocDialog}
        onClose={() => setOpenLocDialog(false)}
        PaperProps={{ sx: { background: '#1e293b', color: '#fff' } }}
      >
        <DialogTitle>Create Storage Location / Bin</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 360, pt: 1 }}
        >
          <TextField
            select
            label="Parent Zone"
            value={locForm.zoneId}
            onChange={(e) => setLocForm({ ...locForm, zoneId: e.target.value })}
            fullWidth
          >
            {zones.map((z) => (
              <MenuItem key={z._id} value={z._id}>
                {z.code} ({z.name})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Location Code (e.g. A-01-02-03)"
            value={locForm.locationCode}
            onChange={(e) => setLocForm({ ...locForm, locationCode: e.target.value })}
            fullWidth
          />
          <TextField
            label="Capacity Units"
            type="number"
            value={locForm.capacityUnits}
            onChange={(e) => setLocForm({ ...locForm, capacityUnits: Number(e.target.value) })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLocDialog(false)} sx={{ color: '#9ca3af' }}>
            Cancel
          </Button>
          <Button onClick={handleCreateLocation} variant="contained">
            Create Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
