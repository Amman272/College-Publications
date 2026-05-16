import { useState, useRef, useEffect } from 'react';
import { Download, Search, ChevronRight, Award, Filter, FileText, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PublicationsTable from '../components/data/PublicationsTable';
import LoginModal from '../components/auth/LoginModal';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../config/constants';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Home = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const tableRef = useRef();
  const exportMenuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleScrollToPublications = () => {
    const section = document.getElementById('publications');
    const header = document.querySelector('header');

    if (section && header) {
      const headerHeight = header.offsetHeight;
      const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 20;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleRefresh = async () => {
    if (!tableRef.current || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await tableRef.current.refresh();
    } catch (error) {
      console.error('Failed to refresh:', error);
      toast.error('Failed to refresh data');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Shared helper to build filter params
  const getExportParams = () => {
    const currentFilters = tableRef.current?.getFilters() || {};
    const hasActiveFilters = Object.values(currentFilters).some(v => v && String(v).trim().length > 0);
    const params = {};
    if (hasActiveFilters) params.filters = JSON.stringify(currentFilters);
    return { params, hasActiveFilters };
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const { params, hasActiveFilters } = getExportParams();
      const response = await api.get("/form/downloadExcel", { params, responseType: "arraybuffer" });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", hasActiveFilters ? "journals-filtered.xlsx" : "journals.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(hasActiveFilters ? "Filtered data exported as Excel" : "All data exported as Excel");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);

    try {
      const { params, hasActiveFilters } = getExportParams();
      params.limit = 10000;
      params.page = 1;

      const response = await api.get("/form/formGet", { params });

      const rawData = response.data?.data || response.data || [];
      const patentsData = Array.isArray(rawData) ? rawData : (rawData.data || []);

      if (patentsData.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });

      const subtitle = hasActiveFilters ? "Filtered Journal Publications Report" : "All Journal Publications Report";
      doc.setFontSize(14);
      doc.text("Dr. RVR NRI INSTITUTE OF TECHNOLOGY - Journal Publications", 20, 25);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${subtitle} • ${patentsData.length} records • Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 40);

      const tableColumns = [
        "ID", "Main Author", "Email", "Phone", "Department", "Designation", "Caste",
        "Co-Authors", "Title", "Journal", "Publisher", "Year",
        "Volume", "Issue No.", "Pages", "Indexation", "ISSN", "UGC", "Impact Factor"
      ];

      const tableRows = patentsData.map(p => [
        p.id || '-',
        p.mainAuthor || '-',
        p.email || '-',
        p.phone || '-',
        p.department || '-',
        p.designation || '-',
        p.caste || '-',
        p.coAuthors || '-',
        p.title || '-',
        p.journal || '-',
        p.publisher || '-',
        p.year || '-',
        p.volume || '-',
        p.issueNumber || '-',
        p.pages || '-',
        p.indexation || '-',
        p.issnNumber || '-',
        p.ugcApproved || '-',
        p.impactFactor || '-',
      ]);

      autoTable(doc, {
        startY: 55,
        head: [tableColumns],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [27, 40, 69], fontSize: 6, halign: 'center' },
        styles: { fontSize: 5.5, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 20 },   // ID
          1: { cellWidth: 70 },   // Main Author
          2: { cellWidth: 80 },   // Email
          3: { cellWidth: 50 },   // Phone
          4: { cellWidth: 40 },   // Department
          5: { cellWidth: 60 },   // Designation
          6: { cellWidth: 25 },   // Caste
          7: { cellWidth: 70 },   // Co-Authors
          8: { cellWidth: 100 },  // Title
          9: { cellWidth: 80 },   // Journal
          10: { cellWidth: 60 },  // Publisher
          11: { cellWidth: 25 },  // Year
          12: { cellWidth: 30 },  // Volume
          13: { cellWidth: 30 },  // Issue No.
          14: { cellWidth: 35 },  // Pages
          15: { cellWidth: 40 },  // Indexation
          16: { cellWidth: 40 },  // ISSN
          17: { cellWidth: 25 },  // UGC
          18: { cellWidth: 35 },  // Impact Factor
        }
      });

      const filename = hasActiveFilters ? "journals-filtered.pdf" : "journals.pdf";
      doc.save(filename);
      toast.success(hasActiveFilters ? "Filtered data exported as PDF" : "All data exported as PDF");

    } catch (err) {
      console.error("PDF export failed", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] transition-colors duration-300">
      <Header />

      <main className="flex-grow">
        {/* HERO — Grand Institutional Banner */}
        <section className="relative overflow-hidden min-h-[75vh] flex items-center justify-center md:pt-16">
          {/* Building Background Image */}
          <div
            className="absolute inset-0 z-0 bg-[center_35%] bg-cover bg-no-repeat"
            style={{ backgroundImage: `url('/nri-building2-4k.png')` }}
          ></div>

          {/* 50% Dark Shade Overlay for Text Readability */}
          <div className="absolute inset-0 z-0 bg-black/50"></div>

          {/* Minimal gradient at the very bottom to blend seamlessly into the next section */}
          <div className="absolute inset-x-0 bottom-0 h-40 z-0 bg-gradient-to-t from-[#FAFBFD] to-transparent"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 relative z-10">
            <div className="max-w-4xl mx-auto text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-md">
                Journal Publications
                <span className="block text-[#C8A96E] mt-2 text-3xl md:text-4xl lg:text-5xl font-bold">Repository</span>
              </h1>

              <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
                A digital archive of journal publications and research contributions from our esteemed faculty and scholars.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleScrollToPublications}
                  className="group px-8 py-4 bg-[#C8A96E] hover:bg-[#B8994E] text-[#1B2845] rounded-xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2"
                >
                  <Search size={20} />
                  Browse Repository
                  <ChevronRight size={18} className="opacity-60 group-hover:translate-x-1 transition-transform" />
                </button>

                {isAuthenticated && (
                  <button
                    onClick={() => navigate('/upload')}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl font-bold shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    Submit Publication
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* PUBLICATIONS TABLE SECTION */}
        <section id="publications" className="py-10 md:py-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">

            {/* Table card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="border-b border-slate-100 px-5 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Journal Publications Database</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Institutional journal records</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
                    Refresh
                  </button>
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      disabled={isExporting || isExportingPdf}
                      className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 text-white ${isExportMenuOpen
                        ? 'bg-[#243656]'
                        : 'bg-[#1B2845] hover:bg-[#243656]'
                        }`}
                      title="Export Options"
                    >
                      {(isExporting || isExportingPdf) ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={15} />
                      )}
                      <span className="hidden sm:inline">Export As</span>
                      <span className="sm:hidden">Export</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 opacity-60 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-1.5 z-50 transition-all origin-top-right ${isExportMenuOpen
                        ? 'opacity-100 scale-100 pointer-events-auto transform-none'
                        : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
                        }`}
                    >
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleExportPdf();
                        }}
                        disabled={isExporting || isExportingPdf}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1B2845] transition-colors text-left group"
                      >
                        <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-[#1B2845]/10 group-hover:text-[#1B2845] transition-colors">
                          <FileText size={14} />
                        </div>
                        PDF Document
                      </button>

                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleExport();
                        }}
                        disabled={isExporting || isExportingPdf}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors text-left group"
                      >
                        <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          <Download size={14} />
                        </div>
                        Excel Spreadsheet
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="px-5 md:px-6 pt-3 pb-1 text-xs text-slate-400 flex items-center gap-1">
                <Filter size={12} />
                Use column filters below to narrow results, then export to download filtered data.
              </p>

              {/* Table */}
              <div className="p-0">
                <PublicationsTable ref={tableRef} />
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default Home;