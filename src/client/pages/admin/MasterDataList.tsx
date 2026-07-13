import { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';
import type { MasterData } from '../../../shared/types.js';

export default function MasterDataList() {
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('CATEGORY');

  const { data: list = [], refetch } = useQuery({
    queryKey: ['master-data', filterType],
    queryFn: async () => {
      const { data } = await apiClient.get<MasterData[]>(`/org/master-data?type=${filterType}`);
      return data;
    },
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', code: '', value: '' },
  });

  const createMutation = useMutation({
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    mutationFn: async (newData: any) => {
      return await apiClient.post('/org/master-data', { type: filterType, ...newData });
    },
    onSuccess: () => {
      toast.success('Master record added successfully!');
      setOpen(false);
      reset();
      refetch();
    },
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Master Data Registries
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ fontWeight: 700 }}>
          Add Master Record
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          select
          label="Registry Type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ width: 220 }}
        >
          <MenuItem value="CATEGORY">Product Categories</MenuItem>
          <MenuItem value="BRAND">Brands</MenuItem>
          <MenuItem value="UOM">Units of Measure (UOM)</MenuItem>
          <MenuItem value="TAX_RATE">Tax Rates</MenuItem>
          <MenuItem value="CUSTOMER_TYPE">Customer Types</MenuItem>
          <MenuItem value="SUPPLIER_TYPE">Supplier Types</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper} sx={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Value / Rate</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Chip label={item.code} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{item.value !== undefined ? String(item.value) : 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={item.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={item.isActive ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Create {filterType} Record</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Name" fullWidth {...register('name', { required: true })} />
            <TextField label="Code (e.g., TAX-VAT-15)" fullWidth {...register('code', { required: true })} />
            {filterType === 'TAX_RATE' && (
              <TextField label="Tax Rate Value (e.g., 0.15)" type="number" inputProps={{ step: 0.01 }} fullWidth {...register('value')} />
            )}
            {filterType === 'UOM' && (
              <TextField label="UOM Abbreviation (e.g., KG)" fullWidth {...register('value')} />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={createMutation.isPending}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
