import { useState, useEffect } from "react";
import { User, Trash2, Plus, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const AdminPage = () => {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!authLoading) {
        if (!isAuthenticated || !isAdmin) {
          navigate("/");
          return;
        }
        fetchAdmins();
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/allAdmins");
      setAdmins(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch admins.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    try {
      setIsAdding(true);
      await api.post("/admin/addAdmin", { addEmail: newAdminEmail });
      setSuccessMsg(`Successfully added ${newAdminEmail} as admin.`);
      setNewAdminEmail("");
      fetchAdmins();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add admin.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAdmin = async (email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from admins?`)) return;

    try {
      await api.post("/admin/deleteAdmin", { deleteEmail: email });
      setSuccessMsg(`Removed ${email} from admins.`);
      // If user deletes themselves, they should probably be redirected or state updated, 
      // but for now let's just refresh list (permission check will handle redirect on next action/refresh)
      if (user?.userEmail === email) {
          window.location.reload(); 
      } else {
        fetchAdmins();
      }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove admin.");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (authLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">Manage system administrators and permissions</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3"
                >
                    <AlertCircle size={20} />
                    {error}
                </motion.div>
            )}
            {successMsg && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center gap-3"
                >
                    <CheckCircle2 size={20} />
                    {successMsg}
                </motion.div>
            )}
        </AnimatePresence>

        <div className="grid gap-6 md:grid-cols-2">
            
            {/* Add Admin Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1 h-fit">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-indigo-500"/> Add New Admin
                </h2>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isAdding}
                        className="w-full btn btn-primary flex items-center justify-center gap-2"
                    >
                        {isAdding ? "Adding..." : "Add Admin"}
                    </button>
                    <p className="text-xs text-slate-400 mt-2">
                        The new admin will have full access to manage publications and other admins.
                    </p>
                </form>
            </div>

            {/* Admin List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <User size={20} className="text-indigo-500"/> Current Admins
                </h2>
                
                {loading ? (
                    <div className="space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {admins.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">No admins found (which is weird since you are one).</div>
                        ) : (
                            admins.map((admin) => (
                                <div key={admin.email} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-slate-200 transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                            <User size={14} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-slate-700 truncate">{admin.email}</span>
                                            {admin.email === user?.userEmail && (
                                                <span className="text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded w-fit">It's You</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleDeleteAdmin(admin.email)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Remove Admin"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPage;
