import { useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem, Avatar, Grid, Card, CardContent } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/auth.ts';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl || null);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      preferredLanguage: user?.preferredLanguage || 'en',
      timeZone: user?.timeZone || 'UTC',
      themePreference: user?.themePreference || 'dark',
    },
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const onSubmit = async (data: any) => {
    try {
      const res = await apiClient.put('/users/profile', data);
      updateUser(res.data);
      toast.success('Profile preferences updated successfully!');
    } catch {
      toast.error('Failed to update profile preferences.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await apiClient.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAvatar(res.data.avatarUrl);
      updateUser({ avatarUrl: res.data.avatarUrl });
      toast.success('Avatar updated successfully!');
    } catch {
      toast.error('Failed to upload avatar.');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>
        User Profile Settings
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 4 }}>
              <Avatar src={avatar || undefined} sx={{ width: 120, height: 120 }} />
              <Button variant="outlined" component="label" sx={{ textTransform: 'none' }}>
                Upload New Image
                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {user?.username || 'Cashier User'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {user?.roleName || 'Cashier'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Preferences
              </Typography>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <TextField select label="Preferred Language" fullWidth {...register('preferredLanguage')}>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </TextField>
                <TextField select label="Time Zone" fullWidth {...register('timeZone')}>
                  <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                  <MenuItem value="EST">EST (Eastern Standard Time)</MenuItem>
                  <MenuItem value="WAT">WAT (West Africa Time)</MenuItem>
                </TextField>
                <TextField select label="Interface Theme" fullWidth {...register('themePreference')}>
                  <MenuItem value="light">Light Mode</MenuItem>
                  <MenuItem value="dark">Dark Mode</MenuItem>
                </TextField>
                <Button variant="contained" type="submit" sx={{ alignSelf: 'flex-start', px: 4, py: 1.2, fontWeight: 700 }}>
                  Save Preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
