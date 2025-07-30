import { PhysicalPlace, Edge } from "../envTypes";
import { useEnvStore } from '../envStore';
import { clearAllFeatures, disableDrawing, addPlaceFromCoordinates, drawArrowBetweenPolygons, getFeatureById } from '../utils/drawUtils';

const HeaderComponent = () => {
  const isEditable = useEnvStore((state) => state.isEditable);
  const setEditable = useEnvStore((state) => state.setEditable);
  const setActiveTool = useEnvStore((state) => state.setActiveTool);
  const mapInstance = useEnvStore((state) => state.mapInstance);
  const clearModel = useEnvStore((state) => state.clearModel);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const model = JSON.parse(event.target?.result as string);

            clear();
            useEnvStore.getState().places = model.places || [];
            useEnvStore.getState().edges = model.edges || [];
            useEnvStore.getState().logicalPlaces = model.logicalPlaces || [];
            useEnvStore.getState().views = model.views || [];

            model.places.forEach((place: PhysicalPlace) => {
              console.log('Drawing place:', place.id);
              addPlaceFromCoordinates(place.id, place.coordinates);
            });

            model.edges.forEach((edge: Edge) => {
              const sourceFeature = getFeatureById(edge.source);
              const targetFeature = getFeatureById(edge.target);
              if (sourceFeature && targetFeature) {
                drawArrowBetweenPolygons(sourceFeature, targetFeature, edge.id);
              }
            });
          } catch (error) {
            alert('Invalid file format. Please upload a valid JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const model = {
      places: useEnvStore.getState().places,
      edges: useEnvStore.getState().edges,
      logicalPlaces: useEnvStore.getState().logicalPlaces,
      views: useEnvStore.getState().views,
    };
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleEditable = () => {
    const newValue = !isEditable;
    setEditable(newValue);
    setActiveTool('hand');
    disableDrawing(mapInstance);
  };

  const clear = () => {
    clearModel();
    clearAllFeatures();
  };

  return (
    <nav className="navbar navbar-dark bg-dark px-3 d-flex justify-content-between align-items-center">
      <span className="navbar-brand mb-0 h1">🌎 BPEnv Modeler</span>
      <div className="btn-group">
        <button className="btn btn-outline-light btn-sm" onClick={handleImport}>
          Import
        </button>
        <button className="btn btn-outline-light btn-sm" onClick={handleExport}>
          Export
        </button>
        <button className="btn btn-outline-light btn-sm" onClick={() => {
          if (confirm('Are you sure you want to clear the model?'))
            clear();
        }}>
          Clear
        </button>
        <button className="btn btn-outline-light btn-sm" onClick={toggleEditable}>
          {isEditable ? '🔓' : '🔒'}
        </button>
      </div>
    </nav>
  );
};

export default HeaderComponent;