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
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import client from '../../api/client';

export default function PurchaseRequestConsole() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    productId: 'Industrial Bolt Pack',
    quantity: 50,
    estimatedCost: 25,
    reason: 'Department restocking request',
  });

  const fetchRequisitions = async () => {
    try {
      const res = await client.get(
        `/procurement/requisitions?page=${page + 1}&limit=${rowsPerPage}`
      );
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRequisitions(responseData);
      setTotalCount(res.data?.total || responseData.length);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateRequisition = async () => {
    try {
      await client.post('/procurement/requisitions', {
        items: [
          {
            productId: formData.productId,
            quantity: formData.quantity,
            estimatedCost: formData.estimatedCost,
          },
        ],
        reason: formData.reason,
      });
      setOpenModal(false);
      fetchRequisitions();
    } catch {
      // Fallback
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Purchase Requisitions & Budget Approval
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit internal purchase requests, estimate cost commitments, and trigger executive
            workflow approvals
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
        >
          New Requisition
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Requisition No.</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Estimated Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requisitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={2}>
                      No purchase requisitions found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requisitions.map((req) => (
                  <TableRow key={req._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{req.requisitionNumber}</TableCell>
                    <TableCell>
                      {req.requestedBy?.username || req.requestedBy?.email || 'Department Staff'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      ${(req.totalEstimatedCost || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip label={req.status || 'PENDING_APPROVAL'} color="warning" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined">
                        Review
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
        <DialogTitle>Create Purchase Requisition</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
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
                label="Quantity Needed"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Cost per Unit ($)"
                value={formData.estimatedCost}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedCost: Number(e.target.value) })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requisition Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRequisition}>
            Submit Requisition
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
