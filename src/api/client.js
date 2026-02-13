import axios from 'axios';
import qs from 'qs';

const APIM_BASE = 'https://gf0js7uezg.execute-api.us-east-2.amazonaws.com/dev/api';
const API_URL = import.meta.env.VITE_API_URL || APIM_BASE;

// Configuración de Auth (Cognito)
const AUTH_URL = 'https://auth-banca-digiconecu-dev-lhd4go.auth.us-east-2.amazoncognito.com/oauth2/token';
const AUTH_BASIC = 'Basic N29qMTJqdHU4ZDNrZWlsdjFlMWdqa2M4ZTQ6MTZvOWJkcHBpMnFrdTY5dnVrN3FkY2ltNGZxcmtta2dnZGVyM2lxNDdwOWNzMjl0cXFvcQ==';
const SCOPE = 'https://switch-api.com/transfers.write';

let tokenCache = null;

// Función para obtener token dinámicamente
async function getAccessToken() {
    // Si tenemos token válido en memoria, úsalo (mejora performance)
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
        return tokenCache.token;
    }

    try {
        console.log('Obteniendo nuevo token de Cognito...');
        const response = await axios.post(AUTH_URL, qs.stringify({
            grant_type: 'client_credentials',
            scope: SCOPE
        }), {
            headers: {
                'Authorization': AUTH_BASIC,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, expires_in } = response.data;

        // Guardar en cache (restamos 60s por seguridad de reloj)
        tokenCache = {
            token: access_token,
            expiresAt: Date.now() + (expires_in * 1000) - 60000
        };

        return access_token;
    } catch (error) {
        console.error('Error autenticando con Cognito:', error);
        throw error;
    }
}

// Configuración de clientes
export const nucleoApi = axios.create({ baseURL: `${API_URL}/v2/switch` });
export const directorioApi = axios.create({ baseURL: `${API_URL}/v2/switch/admin` });
export const contabilidadApi = axios.create({ baseURL: `${API_URL}/v2/switch/admin` });
export const compensacionApi = axios.create({ baseURL: `${API_URL}/v2/compensation` });

// Interceptor para inyectar Token Bearer en cada petición
const addAuthToken = async (config) => {
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
};

// Aplicar a todas las instancias
[nucleoApi, directorioApi, contabilidadApi, compensacionApi].forEach(api => {
    api.interceptors.request.use(addAuthToken, error => Promise.reject(error));

    api.interceptors.response.use(
        response => response,
        error => {
            console.error('API Error:', error.response?.data || error.message);
            return Promise.reject(error);
        }
    );
});
