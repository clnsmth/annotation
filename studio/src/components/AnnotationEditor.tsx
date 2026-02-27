import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnnotatableElement, OntologyTerm, AnnotationStatus } from '../types';
import { Check, X, Plus, Search, Wand2, ExternalLink, ChevronRight, ChevronDown, Trophy, Sparkles, Lightbulb } from 'lucide-react';
import { SuggestTermModal } from './SuggestTermModal';

interface AnnotationEditorProps {
  elements: AnnotatableElement[];
  onUpdateElement: (id: string, updates: Partial<AnnotatableElement>) => void;
  onExport: () => void;
  onReset?: () => void; // Optional prop for future use or if passed by parent
}

const PROPERTY_SUGGESTIONS: Record<string, { label: string; uri: string }[]> = {
  DATASET: [
    { label: 'sameAs', uri: 'https://schema.org/sameAs' },
    { label: 'isBasedOn', uri: 'https://schema.org/isBasedOn' },
    { label: 'wasDerivedFrom', uri: 'http://www.w3.org/ns/prov#wasDerivedFrom' },
    { label: 'contains process', uri: 'http://purl.obolibrary.org/obo/BFO_0000067' },
    { label: 'is about', uri: 'http://purl.obolibrary.org/obo/IAO_0000136' }
  ],
  DATATABLE: [
    { label: 'sameAs', uri: 'https://schema.org/sameAs' },
    { label: 'isBasedOn', uri: 'https://schema.org/isBasedOn' },
    { label: 'wasDerivedFrom', uri: 'http://www.w3.org/ns/prov#wasDerivedFrom' }
  ],
  OTHERENTITY: [
    { label: 'sameAs', uri: 'https://schema.org/sameAs' },
    { label: 'isBasedOn', uri: 'https://schema.org/isBasedOn' },
    { label: 'wasDerivedFrom', uri: 'http://www.w3.org/ns/prov#wasDerivedFrom' }
  ],
  SPATIALRASTER: [
    { label: 'sameAs', uri: 'https://schema.org/sameAs' },
    { label: 'isBasedOn', uri: 'https://schema.org/isBasedOn' },
    { label: 'wasDerivedFrom', uri: 'http://www.w3.org/ns/prov#wasDerivedFrom' }
  ],
  SPATIALVECTOR: [
    { label: 'sameAs', uri: 'https://schema.org/sameAs' },
    { label: 'isBasedOn', uri: 'https://schema.org/isBasedOn' },
    { label: 'wasDerivedFrom', uri: 'http://www.w3.org/ns/prov#wasDerivedFrom' }
  ],
  ATTRIBUTE: [
    { label: 'contains measurements of type', uri: 'http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType' },
    { label: 'usesMethod', uri: 'http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#usesMethod' },
    { label: 'uses protocol', uri: 'http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#usesProtocol' }
  ],
  COVERAGE: [
    { label: 'broad-scale environmental context', uri: 'https://genomicsstandardsconsortium.github.io/mixs/0000012/' },
    { label: 'local environmental context', uri: 'https://genomicsstandardsconsortium.github.io/mixs/0000013/' }
  ]
};

// Helper hook for animating numbers
const useAnimatedNumber = (target: number, duration: number = 800) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startValue = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;
    
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Ease out expo function for snappy feel
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const nextValue = startValue.current + (target - startValue.current) * ease;
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target]);

  return Math.round(displayValue);
};

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ elements, onUpdateElement, onExport }) => {
  const [filter, setFilter] = useState('');
  const [groupBy, setGroupBy] = useState<'CONTEXT' | 'NAME'>('CONTEXT');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Suggest Term Modal State
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestModalLabel, setSuggestModalLabel] = useState('');

  const openSuggestModal = (label?: string) => {
    setSuggestModalLabel(label || '');
    setIsSuggestModalOpen(true);
  };

  // Group elements logic
  const groups = useMemo(() => {
    const grouped: Record<string, AnnotatableElement[]> = {};
    elements.forEach(el => {
      // Filter logic
      if (filter && !el.name.toLowerCase().includes(filter.toLowerCase()) && !el.description.toLowerCase().includes(filter.toLowerCase())) {
        return;
      }
      
      const key = groupBy === 'CONTEXT' ? el.context : el.name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(el);
    });
    return grouped;
  }, [elements, filter, groupBy]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Calculate stats: Percent Annotated (elements with > 0 annotations)
  const total = elements.length;
  const annotatedCount = elements.filter(e => e.currentAnnotations.length > 0).length;
  const rawProgress = total > 0 ? (annotatedCount / total) * 100 : 0;
  
  // Animated progress for display
  const displayProgress = useAnimatedNumber(rawProgress);
  
  // Determine styles based on progress
  let progressColor = 'bg-rose-500';
  let progressText = 'text-rose-600';
  let Icon = Sparkles;
  
  if (displayProgress >= 100) {
    progressColor = 'bg-emerald-500';
    progressText = 'text-emerald-600';
    Icon = Trophy;
  } else if (displayProgress >= 75) {
    progressColor = 'bg-indigo-500';
    progressText = 'text-indigo-600';
  } else if (displayProgress >= 40) {
    progressColor = 'bg-amber-500';
    progressText = 'text-amber-600';
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
            <input 
              type="text" 
              placeholder="Search elements..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 border border-indigo-500/30 rounded-lg text-sm bg-slate-800 text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 placeholder:text-indigo-300/50 transition-all"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setGroupBy('CONTEXT')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${groupBy === 'CONTEXT' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Group by Entity
            </button>
            <button 
              onClick={() => setGroupBy('NAME')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${groupBy === 'NAME' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Group by Name
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Gamified Progress Bar */}
          <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <div className={`flex flex-col items-end min-w-[3rem] ${progressText} transition-colors duration-500`}>
              <span className="text-lg font-bold leading-none">{displayProgress}%</span>
              <span className="text-[10px] font-semibold opacity-70 uppercase tracking-wider">Annotated</span>
            </div>
            
            <div className="w-32 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner relative">
              {/* Background stripe effect for movement feel */}
              <div 
                className={`h-full ${progressColor} transition-all duration-300 ease-out relative`} 
                style={{ width: `${displayProgress}%` }} 
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%]"></div>
              </div>
            </div>

            {displayProgress === 100 && (
              <div className="animate-in zoom-in spin-in-12 duration-500">
                <Icon className={`w-6 h-6 ${progressText} drop-shadow-sm`} />
              </div>
            )}
          </div>
          
          <button 
            onClick={onExport}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-transform active:scale-95"
          >
            Review & Export
          </button>
        </div>
      </div>

      {/* List Area */}
      <div className="space-y-6 pb-12">
        {Object.entries(groups).map(([groupName, groupElements]: [string, AnnotatableElement[]]) => {
          // Retrieve the description if we are grouping by Context (Entity)
          const contextDescription = groupBy === 'CONTEXT' ? groupElements[0]?.contextDescription : undefined;
          const isExpanded = !!expandedGroups[groupName];
          
          // Determine context tag
          let contextTypeTag = null;
          if (groupBy === 'CONTEXT' && groupElements.length > 0) {
              const types = new Set(groupElements.map(e => e.type));
              
              if (types.has('DATATABLE')) contextTypeTag = 'DATA TABLE';
              else if (types.has('OTHERENTITY')) contextTypeTag = 'OTHER ENTITY';
              else if (types.has('SPATIALRASTER')) contextTypeTag = 'SPATIAL RASTER';
              else if (types.has('SPATIALVECTOR')) contextTypeTag = 'SPATIAL VECTOR';
              else if (types.has('COVERAGE')) contextTypeTag = 'COVERAGE';
              else if (types.has('KEYWORD')) contextTypeTag = 'KEYWORD SET';
              else if (types.has('DATASET')) contextTypeTag = 'DATASET';
              else if (types.has('ATTRIBUTE')) contextTypeTag = 'DATA TABLE'; // Default fallback
          }

          return (
            // IMPORTANT: overflow-hidden removed to allow tooltips to popup
            <div key={groupName} className="bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-200">
               <button 
                 onClick={() => toggleGroup(groupName)}
                 className={`w-full bg-slate-50 px-6 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors focus:outline-none text-left ${!isExpanded ? 'rounded-xl border-b-0' : 'rounded-t-xl border-b border-slate-200'}`}
               >
                 <div className="flex-1 min-w-0 pr-4 flex items-start gap-3">
                   <div className="mt-1 text-slate-400">
                     {!isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-700 text-base">{groupName}</h3>
                          {contextTypeTag && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-white border border-slate-200 px-1.5 rounded shadow-sm">
                                  {contextTypeTag}
                              </span>
                          )}
                      </div>
                      {contextDescription && (
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-2xl" title={contextDescription}>{contextDescription}</p>
                      )}
                   </div>
                 </div>
                 <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full shrink-0 ml-2">
                   {groupElements.length} items
                 </span>
               </button>
               
               {isExpanded && (
                 <div className="divide-y divide-slate-100">
                   {groupElements.map((el, idx) => (
                     <div key={el.id} className={idx === groupElements.length - 1 ? 'rounded-b-xl' : ''}>
                       <AnnotationRow 
                         element={el} 
                         onUpdate={(updates) => onUpdateElement(el.id, updates)} 
                         onSuggestTerm={openSuggestModal}
                       />
                     </div>
                   ))}
                 </div>
               )}
            </div>
          );
        })}
        {Object.keys(groups).length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400">No elements found matching your filter.</p>
          </div>
        )}
      </div>

      <SuggestTermModal 
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        initialTermLabel={suggestModalLabel}
      />
    </div>
  );
};

// --- Sub-components for Row Logic ---

interface AnnotationRowProps {
  element: AnnotatableElement;
  onUpdate: (updates: Partial<AnnotatableElement>) => void;
  onSuggestTerm: (label?: string) => void;
}

const AnnotationRow: React.FC<AnnotationRowProps> = ({ element, onUpdate, onSuggestTerm }) => {
  // State for manual entry form - DEFAULTS REMOVED
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customUri, setCustomUri] = useState('');
  const [customPropLabel, setCustomPropLabel] = useState('');
  const [customPropUri, setCustomPropUri] = useState('');

  const suggestions = PROPERTY_SUGGESTIONS[element.type] || [];

  /**
   * Logs selection behavior to the server
   */
  const logSelection = (selected: OntologyTerm, allRecommendations: OntologyTerm[]) => {
    const ignored = allRecommendations.filter(r => r.uri !== selected.uri);
    
    const logData = {
      request_id: selected.request_id, // Top-level key, retrieved from selected recommendation
      event_id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      element_id: element.id,
      element_name: element.name,
      element_type: element.type,
      selected: {
        label: selected.label,
        uri: selected.uri,
        property_label: selected.propertyLabel,
        property_uri: selected.propertyUri,
        confidence: selected.confidence
      },
      not_selected: ignored.map(r => ({
        label: r.label,
        uri: r.uri,
        property_label: r.propertyLabel,
        property_uri: r.propertyUri,
        confidence: r.confidence
      }))
    };

    const blob = new Blob([JSON.stringify(logData)], { type: 'application/json' });
    navigator.sendBeacon('http://localhost:8000/api/log-selection', blob);
  };

  const addAnnotation = (term: OntologyTerm) => {
    // Avoid dupes
    if (element.currentAnnotations.some(a => a.uri === term.uri && a.propertyUri === term.propertyUri)) return;
    onUpdate({
      currentAnnotations: [...element.currentAnnotations, term],
      status: AnnotationStatus.APPROVED
    });
  };

  const removeAnnotation = (uri: string) => {
    const annotationToRemove = element.currentAnnotations.find(a => a.uri === uri);
    const nextCurrent = element.currentAnnotations.filter(a => a.uri !== uri);
    
    let nextRecommended = element.recommendedAnnotations;

    // Check if we need to preserve this as a recommendation (e.g. mistakenly removed)
    if (annotationToRemove) {
        const alreadyExists = element.recommendedAnnotations.some(r => r.uri === uri);
        if (!alreadyExists) {
            // Add to recommendations list so user can re-select it
            nextRecommended = [annotationToRemove, ...element.recommendedAnnotations];
        }
    }

    onUpdate({
      currentAnnotations: nextCurrent,
      recommendedAnnotations: nextRecommended,
      status: nextCurrent.length === 0 ? AnnotationStatus.PENDING : AnnotationStatus.APPROVED
    });
  };

  const acceptRecommendation = (rec: OntologyTerm) => {
    // Log the behavior
    logSelection(rec, element.recommendedAnnotations);
    
    // Add the annotation
    addAnnotation(rec);
  };

  const handleSaveCustom = () => {
    if (!customLabel.trim() || !customUri.trim()) return;

    // Use defaults if property fields are left blank but user saves (though button is disabled)
    const finalPropLabel = customPropLabel.trim() || 'contains';
    const finalPropUri = customPropUri.trim() || 'http://www.w3.org/ns/oa#hasBody';

    addAnnotation({
      label: customLabel.trim(),
      uri: customUri.trim(),
      ontology: 'User Defined',
      confidence: 1.0,
      description: 'Manually added annotation',
      propertyLabel: finalPropLabel,
      propertyUri: finalPropUri
    });

    // Reset and close
    setCustomLabel('');
    setCustomUri('');
    setCustomPropLabel('');
    setCustomPropUri('');
    setIsAddingCustom(false);
  };

  return (
    <div className={`p-6 transition-colors ${element.status === AnnotationStatus.APPROVED ? 'bg-white' : 'bg-slate-50/50'}`}>
      <div className="flex items-start gap-6">
        {/* Element Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <h4 className="text-sm font-bold text-slate-900 truncate" title={element.name}>{element.name}</h4>
             <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 border border-slate-200 px-1.5 rounded">{element.type}</span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2" title={element.description}>{element.description || 'No description provided'}</p>
        </div>

        {/* Current Annotations (Selected) */}
        <div className="flex-1 min-w-0">
           <div className="space-y-2">
             {element.currentAnnotations.length === 0 ? (
               <div className="text-xs text-slate-400 italic py-1">No annotations assigned</div>
             ) : (
               element.currentAnnotations.map((anno, idx) => (
                 <div key={idx} className="relative group/tooltip">
                   <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-md px-3 py-1.5 group cursor-help">
                     <div className="overflow-hidden flex items-baseline gap-2">
                       <span className="text-[10px] uppercase font-bold text-emerald-600/70 tracking-tight">{anno.propertyLabel || 'contains'}</span>
                       <span className="text-xs font-semibold text-emerald-800 truncate">{anno.label}</span>
                     </div>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         removeAnnotation(anno.uri);
                       }}
                       className="ml-2 text-emerald-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 relative"
                       title="Remove annotation"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                   <InfoTooltip term={anno} />
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Recommendations Area */}
        <div className="flex-1 min-w-0 border-l border-slate-100 pl-6">
           <div className="space-y-2">
             {/* Show "No AI suggestions" for all types including DATASET if no recs found */}
             {element.recommendedAnnotations.length === 0 && !isAddingCustom && (
               <div className="flex items-center text-xs text-slate-400 py-1">
                 <span>No AI suggestions</span>
               </div>
             )}
             
             {element.recommendedAnnotations.map((rec, idx) => {
                 const isApplied = element.currentAnnotations.some(a => a.uri === rec.uri);
                 if (isApplied) return null; // Don't show if already applied

                 return (
                   <div key={idx} className="relative group/tooltip">
                     <div className="flex items-center justify-between bg-white border border-indigo-100 rounded-md px-3 py-1.5 shadow-sm hover:border-indigo-300 transition-colors cursor-help">
                       <div className="overflow-hidden flex items-baseline gap-2">
                         <span className="text-[10px] uppercase font-bold text-indigo-400/70 tracking-tight">{rec.propertyLabel || 'contains'}</span>
                         <span className="text-xs font-semibold text-indigo-900 truncate">{rec.label}</span>
                         <Wand2 className="w-3 h-3 text-indigo-400 ml-auto shrink-0" />
                       </div>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           acceptRecommendation(rec);
                         }}
                         className="ml-2 p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-colors z-10 relative"
                         title="Accept Recommendation"
                       >
                         <Plus className="w-3 h-3" />
                       </button>
                     </div>
                     <InfoTooltip term={rec} />
                   </div>
                 );
               })}
             
             {/* Manual Add Form */}
             {isAddingCustom ? (
                <div className="mt-2 bg-white border border-indigo-200 rounded-lg p-3 shadow-sm animate-in fade-in slide-in-from-top-1 w-full max-w-sm">
                   
                   {/* Property Section */}
                   <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Property</span>
                        {suggestions.length > 0 && (
                          <select 
                            className="text-[10px] border border-slate-200 bg-slate-50 rounded text-slate-600 focus:ring-1 focus:ring-indigo-500 cursor-pointer py-0.5 pl-2 pr-6 outline-none"
                            onChange={(e) => {
                              const selected = suggestions.find(s => s.uri === e.target.value);
                              if (selected) {
                                setCustomPropLabel(selected.label);
                                setCustomPropUri(selected.uri);
                              }
                            }}
                            value=""
                          >
                            <option value="" disabled>Quick Select...</option>
                            {suggestions.map(s => (
                              <option key={s.uri} value={s.uri}>{s.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="space-y-1">
                         <input 
                           type="text" 
                           value={customPropLabel}
                           onChange={(e) => setCustomPropLabel(e.target.value)}
                           placeholder="Property Label"
                           className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
                         />
                         <input 
                           type="text" 
                           value={customPropUri}
                           onChange={(e) => setCustomPropUri(e.target.value)}
                           placeholder="Property URI"
                           className="w-full text-[10px] font-mono text-indigo-600 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:border-indigo-500 outline-none placeholder:text-indigo-200"
                         />
                      </div>
                   </div>

                   {/* Visual Divider */}
                   <div className="h-px bg-slate-100 w-full mb-3" />

                   {/* Value Section */}
                   <div className="mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Value</span>
                      <div className="space-y-1">
                         <input 
                           type="text" 
                           value={customLabel}
                           onChange={(e) => setCustomLabel(e.target.value)}
                           placeholder="Annotation Label"
                           className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
                           autoFocus
                         />
                         <input 
                           type="text" 
                           value={customUri}
                           onChange={(e) => setCustomUri(e.target.value)}
                           placeholder="Annotation URI"
                           className="w-full text-[10px] font-mono text-indigo-600 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:border-indigo-500 outline-none placeholder:text-indigo-200"
                         />
                      </div>
                   </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <button 
                      onClick={() => onSuggestTerm(customLabel)}
                      className="text-[10px] font-medium text-indigo-500 hover:text-indigo-700 hover:underline flex items-center gap-1"
                      title="Propose a new term if you can't find one"
                    >
                      <Lightbulb className="w-3 h-3" />
                      Suggest New Term
                    </button>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsAddingCustom(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveCustom}
                        disabled={!customLabel || !customUri || !customPropLabel || !customPropUri}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                </div>
             ) : (
                <div className="pt-2">
                  <button 
                    onClick={() => setIsAddingCustom(true)}
                    className="text-[10px] font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors group"
                  >
                    <div className="bg-slate-100 group-hover:bg-indigo-50 rounded p-0.5 transition-colors">
                      <Plus className="w-3 h-3" /> 
                    </div>
                    Add Custom Annotation
                  </button>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

// Tooltip Component
const InfoTooltip: React.FC<{ term: OntologyTerm }> = ({ term }) => (
  <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 w-80 pb-3 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 ease-out pointer-events-none group-hover/tooltip:pointer-events-auto">
    <div className="bg-slate-800 text-white text-xs rounded-lg shadow-xl p-4 relative ring-1 ring-black/5 flex flex-col gap-4">
      
      {/* Property Section */}
      <div>
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Property</span>
         <div className="font-bold text-slate-200 text-sm mb-0.5">
           {term.propertyLabel || 'contains'}
         </div>
         <a 
            href={term.propertyUri || '#'} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline break-all block"
          >
            {term.propertyUri || 'http://www.w3.org/ns/oa#hasBody'}
          </a>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700/50 w-full" />

      {/* Value Section */}
      <div>
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Value</span>
         <div className="font-bold text-slate-200 text-sm mb-0.5 flex items-center justify-between">
           <span>{term.label}</span>
           <span className="text-[10px] font-normal text-slate-500 border border-slate-600 px-1 rounded">{term.ontology}</span>
         </div>
         <a 
            href={term.uri} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline break-all block mb-2"
          >
            {term.uri}
          </a>
         
         {term.description && (
           <div className="text-slate-400 leading-relaxed bg-slate-900/30 p-2 rounded border border-slate-700/50">
             {term.description}
           </div>
         )}
      </div>
      
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -ml-2 -mt-[1px] border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);