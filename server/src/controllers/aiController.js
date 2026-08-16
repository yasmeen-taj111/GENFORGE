const aiService = require('../services/ai/aiService');
const JD_STOP_WORDS = new Set('a an the and or to of in for with on at from by as is are be will you your our we this that have has years year role job work experience required preferred strong excellent ability'.split(' '));
const normalizeText = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9+#./ -]/g, ' ').replace(/\s+/g, ' ').trim();
const uniqueTerms = (items) => [...new Set(items.map(normalizeText).filter(Boolean))];
const localJDAnalysis = (jdText) => {
  const text = normalizeText(jdText);
  const keywords = uniqueTerms(text.split(' ').filter(word => word.length > 2 && !JD_STOP_WORDS.has(word))).slice(0, 80);
  const requiredSkills = uniqueTerms((text.match(/(?:must|required|need to|should have)\s+([^.;\n]+)/g) || []).flatMap(line => line.split(/[,:/]/))).filter(Boolean);
  const title = (String(jdText).match(/(?:job title|role)\s*:\s*([^\n]+)/i) || [])[1] || '';
  return { title, requiredSkills, preferredSkills: [], technologies: [], responsibilities: [], educationRequirements: '', experienceRequirements: '', softSkills: [], keywords, domainTerminology: [], localFallback: true };
};
const localTailorSuggestions = (resume, jdText) => {
  const jd = localJDAnalysis(jdText);
  const resumeText = normalizeText([resume.summary, ...Object.values(resume.skills || {}).flatMap(value => Array.isArray(value) ? value : []), ...(resume.experiences || []).flatMap(item => [item.role, ...(item.descriptionBullets || [])]), ...(resume.projects || []).flatMap(item => [item.name, ...(item.technologies || []), ...(item.bullets || [])]), ...(resume.certifications || []).flatMap(item => [item.title, item.issuer, item.description]), ...(resume.achievements || []).flatMap(item => [item.title, item.organization, item.description]), ...(resume.customSections || []).flatMap(item => [item.title, item.description, ...(item.bullets || [])])].join(' '));
  const supported = jd.keywords.filter(term => resumeText.includes(term)).slice(0, 5);
  const polish = (value = '') => {
    const text = String(value).replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const sentence = text.charAt(0).toUpperCase() + text.slice(1);
    return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
  };
  const summary = resume.summary && supported.length ? { original: resume.summary, suggested: `${resume.summary.trim().replace(/[.\s]+$/, '')}. Relevant strengths include ${supported.join(', ')}.`, reason: 'Highlights JD terms already supported elsewhere in your resume.' } : null;
  const optimizedResume = {
    summary: summary?.suggested || polish(resume.summary),
    experiences: (resume.experiences || []).map(item => ({ experienceId: String(item._id), descriptionBullets: (item.descriptionBullets || []).map(polish) })),
    projects: (resume.projects || []).map(item => ({ projectId: String(item._id), description: polish(item.description), bullets: (item.bullets || []).map(polish) })),
    achievements: (resume.achievements || []).map(item => ({ achievementId: String(item._id), description: polish(item.description) })),
    certifications: (resume.certifications || []).map(item => ({ certificationId: String(item._id), description: polish(item.description) })),
    customSections: (resume.customSections || []).map(item => ({ sectionId: String(item._id), description: polish(item.description), bullets: (item.bullets || []).map(polish) }))
  };
  const missingTerms = jd.keywords.filter(term => !resumeText.includes(term)).slice(0, 12);
  return {
    optimizedResume,
    summary,
    experienceBullets: [],
    projects: [],
    atsFocus: supported,
    // Keep the learning workflow useful when the configured AI provider is
    // unavailable. These are planning suggestions, never resume claims.
    skillsToConfirm: missingTerms.slice(0, 8).map(skill => ({ skill, category: 'tools', reason: 'This term appears in the target job description. Learn and use it before adding it to your resume.' })),
    missingRequirements: missingTerms,
    sectionRecommendations: supported.length ? ['Review the complete locally prepared rewrite, then use a configured AI provider for deeper tailoring.'] : ['Build genuine projects or experience with the missing target skills before applying for this role.'],
    localFallback: true
  };
};

// AI providers occasionally return an index as a string or omit an embedded
// Mongo id. Normalize each suggestion against the submitted resume before it
// reaches the UI, so "Apply" always changes the intended current bullet.
const normalizeTailorSuggestions = (suggestions, resumeData, includeOptions = true) => {
  const result = suggestions && typeof suggestions === 'object' ? suggestions : {};
  const normalizeItems = (items, entries, idKey, bulletsKey) => (Array.isArray(items) ? items : []).map((item) => {
    const entry = entries.find(candidate => String(candidate._id) === String(item?.[idKey]))
      || entries.find(candidate => (candidate[bulletsKey] || []).includes(item?.original));
    if (!entry) return null;
    const bulletIndex = Number.isInteger(Number(item.bulletIndex)) ? Number(item.bulletIndex) : (entry[bulletsKey] || []).indexOf(item.original);
    const original = entry[bulletsKey]?.[bulletIndex];
    const suggested = String(item?.suggested || '').trim();
    if (!original || !suggested || suggested === original) return null;
    return { ...item, [idKey]: String(entry._id), bulletIndex, original, suggested };
  }).filter(Boolean);

  const summarySuggested = String(result.summary?.suggested || '').trim();
  const allowedSkillCategories = new Set(['languages', 'frameworks', 'libraries', 'databases', 'cloud', 'devops', 'tools', 'softSkills']);
  const knownSkills = new Set(Object.values(resumeData.skills || {}).flatMap(value => Array.isArray(value) ? value : []).map(normalizeText));
  const skillsToConfirm = (Array.isArray(result.skillsToConfirm) ? result.skillsToConfirm : [])
    .map((item) => ({
      skill: String(item?.skill || '').trim(),
      category: allowedSkillCategories.has(item?.category) ? item.category : 'tools',
      reason: String(item?.reason || '').trim()
    }))
    .filter((item, index, items) => item.skill && !knownSkills.has(normalizeText(item.skill)) && items.findIndex(candidate => normalizeText(candidate.skill) === normalizeText(item.skill)) === index)
    .slice(0, 8);
  const normalizeFullEntries = (items, entries, idKey, bulletsKey, extraFields = []) => (Array.isArray(items) ? items : []).map((item) => {
    const entry = entries.find(candidate => String(candidate._id) === String(item?.[idKey]));
    if (!entry) return null;
    const rewrittenBullets = Array.isArray(item?.[bulletsKey]) ? item[bulletsKey].map(value => String(value || '').trim()).filter(Boolean) : [];
    // Preserve the original number of bullets. This prevents an AI response
    // from silently adding responsibilities that were not supplied by the user.
    const bullets = rewrittenBullets.length === (entry[bulletsKey] || []).length ? rewrittenBullets : entry[bulletsKey] || [];
    const normalized = { ...entry, [bulletsKey]: bullets };
    extraFields.forEach((field) => {
      if (typeof item?.[field] === 'string' && item[field].trim()) normalized[field] = item[field].trim();
    });
    return normalized;
  }).filter(Boolean);
  const fullExperienceUpdates = normalizeFullEntries(result.optimizedResume?.experiences, resumeData.experiences || [], 'experienceId', 'descriptionBullets');
  const fullProjectUpdates = normalizeFullEntries(result.optimizedResume?.projects, resumeData.projects || [], 'projectId', 'bullets', ['description']);
  const fullAchievementUpdates = (Array.isArray(result.optimizedResume?.achievements) ? result.optimizedResume.achievements : []).map((item) => {
    const entry = (resumeData.achievements || []).find(candidate => String(candidate._id) === String(item?.achievementId));
    if (!entry || typeof item?.description !== 'string' || !item.description.trim()) return null;
    return { ...entry, description: item.description.trim() };
  }).filter(Boolean);
  const normalizeDescriptions = (items, entries, idKey) => (Array.isArray(items) ? items : []).map((item) => {
    const entry = entries.find(candidate => String(candidate._id) === String(item?.[idKey]));
    if (!entry || typeof item?.description !== 'string' || !item.description.trim()) return null;
    return { ...entry, description: item.description.trim() };
  }).filter(Boolean);
  const fullCertificationUpdates = normalizeDescriptions(result.optimizedResume?.certifications, resumeData.certifications || [], 'certificationId');
  const fullCustomSectionUpdates = normalizeFullEntries(result.optimizedResume?.customSections, resumeData.customSections || [], 'sectionId', 'bullets', ['description']);
  const ordering = Array.isArray(result.optimizedResume?.skillsOrdering) ? result.optimizedResume.skillsOrdering : result.skillsOrdering;
  const skillOrder = Array.isArray(ordering) ? ordering.filter(key => Object.prototype.hasOwnProperty.call(resumeData.skills || {}, key)) : [];
  const reorderedSkills = skillOrder.length ? Object.fromEntries([...skillOrder, ...Object.keys(resumeData.skills || {}).filter(key => !skillOrder.includes(key))].map(key => [key, resumeData.skills[key]])) : resumeData.skills;
  const hasOptimizedResume = Boolean(result.optimizedResume && (fullExperienceUpdates.length || fullProjectUpdates.length || fullAchievementUpdates.length || fullCertificationUpdates.length || fullCustomSectionUpdates.length || String(result.optimizedResume.summary || '').trim()));
  const optimizedResume = hasOptimizedResume ? {
    summary: String(result.optimizedResume?.summary || '').trim() || resumeData.summary,
    experiences: (resumeData.experiences || []).map(entry => fullExperienceUpdates.find(item => String(item._id) === String(entry._id)) || entry),
    projects: (resumeData.projects || []).map(entry => fullProjectUpdates.find(item => String(item._id) === String(entry._id)) || entry),
    achievements: (resumeData.achievements || []).map(entry => fullAchievementUpdates.find(item => String(item._id) === String(entry._id)) || entry),
    certifications: (resumeData.certifications || []).map(entry => fullCertificationUpdates.find(item => String(item._id) === String(entry._id)) || entry),
    customSections: (resumeData.customSections || []).map(entry => fullCustomSectionUpdates.find(item => String(item._id) === String(entry._id)) || entry),
    skills: reorderedSkills
  } : null;
  const normalized = {
    ...result,
    summary: resumeData.summary && summarySuggested && summarySuggested !== resumeData.summary
      ? { ...result.summary, original: resumeData.summary, suggested: summarySuggested }
      : null,
    experienceBullets: normalizeItems(result.experienceBullets, resumeData.experiences || [], 'experienceId', 'descriptionBullets'),
    projects: normalizeItems(result.projects, resumeData.projects || [], 'projectId', 'bullets'),
    atsFocus: Array.isArray(result.atsFocus) ? result.atsFocus.filter(Boolean).slice(0, 5) : [],
    skillsToConfirm,
    optimizedResume,
    missingRequirements: Array.isArray(result.missingRequirements) ? result.missingRequirements.filter(Boolean) : [],
    sectionRecommendations: Array.isArray(result.sectionRecommendations) ? result.sectionRecommendations.filter(Boolean) : []
  };
  if (!includeOptions) return normalized;

  const rawOptions = Array.isArray(result.options) ? result.options : [];
  const options = rawOptions.slice(0, 3).map((option, index) => {
    const optionResult = normalizeTailorSuggestions({ ...result, ...option, options: undefined }, resumeData, false);
    if (!optionResult.optimizedResume) return null;
    return {
      id: ['ats-optimized', 'balanced', 'concise-impact'].includes(option.id) ? option.id : `option-${index + 1}`,
      title: String(option.title || ['ATS-optimized', 'Balanced', 'Concise impact'][index] || `Option ${index + 1}`).trim(),
      description: String(option.description || 'Complete truthful resume rewrite.').trim(),
      optimizedResume: optionResult.optimizedResume
    };
  }).filter(Boolean);

  // Older providers and the local fallback return one rewrite. Still expose
  // three complete choices rather than partial subsets of that rewrite.
  if (!options.length && normalized.optimizedResume) {
    ['ATS-optimized', 'Balanced', 'Concise impact'].forEach((title, index) => options.push({
      id: ['ats-optimized', 'balanced', 'concise-impact'][index],
      title,
      description: index === 0 ? 'Complete truthful rewrite with the strongest supported keyword coverage.' : 'Complete truthful rewrite ready to review.',
      optimizedResume: normalized.optimizedResume
    }));
  }
  return { ...normalized, options };
};

const enhanceSummaryController = async (req, res) => {
  try {
    const { summary, targetRole, jobDescription, mode } = req.body;
    if (!summary) {
      return res.status(400).json({ message: 'Summary is required' });
    }
    const enhanced = await aiService.enhanceSummary(summary, targetRole, jobDescription, mode);
    return res.json({ enhanced });
  } catch (error) {
    console.error('Enhance summary controller error:', error);
    return res.status(502).json({ message: 'We could not enhance the summary right now. Please try again.' });
  }
};

const enhanceBulletController = async (req, res) => {
  try {
    const { bulletText, jobDescription, mode } = req.body;
    if (!bulletText) {
      return res.status(400).json({ message: 'Bullet text is required' });
    }
    const enhanced = await aiService.enhanceBullet(bulletText, jobDescription, mode);
    return res.json({ enhanced });
  } catch (error) {
    console.error('Enhance bullet controller error:', error);
    return res.status(502).json({ message: 'We could not improve that bullet right now. Please try again.' });
  }
};

const analyzeJobDescriptionController = async (req, res) => {
  try {
    const { jdText } = req.body;
    if (!jdText) {
      return res.status(400).json({ message: 'Job Description text is required' });
    }
    const analyzed = await aiService.analyzeJobDescription(jdText);
    return res.json(analyzed);
  } catch (error) {
    console.error('Analyze JD controller error:', error);
    // Tailoring must still be usable when a provider key/rate-limit fails.
    return res.json(localJDAnalysis(req.body.jdText));
  }
};

const tailorResumeController = async (req, res) => {
  try {
    const { resumeData, jdText } = req.body;
    if (!resumeData || !jdText) {
      return res.status(400).json({ message: 'Resume data and JD text are required' });
    }
    const suggestions = await aiService.tailorResume(resumeData, jdText);
    return res.json(normalizeTailorSuggestions(suggestions, resumeData));
  } catch (error) {
    console.error('Tailor resume controller error:', error);
    return res.json(normalizeTailorSuggestions(localTailorSuggestions(req.body.resumeData, req.body.jdText), req.body.resumeData));
  }
};

const reviewResumeController = async (req, res) => {
  try {
    const { resumeData, jdText } = req.body;
    if (!resumeData) {
      return res.status(400).json({ message: 'Resume data is required' });
    }
    const review = await aiService.criticResume(resumeData, jdText);
    return res.json(review);
  } catch (error) {
    console.error('Review resume controller error:', error);
    return res.status(502).json({ message: 'We could not review this resume right now. Please try again.' });
  }
};

const copilotChatController = async (req, res) => {
  try {
    const { messages, resumeContext, jdContext, profileContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }
    const reply = await aiService.copilotChat(messages, resumeContext, jdContext, profileContext);
    return res.json({ reply });
  } catch (error) {
    console.error('Copilot chat controller error:', error);
    return res.status(502).json({ message: 'The Copilot is temporarily unavailable. Please try again.' });
  }
};

module.exports = {
  enhanceSummaryController,
  enhanceBulletController,
  analyzeJobDescriptionController,
  tailorResumeController,
  reviewResumeController,
  copilotChatController
};
