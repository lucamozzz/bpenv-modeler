import { Draw, Select } from "ol/interaction";
import Polygon from 'ol/geom/Polygon.js';
import Feature from 'ol/Feature.js';
import Geometry from 'ol/geom/Geometry.js';
import { VectorSourceEvent } from 'ol/source/Vector';
import { click } from 'ol/events/condition.js';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import Map from 'ol/Map.js';

// Definizione delle interfacce
interface PlaceAttributes {
  [key: string]: string;
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

class PolygonManager {
  private map: Map;
  private placeSource: VectorSource;
  private placeLayer: VectorLayer<VectorSource>;
  private drawInteraction: Draw | null = null;
  private selectInteraction: Select | null = null;
  private selectedPolygon: Feature<Geometry> | null = null;
  private updateSidebarElements: () => void;
  private addToHistory: (type: string, feature: Feature<Geometry>) => void;

  constructor(map: Map, updateSidebarElements: () => void, addToHistory: (type: string, feature: Feature<Geometry>) => void) {
    this.map = map;
    this.updateSidebarElements = updateSidebarElements;
    this.addToHistory = addToHistory;

    // Creazione delle sorgenti e dei layer
    this.placeSource = new VectorSource();
    this.placeLayer = new VectorLayer({
      source: this.placeSource,
      style: placeStyle,
      zIndex: 1
    });

    // Aggiungi il layer alla mappa
    this.map.addLayer(this.placeLayer);

    // Aggiungi listener per registrare le azioni
    this.placeSource.on('addfeature', (event: VectorSourceEvent<Feature<Geometry>>) => {
      if (event.feature) {
        this.addToHistory('add_place', event.feature);
      }
    });
  }

  // Metodo per ottenere il layer dei poligoni
  getPlaceLayer(): VectorLayer<VectorSource> {
    return this.placeLayer;
  }

  // Metodo per ottenere la sorgente dei poligoni
  getPlaceSource(): VectorSource {
    return this.placeSource;
  }

  // Funzione per calcolare il centroide di un poligono
  calculateCentroid(polygon: Polygon): [number, number] {
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
  activateDrawPolygon(): void {
    // Rimuovi interazioni precedenti
    this.removeInteractions();
    
    // Crea nuova interazione per disegnare poligoni
    this.drawInteraction = new Draw({
      source: this.placeSource,
      type: 'Polygon'
    });
    
    // Aggiungi interazione alla mappa
    this.map.addInteraction(this.drawInteraction);
    
    // Gestisci l'evento di fine disegno
    this.drawInteraction.on('drawend', (event) => {
      const feature = event.feature;
      feature.set('type', 'place');
      feature.set('id', 'place_' + Date.now());
      feature.set('attributes', {});
      
      const geometry = feature.getGeometry() as Polygon;
      const coordinates = geometry.getCoordinates()[0];
      console.log('Drawn polygon coordinates:', coordinates);
      
      // Aggiorna il pannello degli attributi
      this.updateSidebarElements();
    });
  }

  // Funzione per attivare la modalità di selezione dei poligoni
  activateSelectPolygon(): void {
    // Rimuovi interazioni precedenti
    this.removeInteractions();
    
    // Crea nuova interazione per selezionare poligoni
    this.selectInteraction = new Select({
      condition: click,
      layers: [this.placeLayer],
      style: selectedStyle
    });
    
    // Aggiungi interazione alla mappa
    this.map.addInteraction(this.selectInteraction);
    
    // Gestisci l'evento di selezione
    this.selectInteraction.on('select', (e) => {
      const selectedFeatures = e.selected;
      
      if (selectedFeatures.length > 0) {
        this.selectedPolygon = selectedFeatures[0];
        console.log('Poligono selezionato:', this.selectedPolygon.get('id'));
      } else {
        this.selectedPolygon = null;
      }
    });
  }

  // Funzione per eliminare il poligono selezionato
  deleteSelectedPolygon(): boolean {
    if (this.selectedPolygon && this.selectedPolygon.get('type') === 'place') {
      const polygonId = this.selectedPolygon.get('id');
      console.log('Eliminazione poligono:', polygonId);
      
      // Salva una copia del poligono per l'undo
      const featureCopy = this.selectedPolygon.clone();
      
      // Rimuovi il poligono dalla sorgente
      this.placeSource.removeFeature(this.selectedPolygon);
      
      // Aggiungi alla cronologia delle azioni
      this.addToHistory('delete_place', featureCopy);
      
      // Resetta la selezione
      if (this.selectInteraction) {
        this.selectInteraction.getFeatures().clear();
      }
      this.selectedPolygon = null;
      
      // Aggiorna il pannello degli attributi
      this.updateSidebarElements();
      
      return true;
    } else {
      console.log('Nessun poligono selezionato da eliminare');
      return false;
    }
  }

  // Funzione per rimuovere le interazioni correnti
  removeInteractions(): void {
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
    }
    if (this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
      this.selectInteraction = null;
    }
  }

  // Funzione per annullare l'ultimo punto disegnato
  undoLastPoint(): void {
    if (this.drawInteraction) {
      this.drawInteraction.removeLastPoint();
    }
  }

  // Funzione per impostare il poligono selezionato (usata dal SelectionManager)
  setSelectedPolygon(polygon: Feature<Geometry> | null): void {
    this.selectedPolygon = polygon;
  }

  // Funzione per ottenere il poligono selezionato
  getSelectedPolygon(): Feature<Geometry> | null {
    return this.selectedPolygon;
  }

  // Funzione per verificare se ci sono poligoni disegnati
  hasPolygons(): boolean {
    return this.placeSource.getFeatures().length > 0;
  }

  // Funzione per contare il numero di poligoni
  getPolygonCount(): number {
    return this.placeSource.getFeatures().length;
  }

 


}


export default PolygonManager;
