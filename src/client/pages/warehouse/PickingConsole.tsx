import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { QrCodeScanner as ScanIcon } from '@mui/icons-material';
import { api } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function PickingConsole() {
  const [pickListId, setPickListId] = useState('');
  const [activePickList, setActivePickList] = useState<any>(null);
  const [scannedSku, setScannedSku] = useState('');
  const [scannedLocationCode, setScannedLocationCode] = useState('');
  const [quantityToPick, setQuantityToPick] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  // Short pick dialog state
  const [shortDialogOpen, setShortDialogOpen] = useState(false);
  const [shortReason, setShortReason] = useState('Missing Stock');
  const [actualQtyPicked, setActualQtyPicked] = useState(0);

  const handleScanAndPick = async () => {
    setErrorMessage('');
    if (!pickListId || !selectedItemId || !scannedSku || !scannedLocationCode) {
      toast.error('Please enter pick list ID, select an item, and scan SKU & location.');
      return;
    }

    try {
      const res = await api.post('/warehouses/picking/scan', {
        pickListId,
        itemId: selectedItemId,
        scannedSku,
        scannedLocationCode,
        quantityToPick,
      });

      setActivePickList(res.data);
      toast.success('Item scan validated & picked successfully!');
      setScannedSku('');
      setScannedLocationCode('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Pick scan failed';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleExecuteShortPick = async () => {
    if (!pickListId || !selectedItemId) return;
    try {
      const res = await api.post('/warehouses/picking/short', {
        pickListId,
        itemId: selectedItemId,
        shortReason,
        quantityPicked: actualQtyPicked,
      });

      setActivePickList(res.data);
      toast.success('Short pick logged and audited.');
      setShortDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit short pick');
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
          <ScanIcon fontSize="large" /> Barcode Picking Console
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Scan SKU and location codes with automated wrong-product & wrong-location protection.
        </Typography>
      </Box>

      {/* Pick List Input */}
      <Paper
        sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', mb: 3 }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              label="Enter Pick List ID / Number"
              value={pickListId}
              onChange={(e) => setPickListId(e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert Display */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            border: '1px solid #ef4444',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {errorMessage}
          </Typography>
        </Alert>
      )}

      {/* Barcode Scanner Controls */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
              1. Barcode Scan Inputs
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Scan Product SKU / Barcode"
                value={scannedSku}
                onChange={(e) => setScannedSku(e.target.value)}
                placeholder="Scan product barcode..."
                fullWidth
              />

              <TextField
                label="Scan Bin Location Code"
                value={scannedLocationCode}
                onChange={(e) => setScannedLocationCode(e.target.value)}
                placeholder="e.g. A-01-02-03"
                fullWidth
              />

              <TextField
                label="Quantity to Pick"
                type="number"
                value={quantityToPick}
                onChange={(e) => setQuantityToPick(Number(e.target.value))}
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleScanAndPick}
                >
                  Validate & Confirm Pick
                </Button>
                <Button variant="outlined" color="warning" onClick={() => setShortDialogOpen(true)}>
                  Short Pick
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Pick List Items Preview */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
              2. Target Pick Items
            </Typography>
            {!activePickList ? (
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                Load a pick list to begin scanning.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {activePickList.items.map((item: any) => (
                  <Box
                    key={item._id}
                    onClick={() => setSelectedItemId(item._id)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background:
                        selectedItemId === item._id ? 'rgba(99, 102, 241, 0.2)' : '#0f172a',
                      border:
                        selectedItemId === item._id ? '1px solid #6366f1' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                        {item.name} ({item.sku})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        Target Bin: {item.locationCode}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={`${item.quantityPicked}/${item.quantityRequired} Picked`}
                        color={
                          item.status === 'PICKED'
                            ? 'success'
                            : item.status === 'SHORT'
                              ? 'error'
                              : 'warning'
                        }
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Short Pick Modal */}
      <Dialog
        open={shortDialogOpen}
        onClose={() => setShortDialogOpen(false)}
        PaperProps={{ sx: { background: '#1e293b', color: '#fff' } }}
      >
        <DialogTitle>Report Short Pick</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 340, pt: 1 }}
        >
          <TextField
            select
            label="Short Pick Reason"
            value={shortReason}
            onChange={(e) => setShortReason(e.target.value)}
            fullWidth
          >
            {['Missing Stock', 'Damaged Stock', 'Incorrect Location', 'Inventory Error'].map(
              (r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              )
            )}
          </TextField>
          <TextField
            label="Actual Quantity Picked"
            type="number"
            value={actualQtyPicked}
            onChange={(e) => setActualQtyPicked(Number(e.target.value))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShortDialogOpen(false)} sx={{ color: '#9ca3af' }}>
            Cancel
          </Button>
          <Button onClick={handleExecuteShortPick} variant="contained" color="warning">
            Submit Short Pick
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
