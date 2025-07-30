import LogicalLayerSection from './LogicalLayerSection';
import PhysicalLayerSection from './PhysicalLayerSection';

const SidebarComponent = () => {
  return (
    <div className="sidebar bg-dark text-white">
      <LogicalLayerSection />
      <PhysicalLayerSection />
    </div>
  );
};

export default SidebarComponent;