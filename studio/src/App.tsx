import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { AnnotationEditor } from './components/AnnotationEditor';
import { emlParser } from './services/emlParser';
import { geminiService } from './services/geminiService';
import { AnnotatableElement, OntologyTerm, AnnotationStatus } from './types';
import { Loader2, Download, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { EXAMPLE_EML_XML } from './constants/mockData';

export default function App() {
  const [step, setStep] = useState<'UPLOAD' | 'ANNOTATE' | 'EXPORT'>('UPLOAD');
  const [xmlContent, setXmlContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [elements, setElements] = useState<AnnotatableElement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [exportReady, setExportReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Reset Application State
  const resetApp = () => {
    setStep('UPLOAD');
    setXmlContent('');
    setFileName('');
    setElements([]);
    setExportReady(false);
    setError(null);
  };

  const handleResetRequest = () => {
    setShowResetConfirm(true);
  };

  const performReset = () => {
    setShowResetConfirm(false);
    resetApp();
  };

  // Handle File Upload and Initial Processing
  const handleFileLoaded = async (name: string, content: string, skipRecommendations: boolean) => {
    console.log(`File loaded: ${name}. AI Recommendations enabled: ${!skipRecommendations}`);
    
    setFileName(name);
    setXmlContent(content);
    setError(null);
    setStep('ANNOTATE');
    setIsProcessing(true);
    setLoadingMsg('Parsing EML structure...');

    // 1. Parse XML
    try {
      // Simulate small delay for UX
      await new Promise(r => setTimeout(r, 500));
      const parsedElements = emlParser.parse(content);
      setElements(parsedElements);

      let recommendationsMap: Map<string, OntologyTerm[]> = new Map();

      if (!skipRecommendations) {
          console.log('Initiating recommendation request to backend...');
          setLoadingMsg('Consulting Knowledge Base (AI)...');
          // 2. Fetch Recommendations from Backend
          recommendationsMap = await geminiService.getRecommendations(parsedElements);
          console.log(`Received recommendations for ${recommendationsMap.size} elements`);
      } else {
          console.log('Skipping AI recommendations per user selection.');
      }
      
      // 3. Merge Recommendations
      const enrichedElements = parsedElements.map(el => {
        const recs = recommendationsMap.get(el.id) || [];
        return {
          ...el,
          recommendedAnnotations: recs,
          // If no existing annotation but we have a high confidence rec, 
          // we could auto-approve, but requirements say "Recommendation Adoption" by user.
          // So we leave status as PENDING or APPROVED if it already had existing ones.
        };
      });

      setElements(enrichedElements);

    } catch (e: any) {
      console.error("Error in processing pipeline:", e);
      setError(e.message || "Error processing file.");
      setStep('UPLOAD');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadExample = (skipRecommendations: boolean) => {
      // Load example data respecting the user's toggle choice
      console.log("Loading example data...");
      handleFileLoaded('example_eml.xml', EXAMPLE_EML_XML, skipRecommendations);
  };

  const handleUpdateElement = (id: string, updates: Partial<AnnotatableElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleExportClick = () => {
    setStep('EXPORT');
    setExportReady(true);
  };

  const downloadFile = () => {
    const finalXml = emlParser.exportXml(xmlContent, elements);
    const blob = new Blob([finalXml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotated_${fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout step={step}>
      {step === 'UPLOAD' && (
         <div className="h-full flex flex-col items-center justify-center">
             <FileUpload 
               onFileLoaded={handleFileLoaded} 
               onLoadExample={handleLoadExample}
               error={error}
             />
             {/* Note: Removed API key check as we now use backend */}
         </div>
      )}

      {step === 'ANNOTATE' && (
        isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
             <div className="text-xl font-medium text-slate-700">{loadingMsg}</div>
             <p className="text-slate-400">This might take a moment depending on file size.</p>
          </div>
        ) : (
          <AnnotationEditor 
            elements={elements} 
            onUpdateElement={handleUpdateElement} 
            onExport={handleExportClick}
          />
        )
      )}

      {step === 'EXPORT' && (
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Annotation Complete!</h2>
            <p className="text-slate-500 mb-8">
              Your EML file has been enriched with semantic annotations.{' '} 
              {elements.filter(e => e.status === 'APPROVED').length} elements annotated.
            </p>

            <div className="flex justify-center gap-4">
              <button 
                onClick={downloadFile}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="w-5 h-5 mr-2" />
                Download EML
              </button>
              
              <button 
                onClick={handleResetRequest}
                className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Annotate Another File
              </button>
            </div>
            
             <button 
              onClick={() => setStep('ANNOTATE')}
              className="mt-8 text-sm text-slate-400 hover:text-indigo-600 underline"
            >
              Back to editing
            </button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2.5 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Start New Annotation?</h3>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Are you sure you want to upload a new file? Make sure you have downloaded your current annotated EML file, or your changes will be lost.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={performReset}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm"
                  >
                    Yes, Start New
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}