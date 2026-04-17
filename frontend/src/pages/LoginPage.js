import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plane, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-sm mb-4">
              <Plane size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-neutral-900 mb-2">Welcome Back</h1>
            <p className="text-neutral-500">Sign in to manage your bookings</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div data-testid="login-error" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  data-testid="login-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    data-testid="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    data-testid="toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                data-testid="login-submit-button"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-sm px-6 py-3 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              Don't have an account?{' '}
              <Link to="/register" data-testid="register-link" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        className="hidden lg:block lg:flex-1 bg-cover bg-center relative"
        style={{ backgroundImage: `url('https://images.pexels.com/photos/36628118/pexels-photo-36628118.png')` }}
      >
        <div className="absolute inset-0 bg-white/60"></div>
      </div>
    </div>
  );
};

export default LoginPage;