import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PageHeader from '../../components/PageHeader';
import { apiClient } from '../../api/client';
import { toast } from 'react-hot-toast';

export default function FiscalPeriodManager() {
  const [periods, setPeriods] = useState<any[]>([]);

  const fetchPeriods = async () => {
    try {
      const res = await apiClient.get('/accounting/periods');
      setPeriods(res.data?.data || []);
    } catch {
      toast.error('Failed to load fiscal periods.');
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleClosePeriod = async (periodCode: string) => {
    try {
      await apiClient.post('/accounting/periods/close', { periodCode });
      toast.success(`Fiscal Period ${periodCode} Closed Successfully!`);
      fetchPeriods();
    } catch {
      toast.error('Failed to close fiscal period.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Fiscal Period Management & Governance"
        subtitle="Manage fiscal accounting periods and enforce period closing controls to prevent retroactive edits"
      />

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period Code</TableCell>
                <TableCell>Fiscal Year / Month</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No closed fiscal periods. All accounting periods open.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{p.periodCode}</TableCell>
                    <TableCell>
                      {p.year} - Month {p.month}
                    </TableCell>
                    <TableCell>{new Date(p.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(p.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.status}
                        color={p.status === 'OPEN' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {p.status === 'OPEN' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<LockIcon />}
                          onClick={() => handleClosePeriod(p.periodCode)}
                        >
                          Close Period
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
