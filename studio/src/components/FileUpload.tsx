import React, { useCallback, useState } from 'react';
import { UploadCloud, FileCode, PlayCircle, Sparkles, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileLoaded: (name: string, content: string, skipRecommendations: boolean) => void;
  onLoadExample: (skipRecommendations: boolean) => void;
  error?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded, onLoadExample, error }) => {
  // Default to skipping recommendations (AI off by default)
  const [skipRecommendations, setSkipRecommendations] = useState(true);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(file.name, content, skipRecommendations);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [skipRecommendations]); // Depend on skipRecommendations so the current state is used

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div 
        className={`bg-white border-2 border-dashed rounded-2xl p-12 text-center transition-colors shadow-sm relative ${error ? 'border-red-300 bg-red-50/10' : 'border-indigo-200 hover:border-indigo-400'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Upload Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <UploadCloud className="w-10 h-10 text-indigo-600" />
          </div>
        )}

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload EML Metadata</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Drag and drop your .xml file here, or click to browse. We support EML version 2.2.0 or later.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <label className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer w-48">
            <span>Select XML File</span>
            <input 
              type="file" 
              className="hidden" 
              accept=".xml" 
              onChange={handleFileChange} 
            />
          </label>

          <div className="flex items-center w-full max-w-xs my-2">
            <div className="flex-grow h-px bg-slate-200"></div>
            <span className="px-3 text-xs text-slate-400 font-medium uppercase">Or</span>
            <div className="flex-grow h-px bg-slate-200"></div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onLoadExample(skipRecommendations);
            }}
            className="inline-flex items-center justify-center px-6 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors w-48"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Load Example Data
          </button>
        </div>

        {/* AI Toggle Switch */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
           <label className="flex items-center cursor-pointer group" onClick={(e) => e.stopPropagation()}>
             <div className="relative">
               <input 
                 type="checkbox" 
                 className="sr-only" 
                 checked={!skipRecommendations}
                 onChange={() => setSkipRecommendations(!skipRecommendations)}
               />
               <div className={`block w-10 h-6 rounded-full transition-colors ${!skipRecommendations ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
               <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${!skipRecommendations ? 'transform translate-x-4' : ''}`}></div>
             </div>
             <div className="ml-3 flex items-center text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
               <Sparkles className={`w-4 h-4 mr-1.5 ${!skipRecommendations ? 'text-indigo-500' : 'text-slate-400'}`} />
               Enable AI Recommendations
             </div>
           </label>
        </div>
        
        <div className="mt-6 flex justify-center space-x-8 text-sm text-slate-400">
           <div className="flex items-center">
             <FileCode className="w-4 h-4 mr-2" />
             <span>EML 2.2.0 Compatible</span>
           </div>
           <div className="flex items-center">
             <FileCode className="w-4 h-4 mr-2" />
             <span>Auto-Detection</span>
           </div>
        </div>
      </div>
    </div>
  );
};