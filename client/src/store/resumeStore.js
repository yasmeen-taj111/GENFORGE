import { create } from 'zustand';
import api, { getErrorMessage } from '../lib/api';

const BASE_URL = '';
const getHeaders = () => ({});
const saveQueue = new Map();
let copilotRequestInFlight = false;
let atsRequestSequence = 0;

const compactResumeContext = (resume) => resume && ({
  targetRole: resume.targetRole,
  targetCompany: resume.targetCompany,
  personalInfo: resume.personalInfo,
  summary: resume.summary,
  skills: resume.skills,
  experiences: (resume.experiences || []).map(({ _id, company, role, descriptionBullets }) => ({ _id, company, role, descriptionBullets })),
  projects: (resume.projects || []).map(({ _id, name, description, technologies, bullets }) => ({ _id, name, description, technologies, bullets })),
  education: resume.education,
  certifications: resume.certifications,
  achievements: resume.achievements,
  targetSkillPlan: resume.targetSkillPlan,
  customSections: resume.customSections
});

const useResumeStore = create((set, get) => ({
  resumes: [],
  currentResume: null,
  masterProfile: null,
  jdAnalysis: null,
  atsAnalysis: null,
  reviewResult: null,
  copilotMessages: [],
  copilotLoading: false,
  loading: false,
  error: null,

  fetchResumes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`${BASE_URL}/resumes`, getHeaders());
      set({ resumes: res.data, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch resumes'), loading: false });
    }
  },

  fetchResumeById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`${BASE_URL}/resumes/${id}`, getHeaders());
      set({ currentResume: res.data, loading: false });
      // If the resume has pre-existing ATS analysis, load it in state
      if (res.data.atsAnalysis) {
        set({ atsAnalysis: res.data.atsAnalysis });
      } else {
        set({ atsAnalysis: null });
      }
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch resume details'), loading: false });
      return null;
    }
  },

  createResume: async (name, targetRole = '', targetCompany = '', useMasterProfile = true) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${BASE_URL}/resumes`, {
        name,
        targetRole,
        targetCompany,
        useMasterProfile
      }, getHeaders());
      set(state => ({ resumes: [res.data, ...state.resumes], loading: false }));
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to create resume'), loading: false });
      return null;
    }
  },

  updateResume: async (id, updatedData, { immediate = false } = {}) => {
    // Local state optimistic update
    set(state => {
      const newResume = state.currentResume && state.currentResume._id === id
        ? { ...state.currentResume, ...updatedData }
        : state.currentResume;
      return { currentResume: newResume };
    });

    const queued = saveQueue.get(id) || { data: {}, timer: null, resolvers: [], flush: null };
    queued.data = { ...queued.data, ...updatedData };

    const flush = async () => {
      const request = saveQueue.get(id);
      if (!request) return null;
      saveQueue.delete(id);
      try {
        const res = await api.put(`${BASE_URL}/resumes/${id}`, request.data, getHeaders());
        set(state => ({
          resumes: state.resumes.map(r => r._id === id ? { ...r, ...res.data } : r),
          currentResume: state.currentResume && state.currentResume._id === id ? { ...state.currentResume, ...res.data } : state.currentResume
        }));
        request.resolvers.forEach(({ resolve }) => resolve(res.data));
        return res.data;
      } catch (err) {
        const message = getErrorMessage(err, 'Failed to save resume changes');
        set({ error: message });
        request.resolvers.forEach(({ resolve }) => resolve(null));
        return null;
      }
    };
    // Expose the active save so dependent actions (notably ATS analysis) can
    // wait for the exact resume visible in the editor rather than score stale
    // server data while the debounce timer is still pending.
    queued.flush = flush;

    const result = new Promise((resolve) => queued.resolvers.push({ resolve }));
    if (queued.timer) window.clearTimeout(queued.timer);
    queued.timer = window.setTimeout(flush, immediate ? 0 : 500);
    saveQueue.set(id, queued);
    return result;
  },

  deleteResume: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`${BASE_URL}/resumes/${id}`, getHeaders());
      set(state => ({
        resumes: state.resumes.filter(r => r._id !== id),
        currentResume: state.currentResume?._id === id ? null : state.currentResume,
        loading: false
      }));
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to delete resume'), loading: false });
    }
  },

  duplicateResume: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${BASE_URL}/resumes/${id}/duplicate`, {}, getHeaders());
      set(state => ({ resumes: [res.data, ...state.resumes], loading: false }));
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to duplicate resume'), loading: false });
      return null;
    }
  },

  normalizeImportedResume: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${BASE_URL}/resumes/${id}/normalize-import`, {}, getHeaders());
      set(state => ({
        currentResume: state.currentResume?._id === id ? res.data : state.currentResume,
        resumes: state.resumes.map(resume => resume._id === id ? { ...resume, ...res.data } : resume),
        loading: false
      }));
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to repair the imported resume'), loading: false });
      return null;
    }
  },

  fetchMasterProfile: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`${BASE_URL}/profile`, getHeaders());
      set({ masterProfile: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch master profile'), loading: false });
      return null;
    }
  },

  updateMasterProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`${BASE_URL}/profile`, profileData, getHeaders());
      set({ masterProfile: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to update master profile'), loading: false });
      return null;
    }
  },

  analyzeJD: async (jdText) => {
    set({ loading: true, error: null, jdAnalysis: null });
    try {
      const res = await api.post(`${BASE_URL}/ai/analyze-jd`, { jdText }, getHeaders());
      set({ jdAnalysis: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to analyze job description'), loading: false });
      return null;
    }
  },

  tailorResume: async (resumeData, jdText) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${BASE_URL}/ai/tailor-resume`, { resumeData: compactResumeContext(resumeData), jdText }, getHeaders());
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to suggest resume tailoring'), loading: false });
      return null;
    }
  },

  reviewResume: async (resumeData, jdText) => {
    set({ loading: true, error: null, reviewResult: null });
    try {
      const res = await api.post(`${BASE_URL}/ai/review-resume`, { resumeData: compactResumeContext(resumeData), jdText }, getHeaders());
      set({ reviewResult: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to review resume'), loading: false });
      return null;
    }
  },

  analyzeATS: async (resumeId, jdText) => {
    const requestSequence = ++atsRequestSequence;
    set({ loading: true, error: null });
    try {
      const pendingSave = saveQueue.get(resumeId);
      if (pendingSave?.flush) {
        if (pendingSave.timer) window.clearTimeout(pendingSave.timer);
        pendingSave.timer = null;
        const saved = await pendingSave.flush();
        if (!saved) throw new Error('Please resolve the pending resume save before calculating ATS.');
      }
      const res = await api.post(`${BASE_URL}/ats/analyze`, { resumeId, jdText }, getHeaders());
      // Requests can finish out of order. Only the newest calculation may
      // update the shared ATS card, preventing an older result overwriting it.
      if (requestSequence !== atsRequestSequence) return res.data;
      set({ atsAnalysis: res.data, loading: false });
      // Update local resume list score
      set(state => ({
        resumes: state.resumes.map(r => r._id === resumeId ? { ...r, atsScore: res.data.overallScore, atsAnalysis: res.data } : r),
        currentResume: state.currentResume?._id === resumeId ? { ...state.currentResume, atsScore: res.data.overallScore, atsAnalysis: res.data } : state.currentResume
      }));
      return res.data;
    } catch (err) {
      if (requestSequence === atsRequestSequence) set({ error: getErrorMessage(err, 'ATS analysis failed'), loading: false });
      return null;
    }
  },

  previewATS: async (resumeData, jdText, jdAnalysis = null) => {
    try {
      const res = await api.post(`${BASE_URL}/ats/preview`, { resumeData, jdText, jdAnalysis }, getHeaders());
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'ATS preview failed') });
      return null;
    }
  },

  uploadResumeFile: async (file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post(`${BASE_URL}/resumes/upload`, formData);
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to upload and parse resume'), loading: false });
      return null;
    }
  },

  enhanceSummary: async (summary, targetRole, jobDescription, mode) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${BASE_URL}/ai/enhance-summary`, {
        summary,
        targetRole,
        jobDescription,
        mode
      }, getHeaders());
      set({ loading: false });
      return res.data.enhanced;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to enhance summary'), loading: false });
      return null;
    }
  },

  enhanceBullet: async (bulletText, jobDescription, mode) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${BASE_URL}/ai/enhance-bullet`, {
        bulletText,
        jobDescription,
        mode
      }, getHeaders());
      set({ loading: false });
      return res.data.enhanced;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to enhance bullet point'), loading: false });
      return null;
    }
  },

  sendCopilotMessage: async (userMessage) => {
    // State updates are asynchronous; this guard also prevents a rapid double
    // click/Enter press from sending the same prompt twice.
    if (copilotRequestInFlight) return false;
    copilotRequestInFlight = true;
    const { copilotMessages, currentResume, jdAnalysis, masterProfile } = get();
    
    // Add user message to state
    const updatedMessages = [...copilotMessages, { role: 'user', content: userMessage }];
    set({ copilotMessages: updatedMessages, copilotLoading: true, error: null });

    try {
      const res = await api.post(`${BASE_URL}/ai/copilot-chat`, {
        messages: updatedMessages.slice(-8),
        resumeContext: compactResumeContext(currentResume),
        jdContext: jdAnalysis || currentResume?.jobDescription?.analyzedData || null,
        profileContext: masterProfile ? { skills: masterProfile.skills } : null
      }, getHeaders());

      set({
        copilotMessages: [...updatedMessages, { role: 'copilot', content: res.data.reply }],
        copilotLoading: false
      });
    } catch (err) {
      set({
        copilotMessages: [...updatedMessages, { role: 'copilot', content: 'Sorry, I encountered an issue accessing the AI service.' }],
        error: getErrorMessage(err, 'AI Copilot error'),
        copilotLoading: false
      });
    } finally {
      copilotRequestInFlight = false;
    }
    return true;
  },

  clearCopilot: () => set({ copilotMessages: [], copilotLoading: false }),
  clearJDAnalysis: () => set({ jdAnalysis: null }),
  clearAtsAnalysis: () => set({ atsAnalysis: null }),
  clearReviewResult: () => set({ reviewResult: null }),
  clearError: () => set({ error: null })
}));

export default useResumeStore;
