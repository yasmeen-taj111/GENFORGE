import React, { useState, useEffect, useRef } from 'react';
import useResumeStore from '../store/resumeStore';
import useNotificationStore from '../store/notificationStore';
import { Templates } from '../components/templates/Templates';
import { AtsAnalyzer } from '../components/AtsAnalyzer';
import { Copilot } from '../components/Copilot';
import {
  ArrowLeft,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  FolderKanban,
  User,
  Wrench,
  Eye,
  Code,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  FileText,
  GripVertical,
  PanelRightClose,
  BarChart3,
  Bot,
  SlidersHorizontal,
  X
} from 'lucide-react';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const escapeLatex = (value = '') => String(value)
  .replace(/\\/g, '\\textbackslash{}')
  .replace(/([#$%&_{}])/g, '\\$1')
  .replace(/~/g, '\\textasciitilde{}')
  .replace(/\^/g, '\\textasciicircum{}');
const resumeFileName = (resume) => String(resume?.name || 'resume').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'resume';

// Portable, standalone source generators. The output intentionally includes all
// populated sections so downloads are useful outside the in-app preview.
const generateSourceCode = (resume) => {
  if (!resume) return { html: '', css: '', latex: '' };
  const info = resume.personalInfo || {};
  const section = (title, body) => body ? `    <section>\n      <h2>${escapeHtml(title)}</h2>\n${body}\n    </section>` : '';
  const list = (items) => items?.filter(Boolean).length ? `      <ul>\n${items.filter(Boolean).map(item => `        <li>${escapeHtml(item)}</li>`).join('\n')}\n      </ul>` : '';
  const contact = [info.email, info.phone, info.location, info.linkedin, info.github, info.portfolio].filter(Boolean).map(escapeHtml).join(' · ');
  const experience = (resume.experiences || []).map(item => `      <article><div class="row"><strong>${escapeHtml(item.role)}</strong><span>${escapeHtml(`${item.startDate || ''}${item.startDate || item.endDate ? ' – ' : ''}${item.current ? 'Present' : item.endDate || ''}`)}</span></div><div class="muted">${escapeHtml([item.company, item.location].filter(Boolean).join(' · '))}</div>${list(item.descriptionBullets)}</article>`).join('\n');
  const projects = (resume.projects || []).map(item => `      <article><strong>${escapeHtml(item.name)}</strong>${item.technologies?.length ? `<span class="muted"> · ${escapeHtml(item.technologies.join(', '))}</span>` : ''}${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}${list(item.bullets)}</article>`).join('\n');
  const skills = Object.entries(resume.skills || {}).filter(([, values]) => Array.isArray(values) && values.length).map(([name, values]) => `      <p><strong>${escapeHtml(name.replace(/([A-Z])/g, ' $1'))}:</strong> ${escapeHtml(values.join(', '))}</p>`).join('\n');
  const education = (resume.education || []).map(item => `      <article><div class="row"><strong>${escapeHtml([item.degree, item.field].filter(Boolean).join(' in '))}</strong><span>${escapeHtml([item.startDate, item.endDate].filter(Boolean).join(' – '))}</span></div><div class="muted">${escapeHtml([item.institution, item.location].filter(Boolean).join(' · '))}</div></article>`).join('\n');
  const html = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${escapeHtml(resume.name || 'Resume')}</title>\n  <style>\n${generateSourceCodeCss(resume)}\n  </style>\n</head>\n<body>\n  <main class="resume-root">\n    <header>\n      <h1>${escapeHtml(info.name)}</h1>\n      ${resume.targetRole ? `      <p class="role">${escapeHtml(resume.targetRole)}</p>\n` : ''}      ${contact ? `      <p class="contact">${contact}</p>` : ''}\n    </header>\n${section('Professional Summary', resume.summary ? `      <p>${escapeHtml(resume.summary)}</p>` : '')}\n${section('Experience', experience)}\n${section('Projects', projects)}\n${section('Skills', skills)}\n${section('Education', education)}\n  </main>\n</body>\n</html>`;
  const css = generateSourceCodeCss(resume);
  const latexSection = (title, body) => body ? `\\section*{${escapeLatex(title)}}\n${body}\n` : '';
  const latexExperience = (resume.experiences || []).map(item => `\\textbf{${escapeLatex(item.role)}} \\hfill ${escapeLatex(`${item.startDate || ''}${item.startDate || item.endDate ? ' -- ' : ''}${item.current ? 'Present' : item.endDate || ''}`)}\\\\\n\\textit{${escapeLatex([item.company, item.location].filter(Boolean).join(' | '))}}\n${(item.descriptionBullets || []).filter(Boolean).length ? `\\begin{itemize}\n${item.descriptionBullets.filter(Boolean).map(bullet => `  \\item ${escapeLatex(bullet)}`).join('\n')}\n\\end{itemize}` : ''}`).join('\n\n');
  const latexProjects = (resume.projects || []).map(item => `\\textbf{${escapeLatex(item.name)}}${item.technologies?.length ? ` (${escapeLatex(item.technologies.join(', '))})` : ''}\\\\\n${item.description ? `${escapeLatex(item.description)}\n` : ''}${(item.bullets || []).filter(Boolean).length ? `\\begin{itemize}\n${item.bullets.filter(Boolean).map(bullet => `  \\item ${escapeLatex(bullet)}`).join('\n')}\n\\end{itemize}` : ''}`).join('\n\n');
  const latexSkills = Object.entries(resume.skills || {}).filter(([, values]) => Array.isArray(values) && values.length).map(([name, values]) => `\\textbf{${escapeLatex(name.replace(/([A-Z])/g, ' $1'))}:} ${escapeLatex(values.join(', '))}\\\\`).join('\n');
  const latexEducation = (resume.education || []).map(item => `\\textbf{${escapeLatex([item.degree, item.field].filter(Boolean).join(' in '))}} \\hfill ${escapeLatex([item.startDate, item.endDate].filter(Boolean).join(' -- '))}\\\\\n${escapeLatex([item.institution, item.location].filter(Boolean).join(' | '))}`).join('\n\n');
  const latex = `\\documentclass[10pt]{article}\n\\usepackage[margin=${resume.styling?.margins || '0.75in'}]{geometry}\n\\usepackage[T1]{fontenc}\n\\usepackage{enumitem}\n\\setlist[itemize]{leftmargin=*, nosep}\n\\pagenumbering{gobble}\n\\begin{document}\n\\begin{center}\n  {\\LARGE\\textbf{${escapeLatex(info.name)}}}\\\\\n  ${escapeLatex(contact)}\n\\end{center}\n${latexSection('Professional Summary', escapeLatex(resume.summary))}${latexSection('Experience', latexExperience)}${latexSection('Projects', latexProjects)}${latexSection('Skills', latexSkills)}${latexSection('Education', latexEducation)}\\end{document}\n`;
  return { html, css, latex };
};

const generateSourceCodeCss = (resume) => `.resume-root { max-width: 8.5in; margin: 0 auto; padding: ${resume.styling?.margins || '0.75in'}; color: #1e293b; font: ${resume.styling?.fontSize || '10pt'}/${resume.styling?.lineSpacing || '1.25'} ${resume.styling?.fontSelection || 'Arial'}, sans-serif; }\n* { box-sizing: border-box; }\nbody { margin: 0; background: #f8fafc; }\nh1 { margin: 0; color: ${resume.styling?.accentColor || '#0f172a'}; font-size: 28px; }\nh2 { margin: ${resume.styling?.sectionSpacing || '16px'} 0 6px; padding-bottom: 3px; border-bottom: 1px solid #cbd5e1; color: ${resume.styling?.accentColor || '#0f172a'}; font-size: 13px; text-transform: uppercase; }\np { margin: 4px 0; }\n.role { font-weight: 600; }\n.contact, .muted { color: #475569; font-size: .92em; }\narticle { margin: 8px 0; break-inside: avoid; }\n.row { display: flex; justify-content: space-between; gap: 16px; }\nul { margin: 4px 0; padding-left: 18px; }\n@media print { body { background: white; } .resume-root { padding: 0; } }`;

const getTailoringPlan = (suggestions, variant) => {
  const experienceBullets = suggestions?.experienceBullets || [];
  const projects = suggestions?.projects || [];
  return variant === 'conservative' ? { summary: suggestions?.summary, experienceBullets: experienceBullets.slice(0, 2), projects: [] }
    : variant === 'balanced' ? { summary: suggestions?.summary, experienceBullets, projects: projects.slice(0, 1) }
      : { summary: suggestions?.summary, experienceBullets, projects };
};

const buildTailoredResume = (resume, suggestions, variant) => {
  const completeOption = (suggestions?.options || []).find(option => option.id === variant);
  if (completeOption?.optimizedResume) return { ...resume, ...completeOption.optimizedResume };
  if (variant === 'recommended' && suggestions?.optimizedResume) {
    return { ...resume, ...suggestions.optimizedResume };
  }
  const plan = getTailoringPlan(suggestions, variant);
  return {
    ...resume,
    summary: plan.summary?.suggested || resume.summary,
    experiences: (resume.experiences || []).map(item => ({ ...item, descriptionBullets: (item.descriptionBullets || []).map((bullet, index) => plan.experienceBullets.find(change => String(change.experienceId) === String(item._id) && change.bulletIndex === index && change.original === bullet)?.suggested || bullet) })),
    projects: (resume.projects || []).map(item => ({ ...item, bullets: (item.bullets || []).map((bullet, index) => plan.projects.find(change => String(change.projectId) === String(item._id) && change.bulletIndex === index && change.original === bullet)?.suggested || bullet) }))
  };
};

const tailoringOptions = (suggestions) => suggestions?.options?.length
  ? suggestions.options
  : [
    { id: 'recommended', title: 'ATS-optimized', description: 'All truthful summary, experience, and project improvements.' },
    { id: 'balanced', title: 'Balanced', description: 'Complete balanced rewrite.' },
    { id: 'conservative', title: 'Concise impact', description: 'Complete concise rewrite.' }
  ];

// This is a planning benchmark, never a candidate resume. It deliberately
// uses placeholders so a user can compare their evidence against the target
// role without copying unearned skills or experience into their own document.
const buildAtsTargetBlueprint = (resume, jdAnalysis = {}) => {
  const terms = [...new Set([...(jdAnalysis.requiredSkills || []), ...(jdAnalysis.keywords || [])].map(term => String(term).trim()).filter(Boolean))].slice(0, 18);
  const role = resume.targetRole || 'Target Role';
  return {
    ...resume,
    name: `${role} — 75+ Target Blueprint`,
    personalInfo: { ...resume.personalInfo, name: 'Target-role preparation blueprint' },
    summary: `Preparation benchmark for a ${role}. Replace each placeholder only with genuine skills, projects, and achievements completed before applying.`,
    skills: { tools: terms },
    experiences: [{ role: `${role} — evidence to build`, company: 'Add only genuine employment, internship, or project evidence', descriptionBullets: terms.slice(0, 6).map(term => `Demonstrate practical evidence of ${term} through a completed project or work contribution.`) }],
    projects: [{ name: 'Target-role preparation project', description: 'Placeholder: complete and document a genuine project before listing it on a resume.', technologies: terms.slice(0, 8), bullets: terms.slice(8, 14).map(term => `Show a verifiable implementation or outcome involving ${term}.`) }],
    certifications: [],
    achievements: [],
    customSections: []
  };
};

export const ResumeBuilder = ({ resumeId, onNavigate }) => {
  const {
    currentResume,
    fetchResumeById,
    updateResume,
    enhanceSummary,
    enhanceBullet,
    tailorResume,
    duplicateResume,
    normalizeImportedResume,
    analyzeATS,
    reviewResume,
    reviewResult,
    loading
  } = useResumeStore();
  const notify = useNotificationStore((state) => state.notify);

  const [activeEditorTab, setActiveEditorTab] = useState('header');
  const [rightPanelMode, setRightPanelMode] = useState('preview'); // preview, sourceCode
  const [activeSideDrawer, setActiveSideDrawer] = useState(null); // null, ats, copilot
  const [sidePanelWidth, setSidePanelWidth] = useState(420);
  const [showSectionsPanel, setShowSectionsPanel] = useState(true);
  const [showFeaturesPanel, setShowFeaturesPanel] = useState(true);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [selectedTailorVariant, setSelectedTailorVariant] = useState('recommended');
  const [tailorOptionScores, setTailorOptionScores] = useState({});
  const [showAtsTargetBlueprint, setShowAtsTargetBlueprint] = useState(false);
  const [atsTargetBlueprintScore, setAtsTargetBlueprintScore] = useState(null);
  const [skillDrafts, setSkillDrafts] = useState({});
  const sidebarResizeRef = useRef(null);
  
  // Customization States
  const [accentColor, setAccentColor] = useState('#0f172a');
  const [fontSelection, setFontSelection] = useState('Inter');
  const [, setFontSize] = useState('10pt');
  const [, setLineSpacing] = useState('1.25');
  const [, setSectionSpacing] = useState('16px');
  const [, setMargins] = useState('0.75in');
  
  // AI Tailor suggestions state
  const [tailorSuggestions, setTailorSuggestions] = useState(null);
  const [showCriticModal, setShowCriticModal] = useState(false);
  const [sourceCode, setSourceCode] = useState({ html: '', css: '', latex: '' });
  const [sourceEdited, setSourceEdited] = useState(false);
  const [showJobDescriptionModal, setShowJobDescriptionModal] = useState(false);
  const [jobDescriptionDraft, setJobDescriptionDraft] = useState('');
  const [savingJobDescription, setSavingJobDescription] = useState(false);

  // JD pasting for AI actions
  const [jdText, setJdText] = useState('');

  useEffect(() => {
    const loadResume = async () => {
      const res = await fetchResumeById(resumeId);
      if (res) {
        if (res.styling) {
          setAccentColor(res.styling.accentColor || '#0f172a');
          setFontSelection(res.styling.fontSelection || 'Inter');
          setFontSize(res.styling.fontSize || '10pt');
          setLineSpacing(res.styling.lineSpacing || '1.25');
          setSectionSpacing(res.styling.sectionSpacing || '16px');
          setMargins(res.styling.margins || '0.75in');
        }
        setJdText(res.jobDescription?.descriptionText || '');
        setSourceCode(res.sourceCode?.html || res.sourceCode?.css || res.sourceCode?.latex ? res.sourceCode : generateSourceCode(res));
        setSourceEdited(Boolean(res.sourceCode?.html || res.sourceCode?.css || res.sourceCode?.latex));
      }
    };
    loadResume();
  }, [resumeId, fetchResumeById]);

  useEffect(() => {
    if (currentResume && !sourceEdited) setSourceCode(generateSourceCode(currentResume));
  }, [currentResume, sourceEdited]);

  const updateSourceCode = (key, value) => {
    const next = { ...sourceCode, [key]: value };
    setSourceEdited(true);
    setSourceCode(next);
    updateResume(resumeId, { sourceCode: next });
  };

  const resetSourceCode = () => {
    const generated = generateSourceCode(currentResume);
    setSourceEdited(false);
    setSourceCode(generated);
    updateResume(resumeId, { sourceCode: generated });
  };

  // Synchronize styling updates
  const handleStylingChange = (key, value) => {
    const updatedStyling = { ...currentResume.styling, [key]: value };
    updateResume(resumeId, { styling: updatedStyling });
    
    // Set individual states
    if (key === 'accentColor') setAccentColor(value);
    if (key === 'fontSelection') setFontSelection(value);
    if (key === 'fontSize') setFontSize(value);
    if (key === 'lineSpacing') setLineSpacing(value);
    if (key === 'sectionSpacing') setSectionSpacing(value);
    if (key === 'margins') setMargins(value);
  };

  const handleFieldChange = (section, field, value) => {
    const updated = { ...currentResume[section], [field]: value };
    updateResume(resumeId, { [section]: updated });
  };

  // --- AI Actions Handlers ---
  const handleEnhanceSummary = async (mode) => {
    if (!currentResume.summary) return;
    const result = await enhanceSummary(currentResume.summary, currentResume.targetRole, jdText, mode);
    if (result) {
      updateResume(resumeId, { summary: result });
    }
  };

  const handleEnhanceBullet = async (expIdx, bulletIdx, mode) => {
    const bulletText = currentResume.experiences[expIdx].descriptionBullets[bulletIdx];
    if (!bulletText) return;
    const result = await enhanceBullet(bulletText, jdText, mode);
    if (result) {
      const experiencesCopy = [...currentResume.experiences];
      experiencesCopy[expIdx].descriptionBullets[bulletIdx] = result;
      updateResume(resumeId, { experiences: experiencesCopy });
    }
  };

  const handleEnhanceProjBullet = async (projIdx, bulletIdx, mode) => {
    const bulletText = currentResume.projects[projIdx].bullets[bulletIdx];
    if (!bulletText) return;
    const result = await enhanceBullet(bulletText, jdText, mode);
    if (result) {
      const projectsCopy = [...currentResume.projects];
      projectsCopy[projIdx].bullets[bulletIdx] = result;
      updateResume(resumeId, { projects: projectsCopy });
    }
  };

  const handleEnhanceAchievement = async (achievementIdx) => {
    const description = currentResume.achievements?.[achievementIdx]?.description;
    if (!description) return;
    const enhanced = await enhanceBullet(description, jdText, 'tailor');
    if (!enhanced) return;
    const achievements = [...currentResume.achievements];
    achievements[achievementIdx] = { ...achievements[achievementIdx], description: enhanced };
    updateResume(resumeId, { achievements });
  };

  const handleTailorResume = async () => {
    if (!jdText) {
      setJobDescriptionDraft(currentResume.jobDescription?.descriptionText || '');
      setShowJobDescriptionModal(true);
      return;
    }
    const suggestions = await tailorResume(currentResume, jdText);
    if (suggestions) {
      const options = tailoringOptions(suggestions);
      setSelectedTailorVariant(options[0].id);
      setTailorSuggestions(suggestions);
      const preview = useResumeStore.getState().previewATS;
      const jdAnalysis = currentResume.jobDescription?.analyzedData || null;
      const scores = await Promise.all(options.map(async ({ id }) => [id, await preview(buildTailoredResume(currentResume, suggestions, id), jdText, jdAnalysis)]));
      const scoreMap = Object.fromEntries(scores);
      setTailorOptionScores(scoreMap);
      const bestVariant = options.map(option => option.id).reduce((best, id) => (
        (scoreMap[id]?.overallScore ?? -1) > (scoreMap[best]?.overallScore ?? -1) ? id : best
      ), options[0].id);
      setSelectedTailorVariant(bestVariant);
    }
  };

  const startSidebarResize = (event) => {
    event.preventDefault();
    const onMove = (moveEvent) => setSidePanelWidth(Math.max(320, Math.min(560, window.innerWidth - moveEvent.clientX)));
    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      sidebarResizeRef.current = null;
    };
    sidebarResizeRef.current = onEnd;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
  };

  useEffect(() => () => sidebarResizeRef.current?.(), []);

  const handleAnalyzeAndTailor = async () => {
    const descriptionText = jobDescriptionDraft.trim();
    if (!descriptionText) {
      notify('Paste a job description to continue.', 'error');
      return;
    }
    setSavingJobDescription(true);
    const analysis = await useResumeStore.getState().analyzeJD(descriptionText);
    if (!analysis) {
      setSavingJobDescription(false);
      return;
    }
    const jobDescription = {
      ...currentResume.jobDescription,
      descriptionText,
      title: analysis.title || currentResume.targetRole || '',
      analyzedData: analysis
    };
    const saved = await updateResume(resumeId, { jobDescription }, { immediate: true });
    setSavingJobDescription(false);
    if (!saved) return;
    setJdText(descriptionText);
    setShowJobDescriptionModal(false);
    const suggestions = await tailorResume({ ...currentResume, jobDescription }, descriptionText);
    if (suggestions) {
      const options = tailoringOptions(suggestions);
      setSelectedTailorVariant(options[0].id);
      setTailorSuggestions(suggestions);
      const preview = useResumeStore.getState().previewATS;
      const scores = await Promise.all(options.map(async ({ id }) => [id, await preview(buildTailoredResume(currentResume, suggestions, id), descriptionText, analysis)]));
      const scoreMap = Object.fromEntries(scores);
      setTailorOptionScores(scoreMap);
      const bestVariant = options.map(option => option.id).reduce((best, id) => (
        (scoreMap[id]?.overallScore ?? -1) > (scoreMap[best]?.overallScore ?? -1) ? id : best
      ), options[0].id);
      setSelectedTailorVariant(bestVariant);
    }
  };

  const handleReviewResume = async () => {
    await reviewResume(currentResume, jdText);
    setShowCriticModal(true);
  };

  const repairImportedFormatting = async () => {
    const repaired = await normalizeImportedResume(resumeId);
    if (repaired) notify('Imported education, skills, and project titles were cleaned. Please review the corrected fields.', 'success');
  };

  // --- suggestion applying handler ---
  const refreshAtsAfterTailoring = async () => {
    if (!jdText.trim()) {
      notify('Tailored changes were saved. Add a job description to calculate ATS.', 'info');
      return;
    }
    const analysis = await analyzeATS(resumeId, jdText);
    if (analysis) {
      setActiveSideDrawer('ats');
      notify(`Tailored changes saved. ATS recalculated: ${analysis.overallScore}/100.`, 'success');
    } else {
      notify('Tailored changes saved, but ATS could not be recalculated. Please try again.', 'error');
    }
  };

  const applyTailorSuggestion = async (type, data) => {
    if (type === 'summary') {
      const saved = await updateResume(resumeId, { summary: data }, { immediate: true });
      if (!saved) return;
      setTailorSuggestions(prev => ({ ...prev, summary: null }));
      await refreshAtsAfterTailoring();
    }
    if (type === 'experience') {
      const expCopy = [...currentResume.experiences];
      const matchIdx = expCopy.findIndex(e => e._id === data.experienceId);
      if (matchIdx !== -1) {
        expCopy[matchIdx].descriptionBullets[data.bulletIndex] = data.suggested;
        const saved = await updateResume(resumeId, { experiences: expCopy }, { immediate: true });
        if (!saved) return;
        await refreshAtsAfterTailoring();
      } else {
        notify('That experience item changed before this suggestion was applied.', 'error');
        return;
      }
      setTailorSuggestions(prev => ({
        ...prev,
        experienceBullets: prev.experienceBullets.filter(b => !(b.experienceId === data.experienceId && b.bulletIndex === data.bulletIndex))
      }));
    }
    if (type === 'project') {
      const projCopy = [...currentResume.projects];
      const matchIdx = projCopy.findIndex(p => p._id === data.projectId);
      if (matchIdx !== -1) {
        projCopy[matchIdx].bullets[data.bulletIndex] = data.suggested;
        const saved = await updateResume(resumeId, { projects: projCopy }, { immediate: true });
        if (!saved) return;
        await refreshAtsAfterTailoring();
      } else {
        notify('That project item changed before this suggestion was applied.', 'error');
        return;
      }
      setTailorSuggestions(prev => ({
        ...prev,
        projects: prev.projects.filter(p => !(p.projectId === data.projectId && p.bulletIndex === data.bulletIndex))
      }));
    }
  };

  const addConfirmedSkill = async (suggestion) => {
    const category = suggestion.category || 'tools';
    const skills = { ...(currentResume.skills || {}) };
    const categorySkills = Array.isArray(skills[category]) ? skills[category] : [];
    if (categorySkills.some((skill) => skill.toLowerCase() === suggestion.skill.toLowerCase())) return;
    skills[category] = [...categorySkills, suggestion.skill];
    const targetSkillPlan = (currentResume.targetSkillPlan || []).filter(item => item.skill?.toLowerCase() !== suggestion.skill.toLowerCase());
    const saved = await updateResume(resumeId, { skills, targetSkillPlan }, { immediate: true });
    if (!saved) return;
    setTailorSuggestions(prev => ({ ...prev, skillsToConfirm: prev.skillsToConfirm.filter((item) => item.skill !== suggestion.skill) }));
    notify(`${suggestion.skill} was added to your skills.`, 'success');
    await refreshAtsAfterTailoring();
  };

  const addToLearningPlan = async (suggestion) => {
    const targetSkillPlan = currentResume.targetSkillPlan || [];
    if (targetSkillPlan.some(item => item.skill?.toLowerCase() === suggestion.skill.toLowerCase())) return;
    const saved = await updateResume(resumeId, { targetSkillPlan: [...targetSkillPlan, { skill: suggestion.skill, category: suggestion.category, reason: suggestion.reason }] }, { immediate: true });
    if (saved) notify(`${suggestion.skill} was added to your learning plan. Add it to your resume only after you have learned it.`, 'success');
  };

  const getTailorVariant = (variantId) => {
    return getTailoringPlan(tailorSuggestions, variantId);
  };

  const openAtsTargetBlueprint = async () => {
    if (!jdText.trim()) return;
    const preview = useResumeStore.getState().previewATS;
    const blueprint = buildAtsTargetBlueprint(currentResume, tailorOptionScores[bestTailorVariant]?.jdAnalysis);
    const score = await preview(blueprint, jdText);
    setAtsTargetBlueprintScore(score);
    setShowAtsTargetBlueprint(true);
  };

  const applyAllTailorSuggestions = async () => {
    if (!tailorSuggestions) return;
    const selectedOption = (tailorSuggestions.options || []).find(option => option.id === selectedTailorVariant);
    if (selectedOption?.optimizedResume || (selectedTailorVariant === 'recommended' && tailorSuggestions.optimizedResume)) {
      const optimized = buildTailoredResume(currentResume, tailorSuggestions, selectedTailorVariant);
      const saved = await updateResume(resumeId, { summary: optimized.summary, experiences: optimized.experiences, projects: optimized.projects, skills: optimized.skills, certifications: optimized.certifications, achievements: optimized.achievements, customSections: optimized.customSections }, { immediate: true });
      if (!saved) return;
      setTailorSuggestions(null);
      await refreshAtsAfterTailoring();
      return;
    }
    const chosenPlan = getTailorVariant(selectedTailorVariant);
    const summary = chosenPlan.summary?.suggested || currentResume.summary;
    const experiences = currentResume.experiences.map((experience) => {
      const updates = chosenPlan.experienceBullets.filter((item) => item.experienceId === experience._id);
      if (!updates.length) return experience;
      const descriptionBullets = [...(experience.descriptionBullets || [])];
      updates.forEach((item) => { if (descriptionBullets[item.bulletIndex] === item.original) descriptionBullets[item.bulletIndex] = item.suggested; });
      return { ...experience, descriptionBullets };
    });
    const projects = currentResume.projects.map((project) => {
      const updates = chosenPlan.projects.filter((item) => item.projectId === project._id);
      if (!updates.length) return project;
      const bullets = [...(project.bullets || [])];
      updates.forEach((item) => { if (bullets[item.bulletIndex] === item.original) bullets[item.bulletIndex] = item.suggested; });
      return { ...project, bullets };
    });
    const saved = await updateResume(resumeId, { summary, experiences, projects }, { immediate: true });
    if (!saved) return;
    setTailorSuggestions(null);
    await refreshAtsAfterTailoring();
  };

  const createAtsOptimizedCopy = async () => {
    if (!tailorSuggestions || !jdText.trim()) {
      notify('Add a job description before creating an ATS-optimized copy.', 'error');
      return;
    }
    const tailoredResume = buildTailoredResume(currentResume, tailorSuggestions, bestTailorVariant);
    const selectedTitle = tailoringOptions(tailorSuggestions).find(option => option.id === bestTailorVariant)?.title || 'Tailored';
    const duplicate = await duplicateResume(resumeId);
    if (!duplicate) return;

    const saved = await updateResume(duplicate._id, {
      name: `${currentResume.name} — ${selectedTitle}`,
      summary: tailoredResume.summary,
      experiences: tailoredResume.experiences,
      projects: tailoredResume.projects,
      achievements: tailoredResume.achievements,
      skills: tailoredResume.skills,
      certifications: tailoredResume.certifications,
      customSections: tailoredResume.customSections,
      jobDescription: currentResume.jobDescription,
      atsScore: 0,
      atsAnalysis: null
    }, { immediate: true });
    if (!saved) return;

    const analysis = await analyzeATS(duplicate._id, jdText);
    if (!analysis) return;
    setTailorSuggestions(null);
    notify(`${selectedTitle} resume created with a score of ${analysis.overallScore}/100. You can open it from the dashboard.`, analysis.overallScore >= 75 ? 'success' : 'info');
    onNavigate('dashboard');
  };

  // --- HTML / CSS download ---
  const handleDownloadSource = () => {
    const cssOverride = `<style>\n${sourceCode.css}\n</style>`;
    const documentHtml = sourceCode.html.includes('</head>')
      ? sourceCode.html.replace('</head>', `${cssOverride}\n</head>`)
      : `<!doctype html><html><head>${cssOverride}</head><body>${sourceCode.html}</body></html>`;
    const blob = new Blob([documentHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${resumeFileName(currentResume)}.html`;
    link.click();
  };

  const handleDownloadLaTeX = () => {
    const blob = new Blob([sourceCode.latex], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${resumeFileName(currentResume)}.tex`;
    link.click();
  };

  // --- PDF Trigger ---
  const handleDownloadPDF = () => {
    window.print(); // Optimal browser print layout style
  };

  if (!currentResume) return <div className="text-center py-20">Loading resume...</div>;

  const tailoringVariantIds = tailoringOptions(tailorSuggestions).map(option => option.id);
  const bestTailorVariant = tailoringVariantIds.reduce((best, id) => (
    (tailorOptionScores[id]?.overallScore ?? -1) > (tailorOptionScores[best]?.overallScore ?? -1) ? id : best
  ), tailoringVariantIds[0]);
  const bestTailorScore = tailorOptionScores[bestTailorVariant]?.overallScore;

  return (
    <div className="h-dvh min-h-screen bg-slate-100 flex flex-col font-sans overflow-hidden no-print">
      {/* Builder Top Bar */}
      <nav className="sticky top-0 bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center z-20 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xs font-bold text-slate-800 leading-tight">{currentResume.name}</h1>
            <p className="text-[10px] text-slate-400">Target: {currentResume.targetRole || 'Not Set'} {currentResume.targetCompany && `at ${currentResume.targetCompany}`}</p>
          </div>
        </div>

        {/* AI Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTailorResume}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tailor to Job
          </button>
          <button
            onClick={repairImportedFormatting}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-semibold transition"
            title="Repair education, skills, and project formatting from a previous import"
          >
            <Wrench className="w-3.5 h-3.5" />
            Fix Imported Format
          </button>
          <button
            onClick={handleReviewResume}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Review Resume
          </button>
          <button
            onClick={() => onNavigate('jd-intelligence')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-semibold transition"
          >
            JD Intelligence
          </button>
          <div className="relative">
            <button type="button" onClick={() => setShowLayoutMenu((visible) => !visible)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-600" title="Adjust workspace layout" aria-label="Adjust workspace layout"><SlidersHorizontal className="h-4 w-4" /></button>
            {showLayoutMenu && <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Workspace layout</p>
              <button type="button" onClick={() => { setShowSectionsPanel((visible) => !visible); setShowLayoutMenu(false); }} className="w-full rounded-lg px-2 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">{showSectionsPanel ? 'Hide editing sections' : 'Show editing sections'}</button>
              <button type="button" onClick={() => { setShowFeaturesPanel((visible) => !visible); setShowLayoutMenu(false); }} className="w-full rounded-lg px-2 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">{showFeaturesPanel ? 'Hide ATS & Copilot panel' : 'Show ATS & Copilot panel'}</button>
              <button type="button" onClick={() => { setShowSectionsPanel(false); setShowFeaturesPanel(false); setShowLayoutMenu(false); }} className="w-full rounded-lg bg-indigo-50 px-2 py-2 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Expand resume preview</button>
              <button type="button" onClick={() => { setShowSectionsPanel(true); setShowFeaturesPanel(true); setShowLayoutMenu(false); }} className="w-full rounded-lg px-2 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">Reset workspace</button>
            </div>}
          </div>
          
          <div className="h-5 w-[1px] bg-slate-200 mx-1" />

          {/* Drawer toggles */}
          <button
            onClick={() => { setShowFeaturesPanel(true); setActiveSideDrawer(activeSideDrawer === 'ats' ? null : 'ats'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition ${
              activeSideDrawer === 'ats'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            ATS Dashboard
          </button>
          <button
            onClick={() => { setShowFeaturesPanel(true); setActiveSideDrawer(activeSideDrawer === 'copilot' ? null : 'copilot'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition ${
              activeSideDrawer === 'copilot'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Copilot
          </button>
        </div>
      </nav>

      {/* Main Workspace (Left Form, Right Preview) */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        
        {/* Left Panel: Sections Editor */}
        {showSectionsPanel && <div className="hidden lg:flex lg:w-[36%] min-w-[360px] border-r border-slate-200 bg-white flex-col overflow-hidden shrink-0">
          
          {/* Section categories bar */}
          <div className="flex border-b border-slate-100 overflow-x-auto shrink-0 bg-slate-50/50 p-2 gap-1.5">
            <div className="flex items-center px-1"><button type="button" onClick={() => setShowLayoutMenu((visible) => !visible)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-indigo-600" title="Adjust workspace layout" aria-label="Adjust workspace layout"><SlidersHorizontal className="h-4 w-4" /></button></div>
            {[
              { id: 'header', label: 'Header', icon: User },
              { id: 'summary', label: 'Summary', icon: FileText },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'projects', label: 'Projects', icon: FolderKanban },
              { id: 'skills', label: 'Skills', icon: Wrench },
              { id: 'education', label: 'Education', icon: BookOpen },
              { id: 'certifications', label: 'Certifications', icon: Award },
              { id: 'achievements', label: 'Achievements', icon: Award },
              { id: 'customSections', label: 'Custom', icon: FolderKanban }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveEditorTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition ${
                  activeEditorTab === tab.id
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. Header Editor */}
            {activeEditorTab === 'header' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800">Contact Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                      value={currentResume.personalInfo?.name || ''}
                      onChange={e => handleFieldChange('personalInfo', 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                      value={currentResume.personalInfo?.phone || ''}
                      onChange={e => handleFieldChange('personalInfo', 'phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                      value={currentResume.personalInfo?.email || ''}
                      onChange={e => handleFieldChange('personalInfo', 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                      value={currentResume.personalInfo?.location || ''}
                      onChange={e => handleFieldChange('personalInfo', 'location', e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-700">URLs / Portal Links</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LinkedIn</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                        value={currentResume.personalInfo?.linkedin || ''}
                        onChange={e => handleFieldChange('personalInfo', 'linkedin', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GitHub</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                        value={currentResume.personalInfo?.github || ''}
                        onChange={e => handleFieldChange('personalInfo', 'github', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Summary Editor */}
            {activeEditorTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800">Professional Summary</h3>
                  
                  {/* Summary AI Actions Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">AI Copilot:</span>
                    {['improve', 'concise', 'ats', 'tailor'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleEnhanceSummary(mode)}
                        className="text-[9px] font-semibold text-indigo-600 hover:underline capitalize"
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="w-full h-48 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none"
                  value={currentResume.summary || ''}
                  onChange={e => updateResume(resumeId, { summary: e.target.value })}
                />
              </div>
            )}

            {/* 3. Experience Editor */}
            {activeEditorTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 font-sans">Experiences</h3>
                  <button
                    onClick={() => {
                      const list = [...(currentResume.experiences || []), { company: '', role: '', location: '', startDate: '', endDate: '', current: false, descriptionBullets: [''] }];
                      updateResume(resumeId, { experiences: list });
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>

                {currentResume.experiences?.map((exp, expIdx) => (
                  <div key={expIdx} className="border border-slate-100 p-4 rounded-xl relative space-y-3 bg-slate-50/50">
                    <button
                      onClick={() => {
                        const list = currentResume.experiences.filter((_, idx) => idx !== expIdx);
                        updateResume(resumeId, { experiences: list });
                      }}
                      className="absolute right-3 top-3 p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company</label>
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                          value={exp.company}
                          onChange={e => {
                            const list = [...currentResume.experiences];
                            list[expIdx].company = e.target.value;
                            updateResume(resumeId, { experiences: list });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</label>
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                          value={exp.role}
                          onChange={e => {
                            const list = [...currentResume.experiences];
                            list[expIdx].role = e.target.value;
                            updateResume(resumeId, { experiences: list });
                          }}
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bullets</label>
                        <button
                          onClick={() => {
                            const list = [...currentResume.experiences];
                            list[expIdx].descriptionBullets.push('');
                            updateResume(resumeId, { experiences: list });
                          }}
                          className="text-[9px] font-bold text-indigo-600 hover:underline"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {exp.descriptionBullets?.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="space-y-1 bg-white p-2 rounded-lg border border-slate-100">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
                              value={bullet}
                              onChange={e => {
                                const list = [...currentResume.experiences];
                                list[expIdx].descriptionBullets[bulletIdx] = e.target.value;
                                updateResume(resumeId, { experiences: list });
                              }}
                            />
                            <button
                              onClick={() => {
                                const list = [...currentResume.experiences];
                                list[expIdx].descriptionBullets = list[expIdx].descriptionBullets.filter((_, idx) => idx !== bulletIdx);
                                updateResume(resumeId, { experiences: list });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Bullet-specific AI controls */}
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold mt-1">
                            <span>Refine:</span>
                            {['improve', 'concise', 'ats', 'verb', 'tailor'].map((mode) => (
                              <button
                                key={mode}
                                onClick={() => handleEnhanceBullet(expIdx, bulletIdx, mode)}
                                className="hover:underline text-indigo-600 capitalize font-medium"
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Projects Editor */}
            {activeEditorTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800">Projects</h3>
                  <button
                    onClick={() => {
                      const list = [...(currentResume.projects || []), { name: '', description: '', technologies: [], githubLink: '', liveLink: '', bullets: [''] }];
                      updateResume(resumeId, { projects: list });
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {currentResume.projects?.map((proj, projIdx) => (
                  <div key={projIdx} className="border border-slate-100 p-4 rounded-xl relative space-y-3 bg-slate-50/50">
                    <button
                      onClick={() => {
                        const list = currentResume.projects.filter((_, idx) => idx !== projIdx);
                        updateResume(resumeId, { projects: list });
                      }}
                      className="absolute right-3 top-3 p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
                      <input
                        type="text"
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                        value={proj.name}
                        onChange={e => {
                          const list = [...currentResume.projects];
                          list[projIdx].name = e.target.value;
                          updateResume(resumeId, { projects: list });
                        }}
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highlights</label>
                        <button
                          onClick={() => {
                            const list = [...currentResume.projects];
                            list[projIdx].bullets.push('');
                            updateResume(resumeId, { projects: list });
                          }}
                          className="text-[9px] font-bold text-indigo-600 hover:underline"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {proj.bullets?.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="space-y-1 bg-white p-2 rounded-lg border border-slate-100">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
                              value={bullet}
                              onChange={e => {
                                const list = [...currentResume.projects];
                                list[projIdx].bullets[bulletIdx] = e.target.value;
                                updateResume(resumeId, { projects: list });
                              }}
                            />
                            <button
                              onClick={() => {
                                const list = [...currentResume.projects];
                                list[projIdx].bullets = list[projIdx].bullets.filter((_, idx) => idx !== bulletIdx);
                                updateResume(resumeId, { projects: list });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold mt-1">
                            <span>Refine:</span>
                            {['improve', 'concise', 'ats', 'tailor'].map((mode) => (
                              <button
                                key={mode}
                                onClick={() => handleEnhanceProjBullet(projIdx, bulletIdx, mode)}
                                className="hover:underline text-indigo-600 capitalize font-medium"
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Skills Editor */}
            {activeEditorTab === 'skills' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800">Skills</h3>
                {[
                  { key: 'languages', label: 'Languages' },
                  { key: 'frameworks', label: 'Frameworks' },
                  { key: 'libraries', label: 'Libraries' },
                  { key: 'databases', label: 'Databases' },
                  { key: 'cloud', label: 'Cloud' },
                  { key: 'devops', label: 'DevOps' },
                  { key: 'tools', label: 'Tools' },
                  { key: 'softSkills', label: 'Soft Skills' }
                ].map(cat => (
                  <div key={cat.key}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{cat.label}</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
                      placeholder="e.g. Skill A, Skill B"
                      value={skillDrafts[cat.key] ?? (Array.isArray(currentResume.skills?.[cat.key]) ? currentResume.skills[cat.key].join(', ') : '')}
                      onChange={e => setSkillDrafts((drafts) => ({ ...drafts, [cat.key]: e.target.value }))}
                      onBlur={e => {
                        const items = e.target.value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
                        const updatedSkills = { ...currentResume.skills, [cat.key]: items };
                        updateResume(resumeId, { skills: updatedSkills });
                        setSkillDrafts((drafts) => ({ ...drafts, [cat.key]: items.join(', ') }));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 6. Education Editor */}
            {activeEditorTab === 'education' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800">Education</h3>
                  <button
                    onClick={() => {
                      const list = [...(currentResume.education || []), { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', relevantCoursework: '', location: '' }];
                      updateResume(resumeId, { education: list });
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Education
                  </button>
                </div>

                {currentResume.education?.map((edu, idx) => (
                  <div key={idx} className="border border-slate-100 p-4 rounded-xl relative space-y-3 bg-slate-50/50">
                    <button
                      onClick={() => {
                        const list = currentResume.education.filter((_, i) => i !== idx);
                        updateResume(resumeId, { education: list });
                      }}
                      className="absolute right-3 top-3 p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Institution</label>
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                          value={edu.institution}
                          onChange={e => {
                            const list = [...currentResume.education];
                            list[idx].institution = e.target.value;
                            updateResume(resumeId, { education: list });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Degree</label>
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                          value={edu.degree}
                          onChange={e => {
                            const list = [...currentResume.education];
                            list[idx].degree = e.target.value;
                            updateResume(resumeId, { education: list });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Field of Study</label>
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                          value={edu.field}
                          onChange={e => {
                            const list = [...currentResume.education];
                            list[idx].field = e.target.value;
                            updateResume(resumeId, { education: list });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GPA</label>
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                          value={edu.gpa}
                          onChange={e => {
                            const list = [...currentResume.education];
                            list[idx].gpa = e.target.value;
                            updateResume(resumeId, { education: list });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 7. Certifications Editor */}
            {activeEditorTab === 'certifications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800">Certifications</h3>
                  <button
                    onClick={() => {
                      const list = [...(currentResume.certifications || []), { title: '', issuer: '', date: '', credentialUrl: '', description: '' }];
                      updateResume(resumeId, { certifications: list });
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-semibold hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Cert
                  </button>
                </div>
                {(!currentResume.certifications || currentResume.certifications.length === 0) ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">No certifications added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {currentResume.certifications.map((cert, idx) => (
                      <div key={idx} className="border border-slate-100 p-3 rounded-lg relative space-y-3 bg-slate-50/50">
                        <button
                          onClick={() => {
                            const list = currentResume.certifications.filter((_, i) => i !== idx);
                            updateResume(resumeId, { certifications: list });
                          }}
                          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={cert.title}
                              onChange={e => {
                                const list = [...currentResume.certifications];
                                list[idx].title = e.target.value;
                                updateResume(resumeId, { certifications: list });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issuer</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={cert.issuer}
                              onChange={e => {
                                const list = [...currentResume.certifications];
                                list[idx].issuer = e.target.value;
                                updateResume(resumeId, { certifications: list });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                            <input
                              type="text"
                              placeholder="e.g. June 2026"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={cert.date}
                              onChange={e => {
                                const list = [...currentResume.certifications];
                                list[idx].date = e.target.value;
                                updateResume(resumeId, { certifications: list });
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">URL (Optional)</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={cert.credentialUrl}
                              onChange={e => {
                                const list = [...currentResume.certifications];
                                list[idx].credentialUrl = e.target.value;
                                updateResume(resumeId, { certifications: list });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 8. Achievements Editor */}
            {activeEditorTab === 'achievements' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800">Achievements</h3>
                  <button
                    onClick={() => {
                      const list = [...(currentResume.achievements || []), { title: '', organization: '', date: '', description: '' }];
                      updateResume(resumeId, { achievements: list });
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-semibold hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Achievement
                  </button>
                </div>
                {(!currentResume.achievements || currentResume.achievements.length === 0) ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">No achievements added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {currentResume.achievements.map((ach, idx) => (
                      <div key={idx} className="border border-slate-100 p-3 rounded-lg relative space-y-3 bg-slate-50/50">
                        <button
                          onClick={() => {
                            const list = currentResume.achievements.filter((_, i) => i !== idx);
                            updateResume(resumeId, { achievements: list });
                          }}
                          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={ach.title}
                              onChange={e => {
                                const list = [...currentResume.achievements];
                                list[idx].title = e.target.value;
                                updateResume(resumeId, { achievements: list });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organization</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={ach.organization}
                              onChange={e => {
                                const list = [...currentResume.achievements];
                                list[idx].organization = e.target.value;
                                updateResume(resumeId, { achievements: list });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={ach.date}
                              onChange={e => {
                                const list = [...currentResume.achievements];
                                list[idx].date = e.target.value;
                                updateResume(resumeId, { achievements: list });
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="mb-1 flex items-center justify-between"><label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Description</label><button type="button" disabled={loading || !ach.description} onClick={() => handleEnhanceAchievement(idx)} className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"><Sparkles className="h-3 w-3" />Enhance for ATS</button></div>
                            <textarea
                              rows={2}
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={ach.description}
                              onChange={e => {
                                const list = [...currentResume.achievements];
                                list[idx].description = e.target.value;
                                updateResume(resumeId, { achievements: list });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 9. Custom Sections Editor */}
            {activeEditorTab === 'customSections' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800">Custom Sections</h3>
                  <button
                    onClick={() => {
                      const list = [...(currentResume.customSections || []), { title: '', description: '', bullets: [''] }];
                      updateResume(resumeId, { customSections: list });
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-semibold hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>
                {(!currentResume.customSections || currentResume.customSections.length === 0) ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">No custom sections added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {currentResume.customSections.map((sec, idx) => (
                      <div key={idx} className="border border-slate-100 p-3 rounded-lg relative space-y-3 bg-slate-50/50">
                        <button
                          onClick={() => {
                            const list = currentResume.customSections.filter((_, i) => i !== idx);
                            updateResume(resumeId, { customSections: list });
                          }}
                          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Section Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Publications, Volunteering"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={sec.title}
                              onChange={e => {
                                const list = [...currentResume.customSections];
                                list[idx].title = e.target.value;
                                updateResume(resumeId, { customSections: list });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                              value={sec.description}
                              onChange={e => {
                                const list = [...currentResume.customSections];
                                list[idx].description = e.target.value;
                                updateResume(resumeId, { customSections: list });
                              }}
                            />
                          </div>

                          {/* Bullets */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bullets</label>
                              <button
                                onClick={() => {
                                  const list = [...currentResume.customSections];
                                  list[idx].bullets = [...(list[idx].bullets || []), ''];
                                  updateResume(resumeId, { customSections: list });
                                }}
                                className="text-[9px] font-bold text-indigo-600 hover:underline"
                              >
                                + Add Bullet
                              </button>
                            </div>
                            {sec.bullets?.map((bullet, bulletIdx) => (
                              <div key={bulletIdx} className="flex gap-2">
                                <input
                                  type="text"
                                  className="flex-1 text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                                  value={bullet}
                                  onChange={e => {
                                    const list = [...currentResume.customSections];
                                    list[idx].bullets[bulletIdx] = e.target.value;
                                    updateResume(resumeId, { customSections: list });
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const list = [...currentResume.customSections];
                                    list[idx].bullets = list[idx].bullets.filter((_, i) => i !== bulletIdx);
                                    updateResume(resumeId, { customSections: list });
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>}

        {/* Middle Panel: Live Resume Preview and Configs */}
        <div className="min-w-0 flex-1 overflow-hidden flex flex-col">
          
          {/* Preview Customization Top Bar */}
          <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex flex-wrap items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500" title="Resume appearance controls" aria-label="Resume appearance controls"><SlidersHorizontal className="h-3.5 w-3.5" /></div>
              {/* Template selection */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Template</label>
                <select
                  className="text-xs border rounded-lg px-2.5 py-1 font-medium bg-slate-50"
                  value={currentResume.template}
                  onChange={e => updateResume(resumeId, { template: e.target.value })}
                >
                  <option value="minimal">Minimal</option>
                  <option value="modern">Modern</option>
                  <option value="professional">Professional</option>
                  <option value="executive">Executive</option>
                  <option value="technical">Technical</option>
                  <option value="academic">Academic</option>
                  <option value="ats-safe">ATS Safe</option>
                </select>
              </div>

              {/* Accent Color picker */}
              {currentResume.template !== 'ats-safe' && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Accent Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      className="w-6 h-6 border rounded cursor-pointer p-0"
                      value={accentColor}
                      onChange={e => handleStylingChange('accentColor', e.target.value)}
                    />
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{accentColor}</span>
                  </div>
                </div>
              )}

              {/* Typography selectors */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Font</label>
                <select
                  className="text-xs border rounded-lg px-2.5 py-1 font-medium bg-slate-50"
                  value={fontSelection}
                  onChange={e => handleStylingChange('fontSelection', e.target.value)}
                >
                  <option value="Inter">Inter (Sans)</option>
                  <option value="Outfit">Outfit (Clean)</option>
                  <option value="EB Garamond">EB Garamond (Classic Serif)</option>
                  <option value="Lora">Lora (Elegant Serif)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Tech Code)</option>
                </select>
              </div>
            </div>

            {/* Toggle View [ Preview ] [ Source ] & Export */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-0.5 rounded-lg flex">
                <button
                  onClick={() => setRightPanelMode('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                    rightPanelMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={() => setRightPanelMode('sourceCode')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                    rightPanelMode === 'sourceCode' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Source
                </button>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Core Panel Content */}
          <div className="flex-1 overflow-auto p-5 lg:p-8 flex justify-center bg-slate-100">
            {rightPanelMode === 'preview' ? (
              <div id="resume-preview-container" className="w-[8.5in] max-w-full shrink-0 bg-white shadow-sm">
                <Templates resume={currentResume} />
              </div>
            ) : (
              // Source View
              <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl p-6 text-left font-mono text-xs text-slate-300 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-slate-400">Generated Resume Code</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={resetSourceCode}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[10px] transition"
                    >
                      Reset to Resume
                    </button>
                    <button
                      onClick={handleDownloadSource}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[10px] transition"
                    >
                      Download HTML
                    </button>
                    <button
                      onClick={handleDownloadLaTeX}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[10px] transition"
                    >
                      Download LaTeX
                    </button>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">HTML Structure</h5>
                  <textarea aria-label="Editable resume HTML" value={sourceCode.html} onChange={(event) => updateSourceCode('html', event.target.value)} spellCheck="false" className="h-72 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-5 text-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tailwind / CSS Variables</h5>
                  <textarea aria-label="Editable resume CSS" value={sourceCode.css} onChange={(event) => updateSourceCode('css', event.target.value)} spellCheck="false" className="h-48 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-5 text-slate-200 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">LaTeX Template Equivalent</h5>
                  <textarea aria-label="Editable resume LaTeX" value={sourceCode.latex} onChange={(event) => updateSourceCode('latex', event.target.value)} spellCheck="false" className="h-72 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-5 text-slate-200 outline-none focus:border-indigo-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rightmost Panels: Slide Out Drawers */}
        {activeSideDrawer && showFeaturesPanel && (
          <div style={{ width: `${sidePanelWidth}px` }} className="fixed inset-x-0 bottom-0 top-20 z-40 min-h-0 border-l border-slate-200 bg-white shadow-xl lg:static lg:h-full lg:shrink-0 animate-slide-in">
            <button type="button" onMouseDown={startSidebarResize} className="absolute -left-2 top-0 z-10 hidden h-full w-4 cursor-col-resize items-center justify-center border-0 bg-transparent text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 lg:flex" title="Drag left or right to resize this panel" aria-label="Drag left or right to resize this panel"><span className="rounded-full border border-slate-200 bg-white p-1 shadow-sm"><GripVertical className="h-3.5 w-3.5" /></span></button>
            <button type="button" onClick={() => setActiveSideDrawer(null)} className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close sidebar" aria-label="Close sidebar"><PanelRightClose className="h-4 w-4" /></button>
            {activeSideDrawer === 'ats' ? <AtsAnalyzer /> : <Copilot />}
          </div>
        )}
      </div>

      {showJobDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Step 1 of 2</p><h2 className="mt-1 text-lg font-bold text-slate-900">Tailor your full resume</h2><p className="mt-1 text-xs leading-5 text-slate-500">We compare every resume section with this role, then offer reviewable changes. Nothing is applied automatically.</p></div><button type="button" onClick={() => setShowJobDescriptionModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-[10px]"><div className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><strong className="block">1. Analyze</strong>Requirements & keywords</div><div className="rounded-lg bg-slate-50 p-2 text-slate-600"><strong className="block">2. Review</strong>Section-by-section changes</div><div className="rounded-lg bg-slate-50 p-2 text-slate-600"><strong className="block">3. Measure</strong>Updated ATS score</div></div>
            <textarea autoFocus value={jobDescriptionDraft} onChange={(event) => setJobDescriptionDraft(event.target.value)} placeholder="Paste job description…" className="mt-4 h-64 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={savingJobDescription} onClick={() => setShowJobDescriptionModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={savingJobDescription || !jobDescriptionDraft.trim()} onClick={handleAnalyzeAndTailor} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">{savingJobDescription && <Sparkles className="h-3.5 w-3.5 animate-pulse" />}{savingJobDescription ? 'Analyzing & tailoring…' : 'Analyze & Tailor'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- AI TAILORING SUGGESTIONS DRAWER MODAL --- */}
      {tailorSuggestions && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white border-l border-slate-200 max-w-2xl w-full h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Step 2 of 2 · Review changes</p><h3 className="mt-1 text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Full Resume Tailoring Plan
                </h3></div>
                <button
                  onClick={() => setTailorSuggestions(null)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="space-y-6 text-xs">
                <div>
                  <div className="flex items-baseline justify-between gap-3"><h4 className="font-bold text-slate-800">Choose a tailored resume version</h4><span className="text-[10px] text-slate-400">The highest-scoring truthful version is selected automatically.</span></div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {tailoringOptions(tailorSuggestions).map((variant) => <button type="button" key={variant.id} onClick={() => setSelectedTailorVariant(variant.id)} className={`rounded-xl border p-3 text-left transition ${selectedTailorVariant === variant.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-200'}`}><div className="flex items-center justify-between gap-2"><span className="font-bold text-slate-800">{variant.title}</span>{selectedTailorVariant === variant.id && <CheckCircle className="h-3.5 w-3.5 text-indigo-600" />}</div><p className="mt-1 text-[10px] leading-4 text-slate-500">{variant.description}</p><p className="mt-2 text-[10px] font-semibold text-indigo-700">Complete resume · ATS {tailorOptionScores[variant.id]?.overallScore ?? '…'}/100</p>{bestTailorVariant === variant.id && bestTailorScore !== undefined && <p className={`mt-1 text-[10px] font-bold ${bestTailorScore >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>{bestTailorScore >= 75 ? 'Best truthful match · 75+ target reached' : 'Best truthful match · improve missing real experience for 75+'}</p>}</button>)}
                  </div>
                  {bestTailorScore !== undefined && bestTailorScore < 75 && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900"><strong>No 75+ resume is available yet.</strong> The best truthful version is {bestTailorScore}/100. Use the readiness plan below, learn the relevant skills, then confirm them and add genuine project or experience evidence before relying on a 75+ score.</div>}
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Previewing {selectedTailorVariant} version</span><span className="text-[10px] font-semibold text-slate-700">ATS {tailorOptionScores[selectedTailorVariant]?.overallScore ?? '…'}/100</span></div>
                    <div className="max-h-80 overflow-auto bg-white p-4"><div className="origin-top scale-[0.72]" style={{ width: '138%' }}><Templates resume={buildTailoredResume(currentResume, tailorSuggestions, selectedTailorVariant)} /></div></div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3"><p className="font-bold text-indigo-900">ATS focus</p><p className="mt-1 text-[11px] leading-4 text-indigo-800">Truthful terms to make more visible in matching sections.</p><div className="mt-2 flex flex-wrap gap-1">{(tailorSuggestions.atsFocus || []).map((item) => <span key={item} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-indigo-700">{item}</span>)}</div></div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><p className="font-bold text-amber-900">Gaps to address honestly</p><p className="mt-1 text-[11px] leading-4 text-amber-800">These are identified, never fabricated into the resume.</p><div className="mt-2 flex flex-wrap gap-1">{(tailorSuggestions.missingRequirements || []).slice(0, 6).map((item) => <span key={item} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-amber-800">{item}</span>)}</div></div>
                </div>
                {tailorSuggestions.optimizedResume && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-[11px] text-indigo-900">
                    <strong>Full-resume rewrite ready.</strong> The selected version refreshes every eligible section—summary, experience, projects, skills order, certifications, achievements, and custom sections—using only information already in this resume.
                  </div>
                )}
                {tailorSuggestions.skillsToConfirm?.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <h4 className="font-bold text-emerald-900">75+ readiness plan</h4>
                    <p className="mt-1 text-[11px] leading-4 text-emerald-800">Plan gaps now, learn them before applying, then confirm them to add them to the resume and recalculate its real ATS score.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tailorSuggestions.skillsToConfirm.map((suggestion) => (
                        <div key={suggestion.skill} className="rounded-lg border border-emerald-200 bg-white p-2.5 text-left text-[10px] text-emerald-900"><span className="block font-bold">{suggestion.skill}</span>{suggestion.reason && <span className="mt-0.5 block text-emerald-700">{suggestion.reason}</span>}<div className="mt-2 flex gap-1.5"><button type="button" onClick={() => addToLearningPlan(suggestion)} className="rounded border border-emerald-200 px-1.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100">Plan to learn</button><button type="button" onClick={() => addConfirmedSkill(suggestion)} className="rounded bg-emerald-600 px-1.5 py-1 font-semibold text-white hover:bg-emerald-700">I learned this</button></div></div>
                      ))}
                    </div>
                  </div>
                )}
                {currentResume.targetSkillPlan?.length > 0 && <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-[11px] text-sky-900"><strong>Saved learning plan</strong><p className="mt-1 text-sky-800">These are preparation goals, not resume claims: {currentResume.targetSkillPlan.map(item => item.skill).filter(Boolean).join(', ')}.</p></div>}
                {/* Summary suggestion */}
                {tailorSuggestions.summary?.suggested && (
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 mb-1">Tailored Summary Suggestions</h4>
                    <p className="text-[10px] text-slate-400 mb-2">{tailorSuggestions.summary.reason}</p>
                    <div className="space-y-2">
                      <div className="p-2 border bg-white rounded text-[11px] text-slate-500 line-through">
                        {tailorSuggestions.summary.original}
                      </div>
                      <div className="p-2 border border-indigo-200 bg-indigo-50/20 text-[11px] text-slate-700 font-medium rounded">
                        {tailorSuggestions.summary.suggested}
                      </div>
                      <button
                        onClick={() => applyTailorSuggestion('summary', tailorSuggestions.summary.suggested)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold"
                      >
                        Apply Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Experience Bullets */}
                {tailorSuggestions.experienceBullets?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800">Experience Statement Suggestion updates</h4>
                    {tailorSuggestions.experienceBullets.map((sug, i) => (
                      <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                        <p className="text-[10px] text-slate-400">{sug.reason}</p>
                        <div className="p-2 border bg-white rounded text-[11px] text-slate-500 line-through">
                          {sug.original}
                        </div>
                        <div className="p-2 border border-indigo-200 bg-indigo-50/20 text-[11px] text-slate-700 font-medium rounded">
                          {sug.suggested}
                        </div>
                        <button
                          onClick={() => applyTailorSuggestion('experience', sug)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold"
                        >
                          Apply Change
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {tailorSuggestions.projects?.length > 0 && (
                  <div className="space-y-4"><h4 className="font-bold text-slate-800">Project statement updates</h4>{tailorSuggestions.projects.map((sug, index) => <div key={`${sug.projectId}-${index}`} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4"><p className="text-[10px] text-slate-400">{sug.reason}</p><div className="rounded border bg-white p-2 text-[11px] text-slate-500 line-through">{sug.original}</div><div className="rounded border border-indigo-200 bg-indigo-50/20 p-2 text-[11px] font-medium text-slate-700">{sug.suggested}</div><button onClick={() => applyTailorSuggestion('project', sug)} className="rounded bg-indigo-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500">Apply Change</button></div>)}</div>
                )}

                {tailorSuggestions.sectionRecommendations?.length > 0 && <div className="rounded-xl border border-slate-200 p-4"><h4 className="font-bold text-slate-800">Whole-resume recommendations</h4><ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-5 text-slate-600">{tailorSuggestions.sectionRecommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t pt-4 sm:grid-cols-4"><button onClick={() => setTailorSuggestions(null)} className="rounded-lg border py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Keep reviewing later</button><button onClick={openAtsTargetBlueprint} className="rounded-lg border border-amber-200 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50">Compare 75+ target</button><button onClick={applyAllTailorSuggestions} className="rounded-lg border border-indigo-200 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Apply selected version</button><button onClick={createAtsOptimizedCopy} className="rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500">Create best-scoring copy</button></div>
          </div>
        </div>
      )}

      {showAtsTargetBlueprint && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Preparation benchmark · not a submit-ready resume</p><h3 className="mt-1 text-lg font-bold text-slate-900">Compare with a 75+ target blueprint</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">The right panel is a scored checklist with placeholders, not your resume. Complete genuine learning, projects, or work evidence before moving anything from it into your real resume.</p></div><button type="button" onClick={() => setShowAtsTargetBlueprint(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="overflow-hidden rounded-xl border border-slate-200"><div className="flex justify-between bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><span>Your selected resume</span><span>ATS {tailorOptionScores[selectedTailorVariant]?.overallScore ?? '…'}/100</span></div><div className="max-h-[58vh] overflow-auto bg-white p-3"><Templates resume={buildTailoredResume(currentResume, tailorSuggestions, selectedTailorVariant)} /></div></div><div className="overflow-hidden rounded-xl border border-amber-200"><div className="flex justify-between bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900"><span>75+ target blueprint</span><span>Benchmark ATS {atsTargetBlueprintScore?.overallScore ?? '…'}/100</span></div><div className="max-h-[58vh] overflow-auto bg-white p-3"><Templates resume={buildAtsTargetBlueprint(currentResume, tailorOptionScores[bestTailorVariant]?.jdAnalysis)} /></div></div></div>
          </div>
        </div>
      )}

      {/* --- AI RECRUITER CRITIC MODAL --- */}
      {showCriticModal && reviewResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto relative">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Recruiter Critique & Review
            </h3>

            <div className="space-y-6 text-xs text-left">
              {/* Recruiter Impression */}
              <div className="p-4 bg-slate-50 border rounded-xl border-slate-200">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-slate-400 mb-1">Recruiter Impression</h4>
                <p className="text-slate-600 leading-relaxed italic">"{reviewResult.recruiterImpression}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div>
                  <h4 className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Strengths
                  </h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                    {reviewResult.strengths?.map((str, i) => <li key={i}>{str}</li>)}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h4 className="font-bold text-rose-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Weaknesses
                  </h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                    {reviewResult.weaknesses?.map((wk, i) => <li key={i}>{wk}</li>)}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-indigo-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Actionable Recommendations
                </h4>
                <ul className="list-decimal pl-4 space-y-1.5 text-slate-600 leading-relaxed">
                  {reviewResult.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-6 border-t mt-6">
              <button
                onClick={() => setShowCriticModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                Close Critique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
