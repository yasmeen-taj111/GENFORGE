const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
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
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    gpa: { type: String, default: '' },
    relevantCoursework: { type: String, default: '' },
    location: { type: String, default: '' }
  }],
  experience: [{
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    current: { type: Boolean, default: false },
    descriptionBullets: [{ type: String }]
  }],
  projects: [{
    name: { type: String, required: true },
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
  certifications: [{
    title: { type: String, required: true },
    issuer: { type: String, default: '' },
    date: { type: String, default: '' },
    credentialUrl: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  achievements: [{
    title: { type: String, required: true },
    organization: { type: String, default: '' },
    date: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  customSections: [{
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    bullets: [{ type: String }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
