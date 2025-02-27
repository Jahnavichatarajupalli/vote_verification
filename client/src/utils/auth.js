import axios from 'axios';

// Create axios instance with base URL
export const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login if unauthorized
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common['x-auth-token'] = token;
    } else {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['x-auth-token'];
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('officerData');
    // Clear any other auth-related data here
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const getOfficerData = () => {
    const data = localStorage.getItem('officerData');
    return data ? JSON.parse(data) : null;
};
