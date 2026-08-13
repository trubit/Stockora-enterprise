import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Paper,
  IconButton,
} from '@mui/material';
import WarehouseIcon from '@mui/icons-material/Storefront';
import RefreshIcon from '@mui/icons-material/Refresh';
import AIIcon from '@mui/icons-material/AutoAwesome';
import { api } from '../../api/client.ts';
import { socket } from '../../socket.ts';

export default function WarehouseDashboard() {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      setWarehouses(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedWarehouseId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (whId: string) => {
    if (!whId) return;
    try {
      const [anaRes, aiRes] = await Promise.all([
        api.get(`/warehouses/${whId}/analytics`),
        api.get(`/warehouses/${whId}/ai-insights`),
      ]);
      setAnalytics(anaRes.data);
      setAiInsights(aiRes.data?.insights || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchAnalytics(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    socket.on('warehouse.inventory.moved', () => {
      if (selectedWarehouseId) fetchAnalytics(selectedWarehouseId);
    });
    socket.on('warehouse.pick.completed', () => {
      if (selectedWarehouseId) fetchAnalytics(selectedWarehouseId);
    });
    return () => {
      socket.off('warehouse.inventory.moved');
      socket.off('warehouse.pick.completed');
    };
  }, [selectedWarehouseId]);

  return (
    <Box sx={{ p: 3, background: '#0b0f19', minHeight: '100vh', color: '#f3f4f6' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WarehouseIcon fontSize="large" /> WMS Operations & Intelligence Center
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Real-time warehouse utilization, picking performance, put-away tasks, and AI slotting insights.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {warehouses.map((wh) => (
            <Button
              key={wh._id}
              variant={selectedWarehouseId === wh._id ? 'contained' : 'outlined'}
              onClick={() => setSelectedWarehouseId(wh._id)}
              sx={{
                borderRadius: '8px',
                borderColor: selectedWarehouseId === wh._id ? '#6366f1' : 'rgba(255,255,255,0.1)',
                background: selectedWarehouseId === wh._id ? '#6366f1' : 'transparent',
              }}
            >
              {wh.name} ({wh.code})
            </Button>
          ))}
          <IconButton onClick={() => selectedWarehouseId && fetchAnalytics(selectedWarehouseId)} sx={{ color: '#9ca3af' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <LinearProgress sx={{ my: 4, borderRadius: 2 }} />
      ) : (
        <Grid container spacing={3}>
          {/* Key KPI Metrics */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: '#9ca3af' }}>Storage Capacity</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
                  {analytics?.capacity?.utilizationPercentage || 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analytics?.capacity?.utilizationPercentage || 0}
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#334155', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }}
                />
                <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 1 }}>
                  {analytics?.capacity?.usedUnits || 0} / {analytics?.capacity?.totalCapacityUnits || 0} units stored
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: '#9ca3af' }}>Pick Accuracy Rate</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', my: 1 }}>
                  {analytics?.fulfillment?.pickAccuracyPercentage || 100}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  {analytics?.fulfillment?.completedPickLists || 0} pick lists completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: '#9ca3af' }}>Pending Put-away</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', my: 1 }}>
                  {analytics?.logistics?.pendingPutawayTasks || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>Tasks waiting at receiving dock</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: '#9ca3af' }}>Dispatches Executed</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ec4899', my: 1 }}>
                  {analytics?.fulfillment?.totalDispatchesExecuted || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>Carrier pickups completed</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* AI Intelligence Advisory Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AIIcon sx={{ color: '#a855f7' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>AI Warehouse Advisory & Recommendations</Typography>
              </Box>
              <Grid container spacing={2}>
                {aiInsights.map((insight, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Box sx={{ p: 2, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 600 }}>{insight.insight}</Typography>
                      <Typography variant="body2" sx={{ color: '#cbd5e1', my: 0.5 }}>{insight.reason}</Typography>
                      <Typography variant="caption" sx={{ color: '#10b981', display: 'block', fontWeight: 600 }}>
                        Recommendation: {insight.recommendedAction}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
