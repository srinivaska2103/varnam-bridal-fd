import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach Authorization and Active Business Context
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isUserScope = path.includes('/user/') || path.endsWith('/user');

      // Use isolated token keys depending on portal scope, with seamless fallback
      let token = null;
      if (isUserScope) {
        token = localStorage.getItem('vexa_user_token') || localStorage.getItem('vexa_auth_token');
      } else {
        token = localStorage.getItem('vexa_admin_token') || localStorage.getItem('vexa_auth_token');
      }

      const activeBusinessId = localStorage.getItem('vexa_active_business_id');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (activeBusinessId) {
        config.headers['x-business-id'] = activeBusinessId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data || {};
    const message = errorData.message || error.message || 'An unexpected error occurred';
    const status = error.response?.status;

    // Handle 401 Unauthorized globally
    if (status === 401 && typeof window !== 'undefined') {
      // Do not interrupt the User login page if user credentials failed
      const path = window.location.pathname;
      const isAuthRoute =
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.includes('/user/login');

      if (!isAuthRoute) {
        const path = window.location.pathname;
        const isUserScope = path.includes('/user/') || path.endsWith('/user');
        const { userRole, studioSlug } = useAuthStore.getState().logout(isUserScope ? 'USER' : 'ADMIN');
        if ((userRole === 'USER' || isUserScope) && studioSlug) {
          window.location.href = `/${studioSlug}/user/login?expired=true`;
        } else {
          window.location.href = '/login?expired=true';
        }
      }
    }

    const customError = new Error(message);
    customError.status = status;
    customError.data = errorData;
    customError.errors = errorData.errors || null;

    return Promise.reject(customError);
  }
);
