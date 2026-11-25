import PageHeader from '../../components/common/PageHeader';
import ComingSoonCard from '../../components/common/ComingSoonCard';

export default function AdminModulePlaceholderPage({
  badge,
  title,
  description,
  icon,
  cardTitle,
  cardDescription,
  endpointHint,
}) {
  return (
    <>
      <PageHeader
        badge={badge}
        title={title}
        description={description}
      />
      <ComingSoonCard
        icon={icon}
        title={cardTitle}
        description={cardDescription}
        targetPhase="Upcoming Feature Phase"
        endpointHint={endpointHint}
        backTo="/admin"
      />
    </>
  );
}
