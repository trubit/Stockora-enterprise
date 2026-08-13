import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { apiClient } from '../../api/client';
import { toast } from 'react-hot-toast';

export default function GeneralLedgerView() {
  const [entries, setEntries] = useState<any[]>([]);

  const fetchJournals = async () => {
    try {
      const res = await apiClient.get('/accounting/journals');
      setEntries(res.data?.data || []);
    } catch {
      toast.error('Failed to load general ledger entries.');
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="General Ledger History"
        subtitle="Searchable double-entry audit ledger records and posted accounting transactions"
      />

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Entry #</TableCell>
                <TableCell>Posting Date</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Total Debit</TableCell>
                <TableCell>Total Credit</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No journal entries recorded in general ledger yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{e.entryNumber}</TableCell>
                    <TableCell>{new Date(e.postingDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={e.source} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>${(e.totalDebit || 0).toFixed(2)}</TableCell>
                    <TableCell>${(e.totalCredit || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={e.status} size="small" color="success" />
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
