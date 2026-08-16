const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Profile = require('../models/profile');
const Resume = require('../models/resume');

dotenv.config();

const demoUserEmail = 'demo@genforge.com';

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/genforge');
    console.log('Connected.');

    // Clear old demo user data
    console.log('Cleaning up existing demo data...');
    const existingUser = await User.findOne({ email: demoUserEmail });
    if (existingUser) {
      await Profile.deleteOne({ userId: existingUser._id });
      await Resume.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('Old demo user data deleted.');
    }

    // Create demo User
    console.log('Creating demo user...');
    const user = await User.create({
      name: 'John Doe',
      email: demoUserEmail,
      password: 'password123', // Will be hashed automatically by user pre-save hook
      profileCreated: true
    });
    console.log(`User created: ${user.name} (${user.email})`);

    // Create master Profile
    console.log('Creating master profile...');
    const profile = await Profile.create({
      userId: user._id,
      personalInfo: {
        name: 'John Doe',
        phone: '+1 (555) 019-2834',
        email: 'john.doe@email.com',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/johndoe-demo',
        github: 'https://github.com/johndoe-demo',
        portfolio: 'https://johndoe-demo.dev',
        customLinks: [
          { label: 'Medium Blog', url: 'https://medium.com/@johndoe-demo' }
        ]
      },
      education: [
        {
          institution: 'Stanford University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2019-09',
          endDate: '2023-06',
          gpa: '3.85 / 4.0',
          relevantCoursework: 'Data Structures & Algorithms, Database Systems, Distributed Systems, Artificial Intelligence',
          location: 'Stanford, CA'
        }
      ],
      experience: [
        {
          company: 'CloudScale Technologies',
          role: 'Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2023-07',
          endDate: 'Present',
          current: true,
          descriptionBullets: [
            'Architected and implemented a high-throughput REST API backend using Node.js and Express, improving server response times by 35%.',
            'Designed and executed migrations for MongoDB Atlas databases, optimizing query performance and indexing strategies.',
            'Collaborated with frontend teams to implement complex state-management patterns in React and Zustand, resolving legacy re-render bottlenecks.',
            'Configured GitHub Actions CI/CD pipelines to build and deploy Dockerized microservices into AWS ECS.'
          ]
        },
        {
          company: 'AppForge Studio',
          role: 'Junior Full Stack Developer',
          location: 'Remote',
          startDate: '2022-06',
          endDate: '2023-05',
          current: false,
          descriptionBullets: [
            'Built responsive web interfaces using React, Tailwind CSS, and HTML5, increasing user engagement metrics by 15%.',
            'Developed serverless cloud functions on AWS Lambda for automated image processing workflows.',
            'Assisted senior engineers in refactoring legacy codebases, migrating from class components to React Hooks.'
          ]
        }
      ],
      projects: [
        {
          name: 'CollabDoc — Realtime Collaborative Editor',
          description: 'A cloud-based rich text document editor supporting simultaneous edits from multiple active sockets.',
          technologies: ['React', 'Node.js', 'Socket.io', 'Redis', 'Tailwind CSS'],
          githubLink: 'https://github.com/johndoe-demo/collabdoc',
          liveLink: 'https://collabdoc-demo.dev',
          bullets: [
            'Utilized Socket.io and Redis adapters to manage connection states across multiple node instances.',
            'Implemented Operational Transformation (OT) rules to handle offline merges and synchronization conflicts.'
          ]
        }
      ],
      skills: {
        languages: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML5', 'CSS3'],
        frameworks: ['React', 'Express.js', 'Next.js'],
        libraries: ['Zustand', 'Socket.io', 'Mongoose', 'Redux Toolkit'],
        databases: ['MongoDB', 'PostgreSQL', 'Redis'],
        cloud: ['AWS (Lambda, S3, ECS, CloudWatch)', 'GCP'],
        devops: ['Docker', 'GitHub Actions', 'Linux', 'Git'],
        tools: ['VS Code', 'Postman', 'Figma'],
        softSkills: ['Problem Solving', 'Team Collaboration', 'Technical Writing', 'Agile Methodology'],
        customCategories: []
      },
      certifications: [
        {
          title: 'AWS Certified Solutions Architect – Associate',
          issuer: 'Amazon Web Services',
          date: '2024-02',
          credentialUrl: 'https://aws.amazon.com/verification',
          description: 'Validation of cloud architecture design expertise.'
        }
      ],
      achievements: [
        {
          title: 'Stanford Hackathon — 1st Place Winner',
          organization: 'Stanford CS Department',
          date: '2022-11',
          description: 'Awarded top spot out of 80 teams for designing a real-time accessibility plugin for websites.'
        }
      ]
    });
    console.log('Master profile seeded.');

    // Create a Resume version
    console.log('Creating sample resume tailored version...');
    const resume = await Resume.create({
      userId: user._id,
      name: 'Software Engineer - Google Tailored',
      targetRole: 'Senior Software Engineer',
      targetCompany: 'Google',
      jobDescription: {
        title: 'Senior Software Engineer',
        company: 'Google',
        websiteUrl: 'https://google.com/careers',
        jobUrl: 'https://google.com/jobs/12345',
        descriptionText: `Role: Senior Software Engineer
About: We are looking for an experienced full-stack engineer who is passionate about backend APIs, real-time architectures, cloud platforms, and clean client-side design.
Required Skills:
- Node.js, Express, JavaScript/TypeScript
- React and state management frameworks (Zustand or Redux)
- REST APIs, WebSockets, Redis
- AWS cloud deployments, Docker, CI/CD pipelines
- Strong communication, problem-solving skills
- BS/MS in Computer Science or related fields`,
        analyzedData: {
          title: 'Senior Software Engineer',
          requiredSkills: ['Node.js', 'Express', 'React', 'REST APIs', 'Docker', 'AWS'],
          preferredSkills: ['TypeScript', 'Redis', 'WebSockets'],
          technologies: ['JavaScript', 'Zustand', 'Docker', 'AWS'],
          responsibilities: ['Architect high throughput backends', 'Collaborate with frontend teams', 'Configure CI/CD pipelines'],
          educationRequirements: 'BS/MS in Computer Science',
          experienceRequirements: 'Senior-level industry experience',
          softSkills: ['Communication', 'Problem Solving'],
          keywords: ['REST APIs', 'Microservices', 'CI/CD', 'Cloud', 'Agile'],
          domainTerminology: ['SaaS', 'Cloud Infrastructure']
        }
      },
      personalInfo: profile.personalInfo,
      summary: 'Passionate and results-oriented Software Engineer with a Bachelor of Science in Computer Science from Stanford University. Over 2 years of industry experience specializing in the MERN stack, real-time collaboration engines, and containerized microservice architectures deployed to AWS. Proven track record of improving api backend performance by 35% and streamlining frontend workflows.',
      experiences: [
        {
          company: 'CloudScale Technologies',
          role: 'Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2023-07',
          endDate: 'Present',
          current: true,
          descriptionBullets: [
            'Architected and implemented a high-throughput REST API backend using Node.js and Express, improving server response times by 35%.',
            'Designed and executed migrations for MongoDB Atlas databases, optimizing query performance and indexing strategies.',
            'Collaborated with frontend teams to implement complex state-management patterns in React and Zustand, resolving legacy re-render bottlenecks.',
            'Configured GitHub Actions CI/CD pipelines to build and deploy Dockerized microservices into AWS ECS.'
          ]
        }
      ],
      projects: profile.projects,
      skills: profile.skills,
      education: profile.education,
      certifications: profile.certifications,
      achievements: profile.achievements,
      references: [],
      includeReferences: false,
      template: 'modern',
      styling: {
        accentColor: '#1e3a8a', // Dark blue
        fontSelection: 'Inter',
        fontSize: '10pt',
        lineSpacing: '1.3',
        sectionSpacing: '18px',
        margins: '0.8in'
      },
      atsScore: 88,
      atsAnalysis: {
        overallScore: 88,
        breakdown: {
          keywordMatch: { score: 32, max: 35 },
          jdRelevance: { score: 18, max: 20 },
          experienceRelevance: { score: 13, max: 15 },
          skillsCoverage: { score: 9, max: 10 },
          formatting: { score: 8, max: 10 },
          completeness: { score: 8, max: 10 }
        },
        keywordsAnalysis: {
          strongMatches: ['Node.js', 'Express', 'React', 'REST APIs', 'Docker', 'AWS', 'Zustand', 'JavaScript'],
          missing: ['TypeScript', 'Redis', 'WebSockets'],
          underrepresented: ['CI/CD', 'Microservices']
        }
      }
    });
    console.log('Sample tailored resume created.');

    console.log('Database seeding finished successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    mongoose.connection.close();
  }
};

seedData();
