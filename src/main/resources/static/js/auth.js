// JWT Token management
const AUTH_TOKEN_KEY = 'auth_token';

const authService = {
    setToken(token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    },

    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    removeToken() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    },

    isAuthenticated() {
        const token = this.getToken();
        return token !== null && token !== undefined;
    }
};

// Axios interceptor to add JWT token to all requests
axios.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            authService.removeToken();
            window.location.href = '/login.html';
        }
        return Promise.reject(error);
    }
); 