import axios from 'axios';

const APIM_BASE = 'https://gf0js7uezg.execute-api.us-east-2.amazonaws.com/dev/api';
// URL Interna/Directa al Orquestador (Bypass APIM para Administración)
const INTERNAL_BASE = 'http://k8s-bancaecosistemash-be991fd327-1419468438.us-east-2.elb.amazonaws.com';

const API_URL = import.meta.env.VITE_API_URL || APIM_BASE;
const INTERNAL_URL = import.meta.env.VITE_INTERNAL_API_URL || INTERNAL_BASE;

const headers = {
    'Authorization': 'Basic N29qMTJqdHU4ZDNrZWlsdjFlMWdqa2M4ZTQ6MTZvOWJkcHBpMnFrdTY5dnVrN3FkY2ltNGZxcmtta2dnZGVyM2lxNDdwOWNzMjl0cXFvcQ==',
    'Content-Type': 'application/json'
};

// PUBLICA: Transferencias y Consultas (Via APIM)
// /v2/switch/transfers, /v2/switch/returns
export const nucleoApi = axios.create({ baseURL: `${API_URL}/v2/switch`, headers });

// INTERNA: Administración de Bancos y Cuentas (Directo al Orquestador)
// /bantec/api/v2/switch/admin (Si se usa Ingress path-based) O Directamente /api/v2/switch/admin
// Asumimos que el LB apunta al default rule del ALB -> Nucleo
export const directorioApi = axios.create({ baseURL: `${INTERNAL_URL}/api/v2/switch/admin`, headers });
export const contabilidadApi = axios.create({ baseURL: `${INTERNAL_URL}/api/v2/switch/admin`, headers });

// PUBLICA: Compensacion (Via APIM)
export const compensacionApi = axios.create({ baseURL: `${API_URL}/v2/compensation`, headers });

[nucleoApi, directorioApi, contabilidadApi, compensacionApi].forEach(api => {
    api.interceptors.response.use(
        response => response,
        error => {
            console.error('API Error:', error.response?.data || error.message);
            return Promise.reject(error);
        }
    );
});
