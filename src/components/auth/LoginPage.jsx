import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/logo.jpeg';

export default function LoginPage() {
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAutoFillDemo = () => {
    setEmail('admin@skycadastral.in');
    setPassword('admin123');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res && !res.success) {
        setErrorMessage(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setErrorMessage('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001B3A] via-[#002652] to-[#000E20] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A67C27]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Login Box */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-8 shadow-2xl relative z-10 text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#001B3A] border-2 border-[#A67C27] flex items-center justify-center shadow-lg mb-3">
            <img
              src={logoImg}
              alt="Sky Cadastral Logo"
              className="w-14 h-14 rounded-xl object-cover"
            />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider font-display-lg text-white">
            Sky Cadastral
          </h1>
          <p className="text-xs text-[#A67C27] font-bold tracking-widest uppercase mt-0.5">
            Land Administration Control
          </p>
          <p className="text-xs text-gray-300 mt-2">
            Sign in with demo credentials to access survey inventory & diary.
          </p>
        </div>

        {/* Demo Credentials Auto-Fill Banner */}
        <div className="mb-6 p-3.5 bg-[#A67C27]/20 border border-[#A67C27]/40 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-[#A67C27] block text-[11px] uppercase tracking-wider">
              Demo Access Mode
            </span>
            <p className="text-[11px] text-gray-200">
              User: <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-amber-200">admin</code> | Pass: <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-amber-200">admin123</code>
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoFillDemo}
            className="px-3 py-1.5 bg-[#A67C27] hover:bg-[#8e681e] text-white text-[11px] font-extrabold rounded-lg shadow-xs transition-all whitespace-nowrap"
          >
            Auto-fill
          </button>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2 animate-shake">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1.5 uppercase tracking-wider">
              Email / Username
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-[18px]">
                person
              </span>
              <input
                type="text"
                required
                placeholder="admin@skycadastral.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/20 rounded-xl outline-none focus:border-[#A67C27] focus:ring-1 focus:ring-[#A67C27] text-xs text-white placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-200 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-[18px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-black/30 border border-white/20 rounded-xl outline-none focus:border-[#A67C27] focus:ring-1 focus:ring-[#A67C27] text-xs text-white placeholder-gray-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#A67C27] hover:bg-[#8e681e] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6 active:scale-98"
          >
            {loading ? (
              <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
            ) : (
              <>
                <span>Sign In to Admin Panel</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-white/10 pt-4">
          <p>© 2026 Sky Cadastral Land Services. Authorized Admin Access Only.</p>
        </div>
      </div>
    </div>
  );
}
