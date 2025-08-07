import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmationModal from '../../components/LogoutConfirmationModal';
import AccountSettingsModal from '../AccountSettingsModal';
const Header = ({ toggleSidebar, onLogout, username, profileImageUrl, user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imgError, setImgError] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
  const navigate = useNavigate();

  // Reset image error when profileImageUrl changes
  useEffect(() => {
    if (profileImageUrl) {
      setImgError(false);
    }
  }, [profileImageUrl]);

  const handleLogoutClick = () => {
    setShowDropdown(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Log profile image URL for debugging
  useEffect(() => {
    console.log("Profile image URL in Header:", profileImageUrl);
  }, [profileImageUrl]);

  // Helper to get the image source
  const getProfileImageSrc = () => {
    const localUrl = localStorage.getItem('profileimageurl');
    if (imgError || !(localUrl || profileImageUrl)) {
      return null;
    }
    return localUrl || profileImageUrl;
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {username}</span>
            {/* User dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors"
              >
                {getProfileImageSrc() ? (
                  <img
                    src={getProfileImageSrc()}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={() => {
                      console.log("Image failed to load:", profileImageUrl);
                      setImgError(true);
                    }}
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-800 font-medium text-sm">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </span>
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                  {/* Header Section */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      {getProfileImageSrc() ? (
                        <img
                          src={getProfileImageSrc()}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium text-lg">
                            {username ? username.charAt(0).toUpperCase() : "U"}
                          </span>
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm truncate max-w-[120px] overflow-hidden whitespace-nowrap">{username}</div>
                      </div>
                    </div>
                  </div>
                  {/* Menu Items */}
                  <div className="py-1">
                    {/* <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/profile');
                      }}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </button> */}
                    <button
                          onClick={() => {
          setShowDropdown(false);
          setShowAccountModal(true); // <-- Open modal
        }}
                                           className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </button>

                    {/* Divider */}
                    <div className="my-2 border-t border-gray-100"></div>
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowDropdown(false)}
          ></div>
        )}
      </header>
         <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        user={user}
      />
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        isLoading={isLoggingOut}
      />

    </>
  );
};

export default Header;