import React, { useState } from 'react';
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
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 space-y-8">
      <div className="flex flex-col items-center">
        <img
          src="/src/assets/CADT-IDG-Logos-Navy_CADT-IDG-Lockup-1-Khmer-English.png"
          alt="CADT Logo"
          width={180}
          height={40}
          className="mb-4"
        />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="usernameoremail" className="block text-sm font-medium text-gray-700 mb-1">
            Username or Email
          </label>
          <input
            type="text"
            id="usernameoremail"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            autoComplete="username"
            disabled={isLoading}
            placeholder="Enter your username or email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="Enter your password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
      
      {/* Add a button to test Moodle access after login */}
      {localStorage.getItem('moodleSessionReady') === 'true' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 mb-3">
             Moodle session is ready! You can now access Moodle without additional login.
          </p>
          <button
            type="button"
            onClick={() => openMoodleWithSession()}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Open Moodle Dashboard
          </button>
        </div>
      )}

    </div>
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