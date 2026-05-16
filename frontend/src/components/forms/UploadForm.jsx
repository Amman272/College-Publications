
import { useState, useEffect } from "react";
import {
    Upload, CheckCircle, User, Building2, Hash,
    Users, BookOpen, Link as LinkIcon, Phone, FileText,
    BarChart2, Calendar, Layers
} from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { DEPARTMENTS } from "../../config/constants";

// ── Shared sub-components ──────────────────────────────────────────────────
const TextField = ({ label, name, icon: Icon, placeholder, required = false, type = "text", value, onChange, error }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            {Icon && <Icon size={14} className="text-slate-400" />}
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none ${error ? "border-red-300 bg-red-50/10" : "border-slate-200 hover:border-slate-300"}`}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
);

const SelectField = ({ label, name, options, icon: Icon, required = false, value, onChange, error }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            {Icon && <Icon size={14} className="text-slate-400" />}
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none ${error ? "border-red-300 bg-red-50/10" : "border-slate-200 hover:border-slate-300"}`}
            >
                <option value="">Select {label}</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
);

const TextAreaField = ({ label, name, icon: Icon, placeholder, required = false, value, onChange, error, rows = 3 }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            {Icon && <Icon size={14} className="text-slate-400" />}
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none ${error ? "border-red-300 bg-red-50/10" : "border-slate-200 hover:border-slate-300"}`}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
);

const SectionHeader = ({ title, subtitle }) => (
    <div className="pb-3 mb-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
);

// ── Default form state ─────────────────────────────────────────────────────
const defaultFormData = {
    mainAuthor: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    caste: "",
    coAuthors: "",
    title: "",
    journal: "",
    publisher: "",
    year: "",
    volume: "",
    issueNumber: "",
    pages: "",
    indexation: "",
    issnNumber: "",
    ugcApproved: "",
    impactFactor: "",
    journalLink: "",
    articleLink: "",
};

const DESIGNATIONS = [
    "Professor", "Associate Professor", "Assistant Professor",
    "Senior Assistant Professor", "Lecturer", "Lab Instructor", "Other"
];
const CASTE_OPTIONS = ["SC", "ST", "OC", "OBC", "BC"];
const UGC_OPTIONS = ["Yes", "No"];
const INDEXATION_OPTIONS = ["SCI", "SCIE", "Scopus", "UGC Care", "Web of Science", "ESCI", "Other"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i + 2));

// ── Main Component ─────────────────────────────────────────────────────────
const UploadForm = ({ onSuccess, onFormChange, initialData, onClose }) => {
    const [formData, setFormData] = useState(initialData ? {
        mainAuthor: initialData.mainAuthor || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        department: initialData.department || "",
        designation: initialData.designation || "",
        caste: initialData.caste || "",
        coAuthors: initialData.coAuthors || "",
        title: initialData.title || "",
        journal: initialData.journal || "",
        publisher: initialData.publisher || "",
        year: initialData.year ? String(initialData.year) : "",
        volume: initialData.volume || "",
        issueNumber: initialData.issueNumber || "",
        pages: initialData.pages || "",
        indexation: initialData.indexation || "",
        issnNumber: initialData.issnNumber || "",
        ugcApproved: initialData.ugcApproved || "",
        impactFactor: initialData.impactFactor ? String(initialData.impactFactor) : "",
        journalLink: initialData.journalLink || "",
        articleLink: initialData.articleLink || "",
    } : { ...defaultFormData });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = Boolean(initialData?.id);

    // Notify parent of form changes for duplicate detection
    useEffect(() => {
        if (onFormChange) {
            onFormChange(formData);
        }
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.mainAuthor.trim()) newErrors.mainAuthor = "Main Author is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email";
        if (!formData.department) newErrors.department = "Department is required";
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.journal.trim()) newErrors.journal = "Journal name is required";
        if (!formData.year) newErrors.year = "Year is required";
        if (formData.journalLink && !/^https?:\/\/.+/.test(formData.journalLink)) newErrors.journalLink = "Must be a valid URL (https://...)";
        if (formData.articleLink && !/^https?:\/\/.+/.test(formData.articleLink)) newErrors.articleLink = "Must be a valid URL (https://...)";
        if (formData.impactFactor && isNaN(parseFloat(formData.impactFactor))) newErrors.impactFactor = "Must be a number";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Please fix the highlighted errors");
            return;
        }

        const payload = {
            ...formData,
            year: formData.year ? parseInt(formData.year, 10) : null,
            impactFactor: formData.impactFactor ? parseFloat(formData.impactFactor) : null,
        };

        try {
            setIsSubmitting(true);
            if (isEditMode) {
                await api.put("/form/formEntryUpdate", { id: initialData.id, ...payload });
                toast.success("Journal publication updated successfully!");
                if (onSuccess) onSuccess();
                if (onClose) onClose();
            } else {
                await api.post("/form/formEntry", payload);
                toast.success("Journal publication submitted successfully!");
                setFormData({ ...defaultFormData });
                setErrors({});
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Submission failed. Please try again.";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1: Author Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader title="Author Information" subtitle="Primary author and contact details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                        <TextField
                            label="Main Author" name="mainAuthor" icon={User}
                            placeholder="Dr. John Doe" required value={formData.mainAuthor}
                            onChange={handleChange} error={errors.mainAuthor}
                        />
                    </div>
                    <TextField
                        label="Email" name="email" type="email" icon={User}
                        placeholder="faculty@nriit.edu.in" required value={formData.email}
                        onChange={handleChange} error={errors.email}
                    />
                    <TextField
                        label="Phone" name="phone" type="tel" icon={Phone}
                        placeholder="9876543210" value={formData.phone}
                        onChange={handleChange} error={errors.phone}
                    />
                    <SelectField
                        label="Department" name="department" icon={Building2}
                        options={DEPARTMENTS} required value={formData.department}
                        onChange={handleChange} error={errors.department}
                    />
                    <SelectField
                        label="Designation" name="designation" icon={User}
                        options={DESIGNATIONS} value={formData.designation}
                        onChange={handleChange} error={errors.designation}
                    />
                    <SelectField
                        label="Caste" name="caste" icon={User}
                        options={CASTE_OPTIONS} value={formData.caste}
                        onChange={handleChange} error={errors.caste}
                    />
                    <div className="sm:col-span-2">
                        <TextAreaField
                            label="Co-Authors" name="coAuthors" icon={Users}
                            placeholder="Dr. Jane Smith, Prof. Kumar, ..." rows={2}
                            value={formData.coAuthors} onChange={handleChange} error={errors.coAuthors}
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Publication Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader title="Publication Details" subtitle="Journal and article information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                        <TextAreaField
                            label="Title" name="title" icon={BookOpen}
                            placeholder="Full title of the paper/article" required rows={2}
                            value={formData.title} onChange={handleChange} error={errors.title}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <TextField
                            label="Journal Name" name="journal" icon={BookOpen}
                            placeholder="e.g. IEEE Transactions on Neural Networks" required
                            value={formData.journal} onChange={handleChange} error={errors.journal}
                        />
                    </div>
                    <TextField
                        label="Publisher" name="publisher" icon={Building2}
                        placeholder="e.g. Elsevier, Springer" value={formData.publisher}
                        onChange={handleChange} error={errors.publisher}
                    />
                    <SelectField
                        label="Year" name="year" icon={Calendar}
                        options={YEAR_OPTIONS} required value={formData.year}
                        onChange={handleChange} error={errors.year}
                    />
                    <TextField
                        label="Volume" name="volume" icon={Layers}
                        placeholder="e.g. 42" value={formData.volume}
                        onChange={handleChange} error={errors.volume}
                    />
                    <TextField
                        label="Issue Number" name="issueNumber" icon={Hash}
                        placeholder="e.g. 3" value={formData.issueNumber}
                        onChange={handleChange} error={errors.issueNumber}
                    />
                    <TextField
                        label="Pages" name="pages" icon={FileText}
                        placeholder="e.g. 123-130" value={formData.pages}
                        onChange={handleChange} error={errors.pages}
                    />
                </div>
            </div>

            {/* Section 3: Metadata & Indexing */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader title="Metadata & Indexing" subtitle="Indexation, ISSN, and quality indicators" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <SelectField
                        label="Indexation" name="indexation" icon={BarChart2}
                        options={INDEXATION_OPTIONS} value={formData.indexation}
                        onChange={handleChange} error={errors.indexation}
                    />
                    <TextField
                        label="ISSN Number" name="issnNumber" icon={Hash}
                        placeholder="e.g. 1234-5678" value={formData.issnNumber}
                        onChange={handleChange} error={errors.issnNumber}
                    />
                    <SelectField
                        label="UGC Approved" name="ugcApproved" icon={CheckCircle}
                        options={UGC_OPTIONS} value={formData.ugcApproved}
                        onChange={handleChange} error={errors.ugcApproved}
                    />
                    <TextField
                        label="Impact Factor" name="impactFactor" type="number"
                        icon={BarChart2} placeholder="e.g. 3.456"
                        value={formData.impactFactor} onChange={handleChange} error={errors.impactFactor}
                    />
                </div>
            </div>

            {/* Section 4: Links */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <SectionHeader title="Links" subtitle="URLs to the journal and article" />
                {/* PDF upload is hidden — journal system uses URL links only */}
                <div className="grid grid-cols-1 gap-5">
                    <TextField
                        label="Link to Journal" name="journalLink" type="url" icon={LinkIcon}
                        placeholder="https://www.journal-website.com"
                        value={formData.journalLink} onChange={handleChange} error={errors.journalLink}
                    />
                    <TextField
                        label="Link to Article" name="articleLink" type="url" icon={LinkIcon}
                        placeholder="https://doi.org/10.xxxx/xxxxx"
                        value={formData.articleLink} onChange={handleChange} error={errors.articleLink}
                    />
                </div>
            </div>

            {/* Submit / Cancel */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none sm:min-w-[180px] py-3 px-6 bg-[#1B2845] hover:bg-[#243656] disabled:bg-slate-300 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    {isSubmitting ? (
                        <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /><span>Submitting...</span></>
                    ) : (
                        <><Upload size={16} /><span>{isEditMode ? "Update Publication" : "Submit Publication"}</span></>
                    )}
                </button>
                {isEditMode && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-3 px-6 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default UploadForm;
