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
  Alert,
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MatchIcon from '@mui/icons-material/FactCheck';
import client from '../../api/client';

export default function ThreeWayMatchingConsole() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    poId: '',
    subtotal: 1000,
    taxAmount: 80,
    totalAmount: 1080,
    invoiceDate: '',
    dueDate: '',
  });

  const fetchInvoices = async () => {
    try {
      const res = await client.get(`/procurement/invoices?page=${page + 1}&limit=${rowsPerPage}`);
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setInvoices(responseData);
      setTotalCount(res.data?.total || responseData.length);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchInvoices();
    const today = new Date();
    const future = new Date(today.getTime() + 30 * 86400000);
    setFormData((prev) => ({
      ...prev,
      invoiceDate: today.toISOString().split('T')[0],
      dueDate: future.toISOString().split('T')[0],
    }));
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSubmitInvoice = async () => {
    try {
      await client.post('/procurement/invoices', {
        ...formData,
        items: [
          { productId: 'Industrial Bolt Pack', quantity: 10, unitPrice: 100, lineTotal: 1000 },
        ],
      });
      setOpenModal(false);
      fetchInvoices();
    } catch {
      // Fallback
    }
  };

  const getMatchChip = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return <Chip label="MATCHED (Auto AP Posted)" color="success" size="small" />;
      case 'PRICE_VARIANCE':
        return <Chip label="PRICE VARIANCE" color="error" size="small" />;
      case 'QUANTITY_VARIANCE':
        return <Chip label="QUANTITY VARIANCE" color="warning" size="small" />;
      case 'TAX_VARIANCE':
        return <Chip label="TAX VARIANCE" color="warning" size="small" />;
      default:
        return <Chip label={status || 'UNMATCHED'} color="default" size="small" />;
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Three-Way Invoice Matching Engine
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automated verification across Purchase Orders, Goods Receipts & Supplier Invoices with
            auto AP posting
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
        >
          Submit Supplier Invoice
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Invoices that match Purchase Orders & Goods Receipts with zero price or quantity variance
        are automatically posted to Accounts Payable and General Ledger.
      </Alert>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>3-Way Match Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={2}>
                      No invoices submitted.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.supplierId?.name || 'Supplier'}</TableCell>
                    <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      ${(inv.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{getMatchChip(inv.matchStatus)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<MatchIcon />}>
                        Review Match
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
        <DialogTitle>Submit Supplier Invoice for 3-Way Match</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Supplier Code / Name"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                placeholder="Apex Industrial Supplies"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-2026-001"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Linked PO Number (Optional)"
                value={formData.poId}
                onChange={(e) => setFormData({ ...formData, poId: e.target.value })}
                placeholder="PO-2026-1001"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Subtotal ($)"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Tax Amount ($)"
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitInvoice}>
            Match & Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
