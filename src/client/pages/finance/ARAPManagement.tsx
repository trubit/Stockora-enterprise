import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { apiClient } from '../../api/client';
import { toast } from 'react-hot-toast';

export default function ARAPManagement() {
  const [tab, setTab] = useState(0);
  const [arRecords, setArRecords] = useState<any[]>([]);
  const [apRecords, setApRecords] = useState<any[]>([]);

  const fetchARAP = async () => {
    try {
      const arRes = await apiClient.get('/ar-ap/receivables');
      setArRecords(arRes.data?.data || []);
      const apRes = await apiClient.get('/ar-ap/payables');
      setApRecords(apRes.data?.data || []);
    } catch {
      toast.error('Failed to load AR/AP records.');
    }
  };

  useEffect(() => {
    fetchARAP();
  }, []);

  const handleRecordARPayment = async (invoiceId: string, amount: number) => {
    try {
      await apiClient.post('/ar-ap/receivables/payment', {
        invoiceId,
        amountPaid: amount,
        paymentMethod: 'BANK_TRANSFER',
      });
      toast.success('Customer Payment Recorded & Posted to Ledger!');
      fetchARAP();
    } catch {
      toast.error('Failed to record payment.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Accounts Receivable (AR) & Accounts Payable (AP)"
        subtitle="Manage customer balances, vendor bills, and 30-60-90+ day aging buckets"
      />

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Accounts Receivable (Customer AR)" />
            <Tab label="Accounts Payable (Vendor AP)" />
          </Tabs>

          {tab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Customer Accounts Receivable & Aging
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Balance Due</TableCell>
                    <TableCell>Aging Bucket</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {arRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No active customer receivables.
                      </TableCell>
                    </TableRow>
                  ) : (
                    arRecords.map((ar) => (
                      <TableRow key={ar._id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{ar.invoiceNumber}</TableCell>
                        <TableCell>{ar.customerName}</TableCell>
                        <TableCell>${(ar.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          ${(ar.balanceDue || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip label={ar.agingBucket} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ar.status}
                            size="small"
                            color={ar.status === 'PAID' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {ar.balanceDue > 0 && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() =>
                                handleRecordARPayment(ar.invoiceId || ar._id, ar.balanceDue)
                              }
                            >
                              Record Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Vendor Accounts Payable & Bills
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bill Invoice #</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Balance Due</TableCell>
                    <TableCell>Aging Bucket</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No unpaid vendor bills.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apRecords.map((ap) => (
                      <TableRow key={ap._id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{ap.invoiceNumber}</TableCell>
                        <TableCell>{ap.supplierName}</TableCell>
                        <TableCell>${(ap.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          ${(ap.balanceDue || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip label={ap.agingBucket} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ap.status}
                            size="small"
                            color={ap.status === 'PAID' ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
