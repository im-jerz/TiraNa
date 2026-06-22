const HOST = window.location.hostname === 'localhost' ? 'localhost' : 'host.docker.internal'
export const HOST_API_URL = `http://${HOST}:5001`
export const CLIENT_API_URL = `http://${HOST}:5000`
