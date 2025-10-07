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
      const response = await adminService.getUsers({
        role: filterRole || undefined,
        is_active: filterActive
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
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
      setError(err.message || 'Failed to load greenhouses');
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card>
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-horti-green-600 to-horti-blue-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 font-medium">Manage users and greenhouses</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-horti-green-500 text-horti-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>👥</span>
                Users Management
              </span>
            </button>
            <button
              onClick={() => setActiveTab('greenhouses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'greenhouses'
                  ? 'border-horti-green-500 text-horti-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🏡</span>
                Greenhouses Management
              </span>
            </button>
          </nav>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between"
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700 font-bold text-xl"
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
            <div className="mb-6 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <span>➕</span>
                Create New User
              </button>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input-modern px-3 py-2 text-sm"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="researcher">Researcher</option>
                <option value="farmer">Farmer</option>
              </select>

              <select
                value={filterActive === undefined ? '' : String(filterActive)}
                onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
                className="input-modern px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <button
                onClick={loadUsers}
                className="btn-secondary flex items-center gap-2"
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>

            <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Users</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          {user.phone_number && (
                            <div className="text-sm text-gray-500">{user.phone_number}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'researcher' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'}`}>
                            {user.role === 'grower' ? 'farmer' : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </Card>

            {/* Create User Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-strong">
              <h3 className="text-lg font-semibold mb-4">Create New User</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                      placeholder="Min 8 chars, 1 upper, 1 lower, 1 number, 1 special"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    required
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="researcher">Researcher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newUser.phone_number}
                    onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newUser.location}
                    onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>
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
            <div className="mb-6 flex flex-wrap gap-4 items-center">
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
                className="btn-primary flex items-center gap-2"
              >
                <span>➕</span>
                Create New Greenhouse
              </button>

              <input
                type="text"
                placeholder="Search greenhouses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern px-3 py-2 text-sm flex-1 max-w-xs"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-modern px-3 py-2 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="created_at">Sort by Date</option>
                <option value="area_m2">Sort by Area</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-ghost"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <button
                onClick={loadGreenhouses}
                className="btn-secondary flex items-center gap-2"
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>

            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Greenhouses</h2>

                {greenhouseLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-horti-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading greenhouses...</p>
                  </div>
                ) : greenhouses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No greenhouses found</p>
                    <p className="text-gray-400 text-sm mt-2">Create your first greenhouse to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {greenhouses.map((greenhouse) => (
                      <motion.div
                        key={greenhouse.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        className="card-elevated p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{greenhouse.name}</h3>
                            <p className="text-sm text-gray-600">{greenhouse.location.city}, {greenhouse.location.region}</p>
                          </div>
                          <span className="badge-success">Active</span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Area:</span>
                            <span className="font-semibold text-gray-900">{greenhouse.details.landArea} m²</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Crop:</span>
                            <span className="font-semibold text-gray-900 capitalize">
                              {(() => {
                                const cropsData = Array.isArray(greenhouse.crops) ? greenhouse.crops[0] : greenhouse.crops;
                                return cropsData?.type || 'N/A';
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Variety:</span>
                            <span className="font-semibold text-gray-900">
                              {(() => {
                                const cropsData = Array.isArray(greenhouse.crops) ? greenhouse.crops[0] : greenhouse.crops;
                                return cropsData?.variety || 'N/A';
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 flex gap-2">
                          <button
                            onClick={() => openEditModal(greenhouse)}
                            className="flex-1 btn-secondary text-sm py-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGreenhouse(greenhouse.id)}
                            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-xl hover:bg-red-50 active:scale-95 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Create/Edit Greenhouse Modal */}
            {showGreenhouseModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-strong max-h-[90vh] overflow-y-auto scrollbar-thin"
                >
                  <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-horti-green-600 to-horti-blue-600 bg-clip-text text-transparent">
                    {editingGreenhouse ? 'Edit Greenhouse' : 'Create New Greenhouse'}
                  </h3>
                  <form onSubmit={editingGreenhouse ? handleUpdateGreenhouse : handleCreateGreenhouse} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Greenhouse Name</label>
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
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
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
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Area (m²)</label>
                        <input
                          type="number"
                          value={newGreenhouse.area_m2 || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, area_m2: e.target.value ? parseFloat(e.target.value) : undefined})}
                          className="input-modern"
                          placeholder="5000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Crop Type</label>
                        <input
                          type="text"
                          value={newGreenhouse.crop_type || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, crop_type: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="tomato"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Variety</label>
                        <input
                          type="text"
                          value={newGreenhouse.variety || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, variety: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="Cherry tomato"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Supplier</label>
                        <input
                          type="text"
                          value={newGreenhouse.supplier || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, supplier: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="Supplier name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Climate System</label>
                        <input
                          type="text"
                          value={newGreenhouse.climate_system || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, climate_system: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="Advanced HVAC"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Lighting System</label>
                        <input
                          type="text"
                          value={newGreenhouse.lighting_system || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, lighting_system: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="LED grow lights"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">CO2 Target (ppm)</label>
                        <input
                          type="number"
                          value={newGreenhouse.co2_target_ppm || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, co2_target_ppm: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="input-modern"
                          placeholder="1000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Temperature Range (°C)</label>
                        <input
                          type="text"
                          value={newGreenhouse.temperature_range_c || ''}
                          onChange={(e) => setNewGreenhouse({...newGreenhouse, temperature_range_c: e.target.value || undefined})}
                          className="input-modern"
                          placeholder="18-23"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
    </Layout>
  );
};

export default AdminDashboard;