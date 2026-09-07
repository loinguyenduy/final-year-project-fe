import ParticipantPublicProfileModal from '../../../../identity/components/ParticipantPublicProfileModal';

const PublicHandymanProfileModal = ({ handymanId, onClose }) => (
  <ParticipantPublicProfileModal participantId={handymanId} onClose={onClose} />
);

export default PublicHandymanProfileModal;
