import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FireIcon } from '@heroicons/react/24/solid';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, setOfflineMode, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/explorer');
    } catch {
      // Error handled by auth context
    }
  };

  const handleOfflineMode = () => {
    setOfflineMode(true);
    navigate('/explorer');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <FireIcon className="h-16 w-16 text-fire-500" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">SPEC Explorer</h2>
          <p className="mt-2 text-sm text-gray-600">
            Construction Product Specification Database
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field mt-1"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleOfflineMode}
              className="btn-secondary w-full mt-4"
            >
              Continue Offline
            </button>
            <p className="mt-2 text-xs text-center text-gray-500">
              Use the app without cloud sync. Data stored locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
