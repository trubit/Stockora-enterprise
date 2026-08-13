import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import AIIcon from '@mui/icons-material/AutoAwesome';
import CompareIcon from '@mui/icons-material/CompareArrows';
import TrendingIcon from '@mui/icons-material/TrendingUp';
import client from '../../api/client';

export default function ProcurementAnalyticsDashboard() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [compareProductId, setCompareProductId] = useState('bread');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchReorderRecommendations = async () => {
    try {
      const res = await client.get('/procurement/ai/reorder-recommendations');
      const data = res.data?.data ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRecommendations(data);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchReorderRecommendations();
  }, []);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCompareSuppliers = async () => {
    if (!compareProductId) return;
    try {
      const res = await client.get(
        `/procurement/ai/compare-suppliers/${encodeURIComponent(compareProductId)}`
      );
      setComparisonResult(res.data);
    } catch {
      // Fallback
    }
  };

  const handleAskCopilot = async () => {
    if (!aiPrompt) return;
    try {
      const res = await client.post('/procurement/ai/copilot', { prompt: aiPrompt });
      setAiResponse(res.data);
    } catch {
      // Fallback
    }
  };

  const cleanText = (str: string) => {
    if (!str) return '';
    return str
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .trim();
  };

  const displayedRecs = recommendations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
        Procurement Analytics & Supply-Chain Intelligence
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Demand-aware reorder recommendations, supplier price comparison matrix, and executive AI
        copilot
      </Typography>

      <Grid container spacing={3} mb={4}>
        {/* Demand-Aware Reorder Intelligence */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TrendingIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                AI Demand-Aware Reorder Recommendations
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Product</TableCell>
                    <TableCell>Stock / Alert</TableCell>
                    <TableCell>Recommended Qty</TableCell>
                    <TableCell>Lead Time</TableCell>
                    <TableCell>Est. Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRecs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary" py={2}>
                          All inventory stock levels are healthy.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedRecs.map((rec) => (
                      <TableRow key={rec.productId || rec.sku}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{rec.productName}</TableCell>
                        <TableCell>
                          {rec.currentStock} / {rec.lowStockAlert}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${rec.recommendedOrderQuantity} units`}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{rec.leadTimeDays} days</TableCell>
                        <TableCell>${(rec.estimatedCost || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={recommendations.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>

        {/* Supplier Comparison Matrix */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CompareIcon color="secondary" />
              <Typography variant="h6" fontWeight="bold">
                Supplier Price & Quality Comparison
              </Typography>
            </Box>
            <Box display="flex" gap={1} mb={2}>
              <TextField
                fullWidth
                size="small"
                label="Product ID / SKU / Name"
                value={compareProductId}
                onChange={(e) => setCompareProductId(e.target.value)}
                placeholder="e.g. bread, SKU-101"
              />
              <Button variant="contained" color="secondary" onClick={handleCompareSuppliers}>
                Compare
              </Button>
            </Box>

            {comparisonResult && (
              <Box bgcolor="action.hover" p={2} borderRadius={1}>
                <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                  Top Recommended Supplier: {comparisonResult.recommendedSupplier}
                </Typography>
                <Typography variant="body2" mt={0.5} color="text.primary">
                  {cleanText(comparisonResult.reason)}
                </Typography>

                {comparisonResult.suppliers && comparisonResult.suppliers.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                      Vendor Options:
                    </Typography>
                    {comparisonResult.suppliers.map((s: any, idx: number) => (
                      <Box key={idx} display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="body2">{s.supplierName}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${s.purchaseCost} ({s.leadTimeDays}d lead time)
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Conversational AI Procurement Copilot */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AIIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Executive AI Procurement Copilot
          </Typography>
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth
            placeholder="Ask Copilot: 'Which supplier', 'Which suppliers have high lead times?' or 'Why did purchase costs increase?'..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleAskCopilot}>
            Ask Copilot
          </Button>
        </Box>

        {aiResponse && (
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Query: {aiResponse.query}
              </Typography>
              <Typography
                variant="body1"
                mt={1.5}
                lineHeight={1.6}
                fontWeight="medium"
                color="text.primary"
              >
                {cleanText(aiResponse.reply)}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
}
