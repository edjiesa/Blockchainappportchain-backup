import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { 
  Anchor, 
  Activity, 
  FileText, 
  FileCheck, 
  Receipt, 
  Building2, 
  Database,
  Shield,
  Menu,
  X,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavigation = [
    { name: 'Dashboard', path: '/', icon: Activity, roles: ['Port Authority', 'Customs', 'Banking'] },
    { name: 'Shipments', path: '/shipments', icon: Anchor, roles: ['Port Authority', 'Customs'] },
    { name: 'Customs', path: '/customs', icon: Shield, roles: ['Port Authority', 'Customs'] },
    { name: 'Documents', path: '/documents', icon: FileText, roles: ['Port Authority', 'Customs'] },
    { name: 'e-BL', path: '/ebl', icon: Receipt, roles: ['Port Authority', 'Banking'] },
    { name: 'Organizations', path: '/organizations', icon: Building2, roles: ['Port Authority'] },
    { name: 'Blockchain', path: '/blockchain', icon: Database, roles: ['Port Authority', 'Customs', 'Banking'] },
    { name: 'Audit Trail', path: '/audit', icon: FileCheck, roles: ['Port Authority', 'Customs'] },
  ];

  // Filter navigation based on user's organization type
  const navigation = allNavigation.filter(item => 
    user && item.roles.includes(user.organization_type)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 border-b border-blue-900 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Anchor className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-white">PortChain</h1>
                <p className="text-xs text-blue-100">Hyperledger Fabric Multi-Org</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4 flex-1 justify-center px-4 overflow-x-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white text-blue-600'
                        : 'text-blue-50 hover:bg-blue-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Logout (Desktop) */}
            <div className="hidden lg:flex items-center gap-4 border-l border-blue-500 pl-4">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-sm">
                  <p className="font-bold leading-none">{user?.full_name}</p>
                  <p className="text-xs text-blue-200 mt-0.5">{user?.organization_name}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-blue-700 text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-blue-700 bg-blue-700 pb-4 shadow-inner">
            <div className="px-4 pt-4 pb-2 border-b border-blue-600 mb-2 flex items-center justify-between text-white">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                   <UserIcon className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="font-bold">{user?.full_name}</p>
                   <p className="text-xs text-blue-200">{user?.organization_name}</p>
                 </div>
               </div>
               <button onClick={handleLogout} className="p-2 text-white bg-red-500 rounded-lg"><LogOut className="w-5 h-5" /></button>
            </div>
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white text-blue-600'
                        : 'text-blue-50 hover:bg-blue-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>PortChain © 2026 - Blockchain-based Port Licensing & Permit Management</p>
            <p className="mt-1">Powered by Hyperledger Fabric • PostgreSQL Database</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
