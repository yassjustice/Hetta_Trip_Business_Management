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
  }),
  bulkImport: (data) => axios.post('/api/vendors/bulk-import', data),
  bulkImportFile: (formData) => axios.post('/api/vendors/bulk-import-file', formData, {
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

// Research API functions
export const researchAPI = {
  // Session management
  createSession: (data) => axios.post('/api/research/sessions', data),
  getAllSessions: (params = {}) => axios.get('/api/research/sessions', { params }),
  getSession: (sessionId) => axios.get(`/api/research/sessions/${sessionId}`),
  deleteSession: (sessionId) => axios.delete(`/api/research/sessions/${sessionId}`),
  
  // Results management
  getSessionResults: (sessionId) => axios.get(`/api/research/sessions/${sessionId}/results`),
  validateResult: (sessionId, resultId, validationData) => 
    axios.put(`/api/research/sessions/${sessionId}/results/${resultId}/validate`, validationData),
  bulkValidateResults: (sessionId, resultIds) => 
    axios.post(`/api/research/sessions/${sessionId}/validate-all`, { resultIds }),
  
  // Import to vendors
  importResults: (sessionId, importData) => 
    axios.post(`/api/research/sessions/${sessionId}/import`, importData),
  
  // Session status and monitoring
  getSessionStatus: (sessionId) => axios.get(`/api/research/sessions/${sessionId}/status`),
  cancelSession: (sessionId) => axios.post(`/api/research/sessions/${sessionId}/cancel`),
  
  // Export and analytics
  exportResults: (sessionId, format = 'csv') => 
    axios.get(`/api/research/sessions/${sessionId}/export`, { 
      params: { format },
      responseType: 'blob'
    }),
  getSessionStats: (sessionId) => axios.get(`/api/research/sessions/${sessionId}/stats`),
  getAllStats: () => axios.get('/api/research/stats/overview'),
  bulkExtract: (data) => axios.post('/api/research/bulk-extract', data),
};

export default axios;
