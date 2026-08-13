import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PageHeader from '../../components/PageHeader';
import { apiClient } from '../../api/client';
import { toast } from 'react-hot-toast';

export default function FinanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinanceReport = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/finance/report');
      setData(res.data?.data || res.data);
    } catch {
      toast.error('Failed to load executive finance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceReport();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Executive Finance & Accounting Dashboard"
        subtitle="Real-time P&L, Balance Sheet, General Ledger & Cash Flow metrics"
        action={
          <Button
            variant="contained"
            startIcon={<AccountBalanceIcon />}
            onClick={fetchFinanceReport}
          >
            Refresh Financials
          </Button>
        }
      />

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Net Revenue
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                ${(data?.revenue || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptLongIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Cost of Goods Sold (COGS)
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${(data?.cogs || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWalletIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Gross Profit & Margin
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                ${(data?.grossProfit || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gross Margin: {data?.grossMarginPercentage || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Operating Profit
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                ${(data?.operatingProfit || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expenses: ${(data?.operatingExpenses || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Balance Sheet & Trial Balance Verification */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Balance Sheet Summary
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Assets</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      ${(data?.balanceSheet?.totalAssets || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Liabilities</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      ${(data?.balanceSheet?.totalLiabilities || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Equity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${(data?.balanceSheet?.totalEquity || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Accounting Balance Integrity</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={
                          data?.balanceSheet?.isBalanced ? 'BALANCED (Assets = L+E)' : 'UNBALANCED'
                        }
                        color={data?.balanceSheet?.isBalanced ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Trial Balance Integrity
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Debits</TableCell>
                    <TableCell align="right">
                      ${(data?.trialBalance?.totalDebit || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Credits</TableCell>
                    <TableCell align="right">
                      ${(data?.trialBalance?.totalCredit || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Zero-Sum Equality Check</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={
                          data?.trialBalance?.isBalanced
                            ? 'MATCHED (Debits == Credits)'
                            : 'MISMATCH'
                        }
                        color={data?.trialBalance?.isBalanced ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sales Tax / VAT Liability</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      ${(data?.taxSummary?.netTaxLiability || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
