import PropTypes from 'prop-types';
import './team.css';

export default function TeamCard({ member, onClick }) {
  return (
    <div className="team-card" onClick={onClick} role="button" tabIndex={0} onKeyPress={e => e.key === 'Enter' && onClick?.() }>
      <img src={member.profilePicture} alt={member.name} className="team-avatar" />
      <h4 className="team-name">{member.name}</h4>
      <p className="team-interests">{member.interests.join(', ')}</p>
    </div>
  );
}

TeamCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    profilePicture: PropTypes.string.isRequired,
    interests: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onClick: PropTypes.func,
};
