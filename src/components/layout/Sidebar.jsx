import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileQuestion, User } from 'lucide-react';
import Logo from '../../assets/CADT-IDG-Logos-Navy_CADT-IDG-Lockup-1-Khmer-English.png';

const Sidebar = ({ collapsed }) => {
  // Navigation items
  const navItems = [
    { 
      label: 'Dashboard', 
      icon: <Home size={20} />, 
      path: '/' 
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
      } relative`}
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
                  `flex items-center px-4 py-3 ${
                    isActive 
                      ? 'bg-sky-600 text-black font-semibold' 
                      : 'text-black hover:bg-white'
                  } transition-colors duration-200 ${
                    collapsed ? 'justify-center' : ''
                  }`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;