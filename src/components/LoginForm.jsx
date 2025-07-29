import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { loginUser } from '../api/userapi';

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const autoLogin = `${import.meta.env.VITE_AUTO_LOGIN}`;   
  const autoLoginToken = import.meta.env.VITE_MOODLE_TOKEN;

  // Validate required environment variables
  React.useEffect(() => {
    const requiredEnvVars = [
      'VITE_LOCAL_MOODLE_URL',
      'VITE_LOCAL_MOODLE_TOKEN',
      'VITE_LOCAL_MOODLE_SERVICE',
      'VITE_PRODUCTION_MOODLE_URL',
      'VITE_PRODUCTION_MOODLE_TOKEN',
      'VITE_PRODUCTION_MOODLE_SERVICE',
      'VITE_AUTO_LOGIN'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(' Missing environment variables:', missingVars);
      console.warn(' Please check your .env file and ensure all Moodle environment variables are set');
    }
  }, []);

// Place this anywhere in your component to trigger the background request
// const openUrlSilently = async (url, e) => {
//   const a = document.createElement('a');
//   a.href = url;
//   a.target = '_blank'; // Open in new tab
//   a.rel = 'noopener noreferrer';
//   a.style.display = 'none';
//   document.body.appendChild(a);
//   a.click();
//   e.preventDefault(); // Prevent default link behavior
//   document.body.removeChild(a);
// };

const silentMoodleLogin = async (token) => {
  try {
    // Define both Moodle environments from environment variables
    const moodleEnvironments = [
      {
        name: 'Local Moodle',
        baseUrl: import.meta.env.VITE_LOCAL_MOODLE_URL,
        token: import.meta.env.VITE_LOCAL_MOODLE_TOKEN,
        service: import.meta.env.VITE_LOCAL_MOODLE_SERVICE
      },
      {
        name: 'Production Moodle',
        baseUrl: import.meta.env.VITE_PRODUCTION_MOODLE_URL,
        token: import.meta.env.VITE_PRODUCTION_MOODLE_TOKEN,
        service: import.meta.env.VITE_PRODUCTION_MOODLE_SERVICE
      }
    ];

    // Try auto-login with both environments
    for (const env of moodleEnvironments) {
      console.log(` Trying auto-login with ${env.name}...`);
      
      const autoLoginUrl = `${env.baseUrl}/${autoLogin}?token=${token}`;
      console.log(' Auto-login URL:', autoLoginUrl);
      
      // Test if the endpoint exists for this environment
      try {
        const testResponse = await fetch(autoLoginUrl, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        console.log(` ${env.name} endpoint test:`, testResponse.status);
      } catch (testError) {
        console.warn(` Could not test ${env.name} endpoint:`, testError.message);
      }
      
      // Try to establish session with this environment
      const sessionSuccess = await tryEnvironmentLogin(autoLoginUrl, env.name);
      
      if (sessionSuccess) {
        console.log(` ${env.name} session established successfully!`);
        // Store which environment worked
        localStorage.setItem('activeMoodleEnvironment', JSON.stringify(env));
        return true;
      } else {
        console.warn(` ${env.name} auto-login failed, trying next environment...`);
      }
    }
    
    console.warn(' Auto-login failed for all environments');
    return false;
    
  } catch (error) {
    console.error(' Silent login failed:', error);
    return false;
  }
};

// Helper function to try login with a specific environment
const tryEnvironmentLogin = async (autoLoginUrl, environmentName) => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = autoLoginUrl;
    document.body.appendChild(iframe);

    let resolved = false;
    
    iframe.onload = () => {
      if (resolved) return;
      
      try {
        // Try to check if we actually got a successful login page
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const pageContent = iframeDoc.body ? iframeDoc.body.innerText : '';
        
        if (pageContent.includes('404') || pageContent.includes('Not Found')) {
          console.warn(` ${environmentName} returned 404 - plugin not installed or wrong path`);
          resolved = true;
          cleanup();
          resolve(false);
          return;
        }
        
        console.log(` ${environmentName} session established silently`);
        resolved = true;
        cleanup();
        resolve(true);
      } catch (crossOriginError) {
        // Can't access iframe content due to CORS - assume success if iframe loaded
        console.log(`${environmentName} session established silently (cross-origin)`);
        resolved = true;
        cleanup();
        resolve(true);
      }
    };

    iframe.onerror = () => {
      if (resolved) return;
      console.warn(` ${environmentName} iframe failed to load`);
      resolved = true;
      cleanup();
      resolve(false);
    };

    // Add timeout for each environment attempt
    setTimeout(() => {
      if (!resolved) {
        console.warn(` ${environmentName} timeout - iframe took too long to load`);
        resolved = true;
        cleanup();
        resolve(false);
      }
    }, 5000); // 5 second timeout per environment
    
    function cleanup() {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  });
};

const alternativeMoodleLogin = async (username, password) => {
  // Get the environments from environment variables (same as defined in silentMoodleLogin)
  const moodleEnvironments = [
    {
      name: 'Local Moodle',
      baseUrl: import.meta.env.VITE_LOCAL_MOODLE_URL,
      token: import.meta.env.VITE_LOCAL_MOODLE_TOKEN,
      service: import.meta.env.VITE_LOCAL_MOODLE_SERVICE
    },
    {
      name: 'Production Moodle',
      baseUrl: import.meta.env.VITE_PRODUCTION_MOODLE_URL,
      token: import.meta.env.VITE_PRODUCTION_MOODLE_TOKEN,
      service: import.meta.env.VITE_PRODUCTION_MOODLE_SERVICE
    }
  ];

  // Try alternative login with both environments
  for (const env of moodleEnvironments) {
    try {
      console.log(` Trying alternative ${env.name} web service login...`);
      
      const loginUrl = `${env.baseUrl}/login/token.php`;
      const params = new URLSearchParams({
        username: username,
        password: password,
        service: env.service
      });
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });
      
      const data = await response.json();
      
      if (data.token) {
        console.log(` Alternative ${env.name} login successful`);
        
        // Store the web service token and environment info
        localStorage.setItem('moodleWebServiceToken', data.token);
        localStorage.setItem('activeMoodleEnvironment', JSON.stringify(env));
        
        // Establish session via direct login
        const sessionUrl = `${env.baseUrl}/login/index.php?token=${data.token}`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = sessionUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
        
        return true;
      } else {
        console.warn(` Alternative ${env.name} login failed:`, data);
      }
    } catch (error) {
      console.error(` Alternative ${env.name} login error:`, error);
    }
  }
  
  console.warn(' Alternative login failed for all environments');
  return false;
};

const openMoodleWithSession = (targetUrl = null) => {
  try {
    // Get the active Moodle environment from localStorage
    const activeEnvString = localStorage.getItem('activeMoodleEnvironment');
    let moodleUrl;
    
    if (activeEnvString) {
      const activeEnv = JSON.parse(activeEnvString);
      moodleUrl = targetUrl || `${activeEnv.baseUrl}/my/`;
      console.log(`🔗 Opening ${activeEnv.name}: ${moodleUrl}`);
    } else {
      // Fallback to environment variable if no active environment stored
      moodleUrl = targetUrl || `${import.meta.env.VITE_MOODLE_BASE_URL}/my/`;
      console.log('🔗 Opening fallback Moodle URL:', moodleUrl);
    }
    
    window.open(moodleUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error(' Error opening Moodle:', error);
    // Fallback to environment variable
    const fallbackUrl = targetUrl || `${import.meta.env.VITE_MOODLE_BASE_URL}/my/`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  }
};
// Usage in your login logic:
// openUrlWithATag(`${import.meta.env.VITE_MOODLE_BASE_URL}/${autoLogin}?token=${response.token}`);

// Usage

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the enhanced loginUser function which now stores comprehensive user data
      const response = await loginUser(username.trim(), password.trim());
      
      // Debug log to verify response
      // console.log(' Enhanced login response:', response);

      // Establish Moodle session silently in background
      console.log(' Establishing Moodle session silently...');
      console.log(' Environment variables check:', {
        AUTO_LOGIN: import.meta.env.VITE_AUTO_LOGIN,
        LOCAL_MOODLE_URL: import.meta.env.VITE_LOCAL_MOODLE_URL,
        LOCAL_MOODLE_SERVICE: import.meta.env.VITE_LOCAL_MOODLE_SERVICE,
        PRODUCTION_MOODLE_URL: import.meta.env.VITE_PRODUCTION_MOODLE_URL,
        PRODUCTION_MOODLE_SERVICE: import.meta.env.VITE_PRODUCTION_MOODLE_SERVICE,
        LOCAL_TOKEN: import.meta.env.VITE_LOCAL_MOODLE_TOKEN ? 'Set' : 'Not set',
        PRODUCTION_TOKEN: import.meta.env.VITE_PRODUCTION_MOODLE_TOKEN ? 'Set' : 'Not set'
      });
      
      const sessionEstablished = await silentMoodleLogin(response.token);
      
      if (sessionEstablished) {
        console.log(' Moodle session ready! Users can now access Moodle without login.');
        
        // Store session status for later use
        localStorage.setItem('moodleSessionReady', 'true');
        localStorage.setItem('moodleSessionTime', Date.now().toString());
        localStorage.setItem('moodleLoginMethod', 'autologin');
      } else {
        console.warn(' Auto-login failed, trying alternative web service method...');
        
        // Try alternative login method
        const altLoginSuccess = await alternativeMoodleLogin(username, password);
        
        if (altLoginSuccess) {
          console.log('Alternative Moodle session established!');
          localStorage.setItem('moodleSessionReady', 'true');
          localStorage.setItem('moodleSessionTime', Date.now().toString());
          localStorage.setItem('moodleLoginMethod', 'webservice');
        } else {
          console.warn(' All Moodle login methods failed');
          console.warn(' Possible solutions:');
          console.warn('   1. Install auto-login plugin: https://github.com/catalyst/moodle-local_autologin');
          console.warn('   2. Enable web services in Moodle');
          console.warn('   3. Check Moodle URL and credentials');
        }
      }

      // Make sure we have all required data before proceeding
      if (!response.token) {
        throw new Error('No authentication token received');
      }

      // The enhanced loginUser function already stores all data in localStorage
      // But we can verify it's stored correctly
      // console.log(' Verifying stored user data:', {
      //   token: localStorage.getItem('token'),
      //   username: localStorage.getItem('username'),
      //   userid: localStorage.getItem('userid'),
      //   profileImage: localStorage.getItem('profileimageurl'),
      //   currentUser: localStorage.getItem('currentUser')
      // });

      // Call the onLogin handler with all data
      if (onLogin) {
        onLogin(
          response.token, 
          response.username, 
          response.userid, 
          response.profileimageurl
        );
      } else {
        window.location.href = '/question-bank'; // Fallback redirect
      }

      console.log(' Login successful! User data stored for comments.');
      
    } catch (err) {
      console.error(' Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={true} aria-labelledby="login-modal-title" aria-describedby="login-modal-description" sx={{ zIndex: 1300 }}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 24,
        p: { xs: 3, sm: 6, md: 8 },
        width: { xs: '95vw', sm: 500, md: 700 },
        maxWidth: 650,
        minWidth: 300,
      }}>
        <div className="text-center space-y-8">
          <div className="mx-auto">
            <img
              src="/src/assets/CADT-IDG-Logos-Navy_CADT-IDG-Lockup-1-Khmer-English.png"
              alt="CADT Logo"
              className="h-20 w-auto mx-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-600 text-xl">Sign in to your CADT account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username Field */}
            <div className="space-y-3">
              <label htmlFor="usernameoremail" className="block text-base font-semibold text-gray-700">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="usernameoremail"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full border-2 border-gray-200 rounded-2xl px-6 py-5 text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  autoComplete="username"
                  disabled={isLoading}
                  placeholder="Enter your username or email"
                />
                <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-base font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border-2 border-gray-200 rounded-2xl px-6 py-5 text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white pr-16"
                  autoComplete="current-password"
                  disabled={isLoading}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 16.121m6.878-6.243L16.121 3" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-5 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.333 3.924 20 5.464 20z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-not-allowed text-white py-6 px-8 rounded-2xl font-semibold text-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign in to Account
                </>
              )}
            </button>
          </form>
        
        {/* Moodle Access Card */}
        {localStorage.getItem('moodleSessionReady') === 'true' && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Moodle Access Ready</h3>
                <p className="text-sm text-green-600">You can now access Moodle without additional login</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openMoodleWithSession()}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Moodle Dashboard
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 CADT Institute of Digital Government. All rights reserved.
          </p>
        </div>
      </Box>
    </Modal>
  );
};

// Utility functions that can be imported by other components
export const checkMoodleSession = () => {
  const sessionReady = localStorage.getItem('moodleSessionReady') === 'true';
  const sessionTime = localStorage.getItem('moodleSessionTime');
  
  // Check if session is still valid (within 8 hours)
  if (sessionReady && sessionTime) {
    const timeDiff = Date.now() - parseInt(sessionTime);
    const eightHours = 8 * 60 * 60 * 1000;
    
    if (timeDiff < eightHours) {
      return true;
    } else {
      // Session expired, clear it
      localStorage.removeItem('moodleSessionReady');
      localStorage.removeItem('moodleSessionTime');
      return false;
    }
  }
  
  return false;
};

export const openMoodleDirect = (targetPath = '/my/') => {
  if (checkMoodleSession()) {
    try {
      // Get the active Moodle environment from localStorage
      const activeEnvString = localStorage.getItem('activeMoodleEnvironment');
      let moodleUrl;
      
      if (activeEnvString) {
        const activeEnv = JSON.parse(activeEnvString);
        moodleUrl = `${activeEnv.baseUrl}${targetPath}`;
        console.log(` Opening ${activeEnv.name}: ${moodleUrl}`);
      } else {
        // Fallback to environment variable
        moodleUrl = `${import.meta.env.VITE_MOODLE_BASE_URL}${targetPath}`;
        console.log(' Opening fallback Moodle URL:', moodleUrl);
      }
      
      window.open(moodleUrl, '_blank', 'noopener,noreferrer');
      return true;
    } catch (error) {
      console.error('Error opening Moodle:', error);
      // Fallback to environment variable
      const fallbackUrl = `${import.meta.env.VITE_MOODLE_BASE_URL}${targetPath}`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      return true;
    }
  } else {
    console.warn(' Moodle session not ready. User needs to login first.');
    return false;
  }
};

export default LoginForm;