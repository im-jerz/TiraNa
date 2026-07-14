const HOST = window.location.hostname === 'localhost' ? 'localhost' : 'host.docker.internal'
export const HOST_API_URL = `http://${HOST}:5001`
export const CLIENT_API_URL = `http://${HOST}:5000`
export const ADMIN_API_URL = `http://${HOST}:5002`
export const CLIENT_API = `${CLIENT_API_URL}/api`
export const HOST_APP_URL = `http://${HOST}:5174`
