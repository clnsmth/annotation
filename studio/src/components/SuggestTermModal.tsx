import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, BookOpen, User, Tag, AlertTriangle } from 'lucide-react';

interface SuggestTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermLabel?: string;
}

interface FormData {
  target_vocabulary: string;
  term_details: {
    label: string;
    description: string;
    evidence_source: string;
  };
  submitter_info: {
    email: string;
    orcid_id: string;
    attribution_consent: boolean;
  };
}

const INITIAL_DATA: FormData = {
  target_vocabulary: '',
  term_details: {
    label: '',
    description: '',
    evidence_source: ''
  },
  submitter_info: {
    email: '',
    orcid_id: '',
    attribution_consent: true
  }
};

export const SuggestTermModal: React.FC<SuggestTermModalProps> = ({ isOpen, onClose, initialTermLabel }) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialTermLabel) {
      setFormData(prev => ({
        ...prev,
        term_details: { ...prev.term_details, label: initialTermLabel }
      }));
    }
  }, [isOpen, initialTermLabel]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Target Vocabulary
    if (!formData.target_vocabulary || formData.target_vocabulary.length < 2) {
      newErrors.target_vocabulary = "Target vocabulary must be at least 2 characters.";
    }

    // Term Details
    if (!formData.term_details.label || formData.term_details.label.length < 2) {
      newErrors.label = "Term label must be at least 2 characters.";
    }
    if (!formData.term_details.description || formData.term_details.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters.";
    }

    // Submitter Info
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.submitter_info.email || !emailRegex.test(formData.submitter_info.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    const orcidRegex = /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-(\d{3}X|\d{4})$/;
    if (formData.submitter_info.orcid_id && !orcidRegex.test(formData.submitter_info.orcid_id)) {
      newErrors.orcid_id = "Invalid ORCID URL format (e.g., https://orcid.org/0000-0000-0000-0000).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Connect to the Python FastAPI backend
      const response = await fetch('http://localhost:8000/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      console.log("Proposal successfully submitted to backend.");
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      setSubmitError("There was an issue submitting your proposal. Please ensure the backend server is running.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData(INITIAL_DATA);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const updateField = (section: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Propose New Ontology Term</h2>
            <p className="text-xs text-slate-500 mt-0.5">Submit a new term for community review and inclusion.</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Suggestion Submitted!</h3>
              <p className="text-slate-600 max-w-md">
                Thank you for contributing to the community ontology. Your suggestion for 
                <span className="font-semibold text-indigo-600"> "{formData.term_details.label}" </span> 
                has been received and will be reviewed by a curator.
              </p>
              <button 
                onClick={handleClose}
                className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-sm text-red-700">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Target Vocabulary */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-100 pb-2">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Target Context</h3>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Target Vocabulary or Category <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={formData.target_vocabulary}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_vocabulary: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-indigo-100 placeholder:text-slate-500 ${errors.target_vocabulary ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-slate-800'}`}
                    placeholder="e.g., Soil Type, Land Use, Sensor Model, or specific ontology (ENVO, SWEET)"
                  />
                  {errors.target_vocabulary && <p className="text-xs text-red-500 mt-1">{errors.target_vocabulary}</p>}
                  <p className="text-xs text-slate-500">
                    Where did you expect to find this term? If you know the specific ontology name (e.g., ENVO), please enter it. Otherwise, state the general category.
                  </p>
                </div>
              </section>

              {/* Term Details */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-100 pb-2">
                  <Tag className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Term Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Suggested Term Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      value={formData.term_details.label}
                      onChange={(e) => updateField('term_details', 'label', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-indigo-100 placeholder:text-slate-500 ${errors.label ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-slate-800'}`}
                      placeholder="e.g., Oligotrophic Peatland"
                    />
                    {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
                    <p className="text-xs text-slate-500">Enter the term exactly as it appears in your dataset. Avoid lab-specific acronyms.</p>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></label>
                    <textarea 
                      value={formData.term_details.description}
                      onChange={(e) => updateField('term_details', 'description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-indigo-100 placeholder:text-slate-500 ${errors.description ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-slate-800'}`}
                      placeholder="What is this term and what distinguishes it from similar concepts?"
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    <p className="text-xs text-slate-500">
                      Briefly describe the term. Example: "A [Term] is a type of [Category] characterized by [Feature]."
                    </p>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Reference / Source</label>
                    <input 
                      type="text"
                      value={formData.term_details.evidence_source}
                      onChange={(e) => updateField('term_details', 'evidence_source', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"
                      placeholder="Wikipedia URL, DOI, or Manufacturer Link"
                    />
                    <p className="text-xs text-slate-500">Link to an open resource (Wikipedia preferred) or DOI supporting the definition.</p>
                  </div>
                </div>
              </section>

              {/* Submitter Info */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-100 pb-2">
                  <User className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Contributor Info</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Contact Email <span className="text-red-500">*</span></label>
                    <input 
                      type="email"
                      value={formData.submitter_info.email}
                      onChange={(e) => updateField('submitter_info', 'email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-indigo-100 placeholder:text-slate-500 ${errors.email ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-slate-800'}`}
                      placeholder="name@institution.edu"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">ORCID URL</label>
                    <input 
                      type="text"
                      value={formData.submitter_info.orcid_id}
                      onChange={(e) => updateField('submitter_info', 'orcid_id', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-indigo-100 placeholder:text-slate-500 ${errors.orcid_id ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-slate-800'}`}
                      placeholder="https://orcid.org/0000-0000-0000-0000"
                    />
                    {errors.orcid_id && <p className="text-xs text-red-500 mt-1">{errors.orcid_id}</p>}
                  </div>
                </div>
                
                <div className="flex items-start gap-3 pt-2">
                   <div className="flex h-5 items-center">
                     <input
                       id="attribution_consent"
                       type="checkbox"
                       checked={formData.submitter_info.attribution_consent}
                       onChange={(e) => updateField('submitter_info', 'attribution_consent', e.target.checked)}
                       className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                     />
                   </div>
                   <label htmlFor="attribution_consent" className="text-sm text-slate-600 cursor-pointer select-none">
                     I consent to be listed as the term creator in the ontology metadata.
                   </label>
                </div>
              </section>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Proposal
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};