import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  Anchor, 
  Shield, 
  FileText, 
  Receipt,
  Building2,
  Database,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalShipments: 0,
    pendingCustoms: 0,
    approvedCustoms: 0,
    activeEBLs: 0,
    totalDocuments: 0,
    activeContainers: 0,
    channelNodes: 3,
    totalTransactions: 0
  });
  const [allShipments, setAllShipments] = useState<any[]>([]);
  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [recentCustoms, setRecentCustoms] = useState<any[]>([]);
  
  const [customsStats, setCustomsStats] = useState<any[]>([]);
  const [shipmentTrends, setShipmentTrends] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const responseStats = await fetch('http://localhost:3001/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: "2.0", method: "GetDashboardStats", params: {}, id: 1 })
        });
        const statsData = await responseStats.json();
        if (statsData.result) {
          setStats(statsData.result);
          const rawCustomsStats = [
            { status: 'Pending', count: statsData.result.pendingCustoms, color: '#f59e0b' },
            { status: 'Approved', count: statsData.result.approvedCustoms, color: '#10b981' },
            { status: 'Rejected', count: statsData.result.rejectedCustoms || 0, color: '#ef4444' },
          ];
          setCustomsStats(rawCustomsStats.filter(item => item.count > 0));

          // Dummy trend generated based on real totalShipments & customs
          setShipmentTrends([
            { day: 'Mon', shipments: Math.max(0, statsData.result.totalShipments - 6), clearances: Math.max(0, statsData.result.approvedCustoms - 3) },
            { day: 'Tue', shipments: Math.max(0, statsData.result.totalShipments - 5), clearances: Math.max(0, statsData.result.approvedCustoms - 2) },
            { day: 'Wed', shipments: Math.max(0, statsData.result.totalShipments - 4), clearances: Math.max(0, statsData.result.approvedCustoms - 2) },
            { day: 'Thu', shipments: Math.max(0, statsData.result.totalShipments - 3), clearances: Math.max(0, statsData.result.approvedCustoms - 1) },
            { day: 'Fri', shipments: Math.max(0, statsData.result.totalShipments - 2), clearances: Math.max(0, statsData.result.approvedCustoms - 1) },
            { day: 'Sat', shipments: Math.max(0, statsData.result.totalShipments - 1), clearances: Math.max(0, statsData.result.approvedCustoms) },
            { day: 'Sun', shipments: statsData.result.totalShipments, clearances: statsData.result.approvedCustoms + statsData.result.pendingCustoms },
          ]);
        }

        const responseShipments = await fetch('http://localhost:3001/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: "2.0", method: "GetAllShipments", params: {}, id: 2 })
        });
        const shipData = await responseShipments.json();
        if (shipData.result) {
          setAllShipments(shipData.result);
          setRecentShipments(shipData.result.slice(0, 5));
        }

        const responseCustoms = await fetch('http://localhost:3001/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: "2.0", method: "GetCustomsClearances", params: {}, id: 3 })
        });
        const customData = await responseCustoms.json();
        if (customData.result) {
          setRecentCustoms(customData.result.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Total Shipments',
      value: stats.totalShipments,
      icon: Anchor,
      color: 'blue',
      link: '/shipments'
    },
    {
      title: 'Pending Customs',
      value: stats.pendingCustoms,
      icon: Clock,
      color: 'yellow',
      link: '/customs'
    },
    {
      title: 'Approved Clearances',
      value: stats.approvedCustoms,
      icon: CheckCircle,
      color: 'green',
      link: '/customs'
    },
    {
      title: 'Active e-BLs',
      value: stats.activeEBLs,
      icon: Receipt,
      color: 'purple',
      link: '/ebl'
    },
  ];

  const metricsCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'indigo'
    },
    {
      title: 'Containers',
      value: stats.activeContainers,
      icon: Database,
      color: 'teal'
    },
    {
      title: 'Organizations',
      value: stats.channelNodes,
      icon: Building2,
      color: 'orange'
    },
    {
      title: 'Blockchain TXs',
      value: stats.totalTransactions,
      icon: Shield,
      color: 'red'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Sistem perizinan pelabuhan berbasis Hyperledger Fabric</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-800">Hyperledger Fabric Online</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 text-${stat.color}-600`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Trends */}
        <div key="shipment-trends-chart" className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tren Pengiriman (7 Hari)</h3>
              <p className="text-sm text-gray-600">Shipments, clearances & documents</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <ResponsiveContainer width="100%" height={280} key="shipment-trends-container">
            <LineChart data={shipmentTrends} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="shipments" stroke="#3b82f6" strokeWidth={2} name="Shipments" />
              <Line type="monotone" dataKey="clearances" stroke="#10b981" strokeWidth={2} name="Clearances" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Customs Status Distribution */}
        <div key="customs-stats-chart" className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Status Bea Cukai</h3>
          <ResponsiveContainer width="100%" height={280} key="customs-stats-container">
            <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie
                data={customsStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {customsStats.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Shipment Terbaru</h3>
              <Link to="/shipments" className="text-sm text-blue-600 hover:text-blue-700">
                Lihat Semua →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentShipments.map((shipment) => (
              <div key={shipment.shipment_id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        {shipment.shipment_code}
                      </span>
                      <Anchor className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{shipment.vessel_name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {shipment.origin_port} → {shipment.destination_port}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(shipment.created_at).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {shipment.total_weight_kg.toLocaleString()} kg
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Customs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Customs Clearance Terbaru</h3>
              <Link to="/customs" className="text-sm text-blue-600 hover:text-blue-700">
                Lihat Semua →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentCustoms.map((customs) => {
              const shipment = allShipments.find(s => s.shipment_id === customs.shipment_id);
              return (
                <div key={customs.customs_clearance_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {customs.pib_number}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {shipment?.shipment_code || 'N/A'}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2 ${
                        (customs.customs_status || '').toUpperCase() === 'APPROVED' 
                          ? 'bg-green-100 text-green-800'
                          : (customs.customs_status || '').toUpperCase() === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(customs.customs_status || '').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(customs.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hyperledger Fabric Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <Database className="w-12 h-12" />
          <div className="flex-1">
            <h3 className="text-xl font-bold">Hyperledger Fabric Network</h3>
            <p className="text-blue-100 mt-1">Channel: port-channel • Chaincode: portchain-cc, customs-cc, ebl-cc</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Total Transaksi</p>
            <p className="text-3xl font-bold">{stats.totalTransactions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}