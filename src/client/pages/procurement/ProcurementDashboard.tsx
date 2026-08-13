import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TablePagination,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import client from '../../api/client';

export default function ProcurementDashboard() {
  const [metrics] = useState({
    activeSuppliers: 42,
    openPurchaseOrders: 18,
    pendingReceipts: 6,
    unmatchedInvoices: 3,
  });
  const [recentPOs, setRecentPOs] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDashboardData = async () => {
    try {
      const res = await client.get(
        `/procurement/purchase-orders?page=${page + 1}&limit=${rowsPerPage}`
      );
      const responseData = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRecentPOs(responseData);
      setTotalCount(res.data?.total || responseData.length);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="APPROVED" color="success" size="small" />;
      case 'PENDING_APPROVAL':
        return <Chip label="PENDING APPROVAL" color="warning" size="small" />;
      case 'SENT':
        return <Chip label="SENT TO VENDOR" color="info" size="small" />;
      case 'RECEIVED':
        return <Chip label="RECEIVED" color="success" size="small" />;
      default:
        return <Chip label={status || 'DRAFT'} color="default" size="small" />;
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
        Procurement & Supply Chain Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Enterprise Purchasing, Supplier Scorecards, Barcode Goods Receiving & 3-Way Invoice Matching
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Active Suppliers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.activeSuppliers}
                  </Typography>
                </Box>
                <VerifiedUserIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Open Purchase Orders
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.openPurchaseOrders}
                  </Typography>
                </Box>
                <ShoppingCartIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pending Deliveries
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.pendingReceipts}
                  </Typography>
                </Box>
                <LocalShippingIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    3-Way Match Pending
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.unmatchedInvoices}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Recent Purchase Orders
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={2}>
                      No recent purchase orders found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentPOs.map((po) => (
                  <TableRow key={po._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{po.poNumber}</TableCell>
                    <TableCell>{po.supplierId?.name || 'Supplier'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      ${po.totalAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusChip(po.status)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined">
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
    </Box>
  );
}
