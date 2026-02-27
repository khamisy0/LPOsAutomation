import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getUser, removeToken, removeUser } from '../utils/auth';

export const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left - Logo/Company Name */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold" style={{ color: '#58585a' }}>
              SmartLPO
            </Link>
          </div>

          {/* Center - Navigation */}
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="font-medium transition text-gray-700 hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/invoices"
              className="font-medium transition text-gray-700 hover:text-primary"
            >
              Invoices
            </Link>
            <Link
              to="/tracker"
              className="font-medium transition text-gray-700 hover:text-primary"
            >
              Tracker
            </Link>
          </div>

          {/* Right - User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-primary">{user?.email}</p>
            </div>
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-10 w-10 rounded-full"
              />
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full transition text-gray-700 hover:bg-gray-100"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
