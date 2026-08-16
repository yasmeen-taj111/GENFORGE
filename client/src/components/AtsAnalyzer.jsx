import React, { useEffect, useState } from 'react';
import useResumeStore from '../store/resumeStore';
import { AlertCircle, CheckCircle, HelpCircle, RefreshCw, Sparkles, XCircle } from 'lucide-react';

export const AtsAnalyzer = () => {
  const { currentResume, atsAnalysis, analyzeATS, loading } = useResumeStore();
  const [jdText, setJdText] = useState(currentResume?.jobDescription?.descriptionText || '');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const savedJd = currentResume?.jobDescription?.descriptionText || '';
    if (savedJd) setJdText(savedJd);
  }, [currentResume?.jobDescription?.descriptionText]);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    setAnalyzing(true);
    await analyzeATS(currentResume._id, jdText);
    setAnalyzing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 border-emerald-200 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 border-amber-200 bg-amber-50';
    return 'text-rose-600 border-rose-200 bg-rose-50';
  };

  const getScoreProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-600';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-y-auto p-6 font-sans">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
        <h2 className="text-lg font-bold text-slate-800">ATS Engine & Scorecard</h2>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Active Job Description (for analysis)
        </label>
        <textarea
          className="w-full h-32 text-xs border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
          placeholder="Paste the target job description here..."
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || analyzing || !jdText.trim()}
          className="w-full mt-2 py-2 px-4 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading || analyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Calculating ATS Compatibility...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Run ATS Analysis
            </>
          )}
        </button>
      </div>

      {atsAnalysis ? (
        <div className="flex flex-col gap-6">
          {/* Main Score Circular Gauge */}
          <div className="flex items-center gap-5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold text-xl shrink-0 ${getScoreColor(atsAnalysis.overallScore)}`}>
              <span>{atsAnalysis.overallScore}</span>
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">/ 100</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">ATS Grade</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                This is a transparent, deterministic comparison of the resume and the pasted job description. It is a guide, not a hiring guarantee.
              </p>
            </div>
          </div>

          {/* Metric Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Metric Breakdown</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Keyword Match', score: atsAnalysis.breakdown.keywordMatch.score, max: atsAnalysis.breakdown.keywordMatch.max, desc: 'Exact matches of key skills and titles' },
                { label: 'JD Relevance', score: atsAnalysis.breakdown.jdRelevance.score, max: atsAnalysis.breakdown.jdRelevance.max, desc: 'Coverage of job-description requirements' },
                { label: 'Experience Relevance', score: atsAnalysis.breakdown.experienceRelevance.score, max: atsAnalysis.breakdown.experienceRelevance.max, desc: 'Relevance of achievements/responsibilities' },
                { label: 'Skills Coverage', score: atsAnalysis.breakdown.skillsCoverage.score, max: atsAnalysis.breakdown.skillsCoverage.max, desc: 'Ratio of must-have skills present' },
                { label: 'Formatting Check', score: atsAnalysis.breakdown.formatting.score, max: atsAnalysis.breakdown.formatting.max, desc: 'Presence of summary, bullets, and contacts' },
                { label: 'Completeness', score: atsAnalysis.breakdown.completeness.score, max: atsAnalysis.breakdown.completeness.max, desc: 'Filled sections out of standard layout' }
              ].map((metric, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>{metric.label}</span>
                    <span className="font-bold text-slate-900">{metric.score} / {metric.max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(metric.score / metric.max) * 100}%` }}
                      className={`h-full rounded-full ${getScoreProgressColor((metric.score / metric.max) * 100)}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{metric.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword analysis gaps */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Keyword Analysis</h3>
            <div className="flex flex-col gap-4">
              {/* Strong Matches */}
              {atsAnalysis.keywordsAnalysis.strongMatches?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Strong Matches ({atsAnalysis.keywordsAnalysis.strongMatches.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.keywordsAnalysis.strongMatches.map((kw, i) => (
                      <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Underrepresented */}
              {atsAnalysis.keywordsAnalysis.underrepresented?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Underrepresented ({atsAnalysis.keywordsAnalysis.underrepresented.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.keywordsAnalysis.underrepresented.map((kw, i) => (
                      <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing */}
              {atsAnalysis.keywordsAnalysis.missing?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 mb-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Missing ({atsAnalysis.keywordsAnalysis.missing.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {atsAnalysis.keywordsAnalysis.missing.map((kw, i) => (
                      <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-[10px] text-slate-500 leading-normal">
                    <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-700">Safety Tip:</strong> These keywords appear in the JD but were not found in your resume. Add them <strong>only</strong> if you genuinely possess these skills.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-xl">
          <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
          <h4 className="text-xs font-bold text-slate-700">No Analysis Done Yet</h4>
          <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed px-4">
            Enter a Job Description above and click "Run ATS Analysis" to evaluate your resume compliance scores.
          </p>
        </div>
      )}
    </div>
  );
};
