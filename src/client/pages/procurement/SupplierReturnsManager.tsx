import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import ReturnIcon from '@mui/icons-material/AssignmentReturn';
import client from '../../api/client';

export default function SupplierReturnsManager() {
  const [supplierReturns, setSupplierReturns] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('Industrial Bolt Pack');
  const [quantity, setQuantity] = useState(5);
  const [unitCost, setUnitCost] = useState(25);
  const [reason, setReason] = useState('Defective shipment');
  const [createdReturn, setCreatedReturn] = useState<any>(null);

  const fetchReturns = async () => {
    try {
      const res = await client.get(
        `/procurement/supplier-returns?page=${page + 1}&limit=${rowsPerPage}`
      );
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setSupplierReturns(responseData);
      setTotalCount(res.data?.total || responseData.length);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateReturn = async () => {
    try {
      const res = await client.post('/procurement/supplier-returns', {
        supplierId,
        items: [{ productId, quantity, unitCost, reason }],
      });
      setCreatedReturn(res.data);
      fetchReturns();
    } catch {
      // Fallback
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
        Supplier Returns & Credit Notes
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Process return-to-supplier requests, generate vendor credit notes, and post inventory
        adjustments
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              New Return Request (RTS)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Supplier Code / Name"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  placeholder="Apex Industrial Supplies"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Product ID / SKU / Name"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Unit Cost ($)"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label="Total ($)" value={quantity * unitCost} disabled />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Return Reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              color="error"
              startIcon={<ReturnIcon />}
              onClick={handleCreateReturn}
              sx={{ mt: 3 }}
            >
              Generate Return & Credit Note
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Supplier Credit Summary
            </Typography>
            {createdReturn ? (
              <Alert severity="success">
                Return Issued: <strong>{createdReturn.returnNumber}</strong>
                <br />
                Credit Note: <strong>{createdReturn.creditNoteNumber}</strong>
                <br />
                Total Amount: <strong>${createdReturn.totalAmount}</strong>
                <br />
                Status: <Chip label={createdReturn.status} color="success" size="small" />
              </Alert>
            ) : (
              <Typography color="text.secondary">No return request created yet.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Supplier Returns Log
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Return Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Credit Note</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={2}>
                      No supplier returns logged.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                supplierReturns.map((rts) => (
                  <TableRow key={rts._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{rts.returnNumber}</TableCell>
                    <TableCell>{rts.supplierId?.name || 'Supplier'}</TableCell>
                    <TableCell>{rts.creditNoteNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      ${(rts.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip label={rts.status || 'APPROVED'} color="success" size="small" />
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
    </Box>
  );
}
