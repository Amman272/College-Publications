import { useState, useEffect } from "react";
import { User, Trash2, Plus, Shield, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const AdminPage = () => {
    const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [admins, setAdmins] = useState([]);
    const [logs, setLogs] = useState([]);
    const [logPage, setLogPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, authLoading, navigate]);

    if (authLoading) return <div className="p-10 text-center">Loading...</div>;

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
                    <Shield size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                    <p className="text-slate-500 mb-6">You do not have administrator privileges to view this page.</p>
                    <button onClick={() => navigate("/")} className="btn btn-primary w-full justify-center">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (!authLoading && isAdmin) {
            fetchAdmins();
            fetchLogs();
        }
    }, [authLoading, isAdmin]);

    const fetchLogs = async (page = 1) => {
        try {
            const response = await api.get(`/admin/logs?page=${page}&limit=10`);
            setLogs(response.data.logs); // Now expecting { logs, total, page, totalPages }
            setTotalPages(response.data.totalPages);
            setLogPage(page);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        }
    };

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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                                <p className="text-slate-500 text-sm">Manage system administrators and permissions</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            <ChevronLeft size={18} />
                            Back to Home
                        </button>
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
                            <Plus size={20} className="text-indigo-500" /> Add New Admin
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
                            <User size={20} className="text-indigo-500" /> Current Admins
                        </h2>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />)}
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



                    {/* Audit Logs */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Shield size={20} className="text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-800">System Audit Logs</h2>
                            </div>
                            <button onClick={() => fetchLogs(1)} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                Refresh
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Action</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">User</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Details</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                                                    No activity logs found.
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded textxs font-medium ${log.action === 'DELETE' || log.action === 'DELETE_ALL' ? 'bg-red-50 text-red-700' :
                                                                log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700' :
                                                                    log.action === 'UPDATE' || log.action === 'BATCH_UPDATE' ? 'bg-amber-50 text-amber-700' :
                                                                        'bg-indigo-50 text-indigo-700'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{log.user_email}</td>
                                                    <td className="px-4 py-3 text-slate-500">{log.details}</td>
                                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                            <span>Page {logPage} of {totalPages}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchLogs(logPage - 1)}
                                    disabled={logPage === 1}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => fetchLogs(logPage + 1)}
                                    disabled={logPage === totalPages}
                                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Danger Zone */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 md:col-span-2">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <AlertCircle size={24} />
                            <h2 className="text-lg font-bold">Danger Zone</h2>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-red-900">Delete All Publications</h3>
                                <p className="text-sm text-red-700/80 mt-1">
                                    This action cannot be undone. It will permanently delete all {1000}+ publication entries from the database.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const confirm = window.prompt("Type 'DELETE' to confirm deleting ALL entries permanently:");
                                    if (confirm === "DELETE") {
                                        api.post("/admin/deleteAll")
                                            .then(() => {
                                                setSuccessMsg("All entries deleted successfully.");
                                                fetchLogs(); // Refresh logs
                                                setTimeout(() => setSuccessMsg(""), 3000);
                                            })
                                            .catch(err => {
                                                setError(err.response?.data?.message || "Failed to delete all entries.");
                                                setTimeout(() => setError(""), 3000);
                                            });
                                    } else if (confirm !== null) {
                                        alert("Incorrect confirmation text. Action cancelled.");
                                    }
                                }}
                                className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                            >
                                Delete All Data
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminPage;
