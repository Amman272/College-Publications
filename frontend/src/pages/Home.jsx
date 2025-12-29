import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PublicationsTable from '../components/data/PublicationsTable';

const Home = () => {
const [isAdminPopup, setIsAdminPopup] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-[--background]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[--primary] text-sm font-medium mb-2 relative overflow-hidden"
          >
           NRI Institute of Technology
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700"
          >
            Faculty Publications Portal
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4 mt-8"
          >
             <a href="#publications" className="btn btn-primary px-6 py-3 text-base">
                View Publications
             </a>
             <a href="/upload" className="btn btn-outline px-6 py-3 text-base bg-white">
                Delete / Manage Entries
             </a>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto text-lg text-slate-600"
          >
            A centralized repository for accessing and managing research publications, journals, and academic contributions by our esteemed faculty.
          </motion.p>
        </section>

        {/* Data Table Section */}
        <section id="publications" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Publications Database</h2>
            <div className="flex items-center gap-2">
              <a
                href="/form/downloadExcel"
                target="_blank"
                download
                className="btn bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-sm py-2"
              >
                <Download size={16} /> Download Excel
              </a>
            </div>
          </div>
          <PublicationsTable />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
