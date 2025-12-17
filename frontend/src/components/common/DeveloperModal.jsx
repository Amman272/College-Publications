import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Mail } from 'lucide-react';

const DeveloperModal = ({ isOpen, onClose }) => {
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-premium p-8 max-w-sm w-full text-center overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary to-secondary opacity-10" />
             
             <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg mx-auto flex items-center justify-center mb-6 text-primary">
                    <Code size={32} />
                </div>
                
                <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">Designed & Developed by</h3>
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-6">
                    Amman
                </h2>
                
                <p className="text-slate-500 text-sm mb-8">
                    Built with React, Tailwind CSS, Express & SQLite for seamless publication management.
                </p>

                <a 
                   href="mailto:ammanfawaz272@gmail.com"
                   className="flex items-center justify-center gap-2 w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold transition-colors group"
                >
                    <Mail size={18} className="text-slate-400 group-hover:text-primary transition-colors"/>
                    ammanfawaz272@gmail.com
                </a>
             </div>

             <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
             >
                <X size={20} />
             </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeveloperModal;
