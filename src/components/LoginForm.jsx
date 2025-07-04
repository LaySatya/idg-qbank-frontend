import React, { useState } from 'react';
import { loginUser } from '../api/userapi';

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      console.log(' Enhanced login response:', response);

      // Make sure we have all required data before proceeding
      if (!response.token) {
        throw new Error('No authentication token received');
      }

      // The enhanced loginUser function already stores all data in localStorage
      // But we can verify it's stored correctly
      console.log(' Verifying stored user data:', {
        token: localStorage.getItem('token'),
        username: localStorage.getItem('username'),
        userid: localStorage.getItem('userid'),
        profileImage: localStorage.getItem('profileimageurl'),
        currentUser: localStorage.getItem('currentUser')
      });

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
      
     

    </div>
  );
};

export default LoginForm;