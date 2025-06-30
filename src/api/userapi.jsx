// userapi.js - Fixed with proper profile image handling
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const loginUser = async (username, password) => {
  try {
    console.log('Attempting login for:', username);
    console.log('API Base URL:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usernameoremail: username,
        password: password
      })
    });

    const data = await response.json();

    console.log('Full login response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Ensure the response contains the required fields
    if (!data.token) {
      throw new Error('No authentication token received');
    }

    // Check if profileimageurl exists and properly format it if needed
    let profileImageUrl = data.profileimageurl || null;

    // If the profileimageurl is a relative path, convert it to an absolute URL
    if (profileImageUrl && !profileImageUrl.startsWith('http')) {
      // Extract the base URL (without the /api part)
      const baseUrl = API_BASE_URL.replace(/\/api$/, '');
      profileImageUrl = `${baseUrl}${profileImageUrl}`;
    }

    // Add any required authentication to the profile image URL if needed
    if (profileImageUrl && data.token) {
      // Only append token if the URL doesn't already have parameters
      if (!profileImageUrl.includes('?')) {
        profileImageUrl = `${profileImageUrl}?token=${data.token}`;
      }
    }

    console.log('Processed profile image URL:', profileImageUrl);

    return {
      token: data.token,
      username: data.username || username,
      userid: data.userid || data.id, // Make sure your backend returns this
      profileimageurl: profileImageUrl,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Add logout function
export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Try to use fetch first, falling back to axios if needed
      try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Logout API failed');
        }
      } catch (fetchError) {
        console.warn('Fetch logout failed, trying axios:', fetchError);
        // Fallback to axios
        await axios.post(`${API_BASE_URL}/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API fails
  }
};

// Get users for the Manage Users page
export const getUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.users || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Optionally, group all functions in an object for easier import:
export const userAPI = {
  loginUser,
  logoutUser,
  getUsers,
};

export default userAPI;