import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import toast from 'react-hot-toast';
import BrandLogo from '../../components/common/BrandLogo';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const next   = searchParams.get('next'); // 'set-password' | 'login'

  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) { toast.error('Missing session. Please log in again.'); navigate('/login'); return; }
    setLoading(true);
    try {
      await authApi.verifyCode(userId, code);
      if (next === 'set-password') {
        toast.success('Code verified! Now set your new password.');
        navigate(`/set-password?userId=${userId}`);
      } else {
        toast.success('Email verified! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
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
          Check your Email
        </h1>
        <p className="text-base text-gray-600 text-center mt-2.5 mb-9">
          Enter the 6-digit code we sent to your email address
        </p>

        <div className="w-full max-w-[480px] bg-white rounded-sm border border-gray-200 shadow-lg overflow-hidden">
          <div className="flex">
            <button className="flex-1 py-4 text-sm font-bold text-slate-800 bg-white border-b-2 border-slate-800">
              Verify Account
            </button>
            <div className="flex-1 py-4 bg-gray-100 border-b border-gray-200" />
          </div>

          <div className="px-10 py-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-600">enter your code below</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Verification Code</label>
                <input
                  type="text" required maxLength={6} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full border border-gray-300 rounded-sm px-4 py-3 text-center text-3xl font-bold tracking-[0.5em] text-slate-800 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
              <div className="flex justify-center pt-3">
                <button
                  type="submit" disabled={loading || code.length !== 6}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm px-14 py-3 rounded-full transition-colors"
                >
                  {loading ? 'Verifying…' : 'Verify Account'}
                </button>
              </div>
              <p className="text-xs text-gray-600 text-center pt-2">
                Code expires in 15 minutes. Log in again with your temp password to get a new one.
              </p>
            </form>
          </div>
        </div>

        <div className="mt-5">
          <Link to="/login" className="text-sm text-orange-500 hover:underline">Back to log in</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
