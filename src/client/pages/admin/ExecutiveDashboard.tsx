import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, Chip } from '@mui/material';
import RevenueIcon from '@mui/icons-material/TrendingUp';
import SalesIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory2';
import WarningIcon from '@mui/icons-material/WarningAmber';
import HealthIcon from '@mui/icons-material/Favorite';
import { apiClient } from '../../api/client.ts';
import { useAuthStore } from '../../store/auth.ts';
import PageHeader from '../../components/PageHeader.tsx';
import StatCard from '../../components/StatCard.tsx';
import { motion } from 'framer-motion';

interface ExecSummary {
  revenue: number;
  salesCount: number;
  purchases: number;
  inventoryValue: number;
  inventoryCost: number;
  netProfit: number;
  totalProducts: number;
  systemHealth: {
    database: string;
    redis: string;
    apiGateway: string;
  };
}

export default function ExecutiveDashboard() {
  const { user } = useAuthStore();
  const { data: summary, isLoading } = useQuery<ExecSummary>({
    queryKey: ['executive-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<ExecSummary>('/reports/summary');
      return data;
    },
  });

  if (isLoading || !summary) {
    return <LinearProgress color="primary" />;
  }

  const isOwnerOrAdmin =
    user?.roleName === 'Company Owner' || user?.roleName === 'Super Administrator';

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Executive Reporting & Analytics"
          subtitle={`Interactive executive insights tailored for the role: ${user?.roleName || 'Employee'}`}
          category="Analytics"
          badgeText="Real-time Metrics"
          badgeColor="secondary"
        />

        {isOwnerOrAdmin ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="TOTAL REVENUE"
                value={`$${summary.revenue.toFixed(2)}`}
                subtitle="Calculated from successful sales"
                icon={<RevenueIcon sx={{ fontSize: 22 }} />}
                trend="+12.5%"
                trendUp={true}
                color="emerald"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="NET SHIFT PROFIT"
                value={`$${summary.netProfit.toFixed(2)}`}
                subtitle="Revenue minus purchases"
                icon={<SalesIcon sx={{ fontSize: 22 }} />}
                trend="+8.2%"
                trendUp={true}
                color="violet"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="INVENTORY ASSETS VALUE"
                value={`$${summary.inventoryValue.toFixed(2)}`}
                subtitle={`Asset Cost: $${summary.inventoryCost.toFixed(2)}`}
                icon={<InventoryIcon sx={{ fontSize: 22 }} />}
                color="sky"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="TOTAL SKUS IN SYSTEM"
                value={summary.totalProducts}
                subtitle="Registered catalog items"
                icon={<WarningIcon sx={{ fontSize: 22 }} />}
                color="violet"
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="MY DAILY SALES"
                value={`$${summary.revenue.toFixed(2)}`}
                subtitle="Transactions processed today"
                icon={<RevenueIcon sx={{ fontSize: 22 }} />}
                color="emerald"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="COMPLETED TRANSACTIONS"
                value={summary.salesCount}
                subtitle="Successful ticket checkouts"
                icon={<SalesIcon sx={{ fontSize: 22 }} />}
                color="violet"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="TOTAL PRODUCT CATALOG"
                value={summary.totalProducts}
                subtitle="Available warehouse lines"
                icon={<InventoryIcon sx={{ fontSize: 22 }} />}
                color="sky"
              />
            </Grid>
          </Grid>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className="glass-panel" sx={{ p: 3, borderRadius: '16px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                  System Node Integrity & Database Health
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Primary Database Connection
                    </Typography>
                    <Chip
                      icon={<HealthIcon sx={{ fontSize: '14px !important' }} />}
                      label={summary.systemHealth.database}
                      color="success"
                      size="small"
                    />
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Redis Memory Cache Connection
                    </Typography>
                    <Chip
                      icon={<HealthIcon sx={{ fontSize: '14px !important' }} />}
                      label={summary.systemHealth.redis}
                      color="success"
                      size="small"
                    />
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Enterprise API Gateway Routing
                    </Typography>
                    <Chip
                      icon={<HealthIcon sx={{ fontSize: '14px !important' }} />}
                      label={summary.systemHealth.apiGateway}
                      color="success"
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
}
