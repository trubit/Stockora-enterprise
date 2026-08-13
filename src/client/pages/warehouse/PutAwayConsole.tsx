import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { MoveToInbox as PutAwayIcon, CheckCircle as ConfirmIcon } from '@mui/icons-material';
import { api } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function PutAwayConsole() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const [confirmedLocationId, setConfirmedLocationId] = useState('');
  const [confirmedQuantity, setConfirmedQuantity] = useState(1);

  const fetchTasks = async (whId: string) => {
    if (!whId) return;
    try {
      const [tRes, lRes] = await Promise.all([
        api.get(`/warehouses/${whId}/putaway/pending`),
        api.get(`/warehouses/${whId}/locations`),
      ]);
      setTasks(tRes.data || []);
      setLocations(lRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load put-away tasks');
    }
  };

  useEffect(() => {
    api.get('/warehouses').then((res) => {
      setWarehouses(res.data || []);
      if (res.data && res.data.length > 0) setSelectedWarehouseId(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) fetchTasks(selectedWarehouseId);
  }, [selectedWarehouseId]);

  const handleOpenConfirm = (task: any) => {
    setSelectedTask(task);
    setConfirmedLocationId(task.suggestedLocationId?._id || '');
    setConfirmedQuantity(task.quantity);
    setConfirmDialog(true);
  };

  const handleExecutePutAway = async () => {
    if (!selectedTask || !confirmedLocationId) return;
    try {
      await api.post('/warehouses/putaway/confirm', {
        putAwayTaskId: selectedTask._id,
        confirmedLocationId,
        confirmedQuantity,
      });
      toast.success(`Put-away task [${selectedTask.taskNumber}] confirmed!`);
      setConfirmDialog(false);
      fetchTasks(selectedWarehouseId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete put-away');
    }
  };

  return (
    <Box sx={{ p: 3, background: '#0b0f19', minHeight: '100vh', color: '#f3f4f6' }}>
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
            <PutAwayIcon fontSize="large" /> Warehouse Put-Away Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Move inspected goods from receiving dock to optimal storage bin locations.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {warehouses.map((wh) => (
            <Button
              key={wh._id}
              variant={selectedWarehouseId === wh._id ? 'contained' : 'outlined'}
              onClick={() => setSelectedWarehouseId(wh._id)}
            >
              {wh.name}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Pending Tasks Table */}
      <TableContainer
        component={Paper}
        sx={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { color: '#9ca3af', fontWeight: 600 } }}>
              <TableCell>Task #</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Source Dock</TableCell>
              <TableCell>Suggested Location</TableCell>
              <TableCell>Strategy</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: '#9ca3af', py: 4 }}>
                  No pending put-away tasks found for this warehouse.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((t) => (
                <TableRow key={t._id} sx={{ '& td': { color: '#fff' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#818cf8' }}>{t.taskNumber}</TableCell>
                  <TableCell>
                    {t.productId?.name} ({t.productId?.sku})
                  </TableCell>
                  <TableCell>{t.quantity} units</TableCell>
                  <TableCell>
                    <Chip
                      label={t.sourceLocationId?.locationCode || 'RECEIVING'}
                      size="small"
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.suggestedLocationId?.locationCode || 'None'}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>{t.strategy}</TableCell>
                  <TableCell>
                    <Chip label={t.status} size="small" color="warning" />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ConfirmIcon />}
                      onClick={() => handleOpenConfirm(t)}
                    >
                      Confirm Move
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PutAway Confirm Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        PaperProps={{ sx: { background: '#1e293b', color: '#fff' } }}
      >
        <DialogTitle>Confirm Put-Away Move</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 360, pt: 1 }}
        >
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Product: {selectedTask?.productId?.name} ({selectedTask?.productId?.sku})
          </Typography>
          <TextField
            select
            label="Destination Location"
            value={confirmedLocationId}
            onChange={(e) => setConfirmedLocationId(e.target.value)}
            fullWidth
          >
            {locations.map((loc) => (
              <MenuItem key={loc._id} value={loc._id}>
                {loc.locationCode} ({loc.locationType})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Quantity Put Away"
            type="number"
            value={confirmedQuantity}
            onChange={(e) => setConfirmedQuantity(Number(e.target.value))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} sx={{ color: '#9ca3af' }}>
            Cancel
          </Button>
          <Button onClick={handleExecutePutAway} variant="contained" color="success">
            Execute Move
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
