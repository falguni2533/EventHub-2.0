const toList = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []);
const norm = (v) => [...new Set(toList(v).map((s) => String(s).trim().toLowerCase()).filter(Boolean))];

/**
 * Extract a comprehensive profile from the User document.
 * Uses ALL onboarding fields: techInterests, programmingLanguages,
 * frameworksAndTools, codingProficiency, projectExperience,
 * preferredRoles, softSkills, projectPreferences.
 */
export const getProfile = (u = {}) => {
    const o = u.onboarding || u.profile || {};
    return {
        // Core skills = programmingLanguages + frameworksAndTools + explicit skills
        skills: norm([
            ...(u.skills ?? []),
            ...(o.skills ?? []),
            ...(o.programmingLanguages ?? []),
            ...(o.frameworksAndTools ?? []),
            ...(o.otherProgrammingLanguage ? [o.otherProgrammingLanguage] : []),
            ...(o.otherFramework ? [o.otherFramework] : []),
        ]),
        // Interests = techInterests + preferredCategories + interests
        interests: norm([
            ...(u.interests ?? []),
            ...(o.interests ?? []),
            ...(u.preferredCategories ?? []),
            ...(o.preferredCategories ?? []),
            ...(o.techInterests ?? []),
        ]),
        department: String(u.department ?? u.branch ?? o.department ?? o.branch ?? '').trim().toLowerCase(),
        year: String(u.year ?? o.year ?? '').trim().toLowerCase(),
        // Extended profile fields for deeper matching
        codingProficiency: String(o.codingProficiency ?? '').trim().toLowerCase(),
        projectExperience: String(o.projectExperience ?? '').trim().toLowerCase(),
        preferredRoles: norm(o.preferredRoles),
        softSkills: norm(o.softSkills),
        projectPreferences: norm(o.projectPreferences),
        collegeName: String(u.collegeName ?? '').trim().toLowerCase(),
        course: String(u.course ?? '').trim().toLowerCase(),
    };
};

/**
 * Map coding proficiency strings to numeric tiers.
 * Close tiers = better fit for collaboration.
 */
const proficiencyTier = (level) => {
    const map = { beginner: 1, basic: 1, intermediate: 2, advanced: 3, expert: 4, professional: 4 };
    return map[level] || 0;
};

/**
 * Leader looking at a candidate student.
 * Uses full profile: skills, interests, proficiency, roles, soft skills, etc.
 *
 * Scoring breakdown (max 100):
 *   Skills match vs team needs    → up to 30
 *   Tech interest / category      → up to 15
 *   Programming language overlap  → up to 10
 *   Same department               → 8
 *   Same college                  → 5
 *   Same year                     → 3
 *   Coding proficiency closeness  → up to 7
 *   Preferred role complements    → up to 7
 *   Soft skills overlap           → up to 5
 *   Project preference match      → up to 5
 *   Actively looking bonus        → 5
 */
export const scoreStudentForTeam = (candidate, team, post) => {
    const p = getProfile(candidate);
    const lead = getProfile(team.leader);
    const needed = norm(team.skillsNeeded);
    const candidateSkills = [...new Set([...p.skills, ...norm(post?.skills)])];
    let score = 0;
    const reasons = [];
    const profileDetails = {};

    // 1. Skills match vs team needs (up to 30)
    if (needed.length) {
        const hit = needed.filter((s) => candidateSkills.includes(s));
        if (hit.length) {
            score += Math.round((hit.length / needed.length) * 30);
            reasons.push(`Skills match: ${hit.join(', ')}`);
        }
    } else if (candidateSkills.length) {
        score += 10;
    }

    // 2. Tech interest / event category match (up to 15)
    const cat = String(team.event?.category || '').toLowerCase();
    if (cat && p.interests.includes(cat)) {
        score += 15;
        reasons.push(`Interested in ${team.event.category} events`);
    } else {
        // Check interest overlap with leader
        const sharedInterests = p.interests.filter((i) => lead.interests.includes(i));
        if (sharedInterests.length) {
            score += Math.min(sharedInterests.length * 5, 10);
            reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
        }
    }

    // 3. Programming language / framework overlap beyond explicit needs (up to 10)
    const extraSkillOverlap = candidateSkills.filter(
        (s) => lead.skills.includes(s) && !needed.includes(s)
    );
    if (extraSkillOverlap.length) {
        score += Math.min(extraSkillOverlap.length * 3, 10);
        reasons.push(`Also knows: ${extraSkillOverlap.slice(0, 3).join(', ')}`);
    }

    // 4. Same department (8)
    if (p.department && p.department === lead.department) {
        score += 8;
        reasons.push('Same department');
    }

    // 5. Same college (5)
    if (p.collegeName && p.collegeName === lead.collegeName) {
        score += 5;
        reasons.push('Same college');
    }

    // 6. Same year (3)
    if (p.year && p.year === lead.year) {
        score += 3;
        reasons.push('Same year');
    }

    // 7. Coding proficiency closeness (up to 7)
    const candTier = proficiencyTier(p.codingProficiency);
    const leadTier = proficiencyTier(lead.codingProficiency);
    if (candTier && leadTier) {
        const diff = Math.abs(candTier - leadTier);
        if (diff === 0) { score += 7; reasons.push('Same coding level'); }
        else if (diff === 1) { score += 4; reasons.push('Similar coding level'); }
    }

    // 8. Preferred role complements (up to 7)
    if (p.preferredRoles.length && lead.preferredRoles.length) {
        // Complementary = candidate brings roles the leader doesn't have
        const complementary = p.preferredRoles.filter((r) => !lead.preferredRoles.includes(r));
        if (complementary.length) {
            score += Math.min(complementary.length * 3, 7);
            reasons.push(`Brings role: ${complementary.slice(0, 2).join(', ')}`);
        }
    }

    // 9. Soft skills overlap (up to 5)
    if (p.softSkills.length) {
        const sharedSoft = p.softSkills.filter((s) => lead.softSkills.includes(s));
        if (sharedSoft.length) {
            score += Math.min(sharedSoft.length * 2, 5);
        }
    }

    // 10. Project preference match (up to 5)
    if (p.projectPreferences.length && lead.projectPreferences.length) {
        const sharedPrefs = p.projectPreferences.filter((pr) => lead.projectPreferences.includes(pr));
        if (sharedPrefs.length) {
            score += Math.min(sharedPrefs.length * 2, 5);
            reasons.push(`Project style: ${sharedPrefs.slice(0, 2).join(', ')}`);
        }
    }

    // 11. Actively looking bonus (5)
    if (post) {
        score += 5;
        reasons.push('Actively looking for a team');
    }

    // Build profile detail summary for the frontend card
    profileDetails.skills = candidateSkills.slice(0, 8);
    profileDetails.interests = p.interests.slice(0, 5);
    profileDetails.codingProficiency = p.codingProficiency || null;
    profileDetails.projectExperience = p.projectExperience || null;
    profileDetails.preferredRoles = p.preferredRoles.slice(0, 3);
    profileDetails.softSkills = p.softSkills.slice(0, 4);
    profileDetails.department = p.department || null;
    profileDetails.year = p.year || null;
    profileDetails.collegeName = p.collegeName || null;
    profileDetails.course = candidate.course || null;

    return { score: Math.min(score, 100), reasons, profileDetails };
};

/**
 * Solo student looking at a team.
 * Uses full profile for deeper matching.
 *
 * Scoring breakdown (max 100):
 *   Your skills match team needs      → up to 30
 *   Event category interest           → up to 15
 *   Shared interests with leader      → up to 10
 *   Same department                   → 8
 *   Same college                      → 5
 *   Same year                         → 3
 *   Coding proficiency closeness      → up to 7
 *   Your role complements team        → up to 7
 *   Project preference match          → up to 5
 *   Open spots bonus                  → up to 10
 */
export const scoreTeamForStudent = (student, team) => {
    const p = getProfile(student);
    const lead = getProfile(team.leader);
    const needed = norm(team.skillsNeeded);
    let score = 0;
    const reasons = [];

    // 1. Skills match vs team needs (up to 30)
    if (needed.length) {
        const hit = needed.filter((s) => p.skills.includes(s));
        if (hit.length) {
            score += Math.round((hit.length / needed.length) * 30);
            reasons.push(`They need ${hit.join(', ')} — you have it`);
        }
    }

    // 2. Event category interest (up to 15)
    const cat = String(team.event?.category || '').toLowerCase();
    if (cat && p.interests.includes(cat)) {
        score += 15;
        reasons.push(`Matches your ${team.event.category} interest`);
    }

    // 3. Shared interests with leader (up to 10)
    const sharedInterests = p.interests.filter((i) => lead.interests.includes(i));
    if (sharedInterests.length) {
        score += Math.min(sharedInterests.length * 4, 10);
        reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
    }

    // 4. Same department (8)
    if (p.department && p.department === lead.department) {
        score += 8;
        reasons.push('Same department as leader');
    }

    // 5. Same college (5)
    if (p.collegeName && p.collegeName === lead.collegeName) {
        score += 5;
        reasons.push('Same college');
    }

    // 6. Same year (3)
    if (p.year && p.year === lead.year) {
        score += 3;
        reasons.push('Same year as leader');
    }

    // 7. Coding proficiency closeness (up to 7)
    const myTier = proficiencyTier(p.codingProficiency);
    const leadTier = proficiencyTier(lead.codingProficiency);
    if (myTier && leadTier) {
        const diff = Math.abs(myTier - leadTier);
        if (diff === 0) { score += 7; reasons.push('Same coding level as leader'); }
        else if (diff === 1) { score += 4; reasons.push('Similar coding level'); }
    }

    // 8. Your role complements team (up to 7)
    if (p.preferredRoles.length && lead.preferredRoles.length) {
        const complementary = p.preferredRoles.filter((r) => !lead.preferredRoles.includes(r));
        if (complementary.length) {
            score += Math.min(complementary.length * 3, 7);
            reasons.push(`You bring: ${complementary.slice(0, 2).join(', ')}`);
        }
    }

    // 9. Project preference match (up to 5)
    if (p.projectPreferences.length && lead.projectPreferences.length) {
        const shared = p.projectPreferences.filter((pr) => lead.projectPreferences.includes(pr));
        if (shared.length) {
            score += Math.min(shared.length * 2, 5);
            reasons.push(`Compatible project style`);
        }
    }

    // 10. Open spots bonus (up to 10)
    const spots = team.maxMembers - team.members.length;
    if (spots > 0) {
        score += Math.min(spots * 3, 10);
        reasons.push(`${spots} open spot${spots > 1 ? 's' : ''}`);
    }

    return { score: Math.min(score, 100), reasons };
};