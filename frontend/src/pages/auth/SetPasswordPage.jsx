import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BrandLogo from '../../components/common/BrandLogo';

const SetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const { setUser } = useAuth();

  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { toast.error('Missing session. Please log in again.'); navigate('/login'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.setPassword(userId, form.password);
      localStorage.setItem('accessToken', data.data.accessToken);
      setUser(data.data.user);
      toast.success('Password set! Welcome to Ishya.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-[Lato,sans-serif]">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-4">
        <BrandLogo />
      </header>

      <div className="flex flex-col items-center px-4 pt-14 pb-20">
        <h1 className="text-[42px] font-black text-slate-800 text-center leading-tight tracking-tight">
          Set your Password
        </h1>
        <p className="text-base text-gray-400 text-center mt-2.5 mb-9">
          Create a permanent password for your Ishya account
        </p>

        <div className="w-full max-w-[480px] bg-white rounded-sm border border-gray-200 shadow-lg overflow-hidden">
          <div className="flex">
            <button className="flex-1 py-4 text-sm font-bold text-slate-800 bg-white border-b-2 border-slate-800">
              Set Password
            </button>
            <div className="flex-1 py-4 bg-gray-100 border-b border-gray-200" />
          </div>

          <div className="px-10 py-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">almost done!</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password" required minLength={6} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password" required value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Repeat password"
                  className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
              <div className="flex justify-center pt-3">
                <button
                  type="submit" disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm px-14 py-3 rounded-full transition-colors"
                >
                  {loading ? 'Saving…' : 'Set Password & Enter System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;
