import { useId, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { processProfileImageFile } from '../../utils/imageUpload';

const getInitials = (name) => {
  if (!name) return 'EH';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function ProfileAvatar({
  fullName,
  profilePicture,
  editable = false,
  saving = false,
  onUpload,
  onRemove,
  onError,
}) {
  const fileInputRef = useRef(null);
  const inputId = useId();
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUpload) return;

    setProcessing(true);
    try {
      const dataUrl = await processProfileImageFile(file);
      await onUpload(dataUrl);
    } catch (err) {
      onError?.(err.message || 'Unable to update profile picture.');
    } finally {
      setProcessing(false);
    }
  };

  const busy = saving || processing;

  return (
    <div className="profile-avatar-block">
      <div className="profile-avatar-frame">
        {profilePicture ? (
          <img
            src={profilePicture}
            alt={`${fullName || 'User'} profile picture`}
            className="profile-avatar-image"
          />
        ) : (
          <span className="profile-avatar-initials" aria-hidden="true">
            {getInitials(fullName)}
          </span>
        )}
      </div>

      {editable && (
        <div className="profile-avatar-controls">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="visually-hidden"
            onChange={handleFileChange}
            disabled={busy}
          />
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? (
              <Loader2 size={15} className="spin-icon" aria-hidden="true" />
            ) : (
              <Camera size={15} aria-hidden="true" />
            )}
            <span>
              {busy
                ? 'Updating...'
                : profilePicture
                  ? 'Change Photo'
                  : 'Upload Photo'}
            </span>
          </button>

          {profilePicture && onRemove && (
            <button
              type="button"
              className="btn-ghost-danger"
              disabled={busy}
              onClick={onRemove}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
