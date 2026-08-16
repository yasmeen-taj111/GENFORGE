import React, { useState, useEffect } from 'react';
import useResumeStore from '../store/resumeStore';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Copy,
  Calendar,
  Sparkles,
  Search,
  Edit,
  FolderOpen,
  LogOut,
  UserCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const Dashboard = ({ onNavigate, onEditResume }) => {
  const { user, logout } = useAuthStore();
  const {
    resumes,
    fetchResumes,
    createResume,
    deleteResume,
    duplicateResume,
    uploadResumeFile,
    loading
  } = useResumeStore();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Create state
  const [newResumeName, setNewResumeName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [useMaster, setUseMaster] = useState(true);

  // Upload/Verification State
  const [uploadFile, setUploadFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResumeName, setVerificationResumeName] = useState('');
  const [resumePendingDeletion, setResumePendingDeletion] = useState(null);
  const notify = useNotificationStore((state) => state.notify);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newResumeName.trim()) return;
    const resume = await createResume(newResumeName, targetRole, targetCompany, useMaster);
    if (resume) {
      setShowCreateModal(false);
      setNewResumeName('');
      setTargetRole('');
      setTargetCompany('');
      onEditResume(resume._id);
    }
  };

  const handleFileUploadChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx'].includes(extension)) {
        notify('Please select a PDF or DOCX resume.', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        notify('Please select a file smaller than 10 MB.', 'error');
        e.target.value = '';
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setVerifying(true);
    const parsed = await uploadResumeFile(uploadFile);
    setVerifying(false);
    if (parsed) {
      setParsedData(parsed);
      setVerificationResumeName(`${uploadFile.name.replace(/\.[^/.]+$/, "")} - Parsed`);
    }
  };

  const handleSaveParsed = async () => {
    if (!verificationResumeName.trim()) return;
    // Create new resume based on parsed structure
    const newResume = await createResume(verificationResumeName, parsedData.targetRole || '', '', false);
    if (newResume) {
      // Overwrite the details with parsed data
      const { updateResume } = useResumeStore.getState();
      const savedResume = await updateResume(newResume._id, {
        personalInfo: parsedData.personalInfo || {},
        summary: parsedData.summary || '',
        experiences: parsedData.experiences || [],
        projects: parsedData.projects || [],
        skills: parsedData.skills || {},
        education: parsedData.education || [],
        certifications: parsedData.certifications || [],
        achievements: parsedData.achievements || []
      }, { immediate: true });
      if (!savedResume) return;
      setShowUploadModal(false);
      setUploadFile(null);
      setParsedData(null);
      fetchResumes();
      notify(parsedData.parseSource === 'local-fallback' ? 'Your resume was imported with basic parsing. Review the fields before saving.' : 'Your parsed resume is ready to edit.');
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  const filteredResumes = resumes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.targetRole.toLowerCase().includes(search.toLowerCase()) ||
    r.targetCompany.toLowerCase().includes(search.toLowerCase())
  );

  // Statistics
  const resumeCount = resumes.length;
  const avgAts = resumes.filter(r => r.atsScore > 0).reduce((acc, curr) => acc + curr.atsScore, 0) / (resumes.filter(r => r.atsScore > 0).length || 1);
  const highestAts = resumes.reduce((max, r) => r.atsScore > max ? r.atsScore : max, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold">
            G
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">GenForge</h1>
            <p className="text-[10px] text-slate-500 font-medium">Forge a resume that fits the role.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Master Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Welcome message */}
        <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.name}!</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage and tailor your job applications from one centralized studio.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Plus className="w-4 h-4" />
              Create Resume
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Upload className="w-4 h-4" />
              Upload Resume
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Resumes</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{resumeCount} Versions</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Average ATS Score</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {avgAts > 1 ? `${Math.round(avgAts)}/100` : 'N/A'}
              </h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Highest ATS Score</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {highestAts > 0 ? `${highestAts}/100` : 'N/A'}
              </h3>
            </div>
          </div>
        </div>

        {/* Resumes List Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <h3 className="text-sm font-bold text-slate-800">My Customized Resumes</h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resumes..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredResumes.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700">No resumes found</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                {search ? 'No matches fit your search criteria.' : 'Create a tailored resume or upload an existing PDF/DOCX to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResumes.map(resume => (
                <div
                  key={resume._id}
                  className="group relative border border-slate-100 hover:border-slate-300 rounded-xl p-5 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition truncate max-w-[200px]">
                          {resume.name}
                        </h4>
                      </div>
                      {resume.atsScore > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">
                          ATS: {resume.atsScore}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                      {resume.targetRole && (
                        <p><strong>Target Role:</strong> {resume.targetRole}</p>
                      )}
                      {resume.targetCompany && (
                        <p><strong>Company:</strong> {resume.targetCompany}</p>
                      )}
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Last updated: {new Date(resume.updatedAt).toLocaleDateString()}
                      </p>
                      <p><strong>Template:</strong> <span className="capitalize">{resume.template}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 text-[11px]">
                    <button
                      onClick={() => onEditResume(resume._id)}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit & Tailor
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => duplicateResume(resume._id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setResumePendingDeletion(resume)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- CREATE RESUME MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              Create Custom Resume
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resume Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer - Google"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newResumeName}
                  onChange={e => setNewResumeName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineer"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Google"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={targetCompany}
                    onChange={e => setTargetCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="clone-master"
                  checked={useMaster}
                  onChange={e => setUseMaster(e.target.checked)}
                  className="w-4 h-4 accent-slate-900"
                />
                <label htmlFor="clone-master" className="text-xs text-slate-600 font-medium select-none cursor-pointer">
                  Pre-populate from my Master Profile
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPLOAD RESUME MODAL & REVIEW PROCESS --- */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto relative">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Upload className="w-4 h-4 text-indigo-500" />
              Upload & Parse Existing Resume (AI Structured)
            </h3>

            {!parsedData ? (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-3" />
                  <p className="text-xs text-slate-600 font-semibold mb-1">Select PDF or DOCX file to scan</p>
                  <p className="text-[10px] text-slate-400">PDF or DOCX, up to 10 MB</p>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    required
                    className="mt-4 text-xs"
                    onChange={handleFileUploadChange}
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || !uploadFile}
                    className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Extracting & Structuring...
                      </>
                    ) : (
                      'Parse with AI'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Verification Form
              <div className="space-y-6">
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-[11px] leading-normal">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    We have extracted your resume details using AI. Please review the parsed fields below before creating your new editable resume.
                  </span>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Resume Name</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={verificationResumeName}
                      onChange={e => setVerificationResumeName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50"
                        value={parsedData.personalInfo?.name || ''}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50"
                        value={parsedData.personalInfo?.email || ''}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Summary Statement</label>
                    <textarea
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 h-16 resize-none"
                      value={parsedData.summary || ''}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Experiences Extracted ({parsedData.experiences?.length || 0})</h4>
                      <div className="space-y-2 max-h-36 overflow-y-auto border p-2 rounded bg-slate-50">
                        {parsedData.experiences?.map((exp, i) => (
                          <div key={i} className="text-[10px] border-b pb-1 mb-1 last:border-0 last:pb-0">
                            <p className="font-semibold text-slate-700">{exp.role} at {exp.company}</p>
                            <p className="text-slate-400 font-normal">{exp.startDate} - {exp.endDate}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Projects Extracted ({parsedData.projects?.length || 0})</h4>
                      <div className="space-y-2 max-h-36 overflow-y-auto border p-2 rounded bg-slate-50">
                        {parsedData.projects?.map((proj, i) => (
                          <div key={i} className="text-[10px] border-b pb-1 mb-1 last:border-0 last:pb-0">
                            <p className="font-semibold text-slate-700">{proj.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedData(null);
                      setUploadFile(null);
                    }}
                    className="flex-1 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveParsed}
                    disabled={loading}
                    className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    Confirm & Create Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {resumePendingDeletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Delete this resume?</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">“{resumePendingDeletion.name}” will be permanently removed.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setResumePendingDeletion(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={loading} onClick={async () => {
                const id = resumePendingDeletion._id;
                await deleteResume(id);
                if (!useResumeStore.getState().error) notify('Resume deleted.');
                setResumePendingDeletion(null);
              }} className="flex-1 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
