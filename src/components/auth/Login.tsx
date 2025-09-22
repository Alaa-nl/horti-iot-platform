import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import authService from '../../services/authService';
import type { LoginCredentials } from '../../services/authService';
import { greenhouseService } from '../../services/greenhouseService';

interface LoginProps {
  onLoginSuccess?: () => void;
  onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onClose }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const isAvailable = await greenhouseService.checkApiStatus();
      setApiStatus(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      setApiStatus('unavailable');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(credentials);
      console.log('Login successful:', response);

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🌱 HORTI-IOT Platform
          </h2>
          <p className="text-gray-600">
            Sign in to access your greenhouse data
          </p>
        </div>

        {/* API Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Database Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              apiStatus === 'checking' ? 'bg-yellow-100 text-yellow-800' :
              apiStatus === 'available' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {apiStatus === 'checking' ? 'Checking...' :
               apiStatus === 'available' ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>

        {apiStatus === 'unavailable' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-3">
              🚫 <strong>Database Connection Required</strong>
            </p>
            <p className="text-xs text-red-700 mb-3">
              The backend database must be running to use this application. Please start the database:
            </p>
            <div className="space-y-2">
              <div className="bg-red-100 p-3 rounded text-xs font-mono text-red-800">
                docker-compose up -d
              </div>
              <div className="bg-red-100 p-3 rounded text-xs font-mono text-red-800">
                cd backend && npm run dev
              </div>
              <p className="text-xs text-red-600">
                Then refresh this page to try again.
              </p>
            </div>
          </div>
        )}

        {apiStatus === 'available' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="researcher@horti-iot.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="password123"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

          </form>
        )}

        {/* Demo Credentials */}
        {apiStatus === 'available' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              <strong>Demo Credentials:</strong>
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>📧 researcher@horti-iot.com</div>
              <div>🔑 password123</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;