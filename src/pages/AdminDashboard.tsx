import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import adminService, { CreateUserData, UserListResponse } from '../services/adminService';
import greenhouseAdminService, { GreenhouseFormData, GreenhouseListItem } from '../services/greenhouseAdminService';
import Card from '../components/common/Card';
import Layout from '../components/layout/Layout';
import { motion } from 'framer-motion';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'greenhouses'>('users');

  // User state
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  // Greenhouse state
  const [greenhouses, setGreenhouses] = useState<GreenhouseListItem[]>([]);
  const [greenhouseLoading, setGreenhouseLoading] = useState(true);
  const [showGreenhouseModal, setShowGreenhouseModal] = useState(false);
  const [editingGreenhouse, setEditingGreenhouse] = useState<GreenhouseListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCropType, setFilterCropType] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'area_m2'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'farmer',
    phone_number: '',
    department: '',
    location: ''
  });

  const [newGreenhouse, setNewGreenhouse] = useState<GreenhouseFormData>({
    name: '',
    location: '',
    dimensions: {
      length: 100,
      width: 50,
      height: 5
    },
    area_m2: undefined,
    crop_type: undefined,
    variety: undefined,
    supplier: undefined,
    climate_system: undefined,
    lighting_system: undefined,
    growing_system: undefined,
    co2_target_ppm: undefined,
    temperature_range_c: undefined
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    loadUsers();
    loadGreenhouses();
  }, [user, filterRole, filterActive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await adminService.getUsers({
        role: filterRole || undefined,
        is_active: filterActive
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load users';
      // Don't show error if we're being redirected to login
      if (!errorMessage.includes('session has expired')) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adminService.createUser(newUser);
      if (response.success) {
        setShowCreateModal(false);
        setNewUser({
          email: '',
          password: '',
          name: '',
          role: 'farmer',
          phone_number: '',
          department: '',
          location: ''
        });
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await adminService.toggleUserStatus(userId);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle user status');
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      await adminService.resetUserPassword(userId, newPassword);
      alert('Password reset successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Greenhouse handlers
  const loadGreenhouses = async () => {
    try {
      setGreenhouseLoading(true);
      setError(null); // Clear previous errors
      const response = await greenhouseAdminService.getAllGreenhouses({
        search: searchQuery || undefined,
        city: filterCity || undefined,
        crop_type: filterCropType || undefined,
        sortBy,
        sortOrder
      });

      if (response.success && response.data) {
        setGreenhouses(response.data.greenhouses);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load greenhouses';
      // Don't show error if we're being redirected to login
      if (!errorMessage.includes('session has expired')) {
        setError(errorMessage);
      }
    } finally {
      setGreenhouseLoading(false);
    }
  };

  const handleCreateGreenhouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out undefined/empty values to only send what's filled
      const cleanData: any = {
        name: newGreenhouse.name,
        location: newGreenhouse.location,
      };

      if (newGreenhouse.dimensions) cleanData.dimensions = newGreenhouse.dimensions;
      if (newGreenhouse.area_m2) cleanData.area_m2 = newGreenhouse.area_m2;
      if (newGreenhouse.crop_type) cleanData.crop_type = newGreenhouse.crop_type;
      if (newGreenhouse.variety) cleanData.variety = newGreenhouse.variety;
      if (newGreenhouse.supplier) cleanData.supplier = newGreenhouse.supplier;
      if (newGreenhouse.climate_system) cleanData.climate_system = newGreenhouse.climate_system;
      if (newGreenhouse.lighting_system) cleanData.lighting_system = newGreenhouse.lighting_system;
      if (newGreenhouse.growing_system) cleanData.growing_system = newGreenhouse.growing_system;
      if (newGreenhouse.co2_target_ppm) cleanData.co2_target_ppm = newGreenhouse.co2_target_ppm;
      if (newGreenhouse.temperature_range_c) cleanData.temperature_range_c = newGreenhouse.temperature_range_c;

      const response = await greenhouseAdminService.createGreenhouse(cleanData);
      if (response.success) {
        setShowGreenhouseModal(false);
        setNewGreenhouse({
          name: '',
          location: '',
          dimensions: { length: 100, width: 50, height: 5 },
          area_m2: undefined,
          crop_type: undefined,
          variety: undefined,
          supplier: undefined,
          climate_system: undefined,
          lighting_system: undefined,
          growing_system: undefined,
          co2_target_ppm: undefined,
          temperature_range_c: undefined
        });
        loadGreenhouses();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create greenhouse');
    }
  };

  const handleUpdateGreenhouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGreenhouse) return;

    try {
      const response = await greenhouseAdminService.updateGreenhouse(
        editingGreenhouse.id,
        newGreenhouse
      );
      if (response.success) {
        setShowGreenhouseModal(false);
        setEditingGreenhouse(null);
        loadGreenhouses();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update greenhouse');
    }
  };

  const handleDeleteGreenhouse = async (greenhouseId: string) => {
    if (!window.confirm('Are you sure you want to delete this greenhouse? This action cannot be undone.')) {
      return;
    }

    try {
      await greenhouseAdminService.deleteGreenhouse(greenhouseId);
      loadGreenhouses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete greenhouse');
    }
  };

  const openEditModal = (greenhouse: GreenhouseListItem) => {
    setEditingGreenhouse(greenhouse);
    const cropsData = Array.isArray(greenhouse.crops) ? greenhouse.crops[0] : greenhouse.crops;
    setNewGreenhouse({
      name: greenhouse.name,
      location: greenhouse.location.address,
      dimensions: greenhouse.details.dimensions,
      area_m2: greenhouse.details.landArea,
      crop_type: cropsData?.type || '',
      variety: cropsData?.variety || '',
      supplier: cropsData?.supplier || '',
      climate_system: greenhouse.equipment.climate.type,
      lighting_system: greenhouse.equipment.lighting.type,
    });
    setShowGreenhouseModal(true);
  };

  useEffect(() => {
    if (activeTab === 'greenhouses') {
      loadGreenhouses();
    }
  }, [searchQuery, filterCity, filterCropType, sortBy, sortOrder]);

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-screen bg-secondary flex items-center justify-center">
          <Card>
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Modern Header with Stats */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                  <span className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">⚙️</span>
                  </span>
                  Admin Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">Comprehensive system management and control</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">System Status</div>
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  All Systems Operational
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card rounded-2xl p-5 shadow-lg border border hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-foreground">{users.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-lg border border hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Greenhouses</p>
                    <p className="text-3xl font-bold text-foreground">{greenhouses.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🏡</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-lg border border hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Active Users</p>
                    <p className="text-3xl font-bold text-foreground">{users.filter(u => u.is_active).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Tabs */}
          <div className="mb-8 bg-card rounded-2xl shadow-lg p-2 border border">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span className="text-xl">👥</span>
                <span>User Management</span>
              </button>
              <button
                onClick={() => setActiveTab('greenhouses')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 ${
                  activeTab === 'greenhouses'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span className="text-xl">🏡</span>
                <span>Greenhouse Management</span>
              </button>
            </nav>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-2xl shadow-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-600 font-bold text-xl transition-colors"
              >
                ×
              </button>
            </motion.div>
          )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 bg-card rounded-2xl p-6 shadow-lg border border">
              <div className="flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3"
                >
                  <span className="text-lg">➕</span>
                  <span>Create New User</span>
                </button>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">Filter by Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-4 py-3 border-2 border rounded-xl font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="researcher">Researcher</option>
                    <option value="farmer">Farmer</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">Filter by Status</label>
                  <select
                    value={filterActive === undefined ? '' : String(filterActive)}
                    onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-4 py-3 border-2 border rounded-xl font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <button
                  onClick={loadUsers}
                  className="px-6 py-3 bg-secondary hover:bg-gray-200 text-muted-foreground font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-3 mt-6"
                >
                  <span className="text-lg">🔄</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-lg border border overflow-hidden">
              <div className="px-8 py-6 border-b border bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-xl">👥</span>
                  </span>
                  User Directory
                </h2>
                <p className="text-sm text-muted-foreground mt-2">Manage and monitor all system users</p>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className="mt-6 text-muted-foreground font-medium">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b-2 border">
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            User Info
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-secondary transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                                  user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                                  user.role === 'researcher' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                                  'bg-gradient-to-br from-green-500 to-emerald-600'
                                }`}>
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-foreground">{user.name}</div>
                                  {user.phone_number && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <span>📞</span>
                                      {user.phone_number}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-muted-foreground">
                              {user.email}
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'researcher' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {user.role === 'grower' ? 'farmer' : user.role}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${
                                user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-sm text-muted-foreground font-medium">
                              {user.department || '-'}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    user.is_active
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                  }`}
                                >
                                  {user.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user.id)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
                                  title="Reset Password"
                                >
                                  🔑
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all"
                                  title="Delete User"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="text-3xl">👤</span>
                      Create New User
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">Add a new user to the system</p>
                  </div>
                  <div className="p-8">
                    <form onSubmit={handleCreateUser} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            className="w-full border-2 border rounded-xl px-4 py-3 font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            className="w-full border-2 border rounded-xl px-4 py-3 font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Password *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            className="w-full border-2 border rounded-xl px-4 py-3 pr-12 font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="Min 8 chars with special characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-muted-foreground hover:bg-secondary rounded-lg transition-all"
                            tabIndex={-1}
                          >
                            {showPassword ? '👁️' : '🔒'}
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
                          Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Role *</label>
                          <select
                            required
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                            className="w-full border-2 border rounded-xl px-4 py-3 font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                          >
                            <option value="farmer">Farmer</option>
                            <option value="researcher">Researcher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={newUser.phone_number}
                            onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                            className="w-full border-2 border rounded-xl px-4 py-3 font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="+31 6 12345678"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Department</label>
                          <input
                            type="text"
                            value={newUser.department}
                            onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                            className="w-full border-2 border rounded-xl px-4 py-3 font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="e.g., Research & Development"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Location</label>
                          <input
                            type="text"
                            value={newUser.location}
                            onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                            className="w-full border-2 border rounded-xl px-4 py-3 font-medium text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                            placeholder="e.g., Amsterdam, Netherlands"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t-2 border">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="px-6 py-3 text-muted-foreground font-semibold border-2 border-gray-300 rounded-xl hover:bg-secondary active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
                        >
                          ✨ Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* Greenhouses Tab */}
        {activeTab === 'greenhouses' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 bg-card rounded-2xl p-6 shadow-lg border border">
              <div className="flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => {
                    setEditingGreenhouse(null);
                    setNewGreenhouse({
                      name: '',
                      location: '',
                      dimensions: { length: 100, width: 50, height: 5 },
                      area_m2: undefined,
                      crop_type: undefined,
                      variety: undefined,
                      supplier: undefined,
                      climate_system: undefined,
                      lighting_system: undefined,
                      growing_system: undefined,
                      co2_target_ppm: undefined,
                      temperature_range_c: undefined
                    });
                    setShowGreenhouseModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3"
                >
                  <span className="text-lg">➕</span>
                  <span>Create New Greenhouse</span>
                </button>

                <div className="flex-1 min-w-[250px]">
                  <input
                    type="text"
                    placeholder="🔍 Search greenhouses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border-2 border rounded-xl font-medium text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border-2 border rounded-xl font-medium text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                >
                  <option value="name">Sort by Name</option>
                  <option value="created_at">Sort by Date</option>
                  <option value="area_m2">Sort by Area</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 bg-secondary hover:bg-gray-200 text-muted-foreground font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  {sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
                </button>

                <button
                  onClick={loadGreenhouses}
                  className="px-6 py-3 bg-secondary hover:bg-gray-200 text-muted-foreground font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-3"
                >
                  <span className="text-lg">🔄</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-lg border border overflow-hidden">
              <div className="px-8 py-6 border-b border bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-xl">🏡</span>
                  </span>
                  Greenhouse Facilities
                </h2>
                <p className="text-sm text-muted-foreground mt-2">Monitor and manage all greenhouse operations</p>
              </div>

              <div className="p-6">

                {greenhouseLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto"></div>
                    <p className="mt-6 text-muted-foreground font-medium">Loading greenhouses...</p>
                  </div>
                ) : greenhouses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🏡</span>
                    </div>
                    <p className="text-muted-foreground text-xl font-semibold">No greenhouses found</p>
                    <p className="text-gray-500 text-sm mt-2">Create your first greenhouse to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {greenhouses.map((greenhouse) => (
                      <motion.div
                        key={greenhouse.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -8 }}
                        className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 border-2 border hover:border-green-300 shadow-lg hover:shadow-2xl transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl">🏡</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-foreground">{greenhouse.name}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span>📍</span>
                                {greenhouse.location.city}, {greenhouse.location.region}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-100 text-green-700 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Active & Operational
                          </span>
                        </div>

                        <div className="space-y-3 mb-5 bg-card rounded-xl p-4 shadow-inner">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium">Area:</span>
                            <span className="text-sm font-bold text-foreground bg-secondary px-3 py-1 rounded-lg">{greenhouse.details.landArea} m²</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium">Crop Type:</span>
                            <span className="text-sm font-bold text-green-700 capitalize bg-green-50 px-3 py-1 rounded-lg">
                              {(() => {
                                const cropsData = Array.isArray(greenhouse.crops) ? greenhouse.crops[0] : greenhouse.crops;
                                return cropsData?.type || 'N/A';
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium">Variety:</span>
                            <span className="text-sm font-bold text-foreground bg-secondary px-3 py-1 rounded-lg">
                              {(() => {
                                const cropsData = Array.isArray(greenhouse.crops) ? greenhouse.crops[0] : greenhouse.crops;
                                return cropsData?.variety || 'N/A';
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t-2 border">
                          <button
                            onClick={() => openEditModal(greenhouse)}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg active:scale-95 transition-all"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGreenhouse(greenhouse.id)}
                            className="px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 active:scale-95 transition-all"
                          >
                            🗑️
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Create/Edit Greenhouse Modal */}
            {showGreenhouseModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-3xl max-w-2xl w-full p-8 shadow-strong max-h-[90vh] overflow-y-auto scrollbar-thin"
                >
                  <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-horti-green-600 to-horti-blue-600 bg-clip-text text-transparent">
                    {editingGreenhouse ? 'Edit Greenhouse' : 'Create New Greenhouse'}
                  </h3>
                  <form onSubmit={editingGreenhouse ? handleUpdateGreenhouse : handleCreateGreenhouse} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-foreground mb-2">Greenhouse Name</label>
                        <input
                          type="text"
                          required
                          value={newGreenhouse.name}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, name: e.target.value})}
                          className="input-modern"
                          placeholder="e.g., Greenhouse Alpha"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
                        <input
                          type="text"
                          required
                          value={newGreenhouse.location}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, location: e.target.value})}
                          className="input-modern"
                          placeholder="e.g., Zuid-Holland, Netherlands"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Area (m²)</label>
                        <input
                          type="number"
                          value={newGreenhouse.area_m2 || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, area_m2: e.target.value ? parseFloat(e.target.value) : undefined})}
                          className="input-modern"
                          placeholder="5000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Crop Type</label>
                        <input
                          type="text"
                          value={newGreenhouse.crop_type || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, crop_type: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="tomato"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Variety</label>
                        <input
                          type="text"
                          value={newGreenhouse.variety || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, variety: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="Cherry tomato"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Supplier</label>
                        <input
                          type="text"
                          value={newGreenhouse.supplier || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, supplier: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="Supplier name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Climate System</label>
                        <input
                          type="text"
                          value={newGreenhouse.climate_system || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, climate_system: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="Advanced HVAC"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Lighting System</label>
                        <input
                          type="text"
                          value={newGreenhouse.lighting_system || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, lighting_system: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="LED grow lights"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">CO2 Target (ppm)</label>
                        <input
                          type="number"
                          value={newGreenhouse.co2_target_ppm || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, co2_target_ppm: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="input-modern"
                          placeholder="1000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Temperature Range (°C)</label>
                        <input
                          type="text"
                          value={newGreenhouse.temperature_range_c || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, temperature_range_c: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="18-23"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t border">
                      <button
                        type="button"
                        onClick={() => {
                          setShowGreenhouseModal(false);
                          setEditingGreenhouse(null);
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                      >
                        {editingGreenhouse ? 'Update Greenhouse' : 'Create Greenhouse'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;