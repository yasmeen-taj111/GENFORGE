import React, { useState, useEffect } from 'react';
import useResumeStore from '../store/resumeStore';
import { AlertCircle, CheckCircle2, ChevronLeft, RefreshCw, Sparkles } from 'lucide-react';

export const JDIntelligence = ({ onBack }) => {
  const { masterProfile, fetchMasterProfile, jdAnalysis, analyzeJD, loading } = useResumeStore();
  const [jdText, setJdText] = useState('');

  useEffect(() => {
    fetchMasterProfile();
  }, [fetchMasterProfile]);

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;
    await analyzeJD(jdText);
  };

  // Check if a skill exists in the user's master profile
  const checkProfileHasSkill = (skillName) => {
    if (!masterProfile || !masterProfile.skills) return false;
    const allMasterSkills = [
      ...(masterProfile.skills.languages || []),
      ...(masterProfile.skills.frameworks || []),
      ...(masterProfile.skills.libraries || []),
      ...(masterProfile.skills.databases || []),
      ...(masterProfile.skills.cloud || []),
      ...(masterProfile.skills.devops || []),
      ...(masterProfile.skills.tools || []),
      ...(masterProfile.skills.softSkills || [])
    ].map(s => s.toLowerCase());

    return allMasterSkills.includes(skillName.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Editor
        </button>
        <h2 className="text-sm font-bold text-slate-900">JD Intelligence Workspace</h2>
        <div className="w-16" /> {/* Spacer */}
      </nav>

      <div className="max-w-4xl mx-auto px-6 mt-8 flex flex-col gap-6">
        
        {/* Input box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
            Target Job Description Text
          </label>
          <textarea
            className="w-full h-40 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none transition"
            placeholder="Paste the job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !jdText.trim()}
            className="w-full mt-3 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing Job Description...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Job Description
              </>
            )}
          </button>
        </div>

        {/* Display Results */}
        {jdAnalysis ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Job Title: {jdAnalysis.title}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Below are the requirements matched against your master profile.</p>
            </div>

            {/* Matching Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Required Skills Match */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-600 mb-3 border-b pb-1.5 uppercase tracking-wider">Required Skills</h4>
                <div className="space-y-2">
                  {jdAnalysis.requiredSkills?.map((skill, idx) => {
                    const matched = checkProfileHasSkill(skill);
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700">{skill}</span>
                        {matched ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not found in profile</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technologies Match */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-600 mb-3 border-b pb-1.5 uppercase tracking-wider">Technologies Mentioned</h4>
                <div className="space-y-2">
                  {jdAnalysis.technologies?.map((tech, idx) => {
                    const matched = checkProfileHasSkill(tech);
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700">{tech}</span>
                        {matched ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not found in profile</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Other details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              {/* Responsibilities */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Responsibilities</h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 leading-normal">
                  {jdAnalysis.responsibilities?.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Experience and Education */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Experience Level</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{jdAnalysis.experienceRequirements || 'Not explicitly mentioned.'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Education Required</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{jdAnalysis.educationRequirements || 'Not explicitly mentioned.'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider font-sans">Soft Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {jdAnalysis.softSkills?.map((skill, i) => (
                      <span key={i} className="text-[10px] font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Important keywords */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">ATS Key Terms / Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {jdAnalysis.keywords?.map((word, i) => (
                  <span key={i} className="text-[10px] font-medium bg-slate-900 border border-slate-800 text-white px-2.5 py-0.5 rounded-md">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-xs">
            <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
            <h3 className="text-xs font-bold text-slate-700">No JD Analyzed</h3>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed px-4">
              Paste your target job description details in the panel above and run AI analysis to discover the requirements matching layout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
