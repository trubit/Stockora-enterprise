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
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <RevenueIcon sx={{ fontSize: 32, color: 'secondary.main' }} />,
      desc: 'Live revenue summary',
    },
    {
      title: 'Sales Count',
      value: transactions.length,
      icon: <TxIcon sx={{ fontSize: 32, color: 'primary.light' }} />,
      desc: 'Successful cashouts',
    },
    {
      title: 'Inventory Value',
      value: `$${totalValue.toFixed(2)}`,
      icon: <StockIcon sx={{ fontSize: 32, color: 'info.main' }} />,
      desc: `Cost base: $${totalCost.toFixed(2)}`,
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockItems.length,
      icon: <WarningIcon sx={{ fontSize: 32, color: 'error.main' }} />,
      desc: 'Require immediate replenishment',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Business Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time metrics, store analytics, and inventory health tracking.
        </Typography>
      </Box>

      {/* Metrics Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((m) => (
          <Grid item xs={12} sm={6} md={3} key={m.title}>
            <Card className="glass-panel">
              <CardContent
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    {m.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 750, mb: 0.5 }}>
                    {m.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {m.desc}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)' }}>
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
          <Card className="glass-panel" sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Sales Activity Trend
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Sales"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="glass-panel" sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Inventory by Category
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  />
                  <Bar dataKey="Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Feed section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="glass-panel" sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Critical Stock Replenishment Warnings
            </Typography>
            {lowStockItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No items are currently below stock warnings limits. Excellent!
              </Typography>
            ) : (
              <List>
                {lowStockItems.map((p, idx) => (
                  <Fragment key={p.id}>
                    {idx > 0 && <Divider sx={{ opacity: 0.5 }} />}
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={p.name}
                        primaryTypographyProps={{ fontWeight: 600, color: 'error.light' }}
                        secondary={`SKU: ${p.sku} | Category: ${p.category}`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {p.quantity} left
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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
          <Card className="glass-panel" sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Recent POS Transactions
            </Typography>
            {transactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No checkout transactions recorded during this shift yet.
              </Typography>
            ) : (
              <List>
                {transactions.slice(0, 5).map((t, idx) => (
                  <Fragment key={t.id}>
                    {idx > 0 && <Divider sx={{ opacity: 0.5 }} />}
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={`Order #${t.transactionNumber}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                        secondary={`${t.items.length} items • ${t.paymentMethod} • Cashier: ${t.cashierName}`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: 'secondary.light' }}
                        >
                          +${t.total.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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
    </Box>
  );
}
