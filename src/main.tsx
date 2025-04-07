import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { useGeographic } from 'ol/proj';
import { OSM } from 'ol/source.js';
import { Tile as TileLayer } from 'ol/layer.js';
import Feature from 'ol/Feature.js';
import Geometry from 'ol/geom/Geometry.js';
import Polygon from 'ol/geom/Polygon.js';
import LineString from 'ol/geom/LineString.js';
import Sidebar from './components/Sidebar';
import PolygonManager from './components/PolygonManager';
import EdgeManager from './components/EdgeManager';
import SelectionManager from './components/SelectionManager';
import './style.css';

// Definizione delle interfacce
interface Element {
  id: string;
  type: 'place' | 'edge';
  source?: string;
  target?: string;
  attributes: Record<string, string>;
}

// Storico delle azioni per la funzionalità di undo
interface Action {
  type: 'add_place' | 'add_edge' | 'delete_place' | 'delete_edge';
  feature: Feature<Geometry>;
}

const actionHistory: Action[] = [];

// Funzione per aggiungere un'azione alla cronologia
function addToHistory(type: string, feature: Feature<Geometry>): void {
  actionHistory.push({
    type: type as 'add_place' | 'add_edge' | 'delete_place' | 'delete_edge',
    feature: feature
  });
  console.log('Azione aggiunta alla cronologia:', type, feature.get('id'));
  console.log('Dimensione cronologia:', actionHistory.length);
  
  // Aggiorna lo stato dell'interfaccia dopo ogni azione
  updateUIState();
}

// Creazione del layer di base (mappa OSM)
const raster = new TileLayer({
  source: new OSM(),
  zIndex: 0
});

useGeographic();

// Creazione della mappa
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

// Stato dell'interfaccia utente
let uiState = {
  canDrawEdge: false,
  hasSelectedElement: false
};

// Funzione per aggiornare lo stato dell'interfaccia
function updateUIState(): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  const selectionManager = (window as any).selectionManager;
  
  if (!polygonManager || !edgeManager || !selectionManager) return;
  
  // Aggiorna lo stato
  uiState = {
    canDrawEdge: polygonManager.getPolygonCount() >= 2,
    hasSelectedElement: selectionManager.hasSelectedElement()
  };
  
  // Aggiorna la sidebar
  updateSidebar();
}

// Funzione per aggiornare la sidebar
function updateSidebar(): void {
  const sidebarRoot = (window as any).sidebarRoot;
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  const selectionManager = (window as any).selectionManager;
  
  if (!sidebarRoot || !polygonManager || !edgeManager || !selectionManager) return;
  
  // Renderizza nuovamente la sidebar con lo stato aggiornato
  sidebarRoot.render(
    <React.StrictMode>
      <Sidebar 
        onDrawPolygon={() => polygonManager.activateDrawPolygon()}
        onDrawEdge={() => edgeManager.activateDrawEdge()}
        onSelect={() => selectionManager.activateSelection()}
        onDelete={() => selectionManager.deleteSelectedElement()}
        onUndo={undoLastAction}
        onExportModel={exportModel}
        canDrawEdge={uiState.canDrawEdge}
        hasSelectedElement={uiState.hasSelectedElement}
        onRenameElement={renameElement}
      />
    </React.StrictMode>
  );
}

// Funzione per aggiornare gli elementi nella sidebar
function updateSidebarElements(): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  
  if (!polygonManager || !edgeManager) return;
  
  const placeFeatures = polygonManager.getPlaceSource().getFeatures();
  const edgeFeatures = edgeManager.getEdgeSource().getFeatures();
  
  interface PlaceElement extends Element {
    type: 'place';
  }

  interface EdgeElement extends Element {
    type: 'edge';
    source: string;
    target: string;
  }

  interface SidebarElement {
    id: string;
    attributes: Record<string, string>;
  }

  interface PlaceElement extends SidebarElement {
    type: 'place';
  }

  interface EdgeElement extends SidebarElement {
    type: 'edge';
    source: string;
    target: string;
  }

  const elements: (PlaceElement | EdgeElement)[] = [
    ...placeFeatures.map((feature: { get: (arg0: string) => string | Record<string, string>; }): PlaceElement => ({
      id: feature.get('id') as string,
      type: 'place',
      attributes: feature.get('attributes') as Record<string, string> || {}
    })),
    ...edgeFeatures.map((feature: { get: (arg0: string) => string | Record<string, string>; }): EdgeElement => ({
      id: feature.get('id') as string,
      type: 'edge',
      source: feature.get('source') as string,
      target: feature.get('target') as string,
      attributes: feature.get('attributes') as Record<string, string> || {}
    }))
  ];
  
  // Aggiorna gli elementi nella sidebar
  if (typeof (window as any).updateSidebarElements === 'function') {
    (window as any).updateSidebarElements(elements);
  }
  
  // Aggiorna lo stato dell'interfaccia dopo ogni aggiornamento degli elementi
  updateUIState();
}

// Funzione per aggiungere un attributo a un elemento
function addAttribute(elementId: string, name: string, value: string): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  
  if (!polygonManager || !edgeManager) return;
  
  // Cerca l'elemento tra i poligoni e gli archi
  let feature: Feature<Geometry> | null = null;
  
  // Cerca tra i poligoni
  const placeFeatures = polygonManager.getPlaceSource().getFeatures();
  for (let i = 0; i < placeFeatures.length; i++) {
    if (placeFeatures[i].get('id') === elementId) {
      feature = placeFeatures[i];
      break;
    }
  }
  
  // Se non trovato, cerca tra gli archi
  if (!feature) {
    const edgeFeatures = edgeManager.getEdgeSource().getFeatures();
    for (let i = 0; i < edgeFeatures.length; i++) {
      if (edgeFeatures[i].get('id') === elementId) {
        feature = edgeFeatures[i];
        break;
      }
    }
  }
  
  // Se l'elemento è stato trovato, aggiungi l'attributo
  if (feature) {
    const attributes = feature.get('attributes') || {};
    attributes[name] = value;
    feature.set('attributes', attributes);
    
    // Aggiorna la sidebar
    updateSidebarElements();
  }
}

// Funzione per rimuovere un attributo da un elemento
function removeAttribute(elementId: string, name: string): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  
  if (!polygonManager || !edgeManager) return;
  
  // Cerca l'elemento tra i poligoni e gli archi
  let feature: Feature<Geometry> | null = null;
  
  // Cerca tra i poligoni
  const placeFeatures = polygonManager.getPlaceSource().getFeatures();
  for (let i = 0; i < placeFeatures.length; i++) {
    if (placeFeatures[i].get('id') === elementId) {
      feature = placeFeatures[i];
      break;
    }
  }
  
  // Se non trovato, cerca tra gli archi
  if (!feature) {
    const edgeFeatures = edgeManager.getEdgeSource().getFeatures();
    for (let i = 0; i < edgeFeatures.length; i++) {
      if (edgeFeatures[i].get('id') === elementId) {
        feature = edgeFeatures[i];
        break;
      }
    }
  }
  
  // Se l'elemento è stato trovato, rimuovi l'attributo
  if (feature) {
    const attributes = feature.get('attributes') || {};
    delete attributes[name];
    feature.set('attributes', attributes);
    
    // Aggiorna la sidebar
    updateSidebarElements();
  }
}

// Funzione per rinominare un elemento
function renameElement(newId: string): void {
  const selectionManager = (window as any).selectionManager;
  
  if (!selectionManager) return;
  
  const success = selectionManager.renameSelectedElement(newId);
  
  if (success) {
    // Aggiorna la sidebar
    updateSidebarElements();
  }
}

// Funzione per esportare il modello in JSON
function exportModel(): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  
  if (!polygonManager || !edgeManager) return;
  
  // Ottieni tutte le feature
  const placeFeatures = polygonManager.getPlaceSource().getFeatures();
  const edgeFeatures = edgeManager.getEdgeSource().getFeatures();
  
  // Crea l'oggetto modello
  const model = {
    places: [] as any[],
    edges: [] as any[]
  };
  
  // Aggiungi i poligoni
  placeFeatures.forEach((feature: Feature<Geometry>) => {
    const geometry = feature.getGeometry();
    if (geometry && geometry instanceof Polygon) {
      const polygonGeometry = geometry as Polygon;
      const coordinates = polygonGeometry.getCoordinates()[0];
      
      model.places.push({
        id: feature.get('id') as string,
        coordinates: coordinates,
        attributes: feature.get('attributes') as Record<string, string> || {}
      });
    }
  });
  
  // Aggiungi gli archi
  edgeFeatures.forEach((feature: Feature<Geometry>) => {
    const geometry = feature.getGeometry();
    if (geometry && geometry instanceof LineString) {
      const lineStringGeometry = geometry as LineString;
      const coordinates = lineStringGeometry.getCoordinates();
      
      model.edges.push({
        id: feature.get('id') as string,
        source: feature.get('source') as string,
        target: feature.get('target') as string,
        coordinates: coordinates,
        attributes: feature.get('attributes') as Record<string, string> || {}
      });
    }
  });
  
  // Converti in JSON
  const jsonString = JSON.stringify(model, null, 2);
  
  // Crea un blob e un link per il download
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

// Funzione per annullare l'ultima azione
function undoLastAction(): void {
  if (actionHistory.length === 0) {
    console.log('Nessuna azione da annullare');
    return;
  }
  
  const lastAction = actionHistory.pop();
  if (!lastAction) return;
  
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  
  if (!polygonManager || !edgeManager) return;
  
  console.log('Annullamento azione:', lastAction.type);
  
  switch (lastAction.type) {
    case 'add_place':
      polygonManager.getPlaceSource().removeFeature(lastAction.feature);
      break;
    case 'add_edge':
      edgeManager.getEdgeSource().removeFeature(lastAction.feature);
      break;
    case 'delete_place':
      polygonManager.getPlaceSource().addFeature(lastAction.feature);
      break;
    case 'delete_edge':
      edgeManager.getEdgeSource().addFeature(lastAction.feature);
      break;
  }
  
  // Aggiorna la sidebar
  updateSidebarElements();
}

// Inizializza i manager
const polygonManager = new PolygonManager(map, updateSidebarElements, addToHistory);
const edgeManager = new EdgeManager(map, polygonManager.getPlaceSource(), updateSidebarElements, addToHistory);
const selectionManager = new SelectionManager(map, polygonManager, edgeManager, updateSidebarElements);

// Esponi i manager e le funzioni globalmente
(window as any).polygonManager = polygonManager;
(window as any).edgeManager = edgeManager;
(window as any).selectionManager = selectionManager;
(window as any).addAttribute = addAttribute;
(window as any).removeAttribute = removeAttribute;
(window as any).renameElement = renameElement;
(window as any).undoLastAction = undoLastAction;
(window as any).updateUIState = updateUIState;

// Crea un div per la sidebar
const sidebarContainer = document.createElement('div');
sidebarContainer.id = 'sidebar-container';
document.body.appendChild(sidebarContainer);

// Renderizza la sidebar
const sidebarRoot = ReactDOM.createRoot(sidebarContainer);
(window as any).sidebarRoot = sidebarRoot;

// Inizializza la sidebar
updateSidebar();

// Inizializza con la modalità di disegno dei poligoni
polygonManager.activateDrawPolygon();

// Evento click sulla mappa per debug
map.on('click', function (evt) {
  const coordinates = evt.coordinate;
  console.log('Click coordinates:', coordinates);
});

// Aggiungi listener per aggiornare lo stato dell'interfaccia quando la mappa cambia
map.on('change', function() {
  updateUIState();
});

// Aggiorna lo stato dell'interfaccia ogni secondo per assicurarsi che i bottoni siano sempre aggiornati
setInterval(updateUIState, 1000);
