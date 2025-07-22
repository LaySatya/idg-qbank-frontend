// userapi.js - Fixed with proper user info storage for comments
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const pfToken = import.meta.env.VITE_MOODLE_TOKEN;

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
    let profileImageUrl = data.profileimageurl + '?token=' + pfToken;

    // If the profileimageurl is a relative path, convert it to an absolute URL
    // if (profileImageUrl && !profileImageUrl.startsWith('http')) {
    //   // Extract the base URL (without the /api part)
    //   const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    //   profileImageUrl = `${baseUrl}${profileImageUrl}`;
    // }

    // // Add any required authentication to the profile image URL if needed
    // if (profileImageUrl && data.token) {
    //   // Only append token if the URL doesn't already have parameters
    //   if (!profileImageUrl.includes('?')) {
    //     profileImageUrl = `${profileImageUrl}?token=${pfToken}`;
    //   }
    // }

    console.log('Processed profile image URL:', profileImageUrl);

    // Store comprehensive user information in localStorage for comments
    const userInfo = {
      token: data.token,
      username: data.username || username,
      userid: data.userid || data.id,
      profileimageurl: profileImageUrl,
      // Additional fields that might be useful
      email: data.email || data.usernameoremail || username,
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      fullname: data.fullname || `${data.firstname || ''} ${data.lastname || ''}`.trim() || data.username || username
    };

    // CRITICAL FIX: Store individual items for backward compatibility
    localStorage.setItem('token', userInfo.token);
    localStorage.setItem('username', userInfo.username);
    localStorage.setItem('userid', String(userInfo.userid));
    localStorage.setItem('usernameoremail', userInfo.email);
    
    if (userInfo.profileimageurl) {
      localStorage.setItem('profileimageurl', userInfo.profileimageurl);
    }

    // Store additional user info
    if (userInfo.firstname) localStorage.setItem('firstname', userInfo.firstname);
    if (userInfo.lastname) localStorage.setItem('lastname', userInfo.lastname);
    if (userInfo.fullname) localStorage.setItem('fullname', userInfo.fullname);

    // Store complete user object as JSON for easy access
    localStorage.setItem('currentUser', JSON.stringify(userInfo));

    console.log(' User info stored in localStorage:', {
      userid: userInfo.userid,
      username: userInfo.username,
      fullname: userInfo.fullname,
      profileImage: userInfo.profileimageurl ? 'Yes' : 'No',
      storedToken: localStorage.getItem('token'),
      storedUsername: localStorage.getItem('username'),
      storedUserid: localStorage.getItem('userid')
    });

    // VERIFICATION: Double-check storage worked
    setTimeout(() => {
      console.log(' Post-storage verification:', {
        token: localStorage.getItem('token'),
        username: localStorage.getItem('username'),
        userid: localStorage.getItem('userid'),
        currentUser: localStorage.getItem('currentUser')
      });
    }, 100);

    return userInfo;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get current user info from localStorage
export const getCurrentUser = () => {
  try {
    // Try to get the complete user object first
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      console.log(' Retrieved user from localStorage:', user);
      return user;
    }

    // Fallback: construct from individual items
    const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
    const userid = localStorage.getItem('userid');
    
    if (username && userid) {
      const fallbackUser = {
        userid: userid,
        username: username,
        profileimageurl: localStorage.getItem('profileimageurl'),
        firstname: localStorage.getItem('firstname') || '',
        lastname: localStorage.getItem('lastname') || '',
        fullname: localStorage.getItem('fullname') || username,
        email: localStorage.getItem('usernameoremail') || username
      };
      
      console.log(' Constructed user from localStorage items:', fallbackUser);
      return fallbackUser;
    }

    return null;
  } catch (error) {
    console.error(' Error getting current user:', error);
    return null;
  }
};

// Update user info in localStorage
export const updateCurrentUser = (updates) => {
  try {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      
      // Update localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update individual items for backward compatibility
      if (updates.username) localStorage.setItem('username', updates.username);
      if (updates.userid) localStorage.setItem('userid', String(updates.userid));
      if (updates.profileimageurl) localStorage.setItem('profileimageurl', updates.profileimageurl);
      if (updates.firstname) localStorage.setItem('firstname', updates.firstname);
      if (updates.lastname) localStorage.setItem('lastname', updates.lastname);
      if (updates.fullname) localStorage.setItem('fullname', updates.fullname);

      console.log(' User info updated in localStorage');
      return updatedUser;
    }
  } catch (error) {
    console.error(' Error updating current user:', error);
  }
  return null;
};

// Add logout function
export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('token');

    if (token) {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.warn('Logout failed:', error);
  } finally {
    localStorage.clear();
    window.location.href = '/login';
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
    const users = Array.isArray(data) ? data : (data.users || []);
    
    console.log(' Fetched users:', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id == userId || u.userid == userId);
    
    if (user) {
      console.log(' Found user by ID:', userId, user);
      return user;
    }
    
    return null;
  } catch (error) {
    console.error(' Error getting user by ID:', error);
    return null;
  }
};

// Optionally, group all functions in an object for easier import:
export const userAPI = {
  loginUser,
  logoutUser,
  getUsers,
  getCurrentUser,
  updateCurrentUser,
  getUserById,
};

export default userAPI;