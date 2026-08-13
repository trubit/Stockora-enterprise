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
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import client from '../../api/client';

export default function PurchaseOrderConsole() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    supplierId: '',
    productId: 'Industrial Bolt Pack',
    quantity: 100,
    costPrice: 50,
    shippingCost: 50,
  });

  const fetchOrders = async () => {
    try {
      const res = await client.get(
        `/procurement/purchase-orders?page=${page + 1}&limit=${rowsPerPage}`
      );
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setPurchaseOrders(responseData);
      setTotalCount(res.data?.total || responseData.length);
    } catch {
      // Fallback
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await client.get('/procurement/suppliers');
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setSuppliers(responseData);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateOrder = async () => {
    try {
      await client.post('/procurement/purchase-orders', {
        supplierId: formData.supplierId || 'default-supplier',
        items: [
          {
            productId: formData.productId,
            quantity: formData.quantity,
            costPrice: formData.costPrice,
          },
        ],
        shippingCost: formData.shippingCost,
      });
      setOpenModal(false);
      fetchOrders();
    } catch {
      // Fallback
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await client.post(`/procurement/purchase-orders/${id}/approve`);
      fetchOrders();
    } catch {
      // Fallback
    }
  };

  const handleSend = async (id: string) => {
    try {
      await client.post(`/procurement/purchase-orders/${id}/send`);
      fetchOrders();
    } catch {
      // Fallback
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="APPROVED" color="success" size="small" />;
      case 'PENDING_APPROVAL':
        return <Chip label="PENDING APPROVAL" color="warning" size="small" />;
      case 'SENT':
        return <Chip label="SENT TO SUPPLIER" color="info" size="small" />;
      case 'RECEIVED':
        return <Chip label="RECEIVED" color="success" size="small" />;
      default:
        return <Chip label={status || 'DRAFT'} color="default" size="small" />;
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Purchase Orders & Versioning Console
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate, approve, send, and audit version history for enterprise Purchase Orders
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
        >
          Create Purchase Order
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={2}>
                      No Purchase Orders created.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{po.poNumber}</TableCell>
                    <TableCell>{po.supplierId?.name || 'Supplier'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      ${(po.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip label={`v${po.version || 1}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{getStatusChip(po.status)}</TableCell>
                    <TableCell align="right">
                      {po.status === 'PENDING_APPROVAL' && (
                        <Button size="small" color="success" onClick={() => handleApprove(po._id)}>
                          Approve
                        </Button>
                      )}
                      {po.status === 'APPROVED' && (
                        <Button
                          size="small"
                          color="info"
                          startIcon={<SendIcon />}
                          onClick={() => handleSend(po._id)}
                        >
                          Send Vendor
                        </Button>
                      )}
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
        <DialogTitle>Create Enterprise Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Select Supplier"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              >
                {suppliers.map((sup) => (
                  <MenuItem key={sup._id} value={sup._id}>
                    {sup.name} ({sup.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product ID / SKU / Name"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Cost Price ($)"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Shipping ($)"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateOrder}>
            Generate PO
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
