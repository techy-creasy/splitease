import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

export const groupAPI = {
  create: (data) => API.post('/groups', data),
  getAll: () => API.get('/groups'),
  getOne: (id) => API.get(`/groups/${id}`),
  delete: (id) => API.delete(`/groups/${id}`),
  addMember: (id, email) => API.post(`/groups/${id}/members`, { email }),
  removeMember: (id, memberId) => API.delete(`/groups/${id}/members/${memberId}`),
};

export const expenseAPI = {
  add: (data) => API.post('/expenses', data),
  getByGroup: (groupId) => API.get(`/expenses/${groupId}`),
  delete: (id) => API.delete(`/expenses/${id}`),
};

export const balanceAPI = {
  getGroupBalances: (groupId) => API.get(`/balances/${groupId}`),
};

export default API;
