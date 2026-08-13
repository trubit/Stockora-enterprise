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
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { apiClient } from '../../api/client';
import { toast } from 'react-hot-toast';

export default function FinancialStatementsView() {
  const [tab, setTab] = useState(0);
  const [report, setReport] = useState<any>(null);

  const fetchReport = async () => {
    try {
      const res = await apiClient.get('/finance/report');
      setReport(res.data?.data || res.data);
    } catch {
      toast.error('Failed to load financial statements.');
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Official Financial Statements (GAAP / IFRS)"
        subtitle="Profit & Loss (P&L), Balance Sheet, Trial Balance & Cash Flow Statements"
      />

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Profit & Loss (P&L)" />
            <Tab label="Balance Sheet" />
            <Tab label="Trial Balance" />
          </Tabs>

          {tab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Income Statement (P&L)
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Gross Sales Revenue</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      ${(report?.revenue || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cost of Goods Sold (COGS)</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -${(report?.cogs || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Gross Profit</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      ${(report?.grossProfit || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Operating Expenses</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -${(report?.operatingExpenses || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Net Operating Profit</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'success.main' }}
                    >
                      ${(report?.operatingProfit || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Balance Sheet Statement (Assets = Liabilities + Equity)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Assets</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      ${(report?.balanceSheet?.totalAssets || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Liabilities</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      ${(report?.balanceSheet?.totalLiabilities || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total Equity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${(report?.balanceSheet?.totalEquity || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Trial Balance Zero-Sum Integrity
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Account Code & Name</TableCell>
                    <TableCell align="right">Debit ($)</TableCell>
                    <TableCell align="right">Credit ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report?.trialBalance?.lines?.map((l: any) => (
                    <TableRow key={l.accountCode}>
                      <TableCell>
                        <strong>{l.accountCode}</strong> — {l.accountName}
                      </TableCell>
                      <TableCell align="right">${(l.debit || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">${(l.credit || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total General Ledger Balance</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${(report?.trialBalance?.totalDebit || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${(report?.trialBalance?.totalCredit || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
