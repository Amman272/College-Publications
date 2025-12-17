import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const LoginModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      await api.post('/login/otpSend', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login/otpVerify', { email, otp });
      login(response.data.token);
      onClose();
      // Reset state after successful login
      setTimeout(() => {
        setStep(1);
        setEmail('');
        setOtp('');
      }, 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white border border-white/20 shadow-premium rounded-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[--primary] to-[--secondary] p-6 text-white text-center">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold font-['Outfit']">Faculty Login</h2>
              <p className="text-black/80 text-sm mt-1">Access restricted to NRIIT faculty</p>
            </div>

            {/* Body */}
            <div className="p-8">
              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[--text-secondary]">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-light]" size={20} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="faculty@nriit.edu.in"
                        className="w-full pl-10 pr-4 py-3 bg-[--background] border border-[--border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2"
                  >
                    
                    {loading ? <Loader2 className="animate-spin" /> : <>Get OTP <ArrowRight size={18} /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-slate-500">Enter the code sent to</p>
                    <p className="font-semibold text-primary">{email}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-500">One-Time Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all tracking-widest text-lg"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-sm text-[--text-secondary] hover:text-[--primary] transition-colors"
                  >
                    Change email
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
