import axios from 'axios';

// Set base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_BASE_URL;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Vendor API functions
export const vendorAPI = {
  getAll: (params = {}) => axios.get('/api/vendors', { params }),
  getById: (id) => axios.get(`/api/vendors/${id}`),
  create: (data) => axios.post('/api/vendors', data),
  update: (id, data) => axios.put(`/api/vendors/${id}`, data),
  delete: (id) => axios.delete(`/api/vendors/${id}`),
  updateRating: (id, rating) => axios.put(`/api/vendors/${id}/rating`, rating),
  getStats: () => axios.get('/api/vendors/stats/overview'),
  uploadDocuments: (id, formData) => axios.post(`/api/upload/vendor/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Project API functions
export const projectAPI = {
  getAll: (params = {}) => axios.get('/api/projects', { params }),
  getById: (id) => axios.get(`/api/projects/${id}`),
  create: (data) => axios.post('/api/projects', data),
  update: (id, data) => axios.put(`/api/projects/${id}`, data),
  delete: (id) => axios.delete(`/api/projects/${id}`),
  linkVendor: (id, vendorData) => axios.post(`/api/projects/${id}/vendors`, vendorData),
  updateVendorStatus: (projectId, vendorId, data) => axios.put(`/api/projects/${projectId}/vendors/${vendorId}`, data),
  removeVendor: (projectId, vendorId) => axios.delete(`/api/projects/${projectId}/vendors/${vendorId}`),
  getStats: () => axios.get('/api/projects/stats/overview'),
  uploadDocuments: (id, formData) => axios.post(`/api/upload/project/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadQuoteDocuments: (projectId, vendorId, formData) => axios.post(`/api/upload/project/${projectId}/vendor/${vendorId}/quote`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Auth API functions
export const authAPI = {
  login: (credentials) => axios.post('/api/auth/login', credentials),
  register: (userData) => axios.post('/api/auth/register', userData),
  getProfile: () => axios.get('/api/auth/me'),
  updateProfile: (data) => axios.put('/api/auth/profile', data),
  changePassword: (data) => axios.put('/api/auth/change-password', data),
  uploadAvatar: (formData) => axios.post('/api/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Upload API functions
export const uploadAPI = {
  deleteDocument: (data) => axios.delete('/api/upload/document', { data }),
  getFile: (filePath) => `${API_BASE_URL}/api/upload/file/${filePath}`
};

export default axios;
