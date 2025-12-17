import { useState } from 'react';
import { Mail, MapPin, Code } from 'lucide-react'; // Removed unused Phone
import DeveloperModal from './DeveloperModal';

const Footer = () => {
  const [isDevOpen, setIsDevOpen] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-[--border] mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-center"> {/* <-- FIX 1: Changed md:text-left to md:text-center */}
            
            {/* Brand & Copyright */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[--primary]">NRI INSTITUTE OF TECHNOLOGY</h3>
              <p className="text-xs text-[--text-light]">
                &copy; {new Date().getFullYear()} All rights reserved.
              </p>
            </div>

            {/* Contact Info (Simplified) */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
               {/* TIP: Wrapped in <a> for better UX */}
               <a href="https://maps.app.goo.gl/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[--text-secondary] hover:text-[--primary] transition-colors">
                   <MapPin size={14} className="text-[--primary]" />
                   <span>Eluru Dist, AP</span>
               </a>
               <a href="mailto:contact@nriit.edu.in" className="flex items-center gap-2 text-xs text-[--text-secondary] hover:text-[--primary] transition-colors">
                   <Mail size={14} className="text-[--primary]" />
                   <span>contact@nriit.edu.in</span>
               </a>
            </div>

            {/* Developer Button */}
            <div>
              <button 
                onClick={() => setIsDevOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full text-xs font-semibold transition-colors border border-slate-200"
              >
                <Code size={14} />
                Contact Developer
              </button>
            </div>

          </div>
        </div>
      </footer>
      
      <DeveloperModal 
        isOpen={isDevOpen} 
        onClose={() => setIsDevOpen(false)} 
      />
    </>
  );
};

export default Footer;