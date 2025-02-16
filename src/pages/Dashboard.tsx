import React, { useEffect, useState } from 'react';
import { Activity, DollarSign, Package, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';

interface Product {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  reorderPoint: number;
  salesHistory: { date: string; quantity: number; revenue: number }[];
}

interface DashboardData {
  revenue: number;
  totalItems: number;
  activeOrders: number;
  lowStockItems: number;
  lowStockAlerts: { productName: string }[];
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    revenue: 0,
    totalItems: 0,
    activeOrders: 0,
    lowStockItems: 0,
    lowStockAlerts: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/inventory'); // Updated endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const products: Product[] = await response.json();

        // Calculate dashboard metrics
        const revenue = products.reduce(
          (acc, product) =>
            acc +
            product.salesHistory.reduce((sum, sale) => sum + sale.revenue, 0),
          0
        );

        const totalItems = products.length;
        const activeOrders = products.reduce(
          (acc, product) => acc + product.salesHistory.length,
          0
        );

        const lowStockItems = products.filter(
          (product) => product.quantity < product.reorderPoint
        );

        const lowStockAlerts = lowStockItems.map((item) => ({
          productName: item.name,
        }));

        // Update state
        setDashboardData({
          revenue,
          totalItems,
          activeOrders,
          lowStockItems: lowStockItems.length,
          lowStockAlerts,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
            title="Total Revenue"
            value={`$${dashboardData.revenue.toLocaleString()}`}
            className="hover:bg-green-50 transition-colors"
          />
          <DashboardCard
            icon={<Package className="w-6 h-6 text-blue-500" />}
            title="Total Items"
            value={dashboardData.totalItems.toLocaleString()}
            className="hover:bg-blue-50 transition-colors"
          />
          <DashboardCard
            icon={<Activity className="w-6 h-6 text-purple-500" />}
            title="Active Orders"
            value={dashboardData.activeOrders.toLocaleString()}
            className="hover:bg-purple-50 transition-colors"
          />
          <DashboardCard
            icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
            title="Low Stock Items"
            value={dashboardData.lowStockItems.toLocaleString()}
            className="hover:bg-orange-50 transition-colors"
          />
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Low Stock Alerts</h2>
          {dashboardData.lowStockAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.lowStockAlerts.map((alert, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {alert.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        Low Stock
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No low stock alerts.</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, value, className }) => (
  <div
    className={`bg-white rounded-lg shadow-md p-6 flex flex-col justify-between ${className}`}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-opacity-20 rounded-full">{icon}</div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    </div>
    <p className="text-2xl font-bold text-gray-800 mt-4">{value}</p>
  </div>
);

export default Dashboard;