import { Select } from "ol/interaction";
import Feature from 'ol/Feature.js';
import Geometry from 'ol/geom/Geometry.js';
import { click } from 'ol/events/condition.js';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style.js';
import Map from 'ol/Map.js';
import PolygonManager from './PolygonManager';
import EdgeManager from './EdgeManager';

// Stile per i poligoni selezionati
const selectedPolygonStyle = new Style({
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

// Stile per gli archi selezionati
const selectedEdgeStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(255, 165, 0, 0.8)', // Arancione per gli archi selezionati
    width: 6,
    lineCap: 'round',
    lineJoin: 'round'
  })
});

// Stile per gli elementi evidenziati (hover)
const highlightStyle = new Style({
  fill: new Fill({
    color: 'rgba(100, 200, 255, 0.3)'
  }),
  stroke: new Stroke({
    color: '#66aaff',
    width: 3
  }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({
      color: '#66aaff'
    })
  })
});

class SelectionManager {
  private map: Map;
  private polygonManager: PolygonManager;
  private edgeManager: EdgeManager;
  private selectInteraction: Select | null = null;
  private selectedElement: Feature<Geometry> | null = null;
  private highlightedElement: Feature<Geometry> | null = null;
  private updateSidebarElements: () => void;

  constructor(map: Map, polygonManager: PolygonManager, edgeManager: EdgeManager, updateSidebarElements: () => void) {
    this.map = map;
    this.polygonManager = polygonManager;
    this.edgeManager = edgeManager;
    this.updateSidebarElements = updateSidebarElements;
  }

  // Funzione per attivare la modalità di selezione unificata (poligoni e archi)
  activateSelection(): void {
    // Rimuovi interazioni precedenti dai manager
    this.polygonManager.removeInteractions();
    this.edgeManager.removeInteractions();
    
    // Rimuovi l'interazione di selezione corrente se esiste
    if (this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
      this.selectInteraction = null;
    }
    
    // Crea nuova interazione per selezionare sia poligoni che archi
    this.selectInteraction = new Select({
      condition: click,
      layers: [
        this.polygonManager.getPlaceLayer(),
        this.edgeManager.getEdgeLayer()
      ],
      style: (feature) => {
        // Applica stile diverso in base al tipo di elemento
        const type = feature.get('type');
        if (type === 'place') {
          return selectedPolygonStyle;
        } else if (type === 'edge') {
          return selectedEdgeStyle;
        }
        return undefined;
      }
    });
    
    // Aggiungi interazione alla mappa
    this.map.addInteraction(this.selectInteraction);
    
    // Gestisci l'evento di selezione
    this.selectInteraction.on('select', (e) => {
      const selectedFeatures = e.selected;
      
      if (selectedFeatures.length > 0) {
        this.selectedElement = selectedFeatures[0];
        const elementType = this.selectedElement.get('type');
        const elementId = this.selectedElement.get('id');
        
        console.log(`Elemento selezionato: ${elementType} - ${elementId}`);
        
        // Aggiorna il riferimento nel manager appropriato
        if (elementType === 'place') {
          this.polygonManager.setSelectedPolygon(this.selectedElement);
          this.edgeManager.setSelectedEdge(null);
        } else if (elementType === 'edge') {
          this.edgeManager.setSelectedEdge(this.selectedElement);
          this.polygonManager.setSelectedPolygon(null);
        }
      } else {
        this.selectedElement = null;
        this.polygonManager.setSelectedPolygon(null);
        this.edgeManager.setSelectedEdge(null);
      }
      
      // Aggiorna la sidebar
      this.updateSidebarElements();
    });
  }

  // Funzione per eliminare l'elemento selezionato (poligono o arco)
  deleteSelectedElement(): boolean {
    if (!this.selectedElement) {
      console.log('Nessun elemento selezionato da eliminare');
      return false;
    }
    
    const elementType = this.selectedElement.get('type');
    
    if (elementType === 'place') {
      // Elimina il poligono selezionato
      return this.polygonManager.deleteSelectedPolygon();
    } else if (elementType === 'edge') {
      // Elimina l'arco selezionato
      return this.edgeManager.deleteSelectedEdge();
    }
    
    return false;
  }

  // Funzione per verificare se c'è un elemento selezionato
  hasSelectedElement(): boolean {
    return this.selectedElement !== null;
  }

  // Funzione per ottenere l'elemento selezionato
  getSelectedElement(): Feature<Geometry> | null {
    return this.selectedElement;
  }

  // Funzione per modificare l'ID dell'elemento selezionato
  renameSelectedElement(newId: string): boolean {
    if (!this.selectedElement || !newId.trim()) {
      return false;
    }
    
    const elementType = this.selectedElement.get('type');
    const oldId = this.selectedElement.get('id');
    
    // Verifica che il nuovo ID non sia già in uso
    let isIdUnique = true;
    
    if (elementType === 'place') {
      const placeFeatures = this.polygonManager.getPlaceSource().getFeatures();
      isIdUnique = !placeFeatures.some(feature => 
        feature !== this.selectedElement && feature.get('id') === newId
      );
    } else if (elementType === 'edge') {
      const edgeFeatures = this.edgeManager.getEdgeSource().getFeatures();
      isIdUnique = !edgeFeatures.some(feature => 
        feature !== this.selectedElement && feature.get('id') === newId
      );
    }
    
    if (!isIdUnique) {
      console.log(`ID "${newId}" già in uso`);
      return false;
    }
    
    // Aggiorna l'ID dell'elemento
    this.selectedElement.set('id', newId);
    
    // Se è un arco, aggiorna anche l'ID basato su source e target
    if (elementType === 'edge') {
      // Mantieni source e target invariati, ma usa il nuovo ID personalizzato
      this.selectedElement.set('custom_id', true); // Flag per indicare che l'ID è personalizzato
    }
    
    console.log(`ID modificato da "${oldId}" a "${newId}"`);
    
    // Aggiorna la sidebar
    this.updateSidebarElements();
    
    return true;
  }

  // Funzione per evidenziare un elemento sulla mappa (per hover)
  highlightElement(elementId: string): void {
    // Rimuovi l'evidenziazione precedente
    this.unhighlightElement();
    
    // Cerca l'elemento tra i poligoni
    let element = this.polygonManager.getPlaceSource().getFeatures().find(
      feature => feature.get('id') === elementId
    );
    
    // Se non trovato tra i poligoni, cerca tra gli archi
    if (!element) {
      element = this.edgeManager.getEdgeSource().getFeatures().find(
        feature => feature.get('id') === elementId
      );
    }
    
    if (element) {
      this.highlightedElement = element;
      
      // Salva lo stile originale
      const originalStyle = element.getStyle();
      element.set('originalStyle', originalStyle);
      
      // Applica lo stile di evidenziazione
      element.setStyle(highlightStyle);
      
      console.log(`Elemento evidenziato: ${elementId}`);
    }
  }

  // Funzione per rimuovere l'evidenziazione
  unhighlightElement(): void {
    if (this.highlightedElement) {
      // Ripristina lo stile originale
      const originalStyle = this.highlightedElement.get('originalStyle');
      this.highlightedElement.setStyle(originalStyle);
      
      this.highlightedElement = null;
    }
  }
}

export default SelectionManager;
