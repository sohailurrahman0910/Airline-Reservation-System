import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plane } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData.email, formData.password, formData.name);
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
            <h1 className="text-4xl font-bold tracking-tighter text-neutral-900 mb-2">Create Account</h1>
            <p className="text-neutral-500">Start booking your flights today</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div data-testid="register-error" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-sm text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  data-testid="register-name-input"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  data-testid="register-email-input"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  data-testid="register-password-input"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-white border border-neutral-200 rounded-sm px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all w-full"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                data-testid="register-submit-button"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-sm px-6 py-3 font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500">
              Already have an account?{' '}
              <Link to="/login" data-testid="login-link" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
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

export default RegisterPage;