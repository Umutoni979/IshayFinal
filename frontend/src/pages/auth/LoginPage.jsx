import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import toast from 'react-hot-toast';
import BrandLogo from '../../components/common/BrandLogo';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]           = useState('login'); // 'login' | 'signup'
  const [regEnabled, setRegEnabled] = useState(false);
  const [regLoading, setRegLoading] = useState(true);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [remember, setRemember]   = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign up form
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    authApi.registrationStatus()
      .then(r => setRegEnabled(r.data.data.enabled))
      .catch(() => setRegEnabled(false))
      .finally(() => setRegLoading(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const result = await login(loginForm);
      if (result?.code === 'MUST_CHANGE_PASSWORD') {
        toast.success('A verification code has been sent to your email.');
        navigate(`/verify-code?userId=${result.userId}&next=set-password`);
        return;
      }
      toast.success(`Welcome back, ${result.user?.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirm) { toast.error('Passwords do not match'); return; }
    if (signupForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSignupLoading(true);
    try {
      const { data } = await authApi.register({
        name: signupForm.name, email: signupForm.email, password: signupForm.password,
      });
      toast.success('Account created! Check your email for a verification code.');
      navigate(`/verify-code?userId=${data.data.userId}&next=login`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSignupLoading(false);
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded-sm px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition';
  const labelCls = 'block text-sm font-bold text-slate-700 mb-1.5';

  return (
    <div className="min-h-screen bg-white font-[Lato,sans-serif]">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-4">
        <BrandLogo />
      </header>

      <div className="flex flex-col items-center px-4 pt-14 pb-20">
        <h1 className="text-[42px] font-black text-slate-800 text-center leading-tight tracking-tight">
          {tab === 'login' ? 'Log in to your Account' : 'Create Admin Account'}
        </h1>
        <p className="text-base text-gray-400 text-center mt-2.5 mb-1">
          {tab === 'login'
            ? 'Welcome back! Please enter your credentials to continue.'
            : 'Sign up to get admin access to the system.'}
        </p>
        {tab === 'login' && (
          <p className="text-sm text-gray-400 text-center mb-9">
            Don't have an account?{' '}
            <span className="text-slate-600 font-semibold">Your account is created by the system admin — check your email for credentials.</span>
          </p>
        )}
        {tab === 'signup' && <div className="mb-9" />}

        <div className="w-full max-w-[480px] bg-white rounded-sm border border-gray-200 shadow-lg overflow-hidden">

          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                tab === 'login'
                  ? 'text-slate-800 bg-white border-b-2 border-slate-800'
                  : 'text-gray-400 bg-gray-100 border-b border-gray-200'
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => regEnabled && setTab('signup')}
              disabled={regLoading || !regEnabled}
              title={!regEnabled ? 'Registration is currently disabled' : ''}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                tab === 'signup'
                  ? 'text-slate-800 bg-white border-b-2 border-slate-800'
                  : regEnabled
                    ? 'text-gray-500 bg-gray-100 border-b border-gray-200 hover:text-gray-700 cursor-pointer'
                    : 'text-gray-300 bg-gray-100 border-b border-gray-200 cursor-not-allowed'
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="px-10 py-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">
                {tab === 'login' ? 'Use your email' : 'Admin registration'}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ── Login form ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" required autoComplete="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" required autoComplete="current-password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={inputCls} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input type="checkbox" checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-orange-500" />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <div className="flex justify-center pt-3">
                  <button type="submit" disabled={loginLoading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm px-14 py-3 rounded-full transition-colors">
                    {loginLoading ? 'Signing in…' : 'Log in'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Sign up form ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input type="text" required
                    value={signupForm.name}
                    onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder="John Doe"
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" required
                    value={signupForm.email}
                    onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" required minLength={6}
                    value={signupForm.password}
                    onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input type="password" required
                    value={signupForm.confirm}
                    onChange={e => setSignupForm({ ...signupForm, confirm: e.target.value })}
                    className={inputCls} />
                </div>
                <div className="flex justify-center pt-3">
                  <button type="submit" disabled={signupLoading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm px-14 py-3 rounded-full transition-colors">
                    {signupLoading ? 'Creating…' : 'Create Admin Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-5 text-center space-y-2">
          <Link to="/forgot-password" className="block text-sm text-orange-500 hover:underline">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
