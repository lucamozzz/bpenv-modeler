import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { useGeographic } from 'ol/proj';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { Draw, Snap } from "ol/interaction";
import LineString from 'ol/geom/LineString.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource();
const vector = new VectorLayer({
  source: source,
  style: {
    'fill-color': 'rgba(255, 255, 255, 0.2)',
    'stroke-color': 'red',
    'stroke-width': 2,
    'circle-radius': 7,
    'circle-fill-color': '#ffcc33',
  },
});

useGeographic();

// let extent = [13.067553, 43.138806, 13.068553, 43.139806]
const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [13.068307772123394, 43.139407493133405],
    zoom: 19,
    rotation: 0.5,
    // maxZoom: 19,
    // minZoom: 19,
    // extent: extent,
    constrainOnlyCenter: true,
    smoothExtentConstraint: true,
  }),
});

const drawInteraction = new Draw({
  source: source,
  type: 'Polygon'
});

const snapInteraction = new Snap({
  source: source
});

map.addInteraction(drawInteraction);
map.addInteraction(snapInteraction);

drawInteraction.on('drawend', function (event) {
  const feature = event.feature;
  const geometry = feature.getGeometry() as LineString | Point | Polygon;
  const coordinates = geometry.getType() === 'Polygon' ? (geometry as Polygon).getCoordinates()[0] : [];
  console.log('Drawn polygon coordinates:', coordinates);
});

map.on('click', function (evt) {
  const coordinates = evt.coordinate;
  console.log(coordinates);
});
