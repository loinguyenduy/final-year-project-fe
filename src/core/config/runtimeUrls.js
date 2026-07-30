const API_SUFFIX = '/api/v1';
const DEVELOPMENT_API_BASE_URL = 'http://localhost:5000/api/v1';
const viteEnvironment = import.meta.env || {};

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const parseHttpUrl = (rawValue, label) => {
  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL without credentials.`);
  }
  if (parsed.search || parsed.hash) {
    throw new Error(`${label} must not contain a query string or fragment.`);
  }
  return parsed;
};

const resolveApiRuntimeUrls = (
  rawApiBase,
  {
    allowDevelopmentFallback = false,
    rawSocketUrl = '',
  } = {},
) => {
  const configuredApiBase = String(rawApiBase || '').trim();
  if (!configuredApiBase && !allowDevelopmentFallback) {
    throw new Error('VITE_API_BASE_URL is required for production builds.');
  }

  const parsedApi = parseHttpUrl(
    configuredApiBase || DEVELOPMENT_API_BASE_URL,
    'VITE_API_BASE_URL',
  );
  const normalizedPath = trimTrailingSlashes(parsedApi.pathname || '/');
  if (!normalizedPath.endsWith(API_SUFFIX)) {
    throw new Error(`VITE_API_BASE_URL must end with ${API_SUFFIX}.`);
  }

  const prefixPath = trimTrailingSlashes(
    normalizedPath.slice(0, normalizedPath.length - API_SUFFIX.length),
  );
  const apiBaseUrl = `${parsedApi.origin}${prefixPath}${API_SUFFIX}`;
  const backendOrigin = parsedApi.origin;

  const configuredSocketUrl = String(rawSocketUrl || '').trim();
  let socketOrigin = backendOrigin;
  if (configuredSocketUrl) {
    const parsedSocket = parseHttpUrl(
      configuredSocketUrl,
      'VITE_SOCKET_URL',
    );
    if (!['', '/'].includes(parsedSocket.pathname) || parsedSocket.search || parsedSocket.hash) {
      throw new Error('VITE_SOCKET_URL must be an origin without a path, query string, or fragment.');
    }
    socketOrigin = parsedSocket.origin;
  }

  return Object.freeze({
    apiBaseUrl,
    backendOrigin,
    socketOrigin,
  });
};

const runtimeUrls = resolveApiRuntimeUrls(viteEnvironment.VITE_API_BASE_URL, {
  allowDevelopmentFallback: Boolean(viteEnvironment.DEV) || !import.meta.env,
  rawSocketUrl: viteEnvironment.VITE_SOCKET_URL,
});

const API_BASE_URL = runtimeUrls.apiBaseUrl;
const BACKEND_ORIGIN = runtimeUrls.backendOrigin;
const SOCKET_SERVER_URL = runtimeUrls.socketOrigin;

const buildApiUrl = (path = '') => {
  const relativePath = String(path || '').replace(/^\/+/, '');
  if (/^[a-z][a-z\d+.-]*:/i.test(relativePath) || relativePath.startsWith('//')) {
    throw new Error('API paths must be relative.');
  }
  return new URL(relativePath, `${API_BASE_URL}/`).toString();
};

export {
  API_BASE_URL,
  API_SUFFIX,
  BACKEND_ORIGIN,
  DEVELOPMENT_API_BASE_URL,
  SOCKET_SERVER_URL,
  buildApiUrl,
  resolveApiRuntimeUrls,
};
