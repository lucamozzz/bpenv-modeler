import ReactDOM from 'react-dom/client';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { useGeographic } from 'ol/proj';
import { OSM } from 'ol/source.js';
import { Tile as TileLayer } from 'ol/layer.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'ol/ol.css';
import './style.css';

import { initializeManagers } from './components/initManagers';
import { addAttribute, removeAttribute, renameElement } from './utils/attributeManager';
import { undoLastAction } from './utils/historyManager';
import { updateUIState, updateSidebar, updateSidebar2 } from './ui/uiState';
import { exportModel } from './utils/exporter';
import { handleFileUpload, importModel } from './utils/importer';

let apis: any = null;

function render(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container)
    throw new Error(`Container element with id "${containerId}" not found.`);
  container.innerHTML = `
    <div id="map""></div>
    <div id="sidebar-container"></div>
    <div id="sidebar2-container"></div>
  `;

  const raster = new TileLayer({
    source: new OSM(),
    zIndex: 0,
  });

  useGeographic();

  const map = new Map({
    layers: [raster],
    target: container.querySelector('#map') as HTMLElement,
    view: new View({
      center: [13.068307772123394, 43.139407493133405],
      zoom: 19,
      rotation: 0.5,
      constrainOnlyCenter: true,
      smoothExtentConstraint: true,
    }),
  });

  initializeManagers(map);


  (window as any).addAttribute = addAttribute;
  (window as any).removeAttribute = removeAttribute;
  (window as any).renameElement = renameElement;
  (window as any).undoLastAction = undoLastAction;
  (window as any).updateUIState = updateUIState;
  (window as any).exportModel = exportModel;
  (window as any).importModel = importModel;
  (window as any).handleFileUpload = handleFileUpload;

  (window as any).highlightElement = (id: string) => {
    (window as any).selectionManager?.highlightElement(id);
  };

  (window as any).unhighlightElement = () => {
    (window as any).selectionManager?.unhighlightElement();
  };


// Espone una funzione globale per ottenere le "places"
(window as any).getPlaces = () => {
  const pm = (window as any).polygonManager;
  return pm ? pm.getPlaceSource().getFeatures() : [];
};

// Espone una funzione globale per ottenere gli "edges" 
(window as any).getEdges = () => {
  const em = (window as any).edgeManager;
  return em ? em.getEdgeSource().getFeatures() : [];
};

  const sidebarRoot = ReactDOM.createRoot(container.querySelector('#sidebar-container')!);
  (window as any).sidebarRoot = sidebarRoot;

  const sidebar2Root = ReactDOM.createRoot(container.querySelector('#sidebar2-container')!);
  (window as any).sidebar2Root = sidebar2Root;

  updateSidebar();
  updateSidebar2();

  map.on('click', (evt) => console.log('Click coordinates:', evt.coordinate));
  map.on('change', updateUIState);
  setInterval(updateUIState, 1000);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'model-upload';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => handleFileUpload(e));
  container.appendChild(fileInput);

  (window as any).triggerFileInput = () => fileInput.click();

  function getPlaces(): any[] {
  return (window as any).getPlaces?.() || [];
}

function getEdges(): any[] {
  return (window as any).getEdges?.() || [];
}

function getLogicalPlaces(): any[] {
  return (window as any).getLogicalPlaces?.() || [];
}

function getViews(): any[] {
  return (window as any).getViews?.() || [];
}


  apis = {
    getPlaces,
    getEdges,
    getLogicalPlaces,
    getViews,
  };

  return apis;
}

function ensureInitialized() {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  return apis;
}

function getPlaces() {
  return ensureInitialized().getPlaces();
}

function getEdges() {
  return ensureInitialized().getEdges();
}

function getLogicalPlaces() {
  return ensureInitialized().getLogicalPlaces();
}

function getViews() {
  return ensureInitialized().getViews();
}


const bpenvModeler = {
  render,
  getPlaces,
  getEdges,
  getLogicalPlaces,
  getViews
};

export default bpenvModeler;