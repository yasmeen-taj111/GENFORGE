const gemini = require('./geminiProvider');
const groq = require('./groqProvider');

const getProvider = () => {
  const provider = process.env.AI_PROVIDER || 'gemini';
  return provider === 'groq' ? groq : gemini;
};

const getFallbackProvider = () => {
  const provider = process.env.AI_PROVIDER || 'gemini';
  return provider === 'groq' ? gemini : groq;
};

const executeText = async (prompt, systemInstruction = '') => {
  const primary = getProvider();
  const fallback = getFallbackProvider();
  try {
    return await primary.generateText(prompt, systemInstruction);
  } catch (error) {
    // Do not add a second, guaranteed-to-fail network call when no fallback key exists.
    if (!fallback.isConfigured()) throw error;
    console.error('AI primary provider failed, trying configured fallback:', error.message);
    try {
      return await fallback.generateText(prompt, systemInstruction);
    } catch (fallbackError) {
      console.error(`AI fallback provider failed as well:`, fallbackError);
      throw new Error(`AI service failure: ${fallbackError.message}`);
    }
  }
};

const executeJSON = async (prompt, systemInstruction = '') => {
  const primary = getProvider();
  const fallback = getFallbackProvider();
  try {
    return await primary.generateJSON(prompt, systemInstruction);
  } catch (error) {
    if (!fallback.isConfigured()) throw error;
    console.error('AI primary provider JSON failed, trying configured fallback:', error.message);
    try {
      return await fallback.generateJSON(prompt, systemInstruction);
    } catch (fallbackError) {
      console.error(`AI fallback provider JSON failed as well:`, fallbackError);
      throw new Error(`AI service JSON failure: ${fallbackError.message}`);
    }
  }
};

// --- Core Workflows ---

// 1. Enhance Professional Summary
const enhanceSummary = async (summary, targetRole = '', jobDescription = '', mode = 'improve') => {
  const systemInstruction = `You are a professional resume writer and career coach.
CRITICAL SAFETY RULE: You must NEVER fabricate information, achievements, metrics, skills, job titles, or experience details.
Keep all factual elements EXACTLY as provided. Only refine the syntax, grammar, professional tone, and clarity.
If information requested for a mode is not provided, return the original text with minor grammar adjustments.`;

  let modeInstruction = '';
  switch (mode) {
    case 'concise':
      modeInstruction = 'Make the summary more concise, professional, and clear. Avoid fluff.';
      break;
    case 'ats':
      modeInstruction = 'Make the summary ATS-friendly. Incorporate relevant technical phrasing without adding skills the user doesn\'t possess.';
      break;
    case 'tailor':
      modeInstruction = `Tailor the summary to align with the Target Role: "${targetRole}" and the Job Description. Highlight the user's matching competencies.`;
      break;
    case 'impactful':
      modeInstruction = 'Enhance the impact of the summary using strong professional vocabulary, highlighting leadership and results.';
      break;
    case 'improve':
    default:
      modeInstruction = 'Improve the general writing flow, spelling, grammar, and professional tone.';
      break;
  }

  const prompt = `Original Professional Summary:
"${summary}"

Target Role: "${targetRole}"
Job Description context:
"${jobDescription}"

Instructions:
${modeInstruction}
Please output ONLY the enhanced summary text. Do not add intro/outro comments or quotes.`;

  return await executeText(prompt, systemInstruction);
};

// 2. Enhance Experience Bullet
const enhanceBullet = async (bulletText, jobDescription = '', mode = 'improve') => {
  const systemInstruction = `You are an expert resume reviewer.
CRITICAL SAFETY RULE: You must NEVER fabricate metrics (e.g., do NOT invent 'improved performance by 40%'), technologies, achievements, or titles.
Only improve the description of activities the user actually did.
If no metrics are provided, do NOT make them up. You may strengthen action verbs and restructure for impact.`;

  let modeInstruction = '';
  switch (mode) {
    case 'concise':
      modeInstruction = 'Make the bullet point concise and clear.';
      break;
    case 'ats':
      modeInstruction = 'Optimize the bullet point for ATS scanning by matching standard engineering terminology without inventing details.';
      break;
    case 'verb':
      modeInstruction = 'Start with a strong action verb (e.g., Architected, Executed, Pioneered) and write in the active voice.';
      break;
    case 'impact':
      modeInstruction = 'Format the bullet using the Action-Context-Result framework. Focus on the result of the action if implied, but do NOT invent specific numbers/metrics.';
      break;
    case 'tailor':
      modeInstruction = `Tailor this bullet point to highlight skills relevant to the following Job Description: "${jobDescription}"`;
      break;
    case 'improve':
    default:
      modeInstruction = 'Improve the grammar, tone, and professional impact of this bullet point.';
      break;
  }

  const prompt = `Original Bullet Point:
"${bulletText}"

Job Description context:
"${jobDescription}"

Instructions:
${modeInstruction}
Please output ONLY the enhanced bullet point text. Do not add intro/outro comments or quotes.`;

  return await executeText(prompt, systemInstruction);
};

// 3. Analyze Job Description (JD Intelligence)
const analyzeJobDescription = async (jdText) => {
  const systemInstruction = `You are an ATS parsing specialist. Analyze the Job Description text and extract structured information.
Do not invent requirements. If a field is not specified in the JD, leave it empty or return an empty array.
Output must be a valid JSON object matching the requested schema.`;

  const prompt = `Job Description Text:
"${jdText}"

Extract and return a JSON object with the following fields:
{
  "title": "Job title or role name",
  "requiredSkills": ["list of explicit technical skills marked as required or must-have"],
  "preferredSkills": ["list of technical skills marked as nice-to-have or preferred"],
  "technologies": ["specific tech stack, languages, tools, frameworks mentioned"],
  "responsibilities": ["key duties and tasks"],
  "educationRequirements": "degree or educational credentials required",
  "experienceRequirements": "years of experience or level required",
  "softSkills": ["communication, leadership, team-work, etc. mentioned"],
  "keywords": ["critical buzzwords, industry jargon, and key concepts"],
  "domainTerminology": ["domain fields e.g., FinTech, SaaS, Healthcare, Cloud Infra"]
}`;

  return await executeJSON(prompt, systemInstruction);
};

// 4. Tailor Resume (Suggestions only, User-controlled)
const tailorResume = async (resumeData, jdText) => {
  const systemInstruction = `You are a resume tailoring copilot.
CRITICAL SAFETY RULE: You must NEVER invent skills, experiences, projects, or metrics.
Review the ENTIRE supplied resume: headline, summary, experience, projects, skills, education, certifications, achievements, and custom sections.
Optimize only the presentation of facts that already exist. Never imply the candidate has a JD requirement unless it appears in their resume.
Treat missing requirements as gaps, not content to add. Prioritize exact, truthful keyword placement in existing relevant bullets to improve ATS keyword matching.
For any suggestion, explain why it helps ATS and the recruiter.
You must output a valid JSON object matching the requested schema.`;

  const prompt = `Current Resume Data:
${JSON.stringify(resumeData)}

Job Description:
"${jdText}"

Create THREE distinct, complete ATS-optimized versions of the existing resume. Every version must optimize every eligible text field: summary, experience bullets, project descriptions/bullets, certification descriptions, achievement descriptions, custom-section descriptions/bullets, and the order of existing skill categories. Do not alter contact data, job titles, company names, dates, credential names, education facts, or skill values. Use a different truthful emphasis for each version: ATS keyword coverage, balanced recruiter readability, and concise impact. Preserve the candidate's facts exactly: do not add a tool, result, metric, company, title, date, credential, or responsibility that is not supported by the input. Keep original entry IDs so the application can apply every change correctly. Do not return partial versions.

Output a JSON object exactly with this format:
{
  "options": [
    {
      "id": "ats-optimized",
      "title": "ATS-optimized",
      "description": "Complete rewrite maximizing truthful, relevant keyword coverage.",
      "optimizedResume": {
        "summary": "complete rewritten professional summary",
        "experiences": [{ "experienceId": "existing experience ID", "descriptionBullets": ["rewritten versions of every existing bullet, in the same order"] }],
        "projects": [{ "projectId": "existing project ID", "description": "rewritten existing description", "bullets": ["rewritten versions of every existing bullet, in the same order"] }],
        "achievements": [{ "achievementId": "existing achievement ID", "description": "rewritten existing achievement description" }],
        "certifications": [{ "certificationId": "existing certification ID", "description": "rewritten existing certification description" }],
        "customSections": [{ "sectionId": "existing custom section ID", "description": "rewritten existing description", "bullets": ["rewritten existing bullets in the same order"] }],
        "skillsOrdering": ["existing skill category names in recommended display order"]
      }
    },
    {
      "id": "balanced",
      "title": "Balanced",
      "description": "Complete rewrite balancing ATS terms with recruiter readability.",
      "optimizedResume": { "summary": "...", "experiences": [], "projects": [], "achievements": [], "certifications": [], "customSections": [], "skillsOrdering": [] }
    },
    {
      "id": "concise-impact",
      "title": "Concise impact",
      "description": "Complete concise rewrite focused on the strongest relevant impact.",
      "optimizedResume": { "summary": "...", "experiences": [], "projects": [], "achievements": [], "certifications": [], "customSections": [], "skillsOrdering": [] }
    }
  ],
  "optimizedResume": {
    "summary": "complete rewritten professional summary, or the original if it cannot be improved truthfully",
    "experiences": [
      { "experienceId": "existing experience ID", "descriptionBullets": ["rewritten versions of all existing bullets, in the same order"] }
    ],
    "projects": [
      { "projectId": "existing project ID", "description": "rewritten existing description", "bullets": ["rewritten versions of all existing bullets, in the same order"] }
    ],
    "achievements": [
      { "achievementId": "existing achievement ID", "description": "rewritten achievement description" }
    ],
    "certifications": [
      { "certificationId": "existing certification ID", "description": "rewritten certification description" }
    ],
    "customSections": [
      { "sectionId": "existing custom section ID", "description": "rewritten description", "bullets": ["rewritten existing bullets in the same order"] }
    ],
    "skillsOrdering": ["existing skill category names in recommended display order"]
  },
  "summary": {
    "original": "Current summary text",
    "suggested": "Suggested tailored summary text without inventing facts",
    "reason": "Why this tailoring helps"
  },
  "experienceBullets": [
    {
      "experienceId": "ID of the experience entry",
      "bulletIndex": 0,
      "original": "original bullet text",
      "suggested": "tailored bullet text focusing on relevant skills without inventing numbers",
      "reason": "why this shift is better"
    }
  ],
  "projects": [
    {
      "projectId": "ID of the project entry",
      "bulletIndex": 0,
      "original": "original project bullet text",
      "suggested": "tailored project bullet text",
      "reason": "why this matches"
    }
  ],
  "skillsOrdering": ["recommended order of skills categories to display, e.g. ['languages', 'frameworks']"],
  "skillsRecommendations": ["skills that appear in the job description which the user already has in their profile but are not currently listed in the resume (leave empty if none)"],
  "skillsToConfirm": [
    {
      "skill": "an explicit technical skill required by the job description",
      "category": "one of: languages, frameworks, libraries, databases, cloud, devops, tools, softSkills",
      "reason": "why this skill matters for the target role"
    }
  ],
  "missingRequirements": ["requirements in the JD that are not supported by the resume; do not suggest adding them"],
  "sectionRecommendations": ["truthful whole-resume recommendations for ordering, education, certifications, or achievements"],
  "atsFocus": ["up to 5 real JD terms already supported by the resume which should be represented clearly"]
}`;

  return await executeJSON(prompt, systemInstruction);
};

// 5. Extract Resume Data from text (Parsing uploads)
const extractResumeData = async (resumeText) => {
  const systemInstruction = `You are an advanced resume parsing parser. 
Extract all information from the resume text and format it into a structured JSON conforming to the GenForge resume schema.
CRITICAL: Map the extracted sections precisely. Do not invent any contact info, dates, degrees, or experience.
Ensure the output is a valid JSON object.`;

  const prompt = `Resume Plain Text:
"""
${resumeText}
"""

Please parse the resume text above and return a valid JSON object that matches this structure:
{
  "personalInfo": {
    "name": "Full name",
    "phone": "Phone number",
    "email": "Email address",
    "location": "City, State or Country",
    "linkedin": "LinkedIn URL if found",
    "github": "GitHub URL if found",
    "portfolio": "Portfolio website URL if found",
    "customLinks": []
  },
  "summary": "Professional summary paragraph if any",
  "experiences": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "location": "Location",
      "startDate": "Start Date or Year",
      "endDate": "End Date/Year or Present",
      "current": true/false (true if they currently work there),
      "descriptionBullets": ["bullet point 1", "bullet point 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Short description of project",
      "technologies": ["tech1", "tech2"],
      "githubLink": "github URL",
      "liveLink": "live deployment URL",
      "bullets": ["bullet point 1"]
    }
  ],
  "skills": {
    "languages": ["programming languages found"],
    "frameworks": ["frameworks found"],
    "libraries": ["libraries found"],
    "databases": ["databases found"],
    "cloud": ["cloud services e.g., AWS, GCP, Azure"],
    "devops": ["devops tools e.g., Docker, CI/CD"],
    "tools": ["other developer tools"],
    "softSkills": ["interpersonal/soft skills found"],
    "customCategories": []
  },
  "education": [
    {
      "institution": "University/College name",
      "degree": "Degree (e.g. BS, MS)",
      "field": "Field of Study (e.g. Computer Science)",
      "startDate": "Start date",
      "endDate": "End date",
      "gpa": "GPA value if found",
      "relevantCoursework": "list or coursework text",
      "location": "university location"
    }
  ],
  "certifications": [
    {
      "title": "Certification Name",
      "issuer": "Issuer",
      "date": "Earned date",
      "credentialUrl": "credential URL",
      "description": "description"
    }
  ],
  "achievements": [
    {
      "title": "Award/Achievement title",
      "organization": "Awarding body",
      "date": "Date received",
      "description": "description"
    }
  ]
}`;

  return await executeJSON(prompt, systemInstruction);
};

// 6. Critic Resume
const criticResume = async (resumeData, jdText = '') => {
  const systemInstruction = `You are an elite technical recruiter and hiring manager.
Conduct a rigorous review of the resume. Be constructive, analytical, and honest.
If a Job Description is provided, analyze the resume's match against the JD.
Output must be a valid JSON object matching the requested schema.`;

  const prompt = `Resume Data:
${JSON.stringify(resumeData)}

Job Description:
"${jdText}"

Provide a detailed review of the resume's content, structure, and JD relevance.
Output a JSON object exactly with this format:
{
  "strengths": ["List of 3-5 specific strengths in the resume"],
  "weaknesses": ["List of 3-5 concrete weaknesses or missing items"],
  "recommendations": ["List of 3-5 actionable recommendations to improve the resume"],
  "recruiterImpression": "A paragraph explaining the gut-check impression of a recruiter seeing this resume (e.g. formatting, impact, stack fit)."
}`;

  return await executeJSON(prompt, systemInstruction);
};

// 7. Copilot Chat
const copilotChat = async (messages, resumeContext = null, jdContext = null, profileContext = null) => {
  const systemInstruction = `You are the GenForge Resume Copilot.
Your job is to assist the user in writing and refining their resume, understanding job descriptions, improving experience statements, and matching keywords.
CONSTRAINTS:
1. ONLY make suggestions using the user's actual profile and resume details.
2. NEVER fabricate credentials, metrics, skills, or job history.
3. If they ask to write a bullet point or section, use the details they provided, or ask clarifying questions if details are missing.
4. Keep answers clear, structured, and professional.

Context details available to you:
- CURRENT RESUME: ${resumeContext ? JSON.stringify(resumeContext) : 'Not loaded yet'}
- TARGET JOB DESCRIPTION: ${jdContext ? JSON.stringify(jdContext) : 'Not loaded yet'}
- MASTER PROFILE: ${profileContext ? JSON.stringify(profileContext) : 'Not loaded yet'}`;

  // Format conversational prompt
  const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + '\nCOPILOT:';

  return await executeText(prompt, systemInstruction);
};

module.exports = {
  enhanceSummary,
  enhanceBullet,
  analyzeJobDescription,
  tailorResume,
  extractResumeData,
  criticResume,
  copilotChat,
  executeJSON,
  executeText
};
