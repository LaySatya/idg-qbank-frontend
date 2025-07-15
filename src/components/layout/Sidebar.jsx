import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileQuestion, User, BarChart3 } from 'lucide-react';
import Logo from '../../assets/CADT-IDG-Logos-Navy_CADT-IDG-Lockup-1-Khmer-English.png';

const Sidebar = ({ collapsed }) => {
  // Navigation items
  const navItems = [
    { 
      label: 'Dashboard', 
      icon: <BarChart3 size={20} />, 
      path: '/dashboard' 
    },
    { 
      label: 'Question Bank', 
      icon: <FileQuestion size={20} />, 
      path: '/question-bank' 
    },
    { 
      label: 'Manage Users', 
      icon: <User size={20} />, 
      path: '/manage-users' 
    }
  ];

  return (
    <aside 
      className={`bg-white text-black font-semibold transition-all duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      } relative shadow-lg border-r border-gray-200`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b bg-white border-gray-200">
        {collapsed ? (
          <div className="w-full flex justify-center">
            <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center">
              <img
                src={Logo}
                alt="CADT IDG Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center">
            <img
              src={Logo}
              alt="CADT IDG Logo"
              className="h-12 w-full object-contain"
              style={{ maxHeight: '48px' }}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="py-4">
        <ul>
          {navItems.map((item, index) => (
            <li key={index} className="mb-1">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 transition-colors duration-200 relative ${
                    isActive 
                      ? 'bg-sky-50 text-sky-700 border-r-3 border-sky-700 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex-shrink-0 ${isActive ? 'text-blue-700' : ''}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="ml-3 transition-opacity duration-200">
                        {item.label}
                      </span>
                    )}
                    {/* Active indicator for collapsed sidebar */}
                    {collapsed && isActive && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-sky-700"></div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar footer - only show when expanded */}
      {/* {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            <p className="font-medium">IDG Question Bank</p>
            <p>v1.0.0</p>
          </div>
        </div>
      )} */}
{/*  */}
      {/* Collapse indicator */}
      {/* <div className={`absolute top-1/2 -right-3 transform -translate-y-1/2 ${collapsed ? 'rotate-180' : ''} transition-transform duration-200`}>
        <div className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;