/**
 * Recommendation Engine – AI or heuristic based skill suggestions.
 * If the Gemini API plugin is installed, we can call `gemini generate`.
 * In this sandbox we provide a simple heuristic fallback.
 */

// Heuristic mapping from onboarding fields to skill suggestions
const TECH_MAP = {
  javascript: ['React', 'Node.js', 'Vue', 'TypeScript'],
  python: ['Django', 'Flask', 'Pandas', 'TensorFlow'],
  java: ['Spring', 'Android', 'Hibernate'],
  c: ['Embedded C', 'Linux Kernel'],
  cpp: ['Qt', 'Boost', 'Game Development'],
  golang: ['Go microservices', 'Docker', 'Kubernetes'],
};

/**
 * Generate skill suggestions based on a user's onboarding data.
 * @param {object} onboarding - the onboarding sub‑document from User.
 * @returns {string[]} array of suggested skill names (max 5).
 */
export function suggestSkills(onboarding) {
  const suggestions = new Set();

  // languages
  (onboarding.programmingLanguages || []).forEach((lang) => {
    const key = lang.toLowerCase();
    const mapped = TECH_MAP[key];
    if (mapped) {
      mapped.forEach((s) => suggestions.add(s));
    }
  });

  // frameworks / tools
  (onboarding.frameworksAndTools || []).forEach((tool) => {
    const t = tool.toLowerCase();
    if (t.includes('react')) suggestions.add('React');
    if (t.includes('node')) suggestions.add('Node.js');
    if (t.includes('aws') || t.includes('cloud')) suggestions.add('AWS');
    if (t.includes('docker')) suggestions.add('Docker');
    if (t.includes('kubernetes')) suggestions.add('Kubernetes');
    if (t.includes('ml') || t.includes('ai')) suggestions.add('Machine Learning');
  });

  // tech interests (free‑form strings)
  (onboarding.techInterests || []).forEach((interest) => {
    const i = interest.toLowerCase();
    if (i.includes('mobile')) suggestions.add('React Native');
    if (i.includes('frontend')) suggestions.add('React');
    if (i.includes('backend')) suggestions.add('Node.js');
    if (i.includes('data')) suggestions.add('Data Science');
  });

  // limit to 5 suggestions for brevity
  return Array.from(suggestions).slice(0, 5);
}
