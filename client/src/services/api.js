import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  logout: () => API.post('/auth/logout'),
};

export const studentsAPI = {
  getAll: (params) => API.get('/students', { params }),
  getById: (id) => API.get(`/students/${id}`),
  create: (data) => API.post('/students', data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
  getMarks: (id) => API.get(`/students/${id}/marks`),
};

export const marksAPI = {
  getByStudent: (studentId) => API.get(`/marks/${studentId}`),
  create: (data) => API.post('/marks', data),
  update: (id, data) => API.put(`/marks/${id}`, data),
  delete: (id) => API.delete(`/marks/${id}`),
  uploadCSV: (formData) => API.post('/marks/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const booksAPI = {
  getAll: (params) => API.get('/books', { params }),
  create: (data) => API.post('/books', data),
  update: (id, data) => API.put(`/books/${id}`, data),
  delete: (id) => API.delete(`/books/${id}`),
};

export const librariesAPI = {
  getAll: () => API.get('/libraries'),
  getNearby: (lat, lng, radius = 10) => API.get('/libraries/nearby', { params: { lat, lng, radius } }),
  create: (data) => API.post('/libraries', data),
  update: (id, data) => API.put(`/libraries/${id}`, data),
  delete: (id) => API.delete(`/libraries/${id}`),
};

export const recommendationsAPI = {
  getByStudent: (studentId) => API.get(`/recommendations/${studentId}`),
  getStats: () => API.get('/recommendations/stats/overview'),
};

export const analyticsAPI = {
  getOverview: () => API.get('/analytics/overview'),
  getSubjects: () => API.get('/analytics/subjects'),
};

export default API;
