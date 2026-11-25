import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  Code2,
  Compass,
  Edit3,
  ExternalLink,
  Github,
  GraduationCap,
  HeartHandshake,
  IdCard,
  Linkedin,
  Loader2,
  Mail,
  Save,
  Sparkles,
  UserCircle,
  X,
} from 'lucide-react';
import PageHeader from '../common/PageHeader';
import ProfileAvatar from '../common/ProfileAvatar';
import StudentOnboardingWizard from './StudentOnboardingWizard';
import { useAuth } from '../../context/AuthContext';
import {
  submitStudentOnboarding,
  updateProfilePicture,
  updateStudentProfile,
} from '../../services/profileService';

const buildEditState = (user) => ({
  fullName: user?.fullName || '',
  collegeName: user?.collegeName || '',
  studentId: user?.studentId || '',
  course: user?.course || '',
  year: user?.year || '',
  bio: user?.bio || '',
  github: user?.socialLinks?.github || '',
  linkedin: user?.socialLinks?.linkedin || '',
});

export default function StudentProfileView() {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [wizardMode, setWizardMode] = useState(
    () => !user?.profileCompleted && searchParams.get('onboarding') === '1'
  );
  const [editingInfo, setEditingInfo] = useState(false);
  const [formState, setFormState] = useState(() => buildEditState(user));
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormState(buildEditState(user));
  }, [user]);

  useEffect(() => {
    if (!user?.profileCompleted && searchParams.get('onboarding') === '1') {
      setWizardMode(true);
    }
  }, [user?.profileCompleted, searchParams]);

  const clearFeedback = () => {
    if (statusMessage) setStatusMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleStartWizard = () => {
    clearFeedback();
    setEditingInfo(false);
    setWizardMode(true);
  };

  const handleCloseWizard = () => {
    clearFeedback();
    setWizardMode(false);
    if (searchParams.has('onboarding')) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleOnboardingSubmit = async (answers) => {
    clearFeedback();
    setSavingOnboarding(true);
    try {
      const updatedUser = user?.profileCompleted
        ? await updateStudentProfile({ onboarding: answers })
        : await submitStudentOnboarding({ onboarding: answers });
      updateUser(updatedUser);
      setWizardMode(false);
      if (searchParams.has('onboarding')) {
        setSearchParams({}, { replace: true });
      }
      setStatusMessage(
        user?.profileCompleted
          ? 'Your profile preferences and skills have been updated.'
          : 'Your Student Profile has been generated and saved to MongoDB!'
      );
    } catch (err) {
      setErrorMessage(err.message || 'Unable to save questionnaire answers.');
    } finally {
      setSavingOnboarding(false);
    }
  };

  const handleAvatarUpload = async (dataUrl) => {
    clearFeedback();
    setSavingAvatar(true);
    try {
      const updatedUser = await updateProfilePicture(dataUrl);
      updateUser(updatedUser);
      setStatusMessage('Profile picture updated.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile picture.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    clearFeedback();
    setSavingAvatar(true);
    try {
      const updatedUser = await updateProfilePicture('');
      updateUser(updatedUser);
      setStatusMessage('Profile picture removed.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove profile picture.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    clearFeedback();
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (formState.fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (formState.collegeName.trim().length < 2) {
      setErrorMessage('College name must be at least 2 characters.');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await updateStudentProfile({
        fullName: formState.fullName.trim(),
        collegeName: formState.collegeName.trim(),
        studentId: formState.studentId.trim(),
        course: formState.course.trim(),
        year: formState.year.trim(),
        bio: formState.bio.trim(),
        socialLinks: {
          github: formState.github.trim(),
          linkedin: formState.linkedin.trim(),
        },
      });
      updateUser(updatedUser);
      setEditingInfo(false);
      setStatusMessage('Personal information and social links updated successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update student profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onboarding = user?.onboarding || {};
  const languages = [
    ...(onboarding.programmingLanguages || []).filter((lang) => lang !== 'Other'),
    ...(onboarding.otherProgrammingLanguage
      ? [onboarding.otherProgrammingLanguage]
      : onboarding.programmingLanguages?.includes('Other')
        ? ['Other']
        : []),
  ];
  const frameworks = [
    ...(onboarding.frameworksAndTools || []).filter((tool) => tool !== 'Other'),
    ...(onboarding.otherFramework
      ? [onboarding.otherFramework]
      : onboarding.frameworksAndTools?.includes('Other')
        ? ['Other']
        : []),
  ];

  const courseYearDisplay =
    user?.course || user?.year
      ? [user?.course, user?.year].filter(Boolean).join(' • ')
      : 'Not specified yet';

  return (
    <>
      <PageHeader
        badge="Student Panel • My Profile"
        title={user?.fullName || 'Student Profile'}
        description={
          user?.profileCompleted
            ? 'Your verified campus profile, technical stack, interests, and team preferences.'
            : 'Complete your 8-step onboarding questionnaire to generate your personalized EventHub student profile.'
        }
        action={
          user?.profileCompleted && !wizardMode ? (
            <div className="profile-header-actions">
              <button
                type="button"
                className="btn-hero-ghost"
                onClick={handleStartWizard}
              >
                <Sparkles size={15} aria-hidden="true" />
                <span>Edit Questionnaire</span>
              </button>
              <button
                type="button"
                className="btn-hero-solid"
                onClick={() => {
                  clearFeedback();
                  setEditingInfo((prev) => !prev);
                }}
              >
                {editingInfo ? (
                  <>
                    <X size={15} aria-hidden="true" />
                    <span>Cancel Edit</span>
                  </>
                ) : (
                  <>
                    <Edit3 size={15} aria-hidden="true" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>
          ) : null
        }
      />

      {statusMessage && (
        <div className="profile-alert is-success" role="status" aria-live="polite">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && !wizardMode && (
        <div className="auth-alert is-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Onboarding Questionnaire Wizard */}
      {wizardMode && (
        <StudentOnboardingWizard
          initialAnswers={user?.onboarding}
          isEditing={Boolean(user?.profileCompleted)}
          submitting={savingOnboarding}
          serverError={errorMessage}
          onSubmit={handleOnboardingSubmit}
          onCancel={handleCloseWizard}
        />
      )}

      {/* First-Time Student Onboarding Prompt */}
      {!user?.profileCompleted && !wizardMode && (
        <section
          className="card onboarding-prompt-card"
          aria-labelledby="complete-profile-heading"
        >
          <div className="onboarding-prompt-body">
            <div className="onboarding-prompt-icon" aria-hidden="true">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 id="complete-profile-heading" className="card-title">
                Complete Your Student Profile
              </h3>
              <p className="card-subtitle" style={{ marginBlockStart: '0.3rem' }}>
                Answer 8 quick questions about your tech interests, programming
                languages, project experience, and preferred team roles to generate
                your profile.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleStartWizard}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Complete Your Profile</span>
          </button>
        </section>
      )}

      {/* Generated / Editable Student Profile */}
      {!wizardMode && (
        <>
          {/* Personal Information */}
          <section className="card" aria-labelledby="personal-info-heading">
            <div className="card-header">
              <div>
                <h3 id="personal-info-heading" className="card-title">
                  Personal Information
                </h3>
                <p className="card-subtitle">
                  Academic identity and profile overview stored in MongoDB
                </p>
              </div>
              <span className={`pill-badge ${user?.profileCompleted ? 'is-ok' : 'is-warn'}`}>
                <BadgeCheck size={14} aria-hidden="true" />
                <span>
                  {user?.profileCompleted ? 'Profile Complete' : 'Setup Pending'}
                </span>
              </span>
            </div>

            <div className="profile-identity-row">
              <ProfileAvatar
                fullName={user?.fullName}
                profilePicture={user?.profilePicture}
                editable
                saving={savingAvatar}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                onError={(msg) => setErrorMessage(msg)}
              />

              <div className="profile-identity-summary">
                <h4 className="profile-display-name">{user?.fullName}</h4>
                <p className="profile-display-sub">
                  {user?.collegeName} • {courseYearDisplay}
                </p>
                {user?.bio ? (
                  <p className="profile-bio-text">{user.bio}</p>
                ) : (
                  <p className="profile-bio-placeholder">
                    Add a short bio, your course, and year from Edit Profile.
                  </p>
                )}
              </div>
            </div>

            {editingInfo ? (
              <form
                className="profile-edit-form"
                onSubmit={handleProfileSave}
                aria-label="Edit student personal information"
              >
                <div className="profile-form-grid">
                  <div className="form-field">
                    <label htmlFor="student-fullname" className="form-label">
                      Full Name
                    </label>
                    <input
                      id="student-fullname"
                      name="fullName"
                      type="text"
                      className="form-input"
                      required
                      minLength={2}
                      value={formState.fullName}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="student-college" className="form-label">
                      College Name
                    </label>
                    <input
                      id="student-college"
                      name="collegeName"
                      type="text"
                      className="form-input"
                      required
                      minLength={2}
                      value={formState.collegeName}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="student-id" className="form-label">
                      Student ID / Enrollment No.
                    </label>
                    <input
                      id="student-id"
                      name="studentId"
                      type="text"
                      className="form-input"
                      required
                      minLength={2}
                      value={formState.studentId}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="student-course" className="form-label">
                      Course / Branch
                    </label>
                    <input
                      id="student-course"
                      name="course"
                      type="text"
                      className="form-input"
                      placeholder="e.g. B.Tech Computer Science"
                      maxLength={100}
                      value={formState.course}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="student-year" className="form-label">
                      Academic Year
                    </label>
                    <select
                      id="student-year"
                      name="year"
                      className="form-input"
                      value={formState.year}
                      onChange={handleEditChange}
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="student-github" className="form-label">
                      GitHub Profile Link (Optional)
                    </label>
                    <input
                      id="student-github"
                      name="github"
                      type="url"
                      className="form-input"
                      placeholder="https://github.com/username"
                      value={formState.github}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="student-linkedin" className="form-label">
                      LinkedIn Profile Link (Optional)
                    </label>
                    <input
                      id="student-linkedin"
                      name="linkedin"
                      type="url"
                      className="form-input"
                      placeholder="https://linkedin.com/in/username"
                      value={formState.linkedin}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="student-bio" className="form-label">
                    Short Bio (Optional)
                  </label>
                  <textarea
                    id="student-bio"
                    name="bio"
                    rows={3}
                    maxLength={500}
                    className="form-input"
                    placeholder="Share a quick summary about what you enjoy building or learning..."
                    value={formState.bio}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setFormState(buildEditState(user));
                      setEditingInfo(false);
                    }}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <Loader2 size={15} className="spin-icon" aria-hidden="true" />
                    ) : (
                      <Save size={15} aria-hidden="true" />
                    )}
                    <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="status-matrix">
                <div className="status-cell">
                  <div className="status-cell-label">
                    <UserCircle size={13} className="inline-icon" aria-hidden="true" />
                    Full Name
                  </div>
                  <div className="status-cell-value">{user?.fullName || '—'}</div>
                </div>
                <div className="status-cell">
                  <div className="status-cell-label">
                    <Mail size={13} className="inline-icon" aria-hidden="true" />
                    Email Address
                  </div>
                  <div className="status-cell-value">{user?.email || '—'}</div>
                </div>
                <div className="status-cell">
                  <div className="status-cell-label">
                    <Building2 size={13} className="inline-icon" aria-hidden="true" />
                    College Name
                  </div>
                  <div className="status-cell-value">{user?.collegeName || '—'}</div>
                </div>
                <div className="status-cell">
                  <div className="status-cell-label">
                    <IdCard size={13} className="inline-icon" aria-hidden="true" />
                    Student ID
                  </div>
                  <div className="status-cell-value">{user?.studentId || '—'}</div>
                </div>
                <div className="status-cell">
                  <div className="status-cell-label">
                    <GraduationCap size={13} className="inline-icon" aria-hidden="true" />
                    Course &amp; Year
                  </div>
                  <div className="status-cell-value">{courseYearDisplay}</div>
                </div>
              </div>
            )}
          </section>

          {/* Generated Questionnaire Sections (Displayed once onboarding is completed) */}
          {user?.profileCompleted && (
            <>
              <div className="two-col-grid">
                {/* Technical Skills */}
                <section className="card" aria-labelledby="tech-skills-heading">
                  <div className="card-header">
                    <div>
                      <h3 id="tech-skills-heading" className="card-title">
                        Technical Skills
                      </h3>
                      <p className="card-subtitle">
                        Languages, frameworks, and proficiency level
                      </p>
                    </div>
                    <Code2 size={20} color="#6d28d9" aria-hidden="true" />
                  </div>

                  <div className="profile-section-stack">
                    <div className="profile-proficiency-banner">
                      <div>
                        <span className="profile-group-label">Coding Proficiency</span>
                        <div className="profile-proficiency-value">
                          <Award size={16} aria-hidden="true" />
                          <span>{onboarding.codingProficiency || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="profile-group-label">Project Experience</span>
                        <div className="profile-experience-value">
                          <Briefcase size={15} aria-hidden="true" />
                          <span>{onboarding.projectExperience || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="profile-group-label">Programming Languages</div>
                      <div className="skill-tags-wrap">
                        {languages.map((lang) => (
                          <span key={lang} className="skill-tag is-primary">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="profile-group-label">
                        Technologies &amp; Frameworks
                      </div>
                      <div className="skill-tags-wrap">
                        {frameworks.map((tool) => (
                          <span key={tool} className="skill-tag">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Interests */}
                <section className="card" aria-labelledby="interests-heading">
                  <div className="card-header">
                    <div>
                      <h3 id="interests-heading" className="card-title">
                        Interests &amp; Team Preferences
                      </h3>
                      <p className="card-subtitle">
                        Tech areas, preferred roles, and project interests
                      </p>
                    </div>
                    <Compass size={20} color="#6d28d9" aria-hidden="true" />
                  </div>

                  <div className="profile-section-stack">
                    <div>
                      <div className="profile-group-label">
                        Areas of Technology Interest
                      </div>
                      <div className="skill-tags-wrap">
                        {(onboarding.techInterests || []).map((interest) => (
                          <span key={interest} className="skill-tag is-primary">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="profile-group-label">Preferred Team Roles</div>
                      <div className="skill-tags-wrap">
                        {(onboarding.preferredRoles || []).map((role) => (
                          <span key={role} className="skill-tag">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="profile-group-label">Project Preferences</div>
                      <div className="skill-tags-wrap">
                        {(onboarding.projectPreferences || []).map((pref) => (
                          <span key={pref} className="skill-tag is-soft">
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="two-col-grid">
                {/* Soft Skills */}
                <section className="card" aria-labelledby="soft-skills-heading">
                  <div className="card-header">
                    <div>
                      <h3 id="soft-skills-heading" className="card-title">
                        Soft Skills
                      </h3>
                      <p className="card-subtitle">
                        Collaboration and leadership strengths
                      </p>
                    </div>
                    <HeartHandshake size={20} color="#6d28d9" aria-hidden="true" />
                  </div>

                  <div className="skill-tags-wrap">
                    {(onboarding.softSkills || []).map((skill) => (
                      <span key={skill} className="skill-tag is-soft">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Social Links */}
                <section className="card" aria-labelledby="social-links-heading">
                  <div className="card-header">
                    <div>
                      <h3 id="social-links-heading" className="card-title">
                        Social Links
                      </h3>
                      <p className="card-subtitle">
                        Optional developer &amp; professional profiles
                      </p>
                    </div>
                  </div>

                  <div className="social-links-list">
                    <div className="social-link-row">
                      <div className="social-link-label">
                        <Github size={17} aria-hidden="true" />
                        <span>GitHub</span>
                      </div>
                      {user?.socialLinks?.github ? (
                        <a
                          href={user.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link-anchor"
                        >
                          <span>{user.socialLinks.github}</span>
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="social-link-empty">Not linked yet</span>
                      )}
                    </div>

                    <div className="social-link-row">
                      <div className="social-link-label">
                        <Linkedin size={17} aria-hidden="true" />
                        <span>LinkedIn</span>
                      </div>
                      {user?.socialLinks?.linkedin ? (
                        <a
                          href={user.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link-anchor"
                        >
                          <span>{user.socialLinks.linkedin}</span>
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="social-link-empty">Not linked yet</span>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
