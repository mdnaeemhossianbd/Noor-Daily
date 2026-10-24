import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  LogIn, 
  CheckCircle2,
  Compass
} from 'lucide-react';

export const Login: React.FC = () => {
  const { currentUser, isAdmin, login, loginWithGoogle, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('habitsk50@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated as authorized admin, go directly to dashboard
  useEffect(() => {
    if (isAdmin && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your admin email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Auth error in form:', err);
      let userFriendlyMsg = 'Authentication failed. Please check credentials.';
      const code = err.code || '';

      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        userFriendlyMsg = 'Account not found or password incorrect. Please check your credentials or use your authorized Google account.';
      } else if (code === 'auth/email-already-in-use') {
        userFriendlyMsg = 'This email is already registered. Please sign in with your password.';
      } else if (code === 'auth/weak-password') {
        userFriendlyMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (code === 'auth/too-many-requests') {
        userFriendlyMsg = 'Too many attempts. Please try again shortly or use Google Sign-In.';
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }
      setErrorMessage(userFriendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = errorMessage || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-lg border border-emerald-500/20 rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        
        {/* Glow ornaments */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-400/30 text-emerald-400 mb-3 shadow-inner">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-100">
            Noor Daily Admin
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/70 mt-1">
            সুরক্ষিত অ্যাডমিন পোর্টাল (Restricted Access)
          </p>
        </div>

        {/* Admin Restriction Banner */}
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>শুধুমাত্র অনুমোদিত অ্যাডমিন (habitsk50@gmail.com) প্রবেশ করতে পারবেন। অন্য কোনো জিমেইল গ্রহণযোগ্য নয়।</span>
        </div>

        {/* Alert Messages */}
        {displayError && (
          <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{displayError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs sm:text-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="habitsk50@gmail.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-300/80 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>


          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition duration-150 shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>লগইন হচ্ছে...</span>
              </>
            ) : (
              <span>অ্যাডমিন প্যানেলে লগইন করুন</span>
            )}
          </button>
        </form>

        {/* Google Sign In with strict habitsk50@gmail.com gate */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google (habitsk50@gmail.com)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
