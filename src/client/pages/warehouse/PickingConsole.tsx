import { useEffect, useState } from 'react';
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
import ScanIcon from '@mui/icons-material/QrCodeScanner';
import { api } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function PickingConsole() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
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

  const handleGeneratePickList = async () => {
    try {
      const res = await api.post('/warehouses/picking', {
        warehouseId: selectedWarehouseId || 'wh-main',
        orderId: 'order-demo-01',
        orderNumber: 'STK-2026-PICK-DEMO',
        priority: 'HIGH',
      });
      setActivePickList(res.data);
      setPickListId(res.data._id);
      if (res.data.items && res.data.items.length > 0) {
        const firstItem = res.data.items[0];
        setSelectedItemId(firstItem._id);
        setScannedSku(firstItem.sku);
        setScannedLocationCode(firstItem.locationCode);
      }
      toast.success(
        `Pick List [${res.data.pickListNumber}] generated & ready for barcode picking!`
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate pick list');
    }
  };

  const handleScanAndPick = async () => {
    setErrorMessage('');
    try {
      const res = await api.post('/warehouses/picking/scan', {
        pickListId: pickListId || activePickList?._id || 'pick-1',
        itemId: selectedItemId || activePickList?.items[0]?._id || 'item-1',
        scannedSku: scannedSku || activePickList?.items[0]?.sku || 'SKU-01',
        scannedLocationCode:
          scannedLocationCode || activePickList?.items[0]?.locationCode || 'A-01-01-01',
        quantityToPick,
      });

      setActivePickList(res.data.pickList);
      toast.success('Item scan validated & picked successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Pick scan failed';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleLogShortPick = async () => {
    try {
      const res = await api.post('/warehouses/picking/short', {
        pickListId: pickListId || activePickList?._id,
        itemId: selectedItemId,
        shortReason,
        quantityPicked: actualQtyPicked,
      });
      setActivePickList(res.data.pickList);
      setShortDialogOpen(false);
      toast.success('Short pick logged & exception reported!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log short pick');
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
          <ScanIcon fontSize="large" /> Barcode Picking & Error Protection Console
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Execute order picking with mandatory barcode SKU and bin location verification.
        </Typography>
      </Box>

      {/* Warehouse Selector & Generate Button */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        {warehouses.map((wh) => (
          <Button
            key={wh._id}
            variant={selectedWarehouseId === wh._id ? 'contained' : 'outlined'}
            onClick={() => setSelectedWarehouseId(wh._id)}
          >
            {wh.name} ({wh.code})
          </Button>
        ))}
        <Button variant="contained" color="secondary" onClick={handleGeneratePickList}>
          + Generate Demo Pick List
        </Button>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 700, borderRadius: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
              Scan Verification Station
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Pick List ID"
                value={pickListId}
                onChange={(e) => setPickListId(e.target.value)}
                placeholder="Active Pick List ID"
                fullWidth
              />

              <TextField
                label="Scan Barcode / SKU"
                value={scannedSku}
                onChange={(e) => setScannedSku(e.target.value)}
                placeholder="Scan product barcode..."
                fullWidth
              />

              <TextField
                label="Scan Location Bin Code"
                value={scannedLocationCode}
                onChange={(e) => setScannedLocationCode(e.target.value)}
                placeholder="e.g. A-01-01-01"
                fullWidth
              />

              <TextField
                label="Quantity Picked"
                type="number"
                value={quantityToPick}
                onChange={(e) => setQuantityToPick(Number(e.target.value))}
                fullWidth
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleScanAndPick}
                sx={{ background: '#6366f1' }}
              >
                Validate Scan & Record Pick
              </Button>
            </Box>
          </Paper>
        </Grid>

        {activePickList && (
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#818cf8', fontWeight: 700 }}>
                  Active List: {activePickList.pickListNumber} ({activePickList.orderNumber})
                </Typography>
                <Chip
                  label={activePickList.status}
                  color={activePickList.status === 'PICKED' ? 'success' : 'warning'}
                />
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1 }}>
                Pick Items ({activePickList.totalPicked}/{activePickList.totalRequired} units
                picked):
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {activePickList.items?.map((item: any) => (
                  <Box
                    key={item._id}
                    onClick={() => {
                      setSelectedItemId(item._id);
                      setScannedSku(item.sku);
                      setScannedLocationCode(item.locationCode);
                    }}
                    sx={{
                      p: 2,
                      background:
                        selectedItemId === item._id
                          ? 'rgba(99, 102, 241, 0.2)'
                          : 'rgba(15, 23, 42, 0.6)',
                      border:
                        selectedItemId === item._id
                          ? '1px solid #6366f1'
                          : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 2,
                      cursor: 'pointer',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                        {item.name} ({item.sku})
                      </Typography>
                      <Chip label={`Bin: ${item.locationCode}`} size="small" color="primary" />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#cbd5e1', display: 'block', mt: 0.5 }}
                    >
                      Progress: {item.quantityPicked} / {item.quantityRequired} units | Status:{' '}
                      {item.status}
                    </Typography>

                    {item.status !== 'PICKED' && (
                      <Button
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item._id);
                          setShortDialogOpen(true);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Report Short Pick
                      </Button>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Short Pick Modal */}
      <Dialog
        open={shortDialogOpen}
        onClose={() => setShortDialogOpen(false)}
        PaperProps={{ sx: { background: '#1e293b', color: '#fff' } }}
      >
        <DialogTitle>Log Short Pick Exception</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 360, pt: 1 }}
        >
          <TextField
            label="Actual Quantity Picked"
            type="number"
            value={actualQtyPicked}
            onChange={(e) => setActualQtyPicked(Number(e.target.value))}
            fullWidth
          />
          <TextField
            label="Reason for Short Pick"
            value={shortReason}
            onChange={(e) => setShortReason(e.target.value)}
            placeholder="e.g. Missing Stock, Damaged Goods"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShortDialogOpen(false)} sx={{ color: '#9ca3af' }}>
            Cancel
          </Button>
          <Button onClick={handleLogShortPick} variant="contained" color="error">
            Submit Short Pick
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
