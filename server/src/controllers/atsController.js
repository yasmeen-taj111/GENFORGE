const crypto = require('crypto');
const Resume = require('../models/resume');
const SCORING_VERSION = '2026-08-ats-whole-resume-v3';

// Job descriptions contain a great deal of boilerplate. Scoring every word
// (the previous implementation used the first 80) made a strong, truthful
// match look artificially weak. Keep only terms which could reasonably be a
// title, skill, domain, or responsibility signal.
const STOP = new Set('a an the and or to of in for with on at from by as is are be will you your our we this that have has must need should years year role job work experience required preferred strong excellent ability candidate candidates team teams position responsibilities responsibility include including about who what when where why how their they them us hiring looking seeking join ensure build built support supporting knowledge understanding plus across within through based related relevant environment environments opportunity qualifications qualification degree bachelor master'.split(' '));
const normalize = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9+#./ -]/g, ' ').replace(/\s+/g, ' ').trim();
const unique = (items) => [...new Set(items.map(normalize).filter(Boolean))];
const contains = (text, term) => text.includes(normalize(term));
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const scoreInput = (resume, jdText) => ({
  scoringVersion: SCORING_VERSION,
  jd: normalize(jdText), targetRole: normalize(resume.targetRole), summary: normalize(resume.summary),
  personalInfo: { email: normalize(resume.personalInfo?.email), phone: normalize(resume.personalInfo?.phone) },
  skills: Object.values(resume.skills || {}).flatMap(item => Array.isArray(item) ? item.map(normalize).sort() : []).sort(),
  experiences: (resume.experiences || []).map(item => ({ role: normalize(item.role), company: normalize(item.company), bullets: (item.descriptionBullets || []).map(normalize) })),
  projects: (resume.projects || []).map(item => ({ name: normalize(item.name), description: normalize(item.description), technologies: (item.technologies || []).map(normalize), bullets: (item.bullets || []).map(normalize) })),
  education: (resume.education || []).map(item => ({ degree: normalize(item.degree), field: normalize(item.field), institution: normalize(item.institution), coursework: normalize(item.relevantCoursework) })),
  certifications: (resume.certifications || []).map(item => ({ title: normalize(item.title), issuer: normalize(item.issuer), description: normalize(item.description) })),
  achievements: (resume.achievements || []).map(item => ({ title: normalize(item.title), organization: normalize(item.organization), description: normalize(item.description) })),
  customSections: (resume.customSections || []).map(item => ({ title: normalize(item.title), description: normalize(item.description), bullets: (item.bullets || []).map(normalize) }))
});

const signalTerms = (value = '', limit = 30) => unique(normalize(value).split(' ')
  .map(word => word.replace(/^[./]+|[./]+$/g, ''))
  .filter(word => word.length > 2 && !STOP.has(word)))
  .slice(0, limit);

const parseJD = (jdText = '') => {
  const sourceHash = hash(normalize(jdText));
  const text = normalize(jdText);
  const keywords = signalTerms(text);
  // A requirement was previously stored as a whole sentence, so an otherwise
  // matching resume could never satisfy it. Score the meaningful individual
  // terms from explicit requirement clauses instead.
  const requiredSkills = unique((String(jdText).match(/(?:must|required|need to|should have)\s+([^\n]+)/gi) || [])
    .flatMap(line => signalTerms(line, 20)))
    .slice(0, 15);
  return { keywords, requiredSkills, sourceHash };
};

const scoreResume = (resume, jdText) => {
  // Never use persisted/AI-derived JD fields to compute a score. Legacy data
  // can differ between requests; normalized JD text is the only score input.
  const jdAnalysis = parseJD(jdText);
  const skills = unique(Object.values(resume.skills || {}).flatMap(item => Array.isArray(item) ? item : []));
  const experienceText = normalize([...(resume.experiences || []).flatMap(item => [item.role, item.company, ...(item.descriptionBullets || [])]), ...(resume.projects || []).flatMap(item => [item.name, item.description, ...(item.technologies || []), ...(item.bullets || [])]), ...(resume.certifications || []).flatMap(item => [item.title, item.issuer, item.description]), ...(resume.achievements || []).flatMap(item => [item.title, item.organization, item.description]), ...(resume.customSections || []).flatMap(item => [item.title, item.description, ...(item.bullets || [])]), ...(resume.education || []).flatMap(item => [item.degree, item.field, item.relevantCoursework])].join(' '));
  const allText = normalize([resume.targetRole, resume.summary, resume.personalInfo?.name, resume.personalInfo?.location, experienceText, ...skills].join(' '));
  const terms = jdAnalysis.keywords;
  // Limit the fallback set to the highest-signal terms. This remains a
  // deterministic comparison, but does not penalize candidates for every
  // unrelated word in a long JD.
  // Skills coverage should represent the core must-haves, not every noun in a
  // long requirement sentence. Broader duties remain part of keyword and
  // experience relevance below.
  const required = jdAnalysis.requiredSkills.length ? jdAnalysis.requiredSkills.slice(0, 8) : terms.slice(0, 12);
  const ratio = (list, check) => list.length ? Math.round((list.filter(check).length / list.length) * 100) : 0;
  const keyword = ratio(terms, term => contains(allText, term));
  const requirements = ratio(required, term => contains(allText, term));
  const skill = ratio(required, term => skills.some(item => item === normalize(term) || item.includes(normalize(term)) || normalize(term).includes(item)));
  const experience = ratio(terms, term => contains(experienceText, term));
  const structure = (resume.summary ? 25 : 0) + ((resume.experiences || []).length ? 25 : 0) + (skills.length ? 25 : 0) + ((resume.education || []).length ? 25 : 0);
  const formatting = (resume.personalInfo?.email ? 50 : 0) + ((resume.experiences || []).some(item => (item.descriptionBullets || []).some(Boolean)) ? 50 : 0);
  const points = (percent, max) => Math.round((percent * max) / 100);
  const breakdown = { keywordMatch: { score: points(keyword, 30), max: 30 }, skillsCoverage: { score: points(skill, 20), max: 20 }, jdRelevance: { score: points(requirements, 20), max: 20 }, experienceRelevance: { score: points(experience, 15), max: 15 }, completeness: { score: points(structure, 10), max: 10 }, formatting: { score: points(formatting, 5), max: 5 } };
  const overallScore = Object.values(breakdown).reduce((total, item) => total + item.score, 0);
  const strongMatches = terms.filter(term => contains(allText, term));
  const missing = terms.filter(term => !contains(allText, term));
  const fingerprint = hash(JSON.stringify(scoreInput(resume, jdText)));
  const versionId = fingerprint.slice(0, 16);
  return { overallScore, versionId, fingerprint, jdAnalysis, breakdown, keywordsAnalysis: { strongMatches, missing, underrepresented: strongMatches.filter(term => !contains(experienceText, term)) } };
};

const analyzeATS = async (req, res) => {
  try {
    const { resumeId, jdText } = req.body;
    if (!resumeId || !jdText?.trim()) return res.status(400).json({ message: 'Resume ID and Job Description text are required' });
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    const fingerprint = hash(JSON.stringify(scoreInput(resume.toObject(), jdText)));
    if (resume.atsAnalysis?.fingerprint === fingerprint) return res.json({ ...resume.atsAnalysis, cached: true });
    const result = scoreResume(resume.toObject(), jdText);
    resume.jobDescription.descriptionText = jdText.trim();
    resume.jobDescription.analyzedData = result.jdAnalysis;
    resume.atsScore = result.overallScore;
    resume.atsAnalysis = result;
    await resume.save();
    return res.json(result);
  } catch (error) { console.error('ATS analyzer error:', error); return res.status(500).json({ message: 'Server error during ATS analysis' }); }
};

const previewATS = async (req, res) => {
  try {
    const { resumeData, jdText } = req.body;
    if (!resumeData || !jdText?.trim()) return res.status(400).json({ message: 'Resume data and Job Description text are required' });
    return res.json(scoreResume(resumeData, jdText));
  } catch (error) { console.error('ATS preview error:', error); return res.status(500).json({ message: 'Server error during ATS preview' }); }
};

module.exports = { analyzeATS, previewATS, scoreResume };
