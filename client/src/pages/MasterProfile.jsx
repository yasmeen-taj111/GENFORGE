import React, { useState, useEffect } from 'react';
import useResumeStore from '../store/resumeStore';
import useNotificationStore from '../store/notificationStore';
import {
  User,
  Briefcase,
  FolderKanban,
  Award,
  BookOpen,
  Wrench,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react';

export const MasterProfile = ({ onNavigate }) => {
  const { fetchMasterProfile, updateMasterProfile, loading } = useResumeStore();
  const [activeTab, setActiveTab] = useState('personal');
  const notify = useNotificationStore((state) => state.notify);

  // Form states matching schema structure
  const [personal, setPersonal] = useState({
    name: '', phone: '', email: '', location: '', linkedin: '', github: '', portfolio: '', customLinks: []
  });
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState({
    languages: [], frameworks: [], libraries: [], databases: [], cloud: [], devops: [], tools: [], softSkills: [], customCategories: []
  });
  const [certifications, setCertifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [customSections, setCustomSections] = useState([]);

  // Load from store
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchMasterProfile();
      if (data) {
        if (data.personalInfo) setPersonal((previous) => ({ ...previous, ...data.personalInfo }));
        if (data.education) setEducation(data.education);
        if (data.experience) setExperience(data.experience);
        if (data.projects) setProjects(data.projects);
        if (data.skills) setSkills((previous) => ({ ...previous, ...data.skills }));
        if (data.certifications) setCertifications(data.certifications);
        if (data.achievements) setAchievements(data.achievements);
        if (data.customSections) setCustomSections(data.customSections);
      }
    };
    loadData();
  }, [fetchMasterProfile]);

  const handleSave = async () => {
    const payload = {
      personalInfo: personal,
      education,
      experience,
      projects,
      skills,
      certifications,
      achievements,
      customSections
    };
    const res = await updateMasterProfile(payload);
    if (res) {
      notify('Master profile saved successfully.');
    }
  };

  // Helper dynamic array handlers
  const addEducation = () => {
    setEducation([...education, { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', relevantCoursework: '', location: '' }]);
  };
  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperience([...experience, { company: '', role: '', location: '', startDate: '', endDate: '', current: false, descriptionBullets: [''] }]);
  };
  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };
  const addExpBullet = (expIndex) => {
    const copy = [...experience];
    copy[expIndex].descriptionBullets.push('');
    setExperience(copy);
  };
  const removeExpBullet = (expIndex, bulletIndex) => {
    const copy = [...experience];
    copy[expIndex].descriptionBullets = copy[expIndex].descriptionBullets.filter((_, i) => i !== bulletIndex);
    setExperience(copy);
  };

  const addProject = () => {
    setProjects([...projects, { name: '', description: '', technologies: [], githubLink: '', liveLink: '', bullets: [''] }]);
  };
  const removeProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };
  const addProjBullet = (projIndex) => {
    const copy = [...projects];
    copy[projIndex].bullets.push('');
    setProjects(copy);
  };
  const removeProjBullet = (projIndex, bulletIndex) => {
    const copy = [...projects];
    copy[projIndex].bullets = copy[projIndex].bullets.filter((_, i) => i !== bulletIndex);
    setProjects(copy);
  };

  const addCertification = () => {
    setCertifications([...certifications, { title: '', issuer: '', date: '', credentialUrl: '', description: '' }]);
  };
  const removeCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const addAchievement = () => {
    setAchievements([...achievements, { title: '', organization: '', date: '', description: '' }]);
  };
  const removeAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const addCustomSection = () => {
    setCustomSections([...customSections, { title: '', description: '', bullets: [''] }]);
  };
  const removeCustomSection = (index) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };
  const addCustomSectionBullet = (secIndex) => {
    const copy = [...customSections];
    copy[secIndex].bullets.push('');
    setCustomSections(copy);
  };
  const removeCustomSectionBullet = (secIndex, bulletIndex) => {
    const copy = [...customSections];
    copy[secIndex].bullets = copy[secIndex].bullets.filter((_, i) => i !== bulletIndex);
    setCustomSections(copy);
  };

  const renderPersonal = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
          <input
            type="text"
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            placeholder="John Doe"
            value={personal.name}
            onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
          <input
            type="text"
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            placeholder="+1 (555) 000-0000"
            value={personal.phone}
            onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
          <input
            type="email"
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            placeholder="you@domain.com"
            value={personal.email}
            onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
          <input
            type="text"
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            placeholder="City, ST"
            value={personal.location}
            onChange={(e) => setPersonal({ ...personal, location: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
        <h4 className="text-xs font-bold text-slate-700">Online Portals & Social Profiles</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">LinkedIn Profile</label>
            <input
              type="url"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              placeholder="https://linkedin.com/in/username"
              value={personal.linkedin}
              onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">GitHub Profile</label>
            <input
              type="url"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              placeholder="https://github.com/username"
              value={personal.github}
              onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Portfolio Website</label>
            <input
              type="url"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              placeholder="https://domain.dev"
              value={personal.portfolio}
              onChange={(e) => setPersonal({ ...personal, portfolio: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700">Educational History</h4>
        <button
          onClick={addEducation}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Education
        </button>
      </div>

      {education.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No education records added yet.</p>
      ) : (
        <div className="space-y-4">
          {education.map((edu, idx) => (
            <div key={idx} className="border border-slate-200 p-4 rounded-xl relative space-y-4">
              <button
                onClick={() => removeEducation(idx)}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">School / Institution</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. Stanford University"
                    value={edu.institution}
                    onChange={(e) => {
                      const copy = [...education];
                      copy[idx].institution = e.target.value;
                      setEducation(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Degree / Certification</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. BS"
                    value={edu.degree}
                    onChange={(e) => {
                      const copy = [...education];
                      copy[idx].degree = e.target.value;
                      setEducation(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Field of Study</label>
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. Computer Science"
                    value={edu.field}
                    onChange={(e) => {
                      const copy = [...education];
                      copy[idx].field = e.target.value;
                      setEducation(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">GPA / CGPA</label>
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. 3.8 / 4.0"
                    value={edu.gpa}
                    onChange={(e) => {
                      const copy = [...education];
                      copy[idx].gpa = e.target.value;
                      setEducation(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="month"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    value={edu.startDate}
                    onChange={(e) => {
                      const copy = [...education];
                      copy[idx].startDate = e.target.value;
                      setEducation(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date (or Expected)</label>
                  <input
                    type="month"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    value={edu.endDate}
                    onChange={(e) => {
                      const copy = [...education];
                      copy[idx].endDate = e.target.value;
                      setEducation(copy);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700">Work Experience</h4>
        <button
          onClick={addExperience}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Experience
        </button>
      </div>

      {experience.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No experience records added yet.</p>
      ) : (
        <div className="space-y-6">
          {experience.map((exp, idx) => (
            <div key={idx} className="border border-slate-200 p-4 rounded-xl relative space-y-4 bg-slate-50/30">
              <button
                onClick={() => removeExperience(idx)}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. Google"
                    value={exp.company}
                    onChange={(e) => {
                      const copy = [...experience];
                      copy[idx].company = e.target.value;
                      setExperience(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role / Position</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. Software Engineer"
                    value={exp.role}
                    onChange={(e) => {
                      const copy = [...experience];
                      copy[idx].role = e.target.value;
                      setExperience(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                  <input
                    type="text"
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. San Francisco, CA"
                    value={exp.location}
                    onChange={(e) => {
                      const copy = [...experience];
                      copy[idx].location = e.target.value;
                      setExperience(copy);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id={`curr-${idx}`}
                    checked={exp.current}
                    onChange={(e) => {
                      const copy = [...experience];
                      copy[idx].current = e.target.checked;
                      setExperience(copy);
                    }}
                    className="w-4 h-4 accent-slate-900"
                  />
                  <label htmlFor={`curr-${idx}`} className="text-xs text-slate-600 font-semibold select-none cursor-pointer">
                    I currently work here
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="month"
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    value={exp.startDate}
                    onChange={(e) => {
                      const copy = [...experience];
                      copy[idx].startDate = e.target.value;
                      setExperience(copy);
                    }}
                  />
                </div>
                {!exp.current && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="month"
                      className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                      value={exp.endDate}
                      onChange={(e) => {
                        const copy = [...experience];
                        copy[idx].endDate = e.target.value;
                        setExperience(copy);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Bullets */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsibilities (Bullet Points)</label>
                  <button
                    onClick={() => addExpBullet(idx)}
                    className="text-[9px] font-bold text-indigo-600 hover:underline"
                  >
                    + Add Bullet
                  </button>
                </div>
                {exp.descriptionBullets?.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-white text-xs border border-slate-200 rounded-lg px-3 py-1.5"
                      placeholder="e.g. Optimized REST APIs reducing latency by 20%..."
                      value={bullet}
                      onChange={(e) => {
                        const copy = [...experience];
                        copy[idx].descriptionBullets[bulletIdx] = e.target.value;
                        setExperience(copy);
                      }}
                    />
                    <button
                      onClick={() => removeExpBullet(idx, bulletIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700">Project Portfolio</h4>
        <button
          onClick={addProject}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No projects added yet.</p>
      ) : (
        <div className="space-y-6">
          {projects.map((proj, idx) => (
            <div key={idx} className="border border-slate-200 p-4 rounded-xl relative space-y-4 bg-slate-50/30">
              <button
                onClick={() => removeProject(idx)}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. CollabDoc Editor"
                    value={proj.name}
                    onChange={(e) => {
                      const copy = [...projects];
                      copy[idx].name = e.target.value;
                      setProjects(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Technologies Used (comma separated)</label>
                  <input
                    type="text"
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. React, Node.js, Socket.io"
                    value={proj.technologies?.join(', ')}
                    onChange={(e) => {
                      const copy = [...projects];
                      copy[idx].technologies = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setProjects(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">GitHub Repository Link</label>
                  <input
                    type="url"
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="https://github.com/..."
                    value={proj.githubLink}
                    onChange={(e) => {
                      const copy = [...projects];
                      copy[idx].githubLink = e.target.value;
                      setProjects(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Live Demo URL</label>
                  <input
                    type="url"
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="https://collabdoc.dev"
                    value={proj.liveLink}
                    onChange={(e) => {
                      const copy = [...projects];
                      copy[idx].liveLink = e.target.value;
                      setProjects(copy);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Short Project Description</label>
                <textarea
                  className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2 h-16 resize-none"
                  placeholder="Summarize the project's purpose..."
                  value={proj.description}
                  onChange={(e) => {
                    const copy = [...projects];
                    copy[idx].description = e.target.value;
                    setProjects(copy);
                  }}
                />
              </div>

              {/* Bullets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Bullets (Highlights)</label>
                  <button
                    onClick={() => addProjBullet(idx)}
                    className="text-[9px] font-bold text-indigo-600 hover:underline"
                  >
                    + Add Bullet
                  </button>
                </div>
                {proj.bullets?.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-white text-xs border border-slate-200 rounded-lg px-3 py-1.5"
                      placeholder="e.g. Scaled connection handlers to support 100 concurrent sockets..."
                      value={bullet}
                      onChange={(e) => {
                        const copy = [...projects];
                        copy[idx].bullets[bulletIdx] = e.target.value;
                        setProjects(copy);
                      }}
                    />
                    <button
                      onClick={() => removeProjBullet(idx, bulletIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSkills = () => {
    const categories = [
      { key: 'languages', label: 'Programming Languages' },
      { key: 'frameworks', label: 'Web Frameworks' },
      { key: 'libraries', label: 'Libraries / Packages' },
      { key: 'databases', label: 'Databases' },
      { key: 'cloud', label: 'Cloud Services (AWS, GCP)' },
      { key: 'devops', label: 'DevOps / Container Tools' },
      { key: 'tools', label: 'Other Developer Tools' },
      { key: 'softSkills', label: 'Soft Skills' }
    ];

    return (
      <div className="space-y-6">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-500" />
          Enter skills separated by commas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div key={cat.key}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {cat.label}
              </label>
              <input
                type="text"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                placeholder="e.g. JavaScript, Python, C++"
                value={skills[cat.key]?.join(', ') || ''}
                onChange={(e) => {
                  const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setSkills({ ...skills, [cat.key]: items });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCertifications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700">Certifications & Licenses</h4>
        <button
          onClick={addCertification}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Certification
        </button>
      </div>

      {certifications.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No certifications added yet.</p>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert, idx) => (
            <div key={idx} className="border border-slate-200 p-4 rounded-xl relative space-y-4">
              <button
                onClick={() => removeCertification(idx)}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Certificate Title</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. AWS Certified Developer"
                    value={cert.title}
                    onChange={(e) => {
                      const copy = [...certifications];
                      copy[idx].title = e.target.value;
                      setCertifications(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issuing Organization</label>
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. Amazon Web Services"
                    value={cert.issuer}
                    onChange={(e) => {
                      const copy = [...certifications];
                      copy[idx].issuer = e.target.value;
                      setCertifications(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Earned Date</label>
                  <input
                    type="month"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    value={cert.date}
                    onChange={(e) => {
                      const copy = [...certifications];
                      copy[idx].date = e.target.value;
                      setCertifications(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Credential URL</label>
                  <input
                    type="url"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="Verification link"
                    value={cert.credentialUrl}
                    onChange={(e) => {
                      const copy = [...certifications];
                      copy[idx].credentialUrl = e.target.value;
                      setCertifications(copy);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700">Honors & Achievements</h4>
        <button
          onClick={addAchievement}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Achievement
        </button>
      </div>

      {achievements.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No achievements added yet.</p>
      ) : (
        <div className="space-y-4">
          {achievements.map((ach, idx) => (
            <div key={idx} className="border border-slate-200 p-4 rounded-xl relative space-y-4">
              <button
                onClick={() => removeAchievement(idx)}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Honor Title</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. 1st Place Winner"
                    value={ach.title}
                    onChange={(e) => {
                      const copy = [...achievements];
                      copy[idx].title = e.target.value;
                      setAchievements(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Awarding Organization</label>
                  <input
                    type="text"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. Stanford University"
                    value={ach.organization}
                    onChange={(e) => {
                      const copy = [...achievements];
                      copy[idx].organization = e.target.value;
                      setAchievements(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Earned</label>
                  <input
                    type="month"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
                    value={ach.date}
                    onChange={(e) => {
                      const copy = [...achievements];
                      copy[idx].date = e.target.value;
                      setAchievements(copy);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCustomSections = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700">Custom / Others Sections</h4>
        <button
          onClick={addCustomSection}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Section
        </button>
      </div>

      {customSections.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No custom sections added yet.</p>
      ) : (
        <div className="space-y-6">
          {customSections.map((sec, idx) => (
            <div key={idx} className="border border-slate-200 p-4 rounded-xl relative space-y-4 bg-slate-50/30">
              <button
                onClick={() => removeCustomSection(idx)}
                className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Section Title</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="e.g. Publications, Volunteering, Patents"
                    value={sec.title}
                    onChange={(e) => {
                      const copy = [...customSections];
                      copy[idx].title = e.target.value;
                      setCustomSections(copy);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-white text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="Short summary for this section..."
                    value={sec.description}
                    onChange={(e) => {
                      const copy = [...customSections];
                      copy[idx].description = e.target.value;
                      setCustomSections(copy);
                    }}
                  />
                </div>
              </div>

              {/* Bullets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bullet Points (Highlights)</label>
                  <button
                    onClick={() => addCustomSectionBullet(idx)}
                    className="text-[9px] font-bold text-indigo-600 hover:underline"
                  >
                    + Add Bullet
                  </button>
                </div>
                {sec.bullets?.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-white text-xs border border-slate-200 rounded-lg px-3 py-1.5"
                      placeholder="Details..."
                      value={bullet}
                      onChange={(e) => {
                        const copy = [...customSections];
                        copy[idx].bullets[bulletIdx] = e.target.value;
                        setCustomSections(copy);
                      }}
                    />
                    <button
                      onClick={() => removeCustomSectionBullet(idx, bulletIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Top navbar */}
      <nav className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <h2 className="text-sm font-bold text-slate-900">Manage Master Profile</h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </nav>

      {/* Profile Layout */}
      <div className="max-w-6xl mx-auto px-6 mt-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar tabs */}
        <div className="w-full md:w-64 bg-white border border-slate-200 rounded-2xl p-4 shrink-0 shadow-sm h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Sections</h3>
          <div className="flex flex-col gap-1">
            {[
              { id: 'personal', label: 'Personal Details', icon: User },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'projects', label: 'Projects', icon: FolderKanban },
              { id: 'skills', label: 'Skills', icon: Wrench },
              { id: 'education', label: 'Education', icon: BookOpen },
              { id: 'certifications', label: 'Certifications', icon: Award },
              { id: 'achievements', label: 'Achievements', icon: Award },
              { id: 'customSections', label: 'Custom Sections', icon: FolderKanban }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Tab content wrapper */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {activeTab === 'personal' && renderPersonal()}
          {activeTab === 'education' && renderEducation()}
          {activeTab === 'experience' && renderExperience()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'skills' && renderSkills()}
          {activeTab === 'certifications' && renderCertifications()}
          {activeTab === 'achievements' && renderAchievements()}
          {activeTab === 'customSections' && renderCustomSections()}
        </div>
      </div>
    </div>
  );
};
