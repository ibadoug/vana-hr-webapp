
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GlobalLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = () => {
        logout();
        navigate('/signin');
    };

    return (
        <div className="min-h-screen bg-[#F4F6F8] font-sans text-gray-900 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Vana Logo */}
                            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
                                <div className="w-8 h-8 bg-[#4F7BFE] rounded-md flex items-center justify-center text-white font-bold text-xl">
                                    V
                                </div>
                                <span className="font-bold text-xl tracking-tight text-[#2E3A45]">Vana</span>
                            </div>

                            {/* Desktop Nav Links */}
                            <nav className="hidden md:ml-10 md:flex md:space-x-8">
                                {['Home', 'Analytics', 'Directory', 'Admin'].map((item) => (
                                    <NavLink
                                        key={item}
                                        to={`/${item.toLowerCase()}`}
                                        className={({ isActive }) =>
                                            `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive
                                                ? 'border-[#4F7BFE] text-[#4F7BFE]'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`
                                        }
                                    >
                                        {item}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>

                        {/* Profile & Settings & Sign Out */}
                        <div className="flex items-center space-x-4">
                            {user && (
                                <div
                                    onClick={() => navigate('/profile')}
                                    className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#4F7BFE] font-bold text-sm cursor-pointer hover:bg-[#DCE4FF] border border-[#B4C6FF] transition-all shadow-sm"
                                    title="Profile"
                                >
                                    {user.email[0].toUpperCase()}
                                </div>
                            )}
                            <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors rounded-full hover:bg-gray-100">
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto">
                <div className="py-6 px-4 sm:px-6 lg:px-8 h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default GlobalLayout;
