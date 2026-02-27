import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  step: 'UPLOAD' | 'ANNOTATE' | 'EXPORT';
}

export const Layout: React.FC<LayoutProps> = ({ children, step }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <img 
                src="https://edirepository.org/static/images/EDI-logo.png" 
                alt="EML Logo" 
                className="w-8 h-8 block object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">EML Annotation Studio</h1>
              <p className="text-xs text-indigo-600 font-medium">Powered by AI</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            <StepIndicator label="Upload" active={step === 'UPLOAD'} completed={step !== 'UPLOAD'} />
            <div className="w-8 h-px bg-slate-300 mx-2" />
            <StepIndicator label="Annotate" active={step === 'ANNOTATE'} completed={step === 'EXPORT'} />
            <div className="w-8 h-px bg-slate-300 mx-2" />
            <StepIndicator label="Export" active={step === 'EXPORT'} completed={false} />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full w-full max-w-7xl mx-auto p-6 overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  );
};

const StepIndicator: React.FC<{ label: string; active: boolean; completed: boolean }> = ({ label, active, completed }) => {
  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>
      <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-indigo-600' : completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <span className={`text-sm font-medium ${active ? 'text-indigo-900' : ''}`}>{label}</span>
    </div>
  );
};