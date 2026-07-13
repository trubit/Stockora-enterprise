import { Box, Typography, Button, TextField, Card, CardContent } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function CompanySettings() {
  const { data: company, refetch } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/org/company');
        return data;
      } catch {
        return null;
      }
    },
  });

  const { register, handleSubmit } = useForm({
    values: {
      name: company?.name || '',
      taxId: company?.taxId || '',
      address: company?.address || '',
      phone: company?.phone || '',
    },
  });

  const mutation = useMutation({
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    mutationFn: async (updatedData: any) => {
      if (company) {
        return await apiClient.put('/org/company', updatedData);
      } else {
        return await apiClient.post('/org/company', updatedData);
      }
    },
    onSuccess: () => {
      toast.success('Company settings saved!');
      refetch();
    },
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        Company Profile Settings
      </Typography>

      <Card sx={{ maxWidth: 600, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TextField label="Company Name" fullWidth {...register('name')} />
            <TextField label="Tax/VAT ID" fullWidth {...register('taxId')} />
            <TextField label="Corporate Address" fullWidth {...register('address')} />
            <TextField label="Contact Phone" fullWidth {...register('phone')} />
            <Button variant="contained" type="submit" sx={{ alignSelf: 'flex-start', px: 4, py: 1.2, fontWeight: 700 }}>
              Save Details
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
