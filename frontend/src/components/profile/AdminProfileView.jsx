import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Building,
  CalendarClock,
  Camera,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Save,
  Shield,
  UserCircle,
  X,
} from 'lucide-react';
import PageHeader from '../common/PageHeader';
import ProfileAvatar from '../common/ProfileAvatar';
import { useAuth } from '../../context/AuthContext';
import {
  changePassword,
  updateAdminProfile,
  updateProfilePicture,
} from '../../services/profileService';
import { formatEventDate } from '../../utils/dateFormat';
import { processProfileImageFile } from '../../utils/imageUpload';

const PASSWORD_PATTERN = '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}';

export default function AdminProfileView() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    designation: user?.designation || 'Admin',
    department: user?.department || '',
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const settingsFileInputRef = useRef(null);

  useEffect(() => {
    setProfileForm({
      fullName: user?.fullName || '',
      designation: user?.designation || 'Admin',
      department: user?.department || '',
    });
  }, [user]);

  const clearFeedback = () => {
    if (statusMessage) setStatusMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    clearFeedback();
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (profileForm.fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await updateAdminProfile({
        fullName: profileForm.fullName.trim(),
        designation: profileForm.designation.trim() || 'Admin',
        department: profileForm.department.trim(),
      });
      updateUser(updatedUser);
      setEditing(false);
      setStatusMessage('Admin profile updated successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Unable to update admin profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (dataUrl) => {
    clearFeedback();
    setSavingAvatar(true);
    try {
      const updatedUser = await updateProfilePicture(dataUrl);
      updateUser(updatedUser);
      setStatusMessage('Profile picture updated successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Unable to update profile picture.');
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
      setErrorMessage(err.message || 'Unable to remove profile picture.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    clearFeedback();
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwordForm);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setShowPasswordForm(false);
      setStatusMessage('Password changed successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <PageHeader
        badge="Admin Panel • My Profile"
        title={user?.fullName || 'Administrator Profile'}
        description="Manage your personal administrator details and account security settings."
      />

      {statusMessage && (
        <div className="profile-alert is-success" role="status" aria-live="polite">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert is-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Personal Information */}
      <section className="card" aria-labelledby="admin-personal-heading">
        <div className="card-header">
          <div>
            <h3 id="admin-personal-heading" className="card-title">
              Personal Information
            </h3>
            <p className="card-subtitle">
              Your administrator identity details stored in MongoDB
            </p>
          </div>
          <span className="pill-badge is-ok">
            <BadgeCheck size={14} aria-hidden="true" />
            <span>{user?.designation || 'Admin'}</span>
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
            <h4 className="profile-display-name">{user?.fullName || 'Administrator'}</h4>
            <p className="profile-display-sub">
              {user?.designation || 'Admin'}
              {user?.department ? ` • ${user.department}` : ''}
            </p>
            <p className="profile-bio-placeholder">{user?.email}</p>
          </div>
        </div>

        {editing ? (
          <form
            className="profile-edit-form"
            onSubmit={handleProfileSave}
            aria-label="Edit administrator profile"
          >
            <div className="profile-form-grid">
              <div className="form-field">
                <label htmlFor="admin-fullname" className="form-label">
                  Full Name
                </label>
                <input
                  id="admin-fullname"
                  name="fullName"
                  type="text"
                  className="form-input"
                  required
                  minLength={2}
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="admin-designation" className="form-label">
                  Designation
                </label>
                <input
                  id="admin-designation"
                  name="designation"
                  type="text"
                  className="form-input"
                  placeholder="Admin"
                  maxLength={80}
                  value={profileForm.designation}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="admin-department" className="form-label">
                  Department (Optional)
                </label>
                <input
                  id="admin-department"
                  name="department"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Student Affairs / Computer Science"
                  maxLength={100}
                  value={profileForm.department}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="profile-form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setProfileForm({
                    fullName: user?.fullName || '',
                    designation: user?.designation || 'Admin',
                    department: user?.department || '',
                  });
                  setEditing(false);
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
                <Shield size={13} className="inline-icon" aria-hidden="true" />
                Designation
              </div>
              <div className="status-cell-value">{user?.designation || 'Admin'}</div>
            </div>

            <div className="status-cell">
              <div className="status-cell-label">
                <Building size={13} className="inline-icon" aria-hidden="true" />
                Department
              </div>
              <div className="status-cell-value">
                {user?.department || 'Not specified'}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="two-col-grid">
        {/* Account Information */}
        <section className="card" aria-labelledby="admin-account-heading">
          <div className="card-header">
            <div>
              <h3 id="admin-account-heading" className="card-title">
                Account Information
              </h3>
              <p className="card-subtitle">
                Verified role and account status
              </p>
            </div>
          </div>

          <div className="status-matrix">
            <div className="status-cell">
              <div className="status-cell-label">
                <Shield size={13} className="inline-icon" aria-hidden="true" />
                Account Role
              </div>
              <div className="status-cell-value" style={{ textTransform: 'capitalize' }}>
                {user?.role || 'admin'}
              </div>
            </div>

            <div className="status-cell">
              <div className="status-cell-label">
                <CalendarClock size={13} className="inline-icon" aria-hidden="true" />
                Account Created
              </div>
              <div className="status-cell-value">
                {formatEventDate(user?.createdAt)}
              </div>
            </div>

            <div className="status-cell">
              <div className="status-cell-label">Account Status</div>
              <div className="status-cell-value">
                <span className="pill-badge is-ok">
                  <span className="status-dot" aria-hidden="true" />
                  <span>{user?.accountStatus || 'Active'}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section className="card" aria-labelledby="admin-settings-heading">
          <div className="card-header">
            <div>
              <h3 id="admin-settings-heading" className="card-title">
                Account Settings
              </h3>
              <p className="card-subtitle">
                Profile updates, security, and session control
              </p>
            </div>
          </div>

          <div className="admin-settings-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                clearFeedback();
                setEditing((prev) => !prev);
              }}
            >
              {editing ? (
                <>
                  <X size={15} aria-hidden="true" />
                  <span>Close Profile Editor</span>
                </>
              ) : (
                <>
                  <Edit3 size={15} aria-hidden="true" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                clearFeedback();
                setShowPasswordForm((prev) => !prev);
              }}
            >
              <KeyRound size={15} aria-hidden="true" />
              <span>{showPasswordForm ? 'Close Password Form' : 'Change Password'}</span>
            </button>

            <input
              ref={settingsFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="visually-hidden"
              aria-label="Choose profile picture file"
              disabled={savingAvatar}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                clearFeedback();
                try {
                  const dataUrl = await processProfileImageFile(file);
                  await handleAvatarUpload(dataUrl);
                } catch (err) {
                  setErrorMessage(err.message || 'Unable to update profile picture.');
                }
              }}
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={savingAvatar}
              onClick={() => settingsFileInputRef.current?.click()}
            >
              <Camera size={15} aria-hidden="true" />
              <span>{savingAvatar ? 'Updating Photo...' : 'Update Profile Picture'}</span>
            </button>

            <button
              type="button"
              className="btn-ghost-danger"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={15} aria-hidden="true" />
              <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>

          {showPasswordForm && (
            <form
              className="profile-edit-form"
              onSubmit={handlePasswordSubmit}
              aria-label="Change administrator password"
            >
              <div className="form-field">
                <label htmlFor="admin-current-pw" className="form-label">
                  Current Password
                </label>
                <div className="password-input-wrap">
                  <input
                    id="admin-current-pw"
                    name="currentPassword"
                    type={showCurrentPw ? 'text' : 'password'}
                    className="form-input"
                    autoComplete="current-password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowCurrentPw((prev) => !prev)}
                    aria-label={
                      showCurrentPw ? 'Hide current password' : 'Show current password'
                    }
                  >
                    {showCurrentPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="admin-new-pw" className="form-label">
                  New Password
                </label>
                <span className="form-hint">
                  At least 8 characters with uppercase, lowercase, and a number.
                </span>
                <div className="password-input-wrap">
                  <input
                    id="admin-new-pw"
                    name="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    className="form-input"
                    autoComplete="new-password"
                    minLength={8}
                    pattern={PASSWORD_PATTERN}
                    required
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPw((prev) => !prev)}
                    aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="admin-confirm-pw" className="form-label">
                  Confirm New Password
                </label>
                <input
                  id="admin-confirm-pw"
                  name="confirmNewPassword"
                  type="password"
                  className="form-input"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={passwordForm.confirmNewPassword}
                  onChange={handlePasswordChange}
                />
              </div>

              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <Loader2 size={15} className="spin-icon" aria-hidden="true" />
                  ) : (
                    <KeyRound size={15} aria-hidden="true" />
                  )}
                  <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
