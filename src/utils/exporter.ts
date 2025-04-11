// utils/exporter.ts
import Feature from 'ol/Feature.js';
import Geometry from 'ol/geom/Geometry.js';
import Polygon from 'ol/geom/Polygon.js';
import LineString from 'ol/geom/LineString.js';

export function exportModel(): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;

  if (!polygonManager || !edgeManager) return;

  const placeFeatures = polygonManager.getPlaceSource().getFeatures();
  const edgeFeatures = edgeManager.getEdgeSource().getFeatures();

  const model = {
    places: [] as any[],
    edges: [] as any[]
  };

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
