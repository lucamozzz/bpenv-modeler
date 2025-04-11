
import ReactDOM from 'react-dom/client';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { useGeographic } from 'ol/proj';
import { OSM } from 'ol/source.js';
import { Tile as TileLayer } from 'ol/layer.js';
import './style.css';

import { initializeManagers, polygonManager, edgeManager, selectionManager } from './components/initManagers';
import { addAttribute, removeAttribute, renameElement } from './utils/attributeManager';
import { undoLastAction } from './utils/historyManager';
import { updateUIState, updateSidebar } from './ui/uiState';

// Layer base
const raster = new TileLayer({
  source: new OSM(),
  zIndex: 0,
});

useGeographic();

// Inizializza mappa
const map = new Map({
  layers: [raster],
  target: 'map',
  view: new View({
    center: [13.068307772123394, 43.139407493133405],
    zoom: 19,
    rotation: 0.5,
    constrainOnlyCenter: true,
    smoothExtentConstraint: true,
  }),
});

// Inizializza manager e sidebar
initializeManagers(map);

// Espone funzioni globali per compatibilità
(window as any).addAttribute = addAttribute;
(window as any).removeAttribute = removeAttribute;
(window as any).renameElement = renameElement;
(window as any).undoLastAction = undoLastAction;
(window as any).updateUIState = updateUIState;

// Crea e monta la sidebar
const sidebarContainer = document.createElement('div');
sidebarContainer.id = 'sidebar-container';
document.body.appendChild(sidebarContainer);

const sidebarRoot = ReactDOM.createRoot(sidebarContainer);
(window as any).sidebarRoot = sidebarRoot;

updateSidebar();

// Debug: click sulla mappa
map.on('click', function (evt) {
  console.log('Click coordinates:', evt.coordinate);
});

// Ogni volta che la mappa cambia, aggiorna lo stato
map.on('change', function () {
  updateUIState();
});

// Aggiornamento periodico dello stato
setInterval(updateUIState, 1000);
