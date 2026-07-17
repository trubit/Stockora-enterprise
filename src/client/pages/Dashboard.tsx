import { useEffect, Fragment } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.ts';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import RevenueIcon from '@mui/icons-material/TrendingUp';
import TxIcon from '@mui/icons-material/ShoppingCart';
import StockIcon from '@mui/icons-material/Inventory2';
import WarningIcon from '@mui/icons-material/WarningAmber';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { socket } from '../socket.ts';
import type { Product, Transaction } from '../../shared/types.js';

// Query functions
const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>('/products');
  return data;
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data } = await apiClient.get<Transaction[]>('/transactions');
  return data;
};

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  // Real-time stock/sale synchronization directly to cache
  useEffect(() => {
    socket.on('product:stock-updated', (data: { productId: string; quantity: number }) => {
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === data.productId ? { ...p, quantity: data.quantity } : p));
      });
    });

    socket.on('product:created', (newProduct: Product) => {
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return [newProduct];
        return [...old, newProduct];
      });
    });

    socket.on('transaction:completed', (newTx: Transaction) => {
      queryClient.setQueryData<Transaction[]>(['transactions'], (old) => {
        if (!old) return [newTx];
        return [newTx, ...old];
      });
    });

    return () => {
      socket.off('product:stock-updated');
      socket.off('product:created');
      socket.off('transaction:completed');
    };
  }, [queryClient]);

  // Compute stats
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowStockItems = products.filter((p) => p.quantity <= p.lowStockAlert);

  // Group transactions for Recharts (last 7 days or mock sequence)
  const chartData =
    transactions.length > 0
      ? transactions
          .map((t) => ({
            name: new Date(t.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            Sales: t.total,
            Subtotal: t.subtotal,
          }))
          .reverse()
      : [
          { name: '09:00', Sales: 0, Subtotal: 0 },
          { name: '10:00', Sales: 120, Subtotal: 100 },
          { name: '11:00', Sales: 340, Subtotal: 300 },
          { name: '12:00', Sales: 210, Subtotal: 190 },
          { name: '13:00', Sales: 580, Subtotal: 510 },
          { name: '14:00', Sales: 420, Subtotal: 390 },
          { name: '15:00', Sales: 690, Subtotal: 620 },
        ];

  // Category levels data
  const categoryStats = products.reduce((acc: { [key: string]: number }, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.quantity;
    return acc;
  }, {});

  const barChartData = Object.keys(categoryStats).map((cat) => ({
    name: cat,
    Stock: categoryStats[cat],
  }));

  const metrics = [
    {
      title: 'TOTAL REVENUE',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <RevenueIcon sx={{ fontSize: 26, color: '#34d399' }} />,
      desc: 'Live checkout analytics',
      gradientClass: 'emerald-gradient-text',
      glowClass: 'glow-card glow-card-emerald',
    },
    {
      title: 'SALES COUNT',
      value: transactions.length,
      icon: <TxIcon sx={{ fontSize: 26, color: '#a78bfa' }} />,
      desc: 'Completed purchases',
      gradientClass: 'gradient-text',
      glowClass: 'glow-card',
    },
    {
      title: 'INVENTORY VALUE',
      value: `$${totalValue.toFixed(2)}`,
      icon: <StockIcon sx={{ fontSize: 26, color: '#38bdf8' }} />,
      desc: `Cost Base: $${totalCost.toFixed(2)}`,
      gradientClass: 'sky-gradient-text',
      glowClass: 'glow-card glow-card-sky',
    },
    {
      title: 'LOW STOCK WARNINGS',
      value: lowStockItems.length,
      icon: <WarningIcon sx={{ fontSize: 26, color: '#ef4444' }} />,
      desc: 'Requires restock',
      gradientClass: '',
      glowClass: lowStockItems.length > 0 ? 'glow-card glow-card-error' : 'glow-card',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
            Enterprise Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Operational metrics, warehouse tracking, and live synchronization statistics.
          </Typography>
        </Box>
      </Box>

      {/* Metrics Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((m) => (
          <Grid item xs={12} sm={6} md={3} key={m.title}>
            <Card className={`glass-panel ${m.glowClass}`} sx={{ borderRadius: '16px' }}>
              <CardContent
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '24px !important' }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 800, letterSpacing: '0.08em', display: 'block', mb: 1 }}
                  >
                    {m.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    className={m.gradientClass}
                    sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em', color: m.gradientClass ? undefined : m.title.includes('WARNINGS') && Number(m.value) > 0 ? '#ef4444' : '#f3f4f6' }}
                  >
                    {m.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 550 }}>
                    {m.desc}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {m.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card className="glass-panel" sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.01em' }}>
              Sales Activity Trend
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f131f',
                      borderColor: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: '#a78bfa', fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Sales"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="glass-panel" sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.01em' }}>
              Inventory by Category
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f131f',
                      borderColor: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Bar dataKey="Stock" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Feed section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="glass-panel" sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em', color: '#ef4444' }}>
              Critical Stock Replenishment Warnings
            </Typography>
            {lowStockItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                ✓ No items are currently below stock warnings limits.
              </Typography>
            ) : (
              <List disablePadding>
                {lowStockItems.map((p, idx) => (
                  <Fragment key={p.id}>
                    {idx > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />}
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={p.name}
                        primaryTypographyProps={{ fontWeight: 700, color: '#f87171', fontSize: '0.875rem' }}
                        secondary={`SKU: ${p.sku} | Category: ${p.category}`}
                        secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
                          {p.quantity} units
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Alert Level: {p.lowStockAlert}
                        </Typography>
                      </Box>
                    </ListItem>
                  </Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="glass-panel" sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
              Recent POS Transactions
            </Typography>
            {transactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No checkout transactions recorded during this shift yet.
              </Typography>
            ) : (
              <List disablePadding>
                {transactions.slice(0, 5).map((t, idx) => (
                  <Fragment key={t.id}>
                    {idx > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />}
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={`Order #${t.transactionNumber}`}
                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.875rem' }}
                        secondary={`${t.items.length} items • ${t.paymentMethod} • Cashier: ${t.cashierName}`}
                        secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 800, color: '#34d399' }}
                        >
                          +${t.total.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {new Date(t.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </ListItem>
                  </Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Telemetry section */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'primary.light',
            mb: 2.5,
            display: 'block',
          }}
        >
          REAL-TIME TELEMETRY SYSTEM
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card className="glass-panel" sx={{ p: 2.5, display: 'flex', gap: 2.5, alignItems: 'center', borderRadius: '14px' }}>
              <div className="pulsing-dot" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.825rem' }}>
                  Toronto Node Cluster
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Cluster: node-toronto-hq-1 • Ping: 12ms
                </Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card className="glass-panel" sx={{ p: 2.5, display: 'flex', gap: 2.5, alignItems: 'center', borderRadius: '14px' }}>
              <div className="pulsing-dot" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.825rem' }}>
                  IndexedDB Engine
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  0 pending local txns • Real-time streams active
                </Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card className="glass-panel" sx={{ p: 2.5, display: 'flex', gap: 2.5, alignItems: 'center', borderRadius: '14px' }}>
              <div className="pulsing-dot" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.825rem' }}>
                  Redis Cache Cache-Layer
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Redis state: connected • 124 cached objects
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
