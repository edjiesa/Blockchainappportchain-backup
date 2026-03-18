import { Outlet, Link, useLocation } from "react-router";
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
  X 
} from "lucide-react";
import { useState } from "react";

export function Root() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Shipments', path: '/shipments', icon: Anchor },
    { name: 'Customs', path: '/customs', icon: Shield },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'e-BL', path: '/ebl', icon: Receipt },
    { name: 'Organizations', path: '/organizations', icon: Building2 },
    { name: 'Blockchain', path: '/blockchain', icon: Database },
    { name: 'Audit Trail', path: '/audit', icon: FileCheck },
  ];

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
                <p className="text-xs text-blue-100">Hyperledger Fabric Port Licensing System</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-blue-700 text-white"
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
          <div className="md:hidden border-t border-blue-700 bg-blue-700">
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
