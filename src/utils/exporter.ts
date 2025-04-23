// utils/exporter.ts
import Feature from 'ol/Feature.js';
import Geometry from 'ol/geom/Geometry.js';
import Polygon from 'ol/geom/Polygon.js';
import LineString from 'ol/geom/LineString.js';

interface LogicalPlace {
  id: string;
  name: string;
  description?: string;
  conditions: any[];
  operator: 'AND' | 'OR';
  physicalPlaces: any[]; // Place fisiche che soddisfano le condizioni
}

interface View {
  id: string;
  name: string;
  description?: string;
  logicalPlaces: string[]; // ID delle place logiche contenute nella view
}

export function exportModel(): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;

  if (!polygonManager || !edgeManager) return;

  const placeFeatures = polygonManager.getPlaceSource().getFeatures();
  const edgeFeatures = edgeManager.getEdgeSource().getFeatures();

  // Recupera le place logiche dal localStorage
  let logicalPlaces: LogicalPlace[] = [];
  try {
    const savedLogicalPlaces = localStorage.getItem('logicalPlaces');
    if (savedLogicalPlaces) {
      logicalPlaces = JSON.parse(savedLogicalPlaces);
    }
  } catch (error) {
    console.error('Error loading logical places from localStorage:', error);
  }

  // Recupera le views dal localStorage (se esistono)
  let views: View[] = [];
  try {
    const savedViews = localStorage.getItem('views');
    if (savedViews) {
      views = JSON.parse(savedViews);
    }
  } catch (error) {
    console.error('Error loading views from localStorage:', error);
  }

  const model = {
    places: [] as any[],
    edges: [] as any[],
    logicalPlaces: [] as any[],
    views: [] as any[]
  };

  // Aggiungi le place fisiche al modello
  placeFeatures.forEach((feature: Feature<Geometry>) => {
    const geometry = feature.getGeometry();
    if (geometry instanceof Polygon) {
      const coordinates = geometry.getCoordinates()[0];
      model.places.push({
        id: feature.get('id'),
        coordinates,
        attributes: feature.get('attributes') || {}
      });
    }
  });

  // Aggiungi gli edge al modello
  edgeFeatures.forEach((feature: Feature<Geometry>) => {
    const geometry = feature.getGeometry();
    if (geometry instanceof LineString) {
      const coordinates = geometry.getCoordinates();
      model.edges.push({
        id: feature.get('id'),
        source: feature.get('source'),
        target: feature.get('target'),
        coordinates,
        attributes: feature.get('attributes') || {}
      });
    }
  });

  // Aggiungi le place logiche al modello
  logicalPlaces.forEach((logicalPlace: LogicalPlace) => {
    model.logicalPlaces.push({
      id: logicalPlace.id,
      name: logicalPlace.name,
      description: logicalPlace.description || '',
      conditions: logicalPlace.conditions,
      operator: logicalPlace.operator,
      physicalPlaces: logicalPlace.physicalPlaces.map(place => ({
        id: place.id,
        attributes: place.attributes || {}
      }))
    });
  });

  // Aggiungi le views al modello
  views.forEach((view: View) => {
    model.views.push({
      id: view.id,
      name: view.name,
      description: view.description || '',
      logicalPlaces: view.logicalPlaces
    });
  });

  const jsonString = JSON.stringify(model, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'spacemodel.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
