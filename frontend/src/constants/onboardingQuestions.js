export const ONBOARDING_QUESTIONS = [
  {
    id: 'techInterests',
    stepNumber: 1,
    question: 'Which areas of technology interest you the most?',
    hint: 'Select all areas you would like to explore at campus events.',
    type: 'multi',
    options: [
      'Web Development',
      'App Development',
      'Artificial Intelligence & Machine Learning',
      'Data Science',
      'Cybersecurity',
      'Cloud Computing & DevOps',
      'UI/UX Design',
      'Game Development',
      'Blockchain',
    ],
  },
  {
    id: 'programmingLanguages',
    stepNumber: 2,
    question: 'Which programming languages do you know?',
    hint: 'Select one or more languages you are comfortable using.',
    type: 'multi',
    otherField: 'otherProgrammingLanguage',
    otherPlaceholder: 'Specify other language (optional)',
    options: [
      'Java',
      'Python',
      'C',
      'C++',
      'JavaScript',
      'TypeScript',
      'PHP',
      'Other',
    ],
  },
  {
    id: 'frameworksAndTools',
    stepNumber: 3,
    question: 'Which technologies or frameworks have you worked with?',
    hint: 'Select all frameworks, databases, and developer tools you have used.',
    type: 'multi',
    otherField: 'otherFramework',
    otherPlaceholder: 'Specify other technology or framework (optional)',
    options: [
      'React.js',
      'Node.js',
      'Express.js',
      'MongoDB',
      'MySQL',
      'Next.js',
      'Django',
      'Flask',
      'Tailwind CSS',
      'Firebase',
      'TensorFlow',
      'Figma',
      'Git & GitHub',
      'Other',
    ],
  },
  {
    id: 'codingProficiency',
    stepNumber: 4,
    question: 'How would you rate your overall coding proficiency?',
    hint: 'Choose the level that best reflects your current comfort level.',
    type: 'single',
    options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  },
  {
    id: 'projectExperience',
    stepNumber: 5,
    question: 'What is your experience with projects?',
    hint: 'Select the option that best describes your hands-on project background.',
    type: 'single',
    options: [
      'No project experience yet',
      'Worked on personal projects',
      'Participated in college projects',
      'Participated in hackathons',
      'Worked on real-world or industry projects',
    ],
  },
  {
    id: 'preferredRoles',
    stepNumber: 6,
    question: 'Which role would you prefer in a team?',
    hint: 'Select one or multiple roles you enjoy taking in team collaborations.',
    type: 'multi',
    options: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'AI/ML Developer',
      'UI/UX Designer',
      'Data Analyst',
      'Researcher',
      'Project Manager',
      'Open to multiple roles',
    ],
  },
  {
    id: 'softSkills',
    stepNumber: 7,
    question: 'What are your strongest skills apart from programming?',
    hint: 'Select the strengths you bring to teams and campus initiatives.',
    type: 'multi',
    options: [
      'Problem Solving',
      'Communication',
      'Leadership',
      'Creativity',
      'Critical Thinking',
      'Research',
      'Presentation',
      'Teamwork',
      'Time Management',
    ],
  },
  {
    id: 'projectPreferences',
    stepNumber: 8,
    question: 'What kind of projects would you like to work on?',
    hint: 'Select the project themes you are most excited to build.',
    type: 'multi',
    options: [
      'Web Applications',
      'AI-Based Projects',
      'Mobile Applications',
      'Social Impact Projects',
      'Research & Innovation',
      'Cloud-Based Projects',
      'Open Source Projects',
      'Hackathon Projects',
    ],
  },
];

export const INITIAL_ONBOARDING_STATE = {
  techInterests: [],
  programmingLanguages: [],
  otherProgrammingLanguage: '',
  frameworksAndTools: [],
  otherFramework: '',
  codingProficiency: '',
  projectExperience: '',
  preferredRoles: [],
  softSkills: [],
  projectPreferences: [],
};

export const normalizeOnboardingState = (existing = {}) => ({
  techInterests: Array.isArray(existing.techInterests) ? existing.techInterests : [],
  programmingLanguages: Array.isArray(existing.programmingLanguages)
    ? existing.programmingLanguages
    : [],
  otherProgrammingLanguage: existing.otherProgrammingLanguage || '',
  frameworksAndTools: Array.isArray(existing.frameworksAndTools)
    ? existing.frameworksAndTools
    : [],
  otherFramework: existing.otherFramework || '',
  codingProficiency: existing.codingProficiency || '',
  projectExperience: existing.projectExperience || '',
  preferredRoles: Array.isArray(existing.preferredRoles) ? existing.preferredRoles : [],
  softSkills: Array.isArray(existing.softSkills) ? existing.softSkills : [],
  projectPreferences: Array.isArray(existing.projectPreferences)
    ? existing.projectPreferences
    : [],
});

export const isQuestionAnswered = (question, answers) => {
  const value = answers?.[question.id];
  if (question.type === 'multi') {
    return Array.isArray(value) && value.length > 0;
  }
  return Boolean(value && String(value).trim());
};
