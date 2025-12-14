import axios from 'axios';

const api = axios.create({
  // O ERRO ESTÁ PROVAVELMENTE AQUI:
  // Certifique-se de que tem o "/api" no final
  baseURL: 'http://localhost:8000/api', 
});

// Interceptor para adicionar o token (Mantenha o que você já tem abaixo)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;