import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 422 && error.response.data?.message?.includes('Invalid token')) {
      // Handle invalid token format (e.g. stale token with int subject)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getCurrentUser: () =>
    api.get('/auth/me'),
  logout: () =>
    api.post('/auth/logout'),
};

export const invoiceService = {
  uploadInvoice: (formData) =>
    api.post('/invoices', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getInvoice: (id) =>
    api.get(`/invoices/${id}`),
  getInvoiceFile: (id) =>
    api.get(`/invoices/${id}/file`, { responseType: 'blob' }),
  downloadExcel: (id) =>
    api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  downloadInvoiceFile: (id) =>
    api.get(`/invoices/${id}/file`, { responseType: 'blob' }),
  downloadSupportingFile: (id) =>
    api.get(`/invoices/${id}/supporting-file`, { responseType: 'blob' }),
  listUserInvoices: (page = 1, perPage = 10) =>
    api.get('/invoices/user', { params: { page, per_page: perPage } }),
  deleteInvoice: (id) =>
    api.delete(`/invoices/${id}`),
  updateInvoice: (id, data) =>
    api.patch(`/invoices/${id}`, data),
};

export const dashboardService = {
  getStats: () =>
    api.get('/dashboard/stats'),
};

export const masterDataService = {
  getCountries: () =>
    api.get('/master/countries'),
  getBrandsByCountry: (countryId) =>
    api.get(`/master/brands/${countryId}`),
  getBusinessUnits: (countryId, brandId) =>
    api.get(`/master/business-units/${countryId}/${brandId}`),
  getSuppliers: (countryId, brandId) =>
    api.get(`/master/suppliers/${countryId}/${brandId}`),
};

export const trackerService = {
  addToTracker: (data) =>
    api.post('/tracker/add', data),
  getTrackerByInvoice: (invoiceId) =>
    api.get(`/tracker/invoice/${invoiceId}`),
  getTrackersByCountry: (countryId) =>
    api.get(`/tracker/country/${countryId}`),
  getAllTrackers: () =>
    api.get('/tracker/all'),
  updateTracker: (trackerId, data) =>
    api.patch(`/tracker/${trackerId}`, data),
  deleteTracker: (trackerId) =>
    api.delete(`/tracker/${trackerId}`),
};

export default api;
