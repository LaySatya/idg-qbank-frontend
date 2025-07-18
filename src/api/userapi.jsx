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

// Get users with role information by fetching from all roles
export const getUsersWithRoles = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log(' Fetching users with role information...');

    // First, get all available roles
    const rolesResponse = await getRoles();
    const roles = rolesResponse.roles || [];

    if (roles.length === 0) {
      console.warn(' No roles found, falling back to basic user fetch');
      return await getUsers();
    }

    // Fetch users for each role
    const allUsersWithRoles = [];
    const userMap = new Map(); // To avoid duplicates

    for (const role of roles) {
      try {
        console.log(` Fetching users for role: ${role.shortname}`);
        const roleUsersResponse = await getUsersByRole(role.shortname);
        const roleUsers = roleUsersResponse.users || [];

        roleUsers.forEach(user => {
          if (!userMap.has(user.id)) {
            // Add role information to the user
            const userWithRole = {
              ...user,
              role: role.shortname,
              rolename: role.name || role.shortname,
              userrole: role.shortname
            };
            userMap.set(user.id, userWithRole);
            allUsersWithRoles.push(userWithRole);
          }
        });
      } catch (roleError) {
        console.warn(` Failed to fetch users for role ${role.shortname}:`, roleError.message);
      }
    }

    console.log(` Fetched ${allUsersWithRoles.length} users with role information`);
    return allUsersWithRoles;

  } catch (error) {
    console.error(' Error fetching users with roles:', error);
    // Fallback to regular user fetch
    console.log(' Falling back to regular user fetch');
    return await getUsers();
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

// Get all user roles from the system
export const getRoles = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log(' Attempting to fetch roles from:', `${API_BASE_URL}/users/roles`);
    
    const response = await fetch(`${API_BASE_URL}/users/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(` Roles endpoint returned ${response.status}. Trying alternative endpoints...`);
      
      // Try alternative endpoints
      const alternatives = [
        `${API_BASE_URL}/roles`,
        `${API_BASE_URL}/user/roles`,
        `${API_BASE_URL}/admin/roles`
      ];
      
      for (const endpoint of alternatives) {
        try {
          console.log(' Trying alternative endpoint:', endpoint);
          const altResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.log('Success with alternative endpoint:', endpoint, altData);
            return altData;
          }
        } catch (altError) {
          console.log(` Alternative endpoint ${endpoint} failed:`, altError.message);
        }
      }
      
      throw new Error(`Failed to fetch roles - ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const roles = data.roles || [];
    
    console.log(' Fetched roles from API:', roles);
    return { roles };
  } catch (error) {
    console.error(' Error fetching roles from API:', error);
    
    // Fallback: Return empty roles array and let the component handle it
    console.log(' Falling back to empty roles - component will extract from users');
    return { roles: [] };
  }
};

// Get users by role shortname
export const getUsersByRole = async (rolename) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log(' Fetching users by role:', rolename);
    
    const response = await fetch(`${API_BASE_URL}/users/user-role?rolename=${encodeURIComponent(rolename)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users by role - ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let users = [];
    
    // Handle different response structures
    if (data.users && Array.isArray(data.users)) {
      users = data.users;
    } else if (Array.isArray(data)) {
      users = data;
    } else {
      users = [];
    }
    
    // Since the role-specific endpoint doesn't include role info, 
    // we'll add the role information based on what we queried for
    const usersWithRole = users.map(user => ({
      ...user,
      role: user.role || user.userrole || user.rolename || rolename,
      userrole: user.userrole || rolename,
      rolename: user.rolename || rolename
    }));
    
    console.log(`👥 Fetched ${usersWithRole.length} users with role '${rolename}':`, usersWithRole);
    
    // Return in the same format as the main getUsers function
    return {
      users: usersWithRole,
      totalcount: data.totalcount || usersWithRole.length,
      page: data.page || 0,
      perpage: data.perpage || usersWithRole.length
    };
  } catch (error) {
    console.error(' Error fetching users by role:', error);
    throw error;
  }
};

// Optionally, group all functions in an object for easier import:
export const userAPI = {
  loginUser,
  logoutUser,
  getUsers,
  getUsersWithRoles,
  getCurrentUser,
  updateCurrentUser,
  getUserById,
  getRoles,
  getUsersByRole,
};

export default userAPI;