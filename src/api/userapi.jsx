import axios from 'axios';

// const API_URL = 'http://127.0.0.1:8000/api/users';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const loginUser = async (username, password) => {
  try {
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
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Ensure the response contains the required fields
    if (!data.token) {
      throw new Error('No authentication token received');
    }

    return {
      token: data.token,
      username: data.username || username,
      userid: data.userid || data.id // Make sure your backend returns this
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};




// Add logout function if your backend supports it
export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await axios.post(`${API_BASE_URL}/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API fails
  }
};



///use for get user from api for place manage user 
export const getUsers = async () => {
  try {
    const response = await axios.get(API_BASE_URL, {
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if needed
      }
    });
    // If your API returns { users: [...] }, return response.data.users
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to fetch users');
  }
};


// Optionally, group all functions in an object for easier import:
export const userAPI = {
  loginUser,
  logoutUser,
  getUsers,
};