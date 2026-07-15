import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Grid, IconButton, Tooltip, Tab, Tabs } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';
import type { Product } from '../../../shared/types.js';
import { motion } from 'framer-motion';

const textFieldStyle = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(17, 24, 39, 0.4)',
    backdropFilter: 'blur(8px)',
    borderRadius: 2.5,
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
      boxShadow: '0 0 14px rgba(139, 92, 246, 0.25)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'text.secondary',
    '&.Mui-focused': {
      color: 'primary.light',
    },
  },
};

export default function ProductCatalog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [], refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products');
      return data;
    },
  });

  const { register, handleSubmit, reset, setValue } = useForm<Product>({
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category: '',
      subcategory: '',
      brand: '',
      uom: 'pcs',
      costPrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      retailPrice: 0,
      status: 'ACTIVE',
      isActive: true,
      notes: '',
      width: 0,
      height: 0,
      depth: 0,
      weight: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newProduct: Product) => {
      return await apiClient.post('/products', newProduct);
    },
    onSuccess: () => {
      toast.success('Product added successfully!');
      setOpen(false);
      reset();
      setImageUrl('');
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedProduct: Product) => {
      return await apiClient.put(`/products/${editingProduct?._id || editingProduct?.id}`, updatedProduct);
    },
    onSuccess: () => {
      toast.success('Product updated successfully!');
      setOpen(false);
      setEditingProduct(null);
      reset();
      setImageUrl('');
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Product deactivated successfully.');
      refetch();
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await apiClient.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.url);
      setValue('imageUrl', data.url);
      toast.success('Product image uploaded successfully!');
    } catch {
      toast.error('Failed to upload image.');
    }
  };

  const handleAutoGenerateSku = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const sku = `SKU-PROD-${random}`;
    setValue('sku', sku);
    toast.success('SKU generated successfully!');
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setImageUrl('');
    reset({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      subcategory: '',
      brand: '',
      uom: 'pcs',
      costPrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      retailPrice: 0,
      status: 'ACTIVE',
      isActive: true,
      notes: '',
      width: 0,
      height: 0,
      depth: 0,
      weight: 0,
    });
    setOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setImageUrl(product.imageUrl || '');
    reset(product);
    setOpen(true);
  };

  const onSubmit = (data: Product) => {
    const payload = {
      ...data,
      costPrice: Number(data.costPrice),
      sellingPrice: Number(data.sellingPrice),
      wholesalePrice: Number(data.wholesalePrice || 0),
      retailPrice: Number(data.retailPrice || 0),
      width: Number(data.width || 0),
      height: Number(data.height || 0),
      depth: Number(data.depth || 0),
      weight: Number(data.weight || 0),
      imageUrl,
    };
    if (editingProduct) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Product Catalog
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: 2.5,
              textTransform: 'none',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              '&:hover': {
                background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.45)',
              },
            }}
          >
            Add Product
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Add, modify, attribute, and catalog items for inventory, checkouts, and purchasing.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Search Products by Name, SKU, or Category..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={textFieldStyle}
          />
        </Box>

        <TableContainer
          component={Paper}
          className="glass-panel"
          sx={{
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            borderRadius: 3,
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(17, 24, 39, 0.5)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Product Details</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Cost / Sale Price</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary', border: 'none' }}>
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p._id || p.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                        ) : (
                          <Box sx={{ width: 44, height: 44, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 700 }}>
                            {p.name.slice(0, 1).toUpperCase()}
                          </Box>
                        )}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.brand || 'No Brand'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Chip label={p.sku} size="small" variant="outlined" sx={{ fontWeight: 700, color: 'primary.light' }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 500 }}>{p.category}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>${Number(p.costPrice || p.cost || 0).toFixed(2)} (Cost)</Typography>
                        <Typography variant="caption" color="text.secondary">${Number(p.sellingPrice || p.price || 0).toFixed(2)} (Selling)</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Chip
                        label={p.status}
                        size="small"
                        color={p.status === 'ACTIVE' ? 'success' : p.status === 'OUT_OF_STOCK' ? 'error' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'right' }}>
                      <Tooltip title="Edit Product">
                        <IconButton onClick={() => handleOpenEdit(p)} sx={{ color: 'primary.light' }} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deactivate">
                        <IconButton onClick={() => p._id && deleteMutation.mutate(p._id)} sx={{ color: 'error.light', ml: 1 }} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(23, 27, 44, 0.98) 0%, rgba(11, 13, 26, 0.99) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 4,
            },
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {editingProduct ? 'Modify Catalog Product' : 'Register New Catalog Product'}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Tab label="Identity & Pricing" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Media & Attributes" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Logistics & Notes" sx={{ textTransform: 'none', fontWeight: 700 }} />
              </Tabs>

              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Product Name" fullWidth {...register('name', { required: true })} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField label="Product SKU" fullWidth {...register('sku')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                      <Button variant="outlined" onClick={handleAutoGenerateSku} sx={{ textTransform: 'none', px: 2, borderColor: 'rgba(139, 92, 246, 0.4)', color: 'primary.light' }}>Generate</Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Barcode (EAN/UPC)" fullWidth {...register('barcode')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Category" fullWidth {...register('category', { required: true })} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Cost Price ($)" type="number" fullWidth {...register('costPrice', { required: true })} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Selling Price ($)" type="number" fullWidth {...register('sellingPrice', { required: true })} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Wholesale Price ($)" type="number" fullWidth {...register('wholesalePrice')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Retail Price ($)" type="number" fullWidth {...register('retailPrice')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Product Thumbnail Image</Typography>
                      <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none', py: 1.5, borderColor: 'rgba(255,255,255,0.08)' }}>
                        Upload Image File
                        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      </Button>
                      {imageUrl && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <img src={imageUrl} alt="Thumbnail" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                          <Typography variant="caption" color="text.secondary">Optimized image linked successfully.</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Brand Name" fullWidth {...register('brand')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Subcategory" fullWidth {...register('subcategory')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Unit of Measure (UOM)" fullWidth {...register('uom')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              )}

              {activeTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Width (cm)" type="number" fullWidth {...register('width')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Height (cm)" type="number" fullWidth {...register('height')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Depth (cm)" type="number" fullWidth {...register('depth')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Weight (kg)" type="number" fullWidth {...register('weight')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Product Status"
                      fullWidth
                      defaultValue="ACTIVE"
                      {...register('status')}
                      sx={textFieldStyle}
                      InputLabelProps={{ shrink: true }}
                    >
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                      <MenuItem value="DRAFT">Draft</MenuItem>
                      <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Product Notes" multiline rows={3} fullWidth {...register('notes')} sx={textFieldStyle} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1.5 }}>
              <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
              <Button variant="contained" type="submit" sx={{ px: 4, py: 1.2, fontWeight: 700, background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)' }}>
                {editingProduct ? 'Update Product' : 'Register Product'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </motion.div>
    </Box>
  );
}
