import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://goonebackend.onrender.com/',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here
    return Promise.reject(error);
  }
);
