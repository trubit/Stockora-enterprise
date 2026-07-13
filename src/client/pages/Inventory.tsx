import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.ts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Card,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, ValueFormatterParams, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Classic theme
import { toast } from 'react-hot-toast';
import { socket } from '../socket.ts';
import type { Product } from '../../shared/types.js';

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

  const { data: products = [], refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Real-time synchronization directly to cache
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

    return () => {
      socket.off('product:stock-updated');
      socket.off('product:created');
    };
  }, [queryClient]);

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
    },
    onError: (err: Error) => {
      toast.error(`Failed to add product: ${err.message || 'Error occurred'}`);
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
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Inventory Catalog
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage product listings, SKU barcodes, warehouse locations, and warning levels.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Sync
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Main Table view */}
      <Card className="glass-panel" sx={{ height: 'calc(100vh - 250px)', width: '100%' }}>
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
