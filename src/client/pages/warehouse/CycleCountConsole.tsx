import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { QrCodeScanner as CountIcon, CheckCircle as ApproveIcon } from '@mui/icons-material';
import { api } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function CycleCountConsole() {
  const [countType, setCountType] = useState('SCHEDULED');
  const [isBlindCount, setIsBlindCount] = useState(true);
  const [activeCount, setActiveCount] = useState<any>(null);
  const [countInputs, setCountInputs] = useState<Record<string, number>>({});

  const handleCreateCount = async () => {
    try {
      const res = await api.post('/warehouses/cycle-count', {
        warehouseId: 'default-wh',
        countType,
        isBlindCount,
      });

      setActiveCount(res.data);
      toast.success(`Cycle count [${res.data.countNumber}] created!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create cycle count');
    }
  };

  const handleSubmitCounts = async () => {
    if (!activeCount) return;
    const items = Object.entries(countInputs).map(([itemId, countedQuantity]) => ({
      itemId,
      countedQuantity,
    }));

    try {
      const res = await api.post(`/warehouses/cycle-count/${activeCount._id}/submit`, { items });
      setActiveCount(res.data);
      toast.success(
        res.data.status === 'REVIEW_REQUIRED'
          ? 'Count submitted! Variance requires supervisor approval.'
          : 'Count submitted & adjustments automatically applied!'
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit count');
    }
  };

  const handleApproveCount = async () => {
    if (!activeCount) return;
    try {
      const res = await api.post(`/warehouses/cycle-count/${activeCount._id}/approve`);
      setActiveCount(res.data);
      toast.success('Cycle count adjustments approved and posted to inventory!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve cycle count');
    }
  };

  return (
    <Box sx={{ p: 3, background: '#0b0f19', minHeight: '100vh', color: '#f3f4f6' }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CountIcon fontSize="large" /> Cycle Counting & Stock Audits
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Execute blind cycle counts, audit stock variances, and trigger approval-driven
          adjustments.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
              Create New Count Task
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Count Type"
                value={countType}
                onChange={(e) => setCountType(e.target.value)}
                fullWidth
              >
                {['SCHEDULED', 'RANDOM', 'ABC', 'LOCATION', 'PRODUCT'].map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant={isBlindCount ? 'contained' : 'outlined'}
                onClick={() => setIsBlindCount(!isBlindCount)}
                color="secondary"
              >
                Blind Count Mode: {isBlindCount ? 'ON (Expected Hidden)' : 'OFF'}
              </Button>

              <Button
                variant="contained"
                onClick={handleCreateCount}
                sx={{ background: '#6366f1' }}
              >
                Generate Cycle Count Task
              </Button>
            </Box>
          </Paper>
        </Grid>

        {activeCount && (
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#818cf8', fontWeight: 700 }}>
                  Count Task: {activeCount.countNumber}
                </Typography>
                <Chip
                  label={activeCount.status}
                  color={activeCount.status === 'COMPLETED' ? 'success' : 'warning'}
                />
              </Box>

              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { color: '#9ca3af' } }}>
                      <TableCell>Location</TableCell>
                      <TableCell>Product</TableCell>
                      {!activeCount.isBlindCount && <TableCell>Expected</TableCell>}
                      <TableCell>Physical Count</TableCell>
                      {activeCount.status !== 'ASSIGNED' && <TableCell>Variance</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeCount.items.map((item: any) => (
                      <TableRow key={item._id} sx={{ '& td': { color: '#fff' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#818cf8' }}>
                          {item.locationCode}
                        </TableCell>
                        <TableCell>
                          {item.name} ({item.sku})
                        </TableCell>
                        {!activeCount.isBlindCount && (
                          <TableCell>{item.expectedQuantity}</TableCell>
                        )}
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={countInputs[item._id] ?? (item.countedQuantity || 0)}
                            onChange={(e) =>
                              setCountInputs({ ...countInputs, [item._id]: Number(e.target.value) })
                            }
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        {activeCount.status !== 'ASSIGNED' && (
                          <TableCell
                            sx={{
                              color: item.variance === 0 ? '#10b981' : '#ef4444',
                              fontWeight: 700,
                            }}
                          >
                            {item.variance > 0 ? `+${item.variance}` : item.variance}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeCount.status === 'ASSIGNED' && (
                  <Button variant="contained" color="primary" onClick={handleSubmitCounts}>
                    Submit Count Results
                  </Button>
                )}
                {activeCount.status === 'REVIEW_REQUIRED' && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<ApproveIcon />}
                    onClick={handleApproveCount}
                  >
                    Approve Variance & Post Adjustments
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
