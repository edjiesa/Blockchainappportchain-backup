import { Building2, Users, Network } from 'lucide-react';
import { mockOrganizations, mockUsers } from '../data/portData';

export function Organizations() {
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
          const orgUsers = mockUsers.filter(u => u.organization_id === org.organization_id);
          
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
                  <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
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
    </div>
  );
}
