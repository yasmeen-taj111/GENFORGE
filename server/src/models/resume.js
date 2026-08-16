const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetRole: { type: String, default: '' },
  targetCompany: { type: String, default: '' },
  // Reserved for an external JD record if that capability is added later.
  // The embedded JD below remains the source of truth today.
  jobDescriptionId: { type: String, default: '' },
  jobDescription: {
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    descriptionText: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    jobUrl: { type: String, default: '' },
    analyzedData: { type: mongoose.Schema.Types.Mixed, default: null } // Extracted JD insights
  },
  personalInfo: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    customLinks: [{
      label: { type: String, default: '' },
      url: { type: String, default: '' }
    }]
  },
  summary: { type: String, default: '' },
  experiences: [{
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false },
    descriptionBullets: [{ type: String }]
  }],
  projects: [{
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    technologies: [{ type: String }],
    githubLink: { type: String, default: '' },
    liveLink: { type: String, default: '' },
    bullets: [{ type: String }]
  }],
  skills: {
    languages: [{ type: String }],
    frameworks: [{ type: String }],
    libraries: [{ type: String }],
    databases: [{ type: String }],
    cloud: [{ type: String }],
    devops: [{ type: String }],
    tools: [{ type: String }],
    softSkills: [{ type: String }],
    customCategories: [{
      categoryName: { type: String, default: '' },
      items: [{ type: String }]
    }]
  },
  education: [{
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    gpa: { type: String, default: '' },
    relevantCoursework: { type: String, default: '' },
    location: { type: String, default: '' }
  }],
  certifications: [{
    title: { type: String, default: '' },
    issuer: { type: String, default: '' },
    date: { type: String, default: '' },
    credentialUrl: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  achievements: [{
    title: { type: String, default: '' },
    organization: { type: String, default: '' },
    date: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  // A preparation plan is intentionally kept separate from resume skills.
  // Planned skills never affect ATS scoring until the candidate marks them as learned.
  targetSkillPlan: [{
    skill: { type: String, default: '' },
    category: { type: String, default: 'tools' },
    reason: { type: String, default: '' }
  }],
  customSections: [{
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    bullets: [{ type: String }]
  }],
  references: [{
    name: { type: String, default: '' },
    position: { type: String, default: '' },
    organization: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' }
  }],
  includeReferences: { type: Boolean, default: false },
  template: { type: String, default: 'minimal' }, // minimal, modern, professional, executive, technical, academic, ats-safe
  styling: {
    accentColor: { type: String, default: '#0f172a' }, // Tailwind slate-900
    fontSelection: { type: String, default: 'Inter' },
    fontSize: { type: String, default: '10pt' },
    lineSpacing: { type: String, default: '1.25' },
    sectionSpacing: { type: String, default: '16px' },
    margins: { type: String, default: '0.75in' }
  },
  sourceCode: {
    html: { type: String, default: '' },
    css: { type: String, default: '' },
    latex: { type: String, default: '' }
  },
  atsScore: { type: Number, default: 0 },
  atsAnalysis: { type: mongoose.Schema.Types.Mixed, default: null }, // Detailed ATS breakdowns
  version: { type: String, default: '1.0.0' }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
