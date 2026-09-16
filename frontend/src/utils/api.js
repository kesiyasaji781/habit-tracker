const RENDER_BACKEND_URL = 'https://habit-tracker1-yaaf.onrender.com';

export async function safeFetch(url, options = {}) {
  try {
    // If hosted on GitHub Pages (github.io), point /api requests to Render backend
    const isGithubPages = window.location.hostname.includes('github.io');
    const fullUrl = (isGithubPages && url.startsWith('/api'))
      ? `${RENDER_BACKEND_URL}${url}`
      : url;

    // Send session cookies with fetch requests
    const fetchOptions = {
      credentials: 'include',
      ...options,
    };

    const response = await fetch(fullUrl, fetchOptions);
    
    // Check if the response is unauthorized (401) and not part of auth routes (like login)
    if (response.status === 401 && !url.includes('/api/auth/')) {
      throw new Error('Session expired or unauthorized. Please login.');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      return data;
    }

    // Handle HTML/text or empty error responses
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`API endpoint not found (404). If you are hosting on Netlify, you must deploy and configure a backend proxy.`);
      }
      throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
    }

    throw new Error('Server returned an unexpected non-JSON response.');
  } catch (err) {
    // If it's already our custom Error, rethrow it
    if (err.message && (err.message.includes('API endpoint') || err.message.includes('Server returned') || err.message.includes('unauthorized') || err.message.includes('Session expired'))) {
      throw err;
    }
    throw new Error(`Network error: ${err.message}. Ensure backend is online.`);
  }
}
