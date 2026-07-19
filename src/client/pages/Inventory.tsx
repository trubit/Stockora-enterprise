import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.ts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Card,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ValueFormatterParams, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { toast } from 'react-hot-toast';
import { socket } from '../socket.ts';
import type { Product } from '../../shared/types.js';
import PageHeader from '../components/PageHeader.tsx';
import StatCard from '../components/StatCard.tsx';

// Zod Validation Schema for Product Creation
const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  SKU: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.string().min(2, 'Category is required'),
  price: z.coerce.number().positive('Price must be positive'),
  cost: z.coerce.number().nonnegative('Cost cannot be negative'),
  quantity: z.coerce.number().int().nonnegative('Quantity cannot be negative'),
  lowStockAlert: z.coerce.number().int().nonnegative('Alert level cannot be negative'),
  barcode: z.string().optional(),
});

type ProductFormInputs = z.infer<typeof productSchema>;

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>('/products');
  return data;
};

export default function Inventory() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { data: products = [], refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: valuation = { weightedAverage: 0, fifo: 0, lifo: 0, totalItemsCount: 0 }, refetch: refetchValuation } = useQuery({
    queryKey: ['valuation'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/valuation');
      return data;
    },
  });

  const { data: movements = [], refetch: refetchMovements } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/movements');
      return data;
    },
  });

  // Real-time synchronization directly to cache
  useEffect(() => {
    socket.on('product:stock-updated', (data: { productId: string; quantity: number }) => {
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === data.productId || p._id === data.productId ? { ...p, quantity: data.quantity } : p));
      });
      refetchValuation();
      refetchMovements();
    });

    socket.on('product:created', (newProduct: Product) => {
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return [newProduct];
        return [...old, newProduct];
      });
      refetchValuation();
      refetchMovements();
    });

    return () => {
      socket.off('product:stock-updated');
      socket.off('product:created');
    };
  }, [queryClient, refetchValuation, refetchMovements]);

  const createProductMutation = useMutation({
    mutationFn: async (newProduct: ProductFormInputs) => {
      const { data } = await apiClient.post<Product>('/products', newProduct);
      return data;
    },
    onSuccess: () => {
      toast.success('Product added successfully!');
      setOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      refetchValuation();
      refetchMovements();
    },
    onError: (err: unknown) => {
      const apiErr = err as Error;
      toast.error(`Failed to add product: ${apiErr.message || 'Error occurred'}`);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      SKU: '',
      category: '',
      price: 0,
      cost: 0,
      quantity: 0,
      lowStockAlert: 5,
      barcode: '',
    },
  });

  const onSubmit = (data: ProductFormInputs) => {
    createProductMutation.mutate(data);
  };

  const handleSyncAll = () => {
    refetch();
    refetchValuation();
    refetchMovements();
    toast.success('Synced valuation & stock counts.');
  };

  // AG Grid Column Definitions
  const columnDefs: ColDef<Product>[] = [
    { field: 'sku', headerName: 'SKU', sortable: true, filter: true, width: 150 },
    {
      field: 'name',
      headerName: 'Product Name',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 200,
    },
    { field: 'category', headerName: 'Category', sortable: true, filter: true, width: 140 },
    {
      field: 'cost',
      headerName: 'Cost Price',
      sortable: true,
      width: 120,
      valueFormatter: (params: ValueFormatterParams<Product>) =>
        params.value != null ? `$${Number(params.value).toFixed(2)}` : '',
    },
    {
      field: 'price',
      headerName: 'Retail Price',
      sortable: true,
      width: 120,
      valueFormatter: (params: ValueFormatterParams<Product>) =>
        params.value != null ? `$${Number(params.value).toFixed(2)}` : '',
    },
    {
      field: 'quantity',
      headerName: 'Stock Qty',
      sortable: true,
      width: 120,
      cellRenderer: (params: ICellRendererParams<Product>) => {
        const qty = params.value;
        const lowLimit = params.data?.lowStockAlert || 5;
        const isLow = qty <= lowLimit;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip
              label={qty}
              size="small"
              color={isLow ? 'error' : 'success'}
              sx={{ fontWeight: 700 }}
            />
          </Box>
        );
      },
    },
    { field: 'barcode', headerName: 'Barcode', sortable: true, filter: true, width: 140 },
    {
      field: 'createdAt',
      headerName: 'Date Added',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 130,
      valueFormatter: (params: ValueFormatterParams<Product>) =>
        params.value ? new Date(params.value).toLocaleDateString() : '',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <PageHeader
        title="Inventory Catalog & Stock Ledger"
        subtitle="Manage product listings, SKU barcodes, warehouse valuation assets, and warning thresholds."
        category="Catalog"
        badgeText={`${products.length} PRODUCTS`}
        badgeColor="primary"
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleSyncAll}
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            >
              Sync
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              sx={{
                fontWeight: 700,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              }}
            >
              Add Product
            </Button>
          </Box>
        }
      />

      {/* Real-Time Valuation Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="WEIGHTED AVG ASSETS"
            value={`$${Number(valuation.weightedAverage || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Real-time asset valuation"
            icon={<RefreshIcon sx={{ fontSize: 22 }} />}
            color="violet"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="FIFO ASSET VALUE"
            value={`$${Number(valuation.fifo || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="First-In First-Out cost base"
            icon={<RefreshIcon sx={{ fontSize: 22 }} />}
            color="emerald"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="LIFO ASSET VALUE"
            value={`$${Number(valuation.lifo || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Last-In First-Out cost base"
            icon={<RefreshIcon sx={{ fontSize: 22 }} />}
            color="amber"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="TOTAL ACTIVE STOCK"
            value={`${Number(valuation.totalItemsCount || 0).toLocaleString()} units`}
            subtitle="Total items in stock"
            icon={<RefreshIcon sx={{ fontSize: 22 }} />}
            color="sky"
          />
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Tab label="Stock Catalog Table" sx={{ textTransform: 'none', fontWeight: 700 }} />
        <Tab label="Stock Movements Ledger" sx={{ textTransform: 'none', fontWeight: 700 }} />
      </Tabs>

      {activeTab === 0 && (
        <Card className="glass-panel" sx={{ height: 'calc(100vh - 360px)', width: '100%' }}>
          <Box
            className="ag-theme-alpine-dark"
            sx={{
              height: '100%',
              width: '100%',
              '--ag-background-color': 'transparent',
              '--ag-header-background-color': '#1f2937',
            }}
          >
            <AgGridReact
              theme="legacy"
              rowData={products}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[10, 15, 25, 50]}
              loadingCellRenderer={undefined}
              domLayout="normal"
            />
          </Box>
        </Card>
      )}

      {activeTab === 1 && (
        <TableContainer
          component={Paper}
          className="glass-panel"
          sx={{
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            borderRadius: 3,
            maxHeight: 'calc(100vh - 360px)',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Qty Changed</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Unit Cost</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Audit Notes</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Operator</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: '#111827', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary', border: 'none' }}>
                    No stock movements recorded.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((mov: {
                  _id: string;
                  productId?: { name: string; sku: string };
                  type: string;
                  quantity: number;
                  costPrice: number;
                  notes?: string;
                  userId?: { username: string };
                  createdAt: string;
                }) => (
                  <TableRow key={mov._id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', py: 1.5, fontWeight: 700 }}>
                      {mov.productId?.name || 'Deleted Product'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Chip label={mov.productId?.sku || 'N/A'} size="small" variant="outlined" sx={{ fontWeight: 700, color: 'primary.light' }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Chip label={mov.type} size="small" color={mov.type === 'SALE' ? 'primary' : mov.type === 'ADJUSTMENT' ? 'warning' : 'success'} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 800, color: mov.quantity < 0 ? 'error.light' : 'success.light' }}>
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 600 }}>
                      ${Number(mov.costPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'text.secondary' }}>
                      {mov.notes || '-'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      {mov.userId?.username || 'System'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      {new Date(mov.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Product Modal Form */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Product</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Product Name"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  {...register('SKU')}
                  error={!!errors.SKU}
                  helperText={errors.SKU?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Category"
                  {...register('category')}
                  error={!!errors.category}
                  helperText={errors.category?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Retail Price ($)"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  {...register('price')}
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Cost Price ($)"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  {...register('cost')}
                  error={!!errors.cost}
                  helperText={errors.cost?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Initial Stock Quantity"
                  type="number"
                  {...register('quantity')}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Low Stock Warning Limit"
                  type="number"
                  {...register('lowStockAlert')}
                  error={!!errors.lowStockAlert}
                  helperText={errors.lowStockAlert?.message}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Barcode Number"
                  {...register('barcode')}
                  placeholder="e.g. 40012011"
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createProductMutation.isPending}
            >
              {createProductMutation.isPending ? 'Saving...' : 'Add Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
