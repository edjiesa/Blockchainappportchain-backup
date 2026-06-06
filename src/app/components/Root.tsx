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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-blue-900 to-blue-950 text-white shadow-2xl z-20">
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-blue-800/50 bg-blue-950/30">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/10 shadow-inner">
            <Anchor className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-white">PortChain</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold mt-0.5">Enterprise Fabric</p>
          </div>
        </div>
        
        {/* User Profile Mini */}
        <div className="px-6 py-6 border-b border-blue-800/50 bg-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-blue-900 rounded-full flex items-center justify-center border-2 border-blue-900">
                <UserIcon className="w-5 h-5 text-blue-100" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-blue-300 truncate mt-0.5">{user?.organization_name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          <div className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-3 px-3">Main Menu</div>
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/50'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'text-blue-400 group-hover:scale-110 group-hover:text-blue-300'}`} />
                <span className="font-medium text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-blue-800/50 bg-blue-950/30">
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-blue-200 hover:text-white hover:bg-red-500/90 hover:shadow-lg hover:shadow-red-900/50 rounded-xl transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-semibold text-sm tracking-wide">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header (Only visible on lg:hidden) */}
        <header className="lg:hidden bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-xl z-30 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Anchor className="w-5 h-5 text-blue-300" />
              </div>
              <h1 className="font-bold text-lg tracking-tight">PortChain</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Dropdown Navigation */}
          {mobileMenuOpen && (
            <div className="border-t border-blue-700/50 bg-blue-900/95 backdrop-blur-md shadow-inner absolute w-full left-0">
              <div className="px-4 py-4 border-b border-blue-800/50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5 rounded-full">
                     <div className="w-full h-full bg-blue-900 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-100" />
                     </div>
                   </div>
                   <div>
                     <p className="font-bold text-sm text-white leading-tight">{user?.full_name}</p>
                     <p className="text-xs text-blue-300">{user?.organization_name}</p>
                   </div>
                 </div>
              </div>
              <nav className="px-4 py-3 space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 mt-4 text-red-300 hover:text-white hover:bg-red-500/90 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          )}
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
          
          {/* Footer inside scroll area so it naturally sits at the bottom */}
          <footer className="mt-auto bg-white/50 backdrop-blur-sm border-t border-gray-200/60 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm font-medium text-gray-500">
                PortChain Enterprise © {new Date().getFullYear()} - Port Licensing & Permit Management
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Powered by Hyperledger Fabric &bull; Built for Port Authority
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
