import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

function App() {
  const [images, setImages] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleCsvChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const gradeExams = async () => {
    if (images.length === 0 || !csvFile) {
      setError("Please upload at least one image and a CSV answer key.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append("answer_key_csv", csvFile);
    images.forEach(img => {
      formData.append("images", img);
    });

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Helper to map 0,1,2,3 to A,B,C,D
  const getOptionLetter = (idx) => {
    if (idx === null || idx === undefined || idx < 0) return "-";
    return String.fromCharCode(65 + idx);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-6 selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-gray-800 pb-6 mb-8 text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">OMR Scanner</h1>
          <p className="text-gray-400 text-lg">Intelligent bulk grading for bubble sheets.</p>
        </header>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Answer Key Upload */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-colors">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              1. Master Answer Key (CSV)
            </h2>
            <div className="relative group rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/30 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-gray-800/50 hover:border-indigo-500/50 transition-all">
              <input type="file" accept=".csv" onChange={handleCsvChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 mb-3 transition-colors" />
              <span className="text-gray-300 font-medium">{csvFile ? csvFile.name : "Drop CSV here or browse"}</span>
              <span className="text-xs text-gray-500 mt-1">Required format: QuestionNum, Option (1, A)</span>
            </div>
          </div>

          {/* OMR Sheets Upload */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-colors">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              2. Student Sheets (Images)
            </h2>
            <div className="relative group rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/30 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-gray-800/50 hover:border-emerald-500/50 transition-all">
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-emerald-400 mb-3 transition-colors" />
              <span className="text-gray-300 font-medium">{images.length > 0 ? `${images.length} files selected` : "Drop images here or browse"}</span>
              <span className="text-xs text-gray-500 mt-1">Supports JPG, PNG</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
          <div className="text-gray-400 text-sm flex-1">
            Status: {images.length > 0 && csvFile ? <span className="text-emerald-400 font-medium">Ready to grade {images.length} sheets!</span> : <span>Awaiting inputs...</span>}
          </div>
          
          <button 
            disabled={loading || images.length === 0 || !csvFile}
            onClick={gradeExams}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-indigo-500/30"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Grade Exams"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results Dashboard */}
        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Results Dashboard
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full">{results.length} processed</span>
            </h2>
            
            <div className="grid gap-4">
              {results.map((res, index) => (
                <div key={index} className="bg-gray-800/40 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-colors">
                  
                  {/* Summary Row (Clickable) */}
                  <div 
                    onClick={() => toggleRow(index)}
                    className="p-5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{res.filename}</h3>
                        <p className="text-sm text-gray-400">{res.success ? "Processed Successfully" : "Failed processing"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {res.success ? (
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">{res.data.score}</span>
                          <span className="text-gray-500 font-medium"> / {res.data.max_score}</span>
                        </div>
                      ) : (
                        <div className="text-red-400 font-medium text-sm max-w-[200px] truncate" title={res.error}>
                          {res.error}
                        </div>
                      )}
                      
                      {expandedRow === index ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {expandedRow === index && res.success && (
                    <div className="border-t border-gray-700/50 bg-gray-800/20 p-6 animate-in slide-in-from-top-2 duration-200">
                       <h4 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Question Breakdown</h4>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                         {res.data.results.map((q, qIndex) => (
                           <div 
                             key={qIndex} 
                             className={`flex items-center justify-between p-3 rounded-lg border ${
                               q.is_correct 
                                ? "bg-emerald-500/10 border-emerald-500/20" 
                                : "bg-red-500/10 border-red-500/20"
                             }`}
                           >
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-semibold uppercase">Q{q.question_num}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`font-bold ${q.is_correct ? "text-emerald-300" : "text-red-300"}`}>
                                    {getOptionLetter(q.selected_option)}
                                  </span>
                                  {!q.is_correct && (
                                    <span className="text-xs text-gray-500 line-through ml-1">{getOptionLetter(q.correct_option)}</span>
                                  )}
                                </div>
                              </div>
                              {q.is_correct ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500/70" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500/70" />
                              )}
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
    </div>
  );
}

export default App;
