import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit } from 'lucide-react';
import UploadForm from './UploadForm';

const EditPublicationModal = ({ isOpen, onClose, publication, onSuccess }) => {
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
            className="relative w-full max-w-2xl bg-white border border-white/20 shadow-premium rounded-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[--primary] to-[--secondary] p-4 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                     <Edit size={20} className="text-white" />
                   </div>
                   <div>
                       <h2 className="text-lg font-bold font-heading">Edit Publication</h2>
                       <p className="text-xs text-white/80">Update the details below</p>
                   </div>
               </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
               <UploadForm 
                  initialData={publication} 
                  onSuccess={onSuccess} 
                  onClose={onClose}
               />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditPublicationModal;
