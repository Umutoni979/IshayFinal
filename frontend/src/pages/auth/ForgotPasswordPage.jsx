import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import toast from 'react-hot-toast';
import BrandLogo from '../../components/common/BrandLogo';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      const userId = res.data?.data?.userId;
      toast.success('Check your email for the reset code');
      if (userId) {
        navigate(`/verify-code?userId=${userId}&next=set-password`);
      }
    } catch {
      toast.error('Something went wrong');
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
          Reset your Password
        </h1>
        <p className="text-base text-gray-600 text-center mt-2.5 mb-9">
          We'll send a 6-digit code to your email address
        </p>

        <div className="w-full max-w-[480px] bg-white rounded-sm border border-gray-200 shadow-lg overflow-hidden">
          <div className="flex">
            <button className="flex-1 py-4 text-sm font-bold text-slate-800 bg-white border-b-2 border-slate-800">
              Reset Password
            </button>
            <div className="flex-1 py-4 bg-gray-100 border-b border-gray-200" />
          </div>

          <div className="px-10 py-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-sm px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
              <div className="flex justify-center pt-3">
                <button
                  type="submit" disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm px-14 py-3 rounded-full transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Reset Code'}
                </button>
              </div>
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

export default ForgotPasswordPage;
