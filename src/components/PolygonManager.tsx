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
import { intersects } from 'ol/extent.js';

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

// Stile per l'evidenziazione
const highlightStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 0, 0.3)'
  }),
  stroke: new Stroke({
    color: '#ff9900',
    width: 2
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

  // Funzione per verificare se due poligoni hanno un'area di intersezione reale
  hasIntersectionArea(polygon1: Polygon, polygon2: Polygon): boolean {
    try {
      // Ottieni le coordinate dei poligoni
      const coords1 = polygon1.getCoordinates()[0];
      const coords2 = polygon2.getCoordinates()[0];
      
      // Verifica se ci sono punti di un poligono all'interno dell'altro
      // Questo è un controllo più preciso rispetto alla semplice intersezione delle extent
      
      // Verifica se almeno un punto del poligono 1 è all'interno del poligono 2
      for (let i = 0; i < coords1.length; i++) {
        if (polygon2.containsXY(coords1[i][0], coords1[i][1])) {
          return true;
        }
      }
      
      // Verifica se almeno un punto del poligono 2 è all'interno del poligono 1
      for (let i = 0; i < coords2.length; i++) {
        if (polygon1.containsXY(coords2[i][0], coords2[i][1])) {
          return true;
        }
      }
      
      // Ottieni le extent dei due poligoni
      const extent1 = polygon1.getExtent();
      const extent2 = polygon2.getExtent();
      
      // Se le extent non si intersecano, i poligoni non si intersecano
      if (!intersects(extent1, extent2)) {
        return false;
      }
      
      // Se le extent si intersecano, ma nessun punto è contenuto nell'altro poligono,
      // allora i poligoni sono adiacenti ma non sovrapposti
      return false;
      
    } catch (error) {
      console.error("Errore nel controllo di sovrapposizione:", error);
      // In caso di errore, per sicurezza consideriamo i poligoni come non sovrapposti
      return false;
    }
  }

  // Funzione per verificare se un poligono si sovrappone ad altri
  checkPolygonOverlap(polygon: Polygon, currentFeature: Feature<Geometry>): boolean {
    const features = this.placeSource.getFeatures();
    
    // Controlla la sovrapposizione con ogni poligono esistente
    for (let i = 0; i < features.length; i++) {
      const existingFeature = features[i];
      
      // Salta il controllo se stiamo confrontando con la feature corrente
      if (existingFeature === currentFeature) {
        continue;
      }
      
      const existingGeometry = existingFeature.getGeometry() as Polygon;
      
      // Verifica se i poligoni hanno un'area di intersezione reale
      if (this.hasIntersectionArea(polygon, existingGeometry)) {
        return true;
      }
    }
    
    return false;
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
      const geometry = feature.getGeometry() as Polygon;
      
      // Imposta gli attributi di base prima del controllo di sovrapposizione
      feature.set('type', 'place');
      feature.set('id', 'place_' + Date.now());
      feature.set('attributes', {});
      
      // Verifica se il poligono si sovrappone ad altri
      if (this.checkPolygonOverlap(geometry, feature)) {
        // Se c'è sovrapposizione, avvisa l'utente e rimuovi il poligono
        alert('You cannot create a place that overlaps with other existing places.');
        
        // Rimuovi il poligono appena disegnato in modo sicuro
        setTimeout(() => {
          this.placeSource.removeFeature(feature);
        }, 10);
        
        return;
      }
      
      // Se non ci sono sovrapposizioni, procedi con l'aggiunta del poligono
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

  // Funzione per evidenziare un singolo elemento
  highlightFeature(featureId: string): void {
    // Prima rimuovi tutte le evidenziazioni
    this.unhighlightFeatures();
    
    // Trova la feature da evidenziare
    const feature = this.placeSource.getFeatures().find(f => f.get('id') === featureId);
    
    if (feature) {
      // Salva lo stile originale se non è già stato salvato
      if (!feature.get('originalStyle')) {
        feature.set('originalStyle', feature.getStyle() || placeStyle);
      }
      
      // Applica lo stile di evidenziazione
      feature.setStyle(highlightStyle);
    }
  }

  // Funzione per evidenziare più elementi contemporaneamente
  highlightMultipleFeatures(featureIds: string[]): void {
    // Prima rimuovi tutte le evidenziazioni
    this.unhighlightFeatures();
    
    // Evidenzia ogni feature nell'array
    featureIds.forEach(id => {
      const feature = this.placeSource.getFeatures().find(f => f.get('id') === id);
      
      if (feature) {
        // Salva lo stile originale se non è già stato salvato
        if (!feature.get('originalStyle')) {
          feature.set('originalStyle', feature.getStyle() || placeStyle);
        }
        
        // Applica lo stile di evidenziazione
        feature.setStyle(highlightStyle);
      }
    });
  }

  // Funzione per rimuovere tutte le evidenziazioni
  unhighlightFeatures(): void {
    this.placeSource.getFeatures().forEach(feature => {
      // Ripristina lo stile originale se esiste
      const originalStyle = feature.get('originalStyle');
      if (originalStyle) {
        feature.setStyle(originalStyle);
        feature.unset('originalStyle');
      } else {
        feature.setStyle(placeStyle);
      }
    });
  }
}

export default PolygonManager;
