import React from 'react';

// Styling font mappings
const fontFamilies = {
  Inter: "'Inter', sans-serif",
  Outfit: "'Outfit', sans-serif",
  'EB Garamond': "'EB Garamond', serif",
  Lora: "'Lora', serif",
  Merriweather: "'Merriweather', serif",
  'JetBrains Mono': "'JetBrains Mono', monospace",
  system: "system-ui, -apple-system, sans-serif"
};

export const Templates = ({ resume, printMode = false }) => {
  if (!resume) return <div className="text-slate-400 p-8 text-center">No resume data loaded.</div>;

  const {
    personalInfo = {},
    summary = '',
    experiences = [],
    projects = [],
    skills = {},
    education = [],
    certifications = [],
    achievements = [],
    customSections = [],
    references = [],
    includeReferences = false,
    template = 'minimal',
    styling = {}
  } = resume;

  const {
    accentColor = '#0f172a',
    fontSelection = 'Inter',
    fontSize = '10pt',
    lineSpacing = '1.25',
    sectionSpacing = '16px',
    margins = '0.75in'
  } = styling;

  const selectedFont = fontFamilies[fontSelection] || fontFamilies.Inter;

  // Global styles to apply inside the resume container
  const containerStyle = {
    fontFamily: selectedFont,
    fontSize: fontSize,
    lineHeight: lineSpacing,
    padding: printMode ? '0' : margins,
    backgroundColor: '#ffffff',
    color: '#1e293b', // Slate-800
    width: '100%',
    minHeight: printMode ? 'auto' : '11in',
    boxSizing: 'border-box'
  };

  const getAccentColor = () => {
    return template === 'ats-safe' ? '#000000' : accentColor;
  };

  const renderSectionHeader = (title) => {
    const color = getAccentColor();
    if (template === 'minimal') {
      return (
        <div style={{ marginBottom: `calc(${sectionSpacing} / 2)` }} className="border-b border-slate-200 pb-1 mt-4">
          <h3 style={{ color }} className="text-xs font-bold uppercase tracking-wider">{title}</h3>
        </div>
      );
    }
    if (template === 'modern') {
      return (
        <div style={{ marginBottom: `calc(${sectionSpacing} / 2)` }} className="flex items-center gap-3 mt-5">
          <h3 style={{ color }} className="text-sm font-semibold uppercase tracking-wide shrink-0">{title}</h3>
          <div className="h-[1px] bg-slate-200 w-full" />
        </div>
      );
    }
    if (template === 'professional') {
      return (
        <div style={{ marginBottom: `calc(${sectionSpacing} / 2)` }} className="mt-5">
          <h3 style={{ color, borderColor: color }} className="text-sm font-bold uppercase tracking-wide border-b-2 pb-1">{title}</h3>
        </div>
      );
    }
    if (template === 'executive') {
      return (
        <div style={{ marginBottom: `calc(${sectionSpacing} / 2)` }} className="text-center mt-6">
          <h3 style={{ color }} className="text-xs font-bold uppercase tracking-widest">{title}</h3>
          <div style={{ backgroundColor: color }} className="h-[1.5px] w-12 mx-auto mt-1" />
        </div>
      );
    }
    if (template === 'technical') {
      return (
        <div style={{ marginBottom: `calc(${sectionSpacing} / 2)` }} className="flex items-baseline gap-2 mt-4">
          <span style={{ color }} className="text-xs font-mono font-bold">{`//`}</span>
          <h3 className="text-sm font-mono font-bold uppercase tracking-wide text-slate-800">{title}</h3>
          <div className="h-[1px] border-b border-dashed border-slate-300 grow ml-2" />
        </div>
      );
    }
    if (template === 'academic') {
      return (
        <div style={{ marginBottom: `calc(${sectionSpacing} / 2)` }} className="mt-5">
          <h3 style={{ color }} className="text-sm italic font-semibold border-b border-slate-300 pb-0.5">{title}</h3>
        </div>
      );
    }
    // ATS Safe
    return (
      <div style={{ marginBottom: '6px' }} className="border-b border-black pb-0.5 mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black">{title}</h3>
      </div>
    );
  };

  // --- HEADER Renders ---
  const renderHeader = () => {
    const color = getAccentColor();
    const links = [
      personalInfo.phone,
      personalInfo.email,
      personalInfo.location,
      personalInfo.linkedin && <a key="li" href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>,
      personalInfo.github && <a key="gh" href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>,
      personalInfo.portfolio && <a key="port" href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="hover:underline">Portfolio</a>,
      ...(personalInfo.customLinks || []).map((link, idx) => (
        link.url && <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.label || 'Link'}</a>
      ))
    ].filter(Boolean);

    if (template === 'executive') {
      return (
        <div className="text-center mb-6">
          <h1 style={{ color }} className="text-3xl font-bold tracking-tight font-serif uppercase">{personalInfo.name}</h1>
          {resume.targetRole && (
            <p className="text-slate-500 uppercase tracking-widest text-xs mt-1 font-medium">{resume.targetRole}</p>
          )}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-500 text-xs mt-3">
            {links.map((link, i) => (
              <span key={i} className="flex items-center">
                {link}
                {i < links.length - 1 && <span className="mx-2 text-slate-300">•</span>}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (template === 'technical') {
      return (
        <div className="border-b-2 border-slate-800 pb-4 mb-6 font-mono">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{personalInfo.name}</h1>
              {resume.targetRole && (
                <p style={{ color }} className="text-xs font-semibold uppercase mt-0.5">{`> ${resume.targetRole}`}</p>
              )}
            </div>
            <div className="flex flex-col items-start md:items-end text-xs text-slate-600 mt-2 md:mt-0">
              <div>{personalInfo.email} {personalInfo.phone && `| ${personalInfo.phone}`}</div>
              <div>{personalInfo.location}</div>
              <div className="flex gap-2 mt-1">
                {personalInfo.linkedin && <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="underline">linkedin</a>}
                {personalInfo.github && <a href={personalInfo.github} target="_blank" rel="noreferrer" className="underline">github</a>}
                {personalInfo.portfolio && <a href={personalInfo.portfolio} target="_blank" rel="noreferrer" className="underline">portfolio</a>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (template === 'modern') {
      return (
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 pb-4 border-b border-slate-100">
          <div>
            <h1 style={{ color }} className="text-3xl font-bold tracking-tight">{personalInfo.name}</h1>
            {resume.targetRole && (
              <p className="text-slate-500 font-medium text-sm mt-0.5">{resume.targetRole}</p>
            )}
          </div>
          <div className="flex flex-col text-slate-500 text-xs gap-1 mt-3 md:mt-0 md:items-end">
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.email && <span className="font-medium text-slate-600">{personalInfo.email}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            <div className="flex flex-wrap gap-2 mt-1">
              {personalInfo.linkedin && <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="text-slate-600 hover:underline">LinkedIn</a>}
              {personalInfo.github && <a href={personalInfo.github} target="_blank" rel="noreferrer" className="text-slate-600 hover:underline">GitHub</a>}
              {personalInfo.portfolio && <a href={personalInfo.portfolio} target="_blank" rel="noreferrer" className="text-slate-600 hover:underline">Portfolio</a>}
            </div>
          </div>
        </div>
      );
    }

    // Default Minimal / Professional / Academic / ATS Safe header (Simple Centered or Left aligned)
    const alignClass = template === 'academic' || template === 'ats-safe' ? 'text-left' : 'text-left';
    return (
      <div className={`${alignClass} mb-5`}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900" style={{ color: template === 'ats-safe' ? '#000000' : color }}>
          {personalInfo.name}
        </h1>
        {resume.targetRole && (
          <p className="text-slate-500 font-medium text-xs uppercase mt-0.5">{resume.targetRole}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 text-xs mt-2">
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <a href={personalInfo.linkedin} className="hover:underline">LinkedIn</a>}
          {personalInfo.github && <a href={personalInfo.github} className="hover:underline">GitHub</a>}
          {personalInfo.portfolio && <a href={personalInfo.portfolio} className="hover:underline">Portfolio</a>}
        </div>
      </div>
    );
  };

  // --- EXPERIENCE Render ---
  const renderExperienceSection = () => {
    if (!experiences || experiences.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeader('Professional Experience')}
        <div className="flex flex-col gap-4">
          {experiences.map((exp, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>{exp.role}</span>
                <span className="text-slate-500 font-normal">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div className="flex justify-between text-slate-600 italic">
                <span>{exp.company}</span>
                <span>{exp.location}</span>
              </div>
              {exp.descriptionBullets && exp.descriptionBullets.length > 0 && (
                <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600">
                  {exp.descriptionBullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="leading-normal">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- PROJECTS Render ---
  const renderProjectsSection = () => {
    if (!projects || projects.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeader('Projects')}
        <div className="flex flex-col gap-4">
          {projects.map((proj, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex justify-between font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span>{proj.name}</span>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <span className="text-[10px] font-normal px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {proj.technologies.join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 text-slate-500 font-normal">
                  {proj.githubLink && <a href={proj.githubLink} className="underline hover:text-slate-700">Code</a>}
                  {proj.liveLink && <a href={proj.liveLink} className="underline hover:text-slate-700">Live</a>}
                </div>
              </div>
              {proj.description && <p className="text-slate-600 mt-1 italic">{proj.description}</p>}
              {proj.bullets && proj.bullets.length > 0 && (
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                  {proj.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="leading-normal">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- SKILLS Render ---
  const renderSkillsSection = () => {
    const categories = [
      { label: 'Languages', data: skills.languages },
      { label: 'Frameworks', data: skills.frameworks },
      { label: 'Libraries', data: skills.libraries },
      { label: 'Databases', data: skills.databases },
      { label: 'Cloud Services', data: skills.cloud },
      { label: 'DevOps / Infra', data: skills.devops },
      { label: 'Developer Tools', data: skills.tools },
      { label: 'Soft Skills', data: skills.softSkills },
      ...(skills.customCategories || []).map(cat => ({ label: cat.categoryName, data: cat.items }))
    ].filter(cat => cat.data && cat.data.length > 0);

    if (categories.length === 0) return null;

    return (
      <div className="mb-4">
        {renderSectionHeader('Technical Skills')}
        <div className="flex flex-col gap-1.5 text-xs">
          {categories.map((cat, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2">
              <span className="font-semibold text-slate-700 col-span-1">{cat.label}:</span>
              <span className="text-slate-600 col-span-3">{cat.data.join(', ')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- EDUCATION Render ---
  const renderEducationSection = () => {
    if (!education || education.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeader('Education')}
        <div className="flex flex-col gap-3">
          {education.map((edu, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>{[edu.degree, edu.field].filter(Boolean).join(edu.degree && edu.field ? ' in ' : '')}</span>
                <span className="text-slate-500 font-normal">{[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}</span>
              </div>
              <div className="flex justify-between text-slate-600 italic">
                <span>{edu.institution} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
                <span>{edu.location}</span>
              </div>
              {edu.relevantCoursework && (
                <p className="text-slate-500 text-[11px] mt-1">
                  <span className="font-medium">Coursework:</span> {edu.relevantCoursework}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- CERTIFICATIONS & ACHIEVEMENTS Renders ---
  const renderCertificationsSection = () => {
    if (!certifications || certifications.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeader('Certifications')}
        <div className="flex flex-col gap-2">
          {certifications.map((cert, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>{cert.title} {cert.issuer && `— ${cert.issuer}`}</span>
                <span className="text-slate-500 font-normal">{cert.date}</span>
              </div>
              {cert.credentialUrl && (
                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline">
                  Verify Credential
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAchievementsSection = () => {
    if (!achievements || achievements.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeader('Achievements')}
        <div className="flex flex-col gap-2">
          {achievements.map((ach, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>{ach.title} {ach.organization && `— ${ach.organization}`}</span>
                <span className="text-slate-500 font-normal">{ach.date}</span>
              </div>
              {ach.description && <p className="text-slate-600 mt-0.5">{ach.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomSections = () => {
    if (!customSections || customSections.length === 0) return null;
    return customSections.map((sec, idx) => (
      <div key={idx} className="mb-4">
        {renderSectionHeader(sec.title || 'Additional Section')}
        {sec.description && <p className="text-xs text-slate-600 mt-1 italic">{sec.description}</p>}
        {sec.bullets && sec.bullets.length > 0 && (
          <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600 text-xs">
            {sec.bullets.map((bullet, bIdx) => (
              <li key={bIdx} className="leading-normal">{bullet}</li>
            ))}
          </ul>
        )}
      </div>
    ));
  };

  // --- REFERENCES Render ---
  const renderReferencesSection = () => {
    if (!includeReferences || !references || references.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeader('References')}
        <div className="grid grid-cols-2 gap-4 text-xs">
          {references.map((ref, idx) => (
            <div key={idx} className="border border-slate-100 p-2 rounded">
              <p className="font-semibold text-slate-800">{ref.name}</p>
              <p className="text-slate-500 text-[11px]">{ref.position} at {ref.organization}</p>
              <p className="text-slate-500 text-[11px]">Relationship: {ref.relationship}</p>
              <div className="flex flex-col text-[10px] text-slate-600 mt-1">
                {ref.email && <span>Email: {ref.email}</span>}
                {ref.phone && <span>Phone: {ref.phone}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle} className="shadow-lg border border-slate-200 print-area rounded-sm text-left">
      {/* Name and Contacts */}
      {renderHeader()}

      {/* Summary */}
      {summary && (
        <div className="mb-4 text-xs">
          {renderSectionHeader('Professional Summary')}
          <p className="leading-relaxed text-slate-600 text-justify">{summary}</p>
        </div>
      )}

      {/* Students/freshers benefit from showing education before projects. */}
      {experiences.length === 0 && renderEducationSection()}

      {/* Experience */}
      {renderExperienceSection()}

      {/* Skills */}
      {renderSkillsSection()}

      {/* Projects */}
      {renderProjectsSection()}

      {/* Education */}
      {experiences.length > 0 && renderEducationSection()}

      {/* Certifications */}
      {renderCertificationsSection()}

      {/* Achievements */}
      {renderAchievementsSection()}

      {/* Custom Sections */}
      {renderCustomSections()}

      {/* References */}
      {renderReferencesSection()}
    </div>
  );
};
