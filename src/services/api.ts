import axios from 'axios';

import { API_URL } from '../config/apiConfig';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here
    return Promise.reject(error);
  }
);
