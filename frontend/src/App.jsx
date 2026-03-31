import React, { useState, useMemo } from 'react';
import { 
  Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, 
  ChevronDown, ChevronUp, LayoutDashboard, KeyRound, BarChart2,
  Settings, Download, Grid
} from 'lucide-react';

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Grading', icon: LayoutDashboard },
    { id: 'keys', label: 'Answer Keys', icon: KeyRound },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className="w-64 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800/60 p-6 flex flex-col h-screen fixed left-0 top-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black text-xl">
          O
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">OMR<span className="text-zinc-500">Scan</span></h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              activeTab === tab.id 
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-zinc-800/60">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all text-sm font-medium">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </div>
  );
}

function AnswerKeyEditor({ visualKey, setVisualKey }) {
  const [numQuestions, setNumQuestions] = useState(visualKey ? Object.keys(visualKey).length : 10);
  
  const handleSelect = (qIdx, optIdx) => {
    setVisualKey(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const currentQuestions = useMemo(() => {
    return Array.from({ length: numQuestions }, (_, i) => i);
  }, [numQuestions]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-zinc-100">
      <div className="flex items-center justify-between mb-8">
         <div>
            <h2 className="text-3xl font-bold text-white mb-2">Visual Key Editor</h2>
            <p className="text-zinc-400">Click the correct options to build your digital answer key.</p>
         </div>
         <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
            <span className="text-sm text-zinc-400 pl-2">Questions:</span>
            <input 
              type="number" 
              min="1" max="100" 
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="bg-zinc-800 text-white border-none rounded-lg w-16 px-2 py-1 focus:ring-2 focus:ring-indigo-500"
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentQuestions.map(qIdx => (
          <div key={qIdx} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
            <span className="font-semibold text-zinc-300 w-8">Q{qIdx + 1}</span>
            <div className="flex gap-2">
              {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                const isSelected = visualKey && visualKey[qIdx] === optIdx;
                return (
                  <button
                    key={letter}
                    onClick={() => handleSelect(qIdx, optIdx)}
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] border-2 border-emerald-400' 
                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white border-2 border-zinc-700'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {Object.keys(visualKey || {}).length > 0 && (
         <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-between">
           <span>You have set {Object.keys(visualKey).length} answers in the active visual key.</span>
           <span className="text-xs uppercase tracking-wider font-bold">Key is Active</span>
         </div>
      )}
    </div>
  );
}

function AnalyticsDashboard({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
        <BarChart2 className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium text-zinc-400">No Analytics Yet</h2>
        <p>Grade a batch of OMR sheets to see class performance.</p>
      </div>
    );
  }

  // Calculate stats
  const successfulGrades = results.filter(r => r.success && r.data);
  const scores = successfulGrades.map(r => r.data.score);
  const maxPossible = successfulGrades[0]?.data?.max_score || 1;
  const avg = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
  const highest = Math.max(...scores, 0);
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;

  // Distribution
  const dist = { "Fail (<60%)": 0, "Pass (60-80%)": 0, "Excel (>80%)": 0 };
  scores.forEach(s => {
     const pct = s / maxPossible;
     if (pct < 0.6) dist["Fail (<60%)"]++;
     else if (pct <= 0.8) dist["Pass (60-80%)"]++;
     else dist["Excel (>80%)"]++;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Class Analytics</h2>
          <p className="text-zinc-400">Performance breakdown for the latest batch of {successfulGrades.length} students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Average Score</p>
          <div className="text-4xl font-black text-white">{avg.toFixed(1)} <span className="text-lg font-medium text-zinc-500">/ {maxPossible}</span></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Highest Score</p>
          <div className="text-4xl font-black text-emerald-400">{highest} <span className="text-lg font-medium text-emerald-700">/ {maxPossible}</span></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Lowest Score</p>
          <div className="text-4xl font-black text-red-400">{lowest} <span className="text-lg font-medium text-red-700">/ {maxPossible}</span></div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
         <h3 className="text-lg font-semibold text-white mb-6">Score Distribution</h3>
         <div className="space-y-6">
            {Object.entries(dist).map(([label, count]) => {
              const rectWidth = scores.length > 0 ? (count / scores.length) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-zinc-300">{label}</span>
                    <span className="text-zinc-500">{count} students ({rectWidth.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${label.includes('Pass') ? 'bg-indigo-500' : label.includes('Excel') ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${rectWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [images, setImages] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [visualKey, setVisualKey] = useState({});
  const [useVisualKey, setUseVisualKey] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files) setImages(Array.from(e.target.files));
  };
  const handleCsvChange = (e) => {
    if (e.target.files && e.target.files.length > 0) setCsvFile(e.target.files[0]);
  };

  const getOptionLetter = (idx) => {
    if (idx === -1) return "MULTI";
    if (idx === null || idx === undefined || idx < 0) return "-";
    return String.fromCharCode(65 + idx);
  };

  const gradeExams = async () => {
    if (images.length === 0) {
      setError("Please upload at least one image.");
      return;
    }
    if (!useVisualKey && !csvFile) {
       setError("Please upload a CSV answer key, or toggle to Use Visual Key.");
       return;
    }
    if (useVisualKey && Object.keys(visualKey).length === 0) {
       setError("Visual key is empty. Create one in the Answer Keys tab.");
       return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    images.forEach(img => formData.append("images", img));

    if (useVisualKey) {
       formData.append("answer_key_json", JSON.stringify(visualKey));
    } else {
       formData.append("answer_key_csv", csvFile);
    }

    try {
      const response = await fetch("http://localhost:8000/grade-omr-bulk/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to grade exams.");
      }

      const data = await response.json();
      setResults(data.batch_results);
      setExpandedRow(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!results) return;
    const rows = [["Filename", "Score", "Max Score", "Success", "Error"]];
    results.forEach(r => {
      rows.push([
        r.filename, 
        r.success ? r.data.score : 0, 
        r.success ? r.data.max_score : 0, 
        r.success, 
        r.error || ""
      ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "omr_grading_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-10 max-w-6xl">
        
        {activeTab === 'keys' && (
          <AnswerKeyEditor visualKey={visualKey} setVisualKey={setVisualKey} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard results={results} />
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Grading Dashboard</h1>
              <p className="text-zinc-400">Initiate bulk scanning and grading here.</p>
            </header>

            {/* Config & Upload Section */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Answer Key Config */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-400" />
                    1. Answer Key
                  </h2>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={useVisualKey} onChange={() => setUseVisualKey(!useVisualKey)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${useVisualKey ? 'bg-indigo-500' : 'bg-zinc-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useVisualKey ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-zinc-300">
                      Use Visual Key
                    </div>
                  </label>
                </div>
                
                {useVisualKey ? (
                  <div className="flex-1 rounded-xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center justify-center p-8 text-center text-indigo-200">
                    <Grid className="w-8 h-8 opacity-50 mb-3" />
                    {Object.keys(visualKey).length > 0 ? (
                      <p className="font-medium">Using Visual Key with {Object.keys(visualKey).length} answers.</p>
                    ) : (
                      <p className="font-medium">No answers set. Go to Answer Keys tab to create it.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 relative group rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-zinc-800 hover:border-indigo-500/50 transition-all">
                    <input type="file" accept=".csv" onChange={handleCsvChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 mb-3 transition-colors" />
                    <span className="text-zinc-300 font-medium">{csvFile ? csvFile.name : "Drop CSV here or browse"}</span>
                  </div>
                )}
              </div>

              {/* OMR Sheets Upload */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  2. Student Sheets
                </h2>
                <div className="flex-1 relative group rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-zinc-800 hover:border-emerald-500/50 transition-all">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-8 h-8 text-zinc-500 group-hover:text-emerald-400 mb-3 transition-colors" />
                  <span className="text-zinc-300 font-medium">{images.length > 0 ? `${images.length} files selected` : "Drop images here or browse"}</span>
                  <span className="text-xs text-zinc-500 mt-1">Supports JPG, PNG</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="text-sm font-medium text-zinc-400">
                {images.length > 0 ? (
                  <span className="text-emerald-400 font-medium">Ready to process {images.length} files.</span>
                ) : "Awaiting files..."}
              </div>
              
              <button 
                disabled={loading || images.length === 0}
                onClick={gradeExams}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:text-white/30 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center gap-2 focus:ring-4 focus:ring-indigo-500/30"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Grading"}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 opacity-80 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="mt-12 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <h2 className="text-xl font-bold">Grading Results</h2>
                  <button onClick={downloadCsv} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white rounded-lg transition-colors border border-zinc-700">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
                
                <div className="grid gap-3">
                  {results.map((res, index) => (
                    <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
                      <div 
                        onClick={() => res.success && setExpandedRow(expandedRow === index ? null : index)}
                        className={`p-4 flex items-center justify-between ${res.success ? 'cursor-pointer hover:bg-zinc-800/50' : 'opacity-80'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${res.success ? 'bg-zinc-800 text-zinc-300' : 'bg-red-500/20 text-red-400'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{res.filename}</h3>
                            <p className="text-xs text-zinc-500">{res.success ? "Successfully Graded" : "Error Parsing"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {res.success ? (
                            <div className="text-right flex items-baseline gap-2">
                              <span className="text-2xl font-black text-white">{res.data.score}</span>
                              <span className="text-sm font-medium text-zinc-500">/ {res.data.max_score}</span>
                            </div>
                          ) : (
                            <div className="text-red-400 font-medium text-xs max-w-[200px] truncate" title={res.error}>
                              {res.error}
                            </div>
                          )}
                          {res.success && (
                            expandedRow === index ? <ChevronUp className="w-5 h-5 text-zinc-600" /> : <ChevronDown className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>
                      </div>

                      {expandedRow === index && res.success && (
                        <div className="border-t border-zinc-800 bg-zinc-950/50 p-6 animate-in slide-in-from-top-2 duration-200">
                           <h4 className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-4">Question Accuracy</h4>
                           <div className="flex flex-wrap gap-2">
                             {res.data.results.map((q, qIndex) => (
                               <div 
                                 key={qIndex} 
                                 title={`Selected: ${getOptionLetter(q.selected_option)}, Answer: ${getOptionLetter(q.correct_option)}`}
                                 className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                                   q.is_correct 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                 }`}
                               >
                                  <span className="text-xs font-bold w-5">Q{q.question_num}</span>
                                  {q.is_correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                               </div>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
