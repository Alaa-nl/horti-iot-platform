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
    <div className="fixed inset-0 bg-gradient-to-br from-horti-green-900/20 via-black/50 to-horti-blue-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-strong max-w-md w-full p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-horti-green-500 to-horti-green-600 rounded-2xl mb-4 shadow-glow-green">
            <span className="text-3xl">🌱</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-horti-green-600 to-horti-blue-600 bg-clip-text text-transparent mb-2">
            HORTI-IOT Platform
          </h2>
          <p className="text-gray-600 text-sm">
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
                className="input-modern"
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
                className="input-modern"
                placeholder="password123"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              )}
            </div>

          </form>
        )}

        {/* Demo Credentials */}
        {apiStatus === 'available' && (
          <div className="mt-6 p-4 bg-gradient-to-br from-horti-green-50 to-horti-blue-50 rounded-xl border border-horti-green-200/50">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Demo Credentials:
            </p>
            <div className="text-xs text-gray-600 space-y-1 font-mono">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span>researcher@horti-iot.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔑</span>
                <span>password123</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;