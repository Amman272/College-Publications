import { useState, useEffect } from 'react';
import { Save, CloudUpload, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const UploadForm = ({ onSuccess, initialData = null, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const initialForm = {
    mainAuthor: '',
    title: '',
    email: '',
    phone: '',
    dept: '',
    coauthors: '',
    journal: '',
    publisher: '',
    year: '2005',
    vol: '',
    issueNo: '',
    pages: '',
    indexation: '',
    issnNo: '',
    journalLink: '',
    ugcApproved: '',
    impactFactor: '',
    pdfUrl: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [showOtherIndexation, setShowOtherIndexation] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const standardIndexations = ['SCI', 'SCOPUS', 'WOS', 'UGC', ''];
      if (!standardIndexations.includes(initialData.indexation)) {
        setShowOtherIndexation(true);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'indexation') {
      if (value === 'OTHER') {
        setShowOtherIndexation(true);
        setFormData(prev => ({ ...prev, indexation: '' }));
        return;
      } else {
        setShowOtherIndexation(false);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      if (initialData) {
         // Edit Mode
         await api.put('/form/formEntryUpdate', formData);
         setMsg({ type: 'success', text: 'Publication updated successfully!' });
      } else {
         // Create Mode
         await api.post('/form/formEntry', formData);
         setMsg({ type: 'success', text: 'Publication added successfully!' });
         setFormData(initialForm);
      }
      
      if (onSuccess) onSuccess();
      if (onClose) setTimeout(onClose, 1000); // Close modal after success if in modal
      
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save publication. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-[--background] border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary]/20 focus:border-[--primary] transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-[--text-secondary] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg.text && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Main Author & Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Main Author *</label>
          <input required name="mainAuthor" value={formData.mainAuthor || ''} onChange={handleChange} className={inputClass} placeholder="Dr. John Doe" />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input required type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} placeholder="john@nriit.edu.in" />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Publication Title *</label>
        <textarea required rows="2" name="title" value={formData.title || ''} onChange={handleChange} className={inputClass} placeholder="Research on AI..." />
      </div>

      {/* Dept & Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Department</label>
          <select name="dept" value={formData.dept || ''} onChange={handleChange} className={inputClass}>
            <option value="">Select Dept</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="IT">IT</option>
            <option value="AIML">AIML</option>
            <option value="DS">DS</option>
            <option value="FED">FED</option>
            <option value="MBA">MBA</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} placeholder="9999988888" />
        </div>
      </div>

      {/* Co Authors */}
      <div>
        <label className={labelClass}>Co-Authors</label>
        <input name="coauthors" value={formData.coauthors || ''} onChange={handleChange} className={inputClass} placeholder="Jane Doe, Bob Smith..." />
      </div>

      {/* Journal & Publisher */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Journal Name</label>
          <input name="journal" value={formData.journal || ''} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Publisher</label>
          <input name="publisher" value={formData.publisher || ''} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      {/* Details Row 1 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
           <label className={labelClass}>Year</label>
           <input type="number" name="year" value={formData.year || ''} onChange={handleChange} className={inputClass} placeholder="2023" />
        </div>
        <div>
           <label className={labelClass}>Volume</label>
           <input name="vol" value={formData.vol || ''} onChange={handleChange} className={inputClass} placeholder="12" />
        </div>
        <div>
           <label className={labelClass}>Issue No</label>
           <input name="issueNo" value={formData.issueNo || ''} onChange={handleChange} className={inputClass} placeholder="4" />
        </div>
      </div>

      {/* Details Row 2 */}
      <div className="grid grid-cols-2 gap-4">
         <div>
            <label className={labelClass}>Pages</label>
            <input name="pages" value={formData.pages || ''} onChange={handleChange} className={inputClass} placeholder="100-112" />
         </div>
          <div>
            <label className={labelClass}>Indexation</label>
            <div className="space-y-2">
              <select 
                name="indexation" 
                value={showOtherIndexation ? 'OTHER' : (formData.indexation || '')} 
                onChange={handleChange} 
                className={inputClass}
              >
                  <option value="">Select</option>
                  <option value="SCI">SCI</option>
                  <option value="SCOPUS">SCOPUS</option>
                  <option value="WOS">Web of Science</option>
                  <option value="UGC">UGC Care</option>
                  <option value="OTHER">Other</option>
              </select>
              
              {showOtherIndexation && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <input 
                    name="indexation" 
                    value={formData.indexation || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, indexation: e.target.value }))} 
                    className={inputClass} 
                    placeholder="Enter Indexation (e.g. IEEE, Springer)" 
                  />
                </motion.div>
              )}
            </div>
          </div>
      </div>
      
      {/* ISSN & Journal Link */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>ISSN No</label>
          <input name="issnNo" value={formData.issnNo || ''} onChange={handleChange} className={inputClass} placeholder="1234-5678" />
        </div>
        
      </div>

      {/* UGC & Impact Factor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>UGC Approved</label>
          <select name="ugcApproved" value={formData.ugcApproved || ''} onChange={handleChange} className={inputClass}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Impact Factor</label>
          <input name="impactFactor" value={formData.impactFactor || ''} onChange={handleChange} className={inputClass} placeholder="5.2" />
        </div>
      </div>

      {/* PDF URL */}
      <div>
        <label className={labelClass}>Link to article</label>
        <input type="url" name="pdfUrl" value={formData.pdfUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
      </div>
      <div>
          <label className={labelClass}>Journal Link</label>
          <input name="journalLink" value={formData.journalLink || ''} onChange={handleChange} className={inputClass} placeholder="https://journal.com/..." />
        </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn btn-primary py-3 rounded-lg text-sm transition-all"
        >
          {loading ? (
             'Loading...'
          ) : (
            <>{initialData ? <Edit size={18} /> : <Save size={18} />} {initialData ? 'Update Publication' : 'Save Record'}</>
          )}
        </button>
      </div>

    </form>
  );
};

export default UploadForm;
