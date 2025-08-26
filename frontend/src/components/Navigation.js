import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Trophy, Award, LogOut, Crown } from 'lucide-react';

const Navigation = ({ isAdmin, onAdminLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/winners', icon: Trophy, label: 'Winners' },
    { path: '/scoreboard', icon: Award, label: 'Scoreboard' },
  ];

  return (
    <nav className="nav-container">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg text-orange-700">Onam 2025</span>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item flex items-center space-x-2 ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <div className="hidden md:flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <Crown className="w-4 h-4" />
                <span>Admin</span>
              </div>
            )}
            
            {isAdmin && (
              <button
                onClick={onAdminLogout}
                className="btn-secondary flex items-center space-x-2 px-4 py-2"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mobile-nav-container">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item flex flex-col items-center space-y-1 text-xs ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;