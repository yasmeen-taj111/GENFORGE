const Profile = require('../models/profile');
const User = require('../models/user');

// @desc    Get user master profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    
    // If no profile, create an empty one
    if (!profile) {
      profile = await Profile.create({
        userId: req.user._id,
        personalInfo: {
          name: req.user.name,
          email: req.user.email,
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          portfolio: '',
          customLinks: []
        },
        education: [],
        experience: [],
        projects: [],
        skills: {
          languages: [],
          frameworks: [],
          libraries: [],
          databases: [],
          cloud: [],
          devops: [],
          tools: [],
          softSkills: [],
          customCategories: []
        },
        certifications: [],
        achievements: []
      });
    }
    
    return res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user master profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { personalInfo, education, experience, projects, skills, certifications, achievements, customSections } = req.body;

    let profile = await Profile.findOne({ userId: req.user._id });

    if (profile) {
      profile.personalInfo = personalInfo || profile.personalInfo;
      profile.education = education || profile.education;
      profile.experience = experience || profile.experience;
      profile.projects = projects || profile.projects;
      profile.skills = skills || profile.skills;
      profile.certifications = certifications || profile.certifications;
      profile.achievements = achievements || profile.achievements;
      profile.customSections = customSections || profile.customSections;

      const updatedProfile = await profile.save();
      
      // Update User profileCreated flag
      await User.findByIdAndUpdate(req.user._id, { profileCreated: true });

      return res.json(updatedProfile);
    } else {
      return res.status(404).json({ message: 'Profile not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile };
