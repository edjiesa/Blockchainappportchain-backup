import { useState } from 'react';
import { Building2, Users, Network, X, Shield, Key } from 'lucide-react';
import { mockOrganizations, mockUsers } from '../data/portData';

export function Organizations() {
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [modalType, setModalType] = useState<'details' | 'users' | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
  // Local state to hold users so we can dynamically add new ones
  const [users, setUsers] = useState(mockUsers);

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newUser = {
      user_id: `usr-${Date.now()}`,
      organization_id: selectedOrg.organization_id,
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      role_name: formData.get('role') as string,
      is_active: true,
      created_at: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    setShowRegisterForm(false);
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Organisasi & Channel</h2>
        <p className="text-gray-600 mt-1">Manajemen organisasi dalam Hyperledger Fabric Network</p>
      </div>

      {/* Network Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Network className="w-12 h-12" />
          <div className="flex-1">
            <h3 className="text-xl font-bold">Hyperledger Fabric Channel</h3>
            <p className="text-blue-100 mt-1">Channel Name: port-channel</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Organizations</p>
            <p className="text-3xl font-bold">{mockOrganizations.length}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{mockOrganizations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{mockUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Network className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Active Channels</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockOrganizations.map((org) => {
          const orgUsers = users.filter(u => u.organization_id === org.organization_id);
          
          return (
            <div key={org.organization_id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{org.organization_name}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{org.organization_type}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Organization ID</span>
                  <span className="font-mono text-sm text-gray-900">{org.organization_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Channel</span>
                  <span className="font-mono text-sm text-blue-600">{org.channel_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Users</span>
                  <span className="font-medium text-gray-900">{orgUsers.length}</span>
                </div>
              </div>

              {/* Users List */}
              {orgUsers.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">Users dalam organisasi ini:</p>
                  <div className="space-y-2">
                    {orgUsers.map((user) => (
                      <div key={user.user_id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {user.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                          <p className="text-xs text-gray-600 truncate">{user.role_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedOrg(org); setModalType('details'); }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => { setSelectedOrg(org); setModalType('users'); }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Manage Users
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Organization Types */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tipe Organisasi dalam Network</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from(new Set(mockOrganizations.map(o => o.organization_type))).map(type => {
            const count = mockOrganizations.filter(o => o.organization_type === type).length;
            return (
              <div key={type} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 mt-1">{type}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Info */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Configuration</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Channel Name</span>
            <span className="font-mono font-medium text-gray-900">port-channel</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Member Organizations</span>
            <span className="font-medium text-gray-900">{mockOrganizations.length}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Chaincode Deployed</span>
            <span className="font-mono text-sm text-blue-600">portchain-cc, customs-cc, ebl-cc</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Consensus</span>
            <span className="font-medium text-gray-900">Raft</span>
          </div>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {selectedOrg && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {modalType === 'details' ? 'Organization Details' : 'Manage Users'}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedOrg.organization_name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedOrg(null); setModalType(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'details' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Organization MSP ID</p>
                      <p className="font-mono font-bold text-gray-900">{selectedOrg.organization_id}MSP</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Certificate Authority</p>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <p className="font-mono font-bold text-green-600">ca.{selectedOrg.organization_id}.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex gap-3">
                      <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Crypto Material Storage</p>
                        <p className="text-sm text-blue-800 mt-1">
                          Sertifikat (X.509) untuk node Peer dan Orderer dari organisasi ini telah disinkronisasikan dan disimpan secara aman di dalam HSM (Hardware Security Module) terenkripsi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showRegisterForm ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setShowRegisterForm(false)} className="text-gray-500 hover:text-gray-800 text-sm font-medium">
                      &larr; Back to User List
                    </button>
                  </div>
                  <form onSubmit={handleRegisterUser} className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username / Enrollment ID</label>
                      <input type="text" name="username" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600" placeholder="e.g. admin_bank" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input type="email" name="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600" placeholder="e.g. admin@banking.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Role</label>
                        <select name="role" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
                          <option value="client">Client</option>
                          <option value="admin">Admin</option>
                          <option value="peer">Peer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
                        <select name="affiliation" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600">
                          <option value={`${selectedOrg.organization_id}.department1`}>{selectedOrg.organization_id}.department1</option>
                          <option value={`${selectedOrg.organization_id}.department2`}>{selectedOrg.organization_id}.department2</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Register User ke CA
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">Daftar pengguna yang terdaftar di Fabric CA untuk organisasi ini.</p>
                    <button 
                      onClick={() => setShowRegisterForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                      + Register New User
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Username</th>
                          <th className="px-4 py-3 font-medium">Role</th>
                          <th className="px-4 py-3 font-medium">Affiliation</th>
                          <th className="px-4 py-3 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.filter(u => u.organization_id === selectedOrg.organization_id).length === 0 && (
                           <tr>
                             <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">Belum ada user yang terdaftar.</td>
                           </tr>
                        )}
                        {users.filter(u => u.organization_id === selectedOrg.organization_id).map(user => (
                          <tr key={user.user_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {user.role_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{selectedOrg.organization_id}.department1</td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Revoke</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right rounded-b-2xl">
              <button 
                onClick={() => { setSelectedOrg(null); setModalType(null); setShowRegisterForm(false); }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
