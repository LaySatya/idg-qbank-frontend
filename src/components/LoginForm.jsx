import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { loginUser } from '../api/userapi';

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Responsive modal sizing handled by .login-modal-box class and CSS

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setIsLoading(true);
    try {
      const response = await loginUser(username.trim(), password.trim());
      if (!response.token) throw new Error('No authentication token received');
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      localStorage.setItem('userid', response.userid);
      localStorage.setItem('profileimageurl', response.profileimageurl);
      if (onLogin) {
        onLogin(response.token, response.username, response.userid, response.profileimageurl);
      } else {
        window.location.href = '/question-bank';
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={true} aria-labelledby="login-modal-title" aria-describedby="login-modal-description" sx={{ zIndex: 1300 }}>
      <Box
        className="login-modal-box"
        sx={{
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
        }}
      >
        <div className="text-center space-y-8">
          <div className="mx-auto">
            <img
              src="/CADT-IDG-Logos-Navy_CADT-IDG-Lockup-1-Khmer-English.png"
              alt="IDG Logo"
              className="h-20 w-auto mx-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome</h1>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
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
                                className="block w-full rounded-2xl px-6 py-5 text-xl bg-gray-50 focus:bg-white border border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-200"
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
                className="block w-full rounded-2xl px-6 py-5 text-xl bg-gray-50 focus:bg-white border border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-200 pr-16"
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
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 CADT Institute of Digital Government. All rights reserved.
          </p>
        </div>
      </Box>
    </Modal>
  );
};

export default LoginForm;