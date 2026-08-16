const Resume = require('../models/resume');
const Profile = require('../models/profile');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const aiService = require('../services/ai/aiService');

// Import must remain usable when an AI provider is unavailable. This parser is
// intentionally conservative: it extracts visible facts and leaves ambiguous
// content for the user to review in the editor rather than inventing details.
const parseResumeLocally = (rawText) => {
  const lines = String(rawText || '').replace(/\r/g, '').split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const headings = /^(summary|professional summary|profile|experience|work experience|employment|projects|skills|technical skills|education|certifications?|achievements?|awards?)$/i;
  const sections = {};
  let activeSection = 'header';
  sections[activeSection] = [];
  lines.forEach((line) => {
    if (headings.test(line.replace(/:$/, ''))) {
      activeSection = line.replace(/:$/, '').toLowerCase();
      sections[activeSection] = [];
    } else {
      sections[activeSection].push(line);
    }
  });
  const readSection = (...names) => names.flatMap(name => sections[name] || []);
  const header = sections.header || [];
  const email = lines.find(line => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line))?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = lines.find(line => /(?:\+?\d[\d(). -]{7,}\d)/.test(line))?.match(/(?:\+?\d[\d(). -]{7,}\d)/)?.[0] || '';
  const url = (label) => lines.find(line => new RegExp(label, 'i').test(line) && /https?:\/\/|www\./i.test(line))?.match(/(?:https?:\/\/|www\.)\S+/i)?.[0] || '';
  const name = header.find(line => !line.includes('@') && !/(linkedin|github|portfolio|phone|\d{7,})/i.test(line) && line.length < 70) || '';
  const summaryLines = readSection('summary', 'professional summary', 'profile');
  const skillsLines = readSection('skills', 'technical skills');
  const skillCategories = { languages: [], frameworks: [], libraries: [], databases: [], cloud: [], devops: [], tools: [], softSkills: [], customCategories: [] };
  const categoryForLabel = (label = '') => {
    const normalized = label.toLowerCase();
    if (/language|programming/.test(normalized)) return 'languages';
    if (/framework|web development/.test(normalized)) return 'frameworks';
    if (/librar/.test(normalized)) return 'libraries';
    if (/database|sql/.test(normalized)) return 'databases';
    if (/cloud|aws|azure|gcp/.test(normalized)) return 'cloud';
    if (/devops|docker|kubernetes|ci\/?cd/.test(normalized)) return 'devops';
    if (/soft\s*skills?|communication|leadership/.test(normalized)) return 'softSkills';
    return 'tools';
  };
  const addSkills = (category, value) => value.split(/[,|•·;\n]+/).map(item => item.trim()).filter(item => item && item.length < 60).forEach((item) => {
    if (!skillCategories[category].some(skill => skill.toLowerCase() === item.toLowerCase())) skillCategories[category].push(item);
  });
  skillsLines.forEach((line) => {
    const matches = [...line.matchAll(/(?:^|\s)(languages?|programming|frameworks?|libraries|databases?|cloud|devops|tools?|soft skills?|web development)\s*:\s*/gi)];
    if (!matches.length) return addSkills('tools', line);
    matches.forEach((match, index) => {
      const valueStart = match.index + match[0].length;
      const valueEnd = matches[index + 1]?.index || line.length;
      addSkills(categoryForLabel(match[1]), line.slice(valueStart, valueEnd).replace(/[;|]+$/, ''));
    });
  });
  const toEntries = (content, kind) => {
    const entries = [];
    let current = null;
    content.forEach((line) => {
      const bullet = /^[•▪◦\-*]/.test(line);
      if (bullet && current) {
        current.bullets.push(line.replace(/^[•▪◦\-*]\s*/, ''));
      } else if (!current || (line.length < 110 && !/[.!?]$/.test(line))) {
        if (current) entries.push(current);
        current = { title: line, bullets: [] };
      } else if (current) {
        current.bullets.push(line);
      }
    });
    if (current) entries.push(current);
    return entries.filter(entry => entry.title || entry.bullets.length).slice(0, 12).map((entry) => kind === 'experience'
      ? ({ company: '', role: entry.title, location: '', startDate: '', endDate: '', current: false, descriptionBullets: entry.bullets })
      : ({ name: entry.title, description: '', technologies: [], githubLink: '', liveLink: '', bullets: entry.bullets }));
  };
  const education = [];
  let currentEducation = null;
  const saveEducation = () => {
    if (currentEducation && (currentEducation.institution || currentEducation.degree || currentEducation.field)) education.push(currentEducation);
    currentEducation = null;
  };
  const dateRange = (line) => line.match(/((?:19|20)\d{2})\s*(?:[-–—to]+\s*((?:19|20)\d{2}|present))?/i);
  readSection('education').forEach((line) => {
    const dates = dateRange(line);
    const dateValues = dates ? { startDate: dates[1] || '', endDate: dates[2] || '' } : {};
    const cleanLine = line.replace(/(?:19|20)\d{2}\s*(?:[-–—to]+\s*((?:19|20)\d{2}|present))?/ig, '').trim();
    if (/(university|college|school|institute|academy)/i.test(cleanLine)) {
      if (currentEducation?.institution) saveEducation();
      currentEducation = { institution: cleanLine, degree: '', field: '', startDate: dateValues.startDate || '', endDate: dateValues.endDate || '', gpa: '', relevantCoursework: '', location: '' };
      return;
    }
    if (!currentEducation) currentEducation = { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', relevantCoursework: '', location: '' };
    if (dates) Object.assign(currentEducation, dateValues);
    if (/(b\.?tech|bachelor|master|m\.?tech|b\.?e\.?|diploma|pre[- ]?university|pu\b|class\s*(?:x|10|12))/i.test(cleanLine)) {
      const degreeMatch = cleanLine.match(/(b\.?tech|bachelor(?:\s+of\s+\w+){0,3}|master(?:\s+of\s+\w+){0,3}|m\.?tech|b\.?e\.?|diploma|pre[- ]?university|pu\b)/i);
      currentEducation.degree = degreeMatch?.[0] || cleanLine;
      const fieldMatch = cleanLine.match(/(?:in|of)\s+(.+)/i);
      if (fieldMatch) {
        const fieldAndLocation = fieldMatch[1].trim();
        const locationMatch = fieldAndLocation.match(/(.+?)(Bengaluru|Bangalore|Mumbai|Delhi|Chennai|Hyderabad|Pune|Kolkata|India)$/i);
        currentEducation.field = (locationMatch?.[1] || fieldAndLocation).trim();
        if (locationMatch) currentEducation.location = locationMatch[2];
      }
    } else if (/^(pcmc|pcmb|pcm|commerce|science|arts)\b/i.test(cleanLine)) {
      currentEducation.degree = 'Pre-University';
      currentEducation.field = cleanLine.replace(/\d+(?:\.\d+)?%?$/, '').trim();
      const percentage = cleanLine.match(/\d+(?:\.\d+)?%/);
      if (percentage) currentEducation.gpa = percentage[0];
    } else if (/(cgpa|gpa|percentage|%)/i.test(cleanLine)) {
      currentEducation.gpa = cleanLine.replace(/^(cgpa|gpa|percentage)\s*:?\s*/i, '');
    } else if (cleanLine && !currentEducation.institution) {
      currentEducation.institution = cleanLine;
    } else if (cleanLine && !currentEducation.location) {
      currentEducation.location = cleanLine;
    }
  });
  saveEducation();
  const certifications = readSection('certification', 'certifications').map(line => ({ title: line, issuer: '', date: '', credentialUrl: '', description: '' })).slice(0, 8);
  return {
    personalInfo: { name, email, phone, location: '', linkedin: url('linkedin'), github: url('github'), portfolio: url('portfolio'), customLinks: [] },
    summary: summaryLines.join(' '),
    experiences: toEntries(readSection('experience', 'work experience', 'employment'), 'experience'),
    projects: toEntries(readSection('projects'), 'project'),
    skills: skillCategories,
    education,
    certifications,
    achievements: [],
    parseSource: 'local-fallback'
  };
};

// @desc    Get all user resumes
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res) => {
  try {
    // The dashboard only needs card metadata; avoid returning full resume bodies.
    const resumes = await Resume.find({ userId: req.user._id })
      .select('name targetRole targetCompany atsScore template updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();
    return res.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new resume (can clone from Master Profile)
// @route   POST /api/resumes
// @access  Private
const createResume = async (req, res) => {
  try {
    const { name, targetRole, targetCompany, useMasterProfile = true } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Resume name is required' });
    }

    let personalInfo = {};
    let education = [];
    let experiences = [];
    let projects = [];
    let skills = {
      languages: [],
      frameworks: [],
      libraries: [],
      databases: [],
      cloud: [],
      devops: [],
      tools: [],
      softSkills: [],
      customCategories: []
    };
    let certifications = [];
    let achievements = [];
    let customSections = [];

    // Clone from Master Profile if requested
    if (useMasterProfile) {
      const profile = await Profile.findOne({ userId: req.user._id });
      if (profile) {
        personalInfo = profile.personalInfo || {};
        education = profile.education || [];
        experiences = profile.experience || [];
        projects = profile.projects || [];
        skills = profile.skills || skills;
        certifications = profile.certifications || [];
        achievements = profile.achievements || [];
        customSections = profile.customSections || [];
      }
    }

    const newResume = await Resume.create({
      userId: req.user._id,
      name,
      targetRole: targetRole || '',
      targetCompany: targetCompany || '',
      personalInfo,
      education,
      experiences,
      projects,
      skills,
      certifications,
      achievements,
      customSections,
      summary: '',
      references: [],
      includeReferences: false,
      template: 'minimal',
      styling: {
        accentColor: '#0f172a',
        fontSelection: 'Inter',
        fontSize: '10pt',
        lineSpacing: '1.25',
        sectionSpacing: '16px',
        margins: '0.75in'
      }
    });

    return res.status(201).json(newResume);
  } catch (error) {
    console.error('Create resume error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single resume details
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    return res.json(resume);
  } catch (error) {
    console.error('Get resume by id error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update resume details
// @route   PUT /api/resumes/:id
// @access  Private
const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const updateFields = req.body;
    
    // Dynamically apply fields
    Object.keys(updateFields).forEach(key => {
      if (key !== '_id' && key !== 'userId') {
        resume[key] = updateFields[key];
      }
    });

    const updatedResume = await resume.save();
    return res.json(updatedResume);
  } catch (error) {
    console.error('Update resume error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const result = await Resume.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    return res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Duplicate a resume
// @route   POST /api/resumes/:id/duplicate
// @access  Private
const duplicateResume = async (req, res) => {
  try {
    const resumeToDuplicate = await Resume.findOne({ _id: req.params.id, userId: req.user._id });

    if (!resumeToDuplicate) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const duplicateObj = resumeToDuplicate.toObject();
    delete duplicateObj._id;
    delete duplicateObj.createdAt;
    delete duplicateObj.updatedAt;
    
    duplicateObj.name = `${duplicateObj.name} (Copy)`;
    
    const duplicatedResume = await Resume.create(duplicateObj);
    return res.status(201).json(duplicatedResume);
  } catch (error) {
    console.error('Duplicate resume error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Repair a resume that was imported by an older, less structured parser
// @route   POST /api/resumes/:id/normalize-import
// @access  Private
const normalizeImportedResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const educationText = (resume.education || []).flatMap((item) => [item.institution, item.degree, item.field, item.startDate, item.endDate, item.gpa, item.location]).filter(Boolean).join('\n');
    const skillsText = Object.entries(resume.skills?.toObject?.() || resume.skills || {})
      .filter(([key, value]) => key !== 'customCategories' && Array.isArray(value))
      .flatMap(([key, value]) => value.length ? [`${key}: ${value.join(', ')}`] : [])
      .join('\n');
    const repaired = parseResumeLocally(`Education\n${educationText}\nSkills\n${skillsText}`);

    if (repaired.education.length) resume.education = repaired.education;
    if (Object.values(repaired.skills).some((value) => Array.isArray(value) && value.length)) resume.skills = repaired.skills;
    resume.projects = (resume.projects || []).map((project) => ({
      ...(project.toObject?.() || project),
      name: String(project.name || '').replace(/\s*(?:github|git hub)\s*$/i, '').trim()
    }));

    const updated = await resume.save();
    return res.json(updated);
  } catch (error) {
    console.error('Imported resume normalization error:', error);
    return res.status(500).json({ message: 'We could not repair this imported resume.' });
  }
};

// @desc    Upload a resume file and parse it with AI
// @route   POST /api/resumes/upload
// @access  Private
const uploadResumeText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let text = '';
    const buffer = req.file.buffer;
    const fileMime = req.file.mimetype;
    const fileName = req.file.originalname.toLowerCase();

    if (fileMime === 'application/pdf' || fileName.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      fileMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const data = await mammoth.extractRawText({ buffer });
      text = data.value;
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Only PDF and DOCX are allowed.' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text from the file.' });
    }

    // Prevent oversized documents from exhausting the AI provider context window.
    if (text.length > 60000) {
      return res.status(400).json({ message: 'This resume contains too much text to parse. Please upload a shorter document.' });
    }

    // Call AI to parse and structure this text
    try {
      const parsedData = await aiService.extractResumeData(text);
      return res.json({ ...parsedData, parseSource: 'ai' });
    } catch (aiError) {
      console.error('AI resume parsing unavailable; using local parser:', aiError.message);
      return res.json(parseResumeLocally(text));
    }
  } catch (error) {
    console.error('Upload parsing error:', error);
    return res.status(502).json({ message: 'We could not parse this resume right now. Please try again.' });
  }
};

module.exports = {
  getResumes,
  createResume,
  getResumeById,
  updateResume,
  deleteResume,
  duplicateResume,
  normalizeImportedResume,
  uploadResumeText
};
