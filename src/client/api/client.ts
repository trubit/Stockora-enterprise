import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.ts';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT bearer keys automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockora_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Route session timeouts and fire toast alerts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errMessage = error.response?.data?.error?.message || error.message || 'Request failed';

    if (status === 401) {
      useAuthStore.getState().clearSession();
      window.location.href = '/login';
      toast.error('Session expired. Please log in again.');
    } else if (status === 403) {
      toast.error('Access denied. You do not have permissions for this path.');
    } else if (status >= 500) {
      toast.error('Internal server error. Please try again later.');
    } else {
      toast.error(errMessage);
    }

    return Promise.reject(error);
  }
);
