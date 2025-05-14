import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaBox, 
  FaClipboardList, 
  FaShoppingCart, 
  FaWarehouse, 
  FaReceipt, 
  FaBoxOpen, 
  FaCashRegister, 
  FaChartLine,
  FaHome,
  FaShoppingBag,
  FaUsers,
  FaBoxes,
  FaClipboard,
  FaComments,
  FaIndustry,
  FaListAlt
} from 'react-icons/fa';
import ProductionNotifications from './ProductionNotifications';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeUsers: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    fetchRecentOrders();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch orders
      const ordersResponse = await axios.get('http://localhost:3000/api/orders', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch users
      const usersResponse = await axios.get('http://localhost:3000/api/users/users', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const orders = ordersResponse.data;
      const users = usersResponse.data;

      // Calculate statistics
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => order.order_status === 'PENDING').length;
      const activeUsers = users.length;

      setStats({
        totalOrders,
        activeUsers,
        pendingOrders
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/orders/recent-production', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Transform the data to match our display format
      const formattedOrders = response.data.orders.map(order => ({
        id: order.order_id,
        customer: order.address.full_name,
        items: order.items.reduce((total, item) => total + item.quantity, 0),
        total: `Rs.${parseFloat(order.total_amount).toFixed(2)}`,
        status: order.order_status
      }));

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      toast.error('Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    if (path === 'products') {
      navigate('/product-management');
    } else if (path === 'inventory') {
      navigate('/inventory');
    } else if (path === 'purchase') {
      navigate('/purchase-management');
    } else if (path === 'inventory-stock') {
      navigate('/inventory-stock');
    } else {
      setActiveTab(path);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <FaHome className="w-6 h-6" /> },
    { id: 'users', label: 'Users', icon: <FaUsers className="w-6 h-6" /> },
    { id: 'inventory', label: 'Inventory Items', icon: <FaBoxes className="w-6 h-6" /> },
    { id: 'purchase', label: 'Purchases', icon: <FaShoppingCart className="w-6 h-6" /> },
    { id: 'inventory-stock', label: 'Current Inventory Stock', icon: <FaWarehouse className="w-6 h-6" /> },

  ];


  return (
    <div className="min-h-screen bg-white p-4">
      <ProductionNotifications />
      {/* Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-72 bg-white p-6 shadow-lg"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-600">HOT-FAST</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                activeTab === item.id
                  ? 'bg-green-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="text-base whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="ml-72 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl text-gray-800 font-bold">Dashboard Overview</h2>
          <div className="flex items-center space-x-4">
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white text-gray-800 p-6 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-gray-600 mb-2">{stat.title}</h3>
              <div className="flex justify-between items-end">
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  stat.trend === 'up' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-md"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Orders</h3>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="pb-4">Order ID</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Items</th>
                    <th className="pb-4">Total</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-200 text-gray-800">
                      <td className="py-4">#{order.id}</td>
                      <td className="py-4">{order.customer}</td>
                      <td className="py-4">{order.items}</td>
                      <td className="py-4">{order.total}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Management Options */}
      </div>
    </div>
  );
};

export default AdminDashboard; 