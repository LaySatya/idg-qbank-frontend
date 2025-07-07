const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  //  Token expired — force logout
  if (response.status === 401) {
    console.warn('Unauthorized — token expired. Logging out...');
    localStorage.clear();
    alert('Your session has expired. Redirecting to login...');
    window.location.href = '/login';
    return;
  }

  return response;
};
