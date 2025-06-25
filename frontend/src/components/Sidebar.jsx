import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    MessageSquare,
    Home,
    FileText,
    Users,
    LogOut,
    User,
    Settings
} from 'lucide-react';
import logo from '/icons/dpdzeroLogo.png';

const iconMap = {
    home: Home,
    feedback: FileText,
    team: Users,
    settings: Settings,
};

function Sidebar({ navItems, userRole }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuth();

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="w-64 bg-gradient-to-b from-indigo-100 to-indigo-50 shadow-lg  flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                    <img src={logo} alt="DPDzero Logo" className="w-4/5" />
                    <div className='flex flex-col justify-center items-center'>
                        <h1 className="mt-2 tracking-wide text-lg font-semibold text-indigo-900">FeedbackFlow</h1>
                        <p className="text-sm text-gray-500 capitalize">{userRole} Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 pl-4 py-4">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = iconMap[item.id];
                        const active = isActive(item.path);

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg rounded-r-none text-left transition-colors ${active
                                        ? 'bg-gray-50 text-indigo-700 border border-r-0 border-indigo-200'
                                        : 'text-gray-700 hover:bg-white hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-500'}`} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Profile & Logout */}
            <div className="py-4 pl-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 mb-3 mr-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>

                {/* Settings button - only for employees */}
                {userRole === 'employee' && (
                    <button
                        onClick={() => handleNavigation('/employee/settings')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg rounded-r-none text-left transition-colors ${isActive('/employee/settings')
                            ? 'bg-gray-50 text-indigo-700 border border-r-0 border-indigo-200'
                            : 'text-gray-700 hover:bg-white hover:text-gray-900'
                            }`}
                    >
                        <Settings className={`w-5 h-5 ${isActive('/employee/settings') ? 'text-indigo-600' : 'text-gray-500'}`} />
                        <span className="font-medium">Settings</span>
                    </button>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;