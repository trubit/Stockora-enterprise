import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Alert,
  TablePagination,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import client from '../../api/client';

export default function GoodsReceivingConsole() {
  const [goodsReceipts, setGoodsReceipts] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    poId: '',
    productId: 'Industrial Bolt Pack',
    quantityReceived: 10,
    batchNumber: 'BATCH-2026-001',
    notes: 'Received shipment in good order.',
  });

  const fetchGoodsReceipts = async () => {
    try {
      const res = await client.get(
        `/procurement/goods-receipts?page=${page + 1}&limit=${rowsPerPage}`
      );
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setGoodsReceipts(responseData);
      setTotalCount(res.data?.total || responseData.length);
    } catch {
      // Fallback
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await client.get('/procurement/purchase-orders');
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setPurchaseOrders(responseData);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchGoodsReceipts();
    fetchPurchaseOrders();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleReceiveGoods = async () => {
    try {
      await client.post('/procurement/goods-receipts', {
        poId: formData.poId,
        items: [
          {
            productId: formData.productId,
            quantityReceived: formData.quantityReceived,
            batchNumber: formData.batchNumber,
            barcodeScanned: true,
          },
        ],
        notes: formData.notes,
      });
      setOpenModal(false);
      fetchGoodsReceipts();
    } catch {
      // Fallback
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Barcode Goods Receiving & Quality Inspection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process incoming vendor shipments, scan barcodes, run quality inspections & isolate
            quarantine stock
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => setOpenModal(true)}
        >
          Receive New Shipment
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Over-receiving variance limit is strictly capped at 5%. Received items auto-update weighted
        average product costs.
      </Alert>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>GRN Number</TableCell>
                <TableCell>PO Reference</TableCell>
                <TableCell>Received Date</TableCell>
                <TableCell>Quality Inspection</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {goodsReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={2}>
                      No goods receipts recorded.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                goodsReceipts.map((grn) => (
                  <TableRow key={grn._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{grn.grnNumber}</TableCell>
                    <TableCell>{grn.poId?.poNumber || 'PO Reference'}</TableCell>
                    <TableCell>{new Date(grn.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={grn.inspectionStatus || 'PASSED'} color="success" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<LocalShippingIcon />}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Receive Incoming Vendor Shipment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Purchase Order (Optional)"
                value={formData.poId}
                onChange={(e) => setFormData({ ...formData, poId: e.target.value })}
              >
                <MenuItem value="">-- Auto-Assign / Recent Purchase Order --</MenuItem>
                {purchaseOrders.map((po) => (
                  <MenuItem key={po._id} value={po._id}>
                    {po.poNumber} - ${po.totalAmount}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Product ID / SKU / Name"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity Received"
                value={formData.quantityReceived}
                onChange={(e) =>
                  setFormData({ ...formData, quantityReceived: Number(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Batch / Lot Number"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Receiving Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReceiveGoods}>
            Submit Receiving
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
