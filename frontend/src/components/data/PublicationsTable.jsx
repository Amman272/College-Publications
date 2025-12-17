import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Trash2, AlertCircle, Edit, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EditPublicationModal from '../forms/EditPublicationModal';

const PublicationsTable = ({ showActions = false }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  
  // Edit state
  const [editItem, setEditItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Admin emails - hardcoded for frontend check (backend also verifies)
  const adminEmails = ["ammanfawaz272@gmail.com"];
  const isAdmin = isAuthenticated && user && adminEmails.includes(user.userEmail);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/form/formGet');
      setData(response.data);
    } catch (err) {
      setError('Failed to load publications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (row) => {
    if (!isAuthenticated) {
        navigate('/');
        return; 
    }
    setDeleteId(row.id);
  };
  
  const handleEditClick = (row) => {
      if (!isAuthenticated) {
          navigate('/');
          return;
      }
      setEditItem(row);
      setIsEditOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/form/deleteEntry/${deleteId}`);
      // Remove from local state
      setData(prev => prev.filter(item => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleEditSuccess = () => {
      fetchData(); // Refresh data
      // Modal closes automatically via UploadForm onClose or we can force close here
      setIsEditOpen(false);
      setEditItem(null);
  };

  const columns = [
    { key: 'mainAuthor', label: 'Main Author', minWidth: '180px' },
    { key: 'title', label: 'Title', minWidth: '250px' },
    { key: 'dept', label: 'Dept', minWidth: '100px' }, 
    { key: 'coauthors', label: 'Co-Authors', minWidth: '200px' },
    { key: 'journal', label: 'Journal', minWidth: '180px' },
    { key: 'publisher', label: 'Publisher', minWidth: '150px' },
    { key: 'year', label: 'Year', minWidth: '80px' },
    { key: 'vol', label: 'Vol', minWidth: '80px' },
    { key: 'issueNo', label: 'Issue', minWidth: '80px' },
    { key: 'pages', label: 'Pages', minWidth: '100px' },
    { key: 'indexation', label: 'Index', minWidth: '120px' }, 
    { key: 'pdfUrl', label: 'Link', isLink: true, minWidth: '80px' },
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, searchTerm]) => {
        if (!searchTerm) return true;
        const itemValue = item[key]?.toString().toLowerCase() || '';
        return itemValue.includes(searchTerm.toLowerCase());
      });
    });
  }, [data, filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-slate-500">Loading publications...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full"
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="p-3 align-top bg-slate-50" style={{ minWidth: col.minWidth }}>
                    <div className="mb-2">{col.label}</div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                      <input
                        type="text"
                        placeholder={`Search...`}
                        className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all font-normal normal-case"
                        value={filters[col.key] || ''}
                        onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      />
                    </div>
                  </th>
                ))}
                 {/* Action Column */}
                 {(showActions || isAuthenticated) && (
                   <th className="p-3 w-24 align-top bg-slate-50 sticky right-0 z-20 shadow-[-5px_0_10px_-5px_rgb(0,0,0,0.05)]">
                      <div className="mb-2 text-center">Actions</div>
                   </th>
                 )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                    {columns.map((col) => (
                      <td key={`${row.id}-${col.key}`} className="p-3 text-slate-700">
                        {col.isLink ? (
                          row[col.key] ? (
                            <a 
                              href={row[col.key]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-indigo-700 font-medium inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                            >
                              <FileText size={14} /> View
                            </a>
                          ) : (
                            <span className="text-slate-300 ml-2">-</span>
                          )
                        ) : (
                          <div className="truncate" title={row[col.key]} style={{ maxWidth: col.minWidth }}>
                              {row[col.key] || <span className="text-slate-300">-</span>}
                          </div>
                        )}
                      </td>
                    ))}
                    {(showActions || isAuthenticated) && (
                      <td className="p-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-5px_0_10px_-5px_rgb(0,0,0,0.05)] border-l border-transparent z-10">
                          <div className="flex items-center justify-center gap-1">
                            {/* Check permissions: Owner OR Admin */}
                            {isAuthenticated && (isAdmin || user?.userEmail === row.email) ? (
                                <>
                                    <button
                                        onClick={() => handleEditClick(row)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="Edit Entry"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(row)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete Entry"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            ) : (
                                <span className="text-slate-200 text-xs px-2">Read-only</span>
                            )}
                          </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500 italic">
                    No publications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] sm:text-xs text-slate-400 flex justify-between items-center shrink-0">
          <span>Showing {filteredData.length} records</span>
          <span>Total: {data.length}</span>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setDeleteId(null)}
                />
                <motion.div
                    initial={{scale:0.9, opacity:0}}
                    animate={{scale:1, opacity:1}}
                    exit={{scale:0.9, opacity:0}}
                    className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 border border-slate-100"
                >
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Publication?</h3>
                            <p className="text-sm text-slate-500 mt-1">This action cannot be undone.</p>
                        </div>
                        <div className="flex w-full gap-3 mt-2">
                            <button 
                                onClick={() => setDeleteId(null)}
                                className="flex-1 btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 btn bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <EditPublicationModal 
        isOpen={isEditOpen} 
        onClose={() => { setIsEditOpen(false); setEditItem(null); }} 
        publication={editItem}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default PublicationsTable;
