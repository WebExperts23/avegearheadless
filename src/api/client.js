import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_MAGENTO_URL || '/graphql',
  credentials: 'same-origin', // Ensure cookies (like PHPSESSID) are sent to the proxied backend
});

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            merge(existing, incoming) {
              return incoming;
            }
          }
        }
      }
    }
  }),
});

// Dynamic Admin Token Management
let currentAdminToken = null;
let tokenExpirationTime = 0;

export const fetchAdminToken = async () => {
  // Check if we have a valid cached token
  if (currentAdminToken && Date.now() < tokenExpirationTime) {
    return currentAdminToken;
  }

  const username = import.meta.env.VITE_MAGENTO_ADMIN_USER;
  const password = import.meta.env.VITE_MAGENTO_ADMIN_PASS;
  const magentoBaseUrl = import.meta.env.VITE_MAGENTO_BASE_URL || 'https://2fc1869dd5.nxcli.io';

  if (!username || !password) {
    console.error("[TokenFetcher] Missing admin credentials in environment variables");
    return null;
  }

  const fetchToken = async (endpoint) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`[TokenFetcher] Failed at ${endpoint}:`, err.message);
      return null;
    }
  };

  // Try proxied endpoint first (standard for Vite/Vercel)
  let token = await fetchToken('/magento-api/rest/V1/integration/admin/token');
  
  // Fallback to absolute URL if proxy fails (useful for direct staging access)
  if (!token) {
    console.log("[TokenFetcher] Proxied request failed. Falling back to absolute URL...");
    token = await fetchToken(`${magentoBaseUrl}/rest/V1/integration/admin/token`);
  }

  if (token) {
    // Magento tokens usually expire in 4 hours. We'll cache for 3.5 hours to be safe.
    currentAdminToken = token;
    tokenExpirationTime = Date.now() + (3.5 * 60 * 60 * 1000);
    console.log("[TokenFetcher] Token successfully retrieved and cached.");
    return token;
  }

  console.error("[TokenFetcher] All attempts to fetch Admin Token failed.");
  return null;
};

export const getAdminHeaders = async () => {
  const token = await fetchAdminToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export default client;
