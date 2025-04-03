import React from 'react';
import ReactDOM from 'react-dom/client';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { useGeographic } from 'ol/proj';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { Draw, Snap, Select } from "ol/interaction";
import LineString from 'ol/geom/LineString.js';
import Polygon from 'ol/geom/Polygon.js';
import Feature from 'ol/Feature.js';
import { click } from 'ol/events/condition.js';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style.js';
import { Coordinate } from 'ol/coordinate';
import Sidebar from './Sidebar';
import './style.css';

// Definizione delle interfacce
interface PlaceAttributes {
  [key: string]: string;
}

interface EdgeAttributes {
  [key: string]: string;
}

interface Element {
  id: string;
  type: 'place' | 'edge';
  source?: string;
  target?: string;
  attributes: Record<string, string>;
}

// Definizione degli stili
const placeStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)'
  }),
  stroke: new Stroke({
    color: 'red',
    width: 2
  }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33'
    })
  })
});

// Stile per gli archi - più visibile con colore blu e spessore maggiore
const edgeStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(0, 0, 255, 0.8)', // Blu più opaco per maggiore visibilità
    width: 5, // Spessore maggiore
    lineCap: 'round', // Estremità arrotondate
    lineJoin: 'round' // Giunzioni arrotondate
  })
});

const selectedStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 0, 0.3)'
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 3
  }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33'
    })
  })
});

// Creazione delle sorgenti e dei layer
const placeSource = new VectorSource();
const edgeSource = new VectorSource();

const placeLayer = new VectorLayer({
  source: placeSource,
  style: placeStyle,
  zIndex: 1
});

const edgeLayer = new VectorLayer({
  source: edgeSource,
  style: edgeStyle,
  zIndex: 2 // Assicura che gli archi siano sopra i poligoni
});

const raster = new TileLayer({
  source: new OSM(),
  zIndex: 0
});

useGeographic();

// Creazione della mappa
const map = new Map({
  layers: [raster, placeLayer, edgeLayer], // Ordine importante: gli archi devono essere sopra i poligoni
  target: 'map',
  view: new View({
    center: [13.068307772123394, 43.139407493133405],
    zoom: 19,
    rotation: 0.5,
    constrainOnlyCenter: true,
    smoothExtentConstraint: true,
  }),
});

// Interazioni per il disegno
let drawInteraction: Draw | null = null;
let selectInteraction: Select | null = null;
let selectedPlaces: Feature[] = [];

// Interazione per lo snap
const snapInteraction = new Snap({
  source: placeSource
});

map.addInteraction(snapInteraction);

// Funzione per calcolare il centroide di un poligono
function calculateCentroid(polygon: Polygon): Coordinate {
  const coordinates = polygon.getCoordinates()[0];
  let x = 0;
  let y = 0;
  
  // Calcola la media delle coordinate
  for (let i = 0; i < coordinates.length; i++) {
    x += coordinates[i][0];
    y += coordinates[i][1];
  }
  
  return [x / coordinates.length, y / coordinates.length];
}

// Funzione per attivare la modalità di disegno dei poligoni
function activateDrawPolygon(): void {
  // Rimuovi interazioni precedenti
  if (drawInteraction) {
    map.removeInteraction(drawInteraction);
  }
  if (selectInteraction) {
    map.removeInteraction(selectInteraction);
  }
  
  // Crea nuova interazione per disegnare poligoni
  drawInteraction = new Draw({
    source: placeSource,
    type: 'Polygon'
  });
  
  // Aggiungi interazione alla mappa
  map.addInteraction(drawInteraction);
  
  // Gestisci l'evento di fine disegno
  drawInteraction.on('drawend', function (event) {
    const feature = event.feature;
    feature.set('type', 'place');
    feature.set('id', 'place_' + Date.now());
    feature.set('attributes', {});
    
    const geometry = feature.getGeometry() as Polygon;
    const coordinates = geometry.getCoordinates()[0];
    console.log('Drawn polygon coordinates:', coordinates);
    
    // Aggiorna il pannello degli attributi
    updateSidebarElements();
  });
}

// Funzione per attivare la modalità di disegno degli archi
function activateDrawEdge(): void {
  // Rimuovi interazioni precedenti
  if (drawInteraction) {
    map.removeInteraction(drawInteraction);
  }
  if (selectInteraction) {
    map.removeInteraction(selectInteraction);
  }
  
  // Crea nuova interazione per selezionare poligoni
  selectInteraction = new Select({
    condition: click,
    layers: [placeLayer],
    style: selectedStyle
  });
  
  // Aggiungi interazione alla mappa
  map.addInteraction(selectInteraction);
  
  // Resetta la selezione
  selectedPlaces = [];
  
  // Gestisci l'evento di selezione
  selectInteraction.on('select', function(e) {
    const selectedFeatures = e.selected;
    
    if (selectedFeatures.length > 0) {
      const feature = selectedFeatures[0];
      
      if (feature.get('type') === 'place') {
        if (selectedPlaces.length === 0) {
          // Primo poligono selezionato
          selectedPlaces.push(feature);
          console.log('Primo poligono selezionato:', feature.get('id'));
        } else if (selectedPlaces.length === 1 && selectedPlaces[0] !== feature) {
          // Secondo poligono selezionato, crea l'arco
          selectedPlaces.push(feature);
          console.log('Secondo poligono selezionato:', feature.get('id'));
          
          // Crea l'arco tra i due poligoni
          createEdge(selectedPlaces[0], selectedPlaces[1]);
          
          // Resetta la selezione
          selectedPlaces = [];
          selectInteraction?.getFeatures().clear();
        }
      }
    }
  });
}

// Funzione per creare un arco tra due poligoni
function createEdge(source: Feature, target: Feature): void {
  try {
    console.log('Creazione arco tra:', source.get('id'), 'e', target.get('id'));
    
    // Ottieni i centroidi dei poligoni
    const sourceGeom = source.getGeometry() as Polygon;
    const targetGeom = target.getGeometry() as Polygon;
    
    // Calcola i centroidi usando la funzione dedicata
    const sourceCoords = calculateCentroid(sourceGeom);
    const targetCoords = calculateCentroid(targetGeom);
    
    console.log('Coordinate arco - origine:', sourceCoords, 'destinazione:', targetCoords);
    
    // Crea un ID univoco basato sui poligoni di origine e destinazione
    const sourceId = source.get('id');
    const targetId = target.get('id');
    const edgeId = 'edge_' + sourceId + '_' + targetId;
    
    // Verifica se esiste già un arco con lo stesso ID
    const existingEdges = edgeSource.getFeatures();
    for (let i = 0; i < existingEdges.length; i++) {
      if (existingEdges[i].get('id') === edgeId) {
        console.log('Arco già esistente tra questi poligoni');
        return; // Esci dalla funzione se l'arco esiste già
      }
    }
    
    // Crea una feature LineString
    const lineString = new LineString([sourceCoords, targetCoords]);
    console.log('LineString creata:', lineString.getCoordinates());
    
    const edgeFeature = new Feature({
      geometry: lineString,
      type: 'edge',
      id: edgeId,
      source: sourceId,
      target: targetId,
      attributes: {}
    });
    
    // Imposta esplicitamente lo stile per questa feature
    edgeFeature.setStyle(new Style({
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)', // Blu più opaco per maggiore visibilità
        width: 5, // Spessore maggiore
        lineCap: 'round',
        lineJoin: 'round'
      })
    }));
    
    // Aggiungi la feature al layer degli archi
    edgeSource.addFeature(edgeFeature);
    console.log('Arco creato tra:', sourceId, 'e', targetId);
    console.log('Numero di archi nel layer:', edgeSource.getFeatures().length);
    
    // Forza il refresh del layer
    edgeLayer.changed();
    
    // Verifica che l'arco sia stato aggiunto
    console.log('Archi nel layer dopo aggiunta:', edgeSource.getFeatures().length);
    console.log('Arco aggiunto:', edgeFeature.getGeometry()?.getCoordinates() || 'Geometria non disponibile');

    // Aggiorna il pannello degli attributi
    updateSidebarElements();
  } catch (error) {
    console.error('Errore nella creazione dell\'arco:', error);
  }
}

// Funzione per aggiungere un attributo a un elemento
function addAttribute(elementId: string, name: string, value: string): void {
  // Cerca l'elemento tra i poligoni e gli archi
  let feature: Feature | null = null;
  
  // Cerca tra i poligoni
  const placeFeatures = placeSource.getFeatures();
  for (let i = 0; i < placeFeatures.length; i++) {
    if (placeFeatures[i].get('id') === elementId) {
      feature = placeFeatures[i];
      break;
    }
  }
  
  // Se non trovato, cerca tra gli archi
  if (!feature) {
    const edgeFeatures = edgeSource.getFeatures();
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
  // Cerca l'elemento tra i poligoni e gli archi
  let feature: Feature | null = null;
  
  // Cerca tra i poligoni
  const placeFeatures = placeSource.getFeatures();
  for (let i = 0; i < placeFeatures.length; i++) {
    if (placeFeatures[i].get('id') === elementId) {
      feature = placeFeatures[i];
      break;
    }
  }
  
  // Se non trovato, cerca tra gli archi
  if (!feature) {
    const edgeFeatures = edgeSource.getFeatures();
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

// Funzione per esportare il modello in JSON
function exportModel(): void {
  // Ottieni tutte le feature
  const placeFeatures = placeSource.getFeatures();
  const edgeFeatures = edgeSource.getFeatures();
  
  // Crea l'oggetto modello
  const model = {
    places: [] as any[],
    edges: [] as any[]
  };
  
  // Aggiungi i poligoni
  placeFeatures.forEach(feature => {
    const geometry = feature.getGeometry() as Polygon;
    const coordinates = geometry.getCoordinates()[0];
    
    model.places.push({
      id: feature.get('id'),
      coordinates: coordinates,
      attributes: feature.get('attributes') || {}
    });
  });
  
  // Aggiungi gli archi
  edgeFeatures.forEach(feature => {
    const geometry = feature.getGeometry() as LineString;
    const coordinates = geometry.getCoordinates();
    
    model.edges.push({
      id: feature.get('id'),
      source: feature.get('source'),
      target: feature.get('target'),
      coordinates: coordinates,
      attributes: feature.get('attributes') || {}
    });
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

// Funzione per aggiornare gli elementi nella sidebar
function updateSidebarElements(): void {
  const placeFeatures = placeSource.getFeatures();
  const edgeFeatures = edgeSource.getFeatures();
  
  const elements: Element[] = [
    ...placeFeatures.map(feature => ({
      id: feature.get('id'),
      type: 'place' as const,
      attributes: feature.get('attributes') || {}
    })),
    ...edgeFeatures.map(feature => ({
      id: feature.get('id'),
      type: 'edge' as const,
      source: feature.get('source'),
      target: feature.get('target'),
      attributes: feature.get('attributes') || {}
    }))
  ];
  
  // Aggiorna gli elementi nella sidebar
  if (typeof (window as any).updateSidebarElements === 'function') {
    (window as any).updateSidebarElements(elements);
  }
}

// Esponi le funzioni globalmente
(window as any).addAttribute = addAttribute;
(window as any).removeAttribute = removeAttribute;

// Crea un div per la sidebar
const sidebarContainer = document.createElement('div');
sidebarContainer.id = 'sidebar-container';
document.body.appendChild(sidebarContainer);

// Renderizza la sidebar
const sidebarRoot = ReactDOM.createRoot(sidebarContainer);
sidebarRoot.render(
  <React.StrictMode>
    <Sidebar 
      onDrawPolygon={activateDrawPolygon} 
      onDrawEdge={activateDrawEdge} 
      onExportModel={exportModel}
    />
  </React.StrictMode>
);

// Inizializza con la modalità di disegno dei poligoni
activateDrawPolygon();

// Evento click sulla mappa per debug
map.on('click', function (evt) {
  const coordinates = evt.coordinate;
  console.log('Click coordinates:', coordinates);
});
