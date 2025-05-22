import React, { useState, useEffect } from 'react';
import "./Sidebar2.css";

interface Sidebar2Props {
  // Non sono necessarie props specifiche poiché la sidebar si aggiorna automaticamente
}

interface PlaceAttributes {
  [key: string]: string;
}

interface EdgeAttributes {
  [key: string]: string;
}

interface Place {
  id: string;
  type: 'place';
  attributes: PlaceAttributes;
}

interface Edge {
  id: string;
  type: 'edge';
  source: string;
  target: string;
  attributes: EdgeAttributes;
}

interface Condition {
  attribute: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string;
}

interface LogicalPlace {
  id: string;
  name: string;
  description?: string;
  conditions: Condition[];
  operator: 'AND' | 'OR';
  physicalPlaces: Place[]; // Place fisiche che soddisfano le condizioni
}

interface View {
  id: string;
  name: string;
  description?: string;
  logicalPlaces: string[]; // ID delle place logiche contenute nella view
  aggregatedAttributes?: string[]; // Attributi da aggregare nella view (Potentially deprecated if aggregation is only in LogicalPlace)
}

type Element = Place | Edge;

// Componente per la sidebar a destra
const Sidebar2: React.FC<Sidebar2Props> = () => {
  const [roads, setRoads] = useState<Place[]>([]);
  const [departments, setDepartments] = useState<Place[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Place[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredElements, setHoveredElements] = useState<string[]>([]); // Modificato per supportare più elementi
  const [refreshKey, setRefreshKey] = useState<number>(0); // Stato per forzare il refresh
  const [isVisible, setIsVisible] = useState(true);

  // Stati per le place logiche
  const [logicalPlaces, setLogicalPlaces] = useState<LogicalPlace[]>([]);
  const [showLogicalPlaceEditor, setShowLogicalPlaceEditor] = useState(false);

  // Stati per la selezione manuale di place fisiche
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [newManualLogicalPlaceName, setNewManualLogicalPlaceName] = useState<string>('');

  // Stato per le views
  const [views, setViews] = useState<View[]>([]);
  const [showViewEditor, setShowViewEditor] = useState(false);
  const [newViewName, setNewViewName] = useState<string>('');
  const [selectedLogicalPlaces, setSelectedLogicalPlaces] = useState<string[]>([]);

  // Stato per espandere/comprimere i dettagli delle place fisiche
  const [expandedLogicalPlaces, setExpandedLogicalPlaces] = useState<string[]>([]);

  // *** ADDED: State for selected aggregation functions per logical place ***
  // Example: { 'logical-123': { 'posti': 'SUM', 'area': 'AVG' }, 'logical-456': { 'posti': 'MAX' } }
  const [selectedAggregations, setSelectedAggregations] = useState<Record<string, Record<string, 'MAX' | 'MIN' | 'AVG' | 'SUM' | 'COUNT' | null>>>({});


  // Salva le place logiche nel localStorage
  const saveLogicalPlacesToLocalStorage = () => {
    localStorage.setItem('logicalPlaces', JSON.stringify(logicalPlaces));
    // *** ADDED: Save aggregations to localStorage ***
    localStorage.setItem('selectedAggregations', JSON.stringify(selectedAggregations));
  };

  // Carica le place logiche dal localStorage
  const loadLogicalPlacesFromLocalStorage = () => {
    const savedLogicalPlaces = localStorage.getItem('logicalPlaces');
    if (savedLogicalPlaces) {
      try {
        const parsedLogicalPlaces = JSON.parse(savedLogicalPlaces) as LogicalPlace[];
        setLogicalPlaces(parsedLogicalPlaces);
      } catch (error) {
        console.error('Error loading logical places from localStorage:', error);
      }
    }
    // *** ADDED: Load aggregations from localStorage ***
    const savedAggregations = localStorage.getItem('selectedAggregations');
    if (savedAggregations) {
        try {
            const parsedAggregations = JSON.parse(savedAggregations);
            setSelectedAggregations(parsedAggregations);
        } catch (error) {
            console.error('Error loading selected aggregations from localStorage:', error);
        }
    }
  };

  // Salva le views nel localStorage
  const saveViewsToLocalStorage = () => {
    localStorage.setItem('views', JSON.stringify(views));
  };

  // Carica le views dal localStorage
  const loadViewsFromLocalStorage = () => {
    const savedViews = localStorage.getItem('views');
    if (savedViews) {
      try {
        const parsedViews = JSON.parse(savedViews) as View[];
        setViews(parsedViews);
      } catch (error) {
        console.error('Error loading views from localStorage:', error);
      }
    }
  };

  // Funzione per aggiornare gli elementi dalla mappa
  const updateElements = (newElements: Element[]) => {
    console.log("Sidebar2: Update elements", newElements);

    // Filtra gli elementi per tipo
    const newPlaces = newElements.filter(el => el.type === 'place') as Place[];
    const newEdges = newElements.filter(el => el.type === 'edge') as Edge[];

    // Categorizza i poligoni in base agli attributi (Potentially less relevant now)
    const newRoads = newPlaces.filter(place =>
      place.attributes.type === 'road' ||
      place.id.toLowerCase().includes('sp') ||
      place.attributes.zone?.toLowerCase().includes('sp')
    );

    const newDepartments = newPlaces.filter(place =>
      place.attributes.type === 'department' ||
      place.id.toLowerCase().includes('department') ||
      place.attributes.department === 'true'
    );

    const newAvailableRooms = newPlaces.filter(place =>
      place.attributes.type === 'room' ||
      place.attributes.available === 'true' ||
      place.id.toLowerCase().includes('room')
    );

    // Aggiorna gli stati
    setRoads(newRoads);
    setDepartments(newDepartments);
    setAvailableRooms(newAvailableRooms);
    setPlaces(newPlaces);
    setEdges(newEdges);

    // Aggiorna le place logiche con le nuove place fisiche
    updateLogicalPlaces(newPlaces);

    // Forza un refresh del componente
    setRefreshKey(prev => prev + 1);
  };

  // Funzione per aggiornare le place logiche con le nuove place fisiche
  const updateLogicalPlaces = (newPlaces: Place[]) => {
    const updatedLogicalPlaces = logicalPlaces.map(logicalPlace => {
      // Se la place logica è stata creata manualmente (senza condizioni),
      // mantieni le sue place fisiche originali ma aggiorna i riferimenti
      if (logicalPlace.conditions.length === 0) {
        return {
          ...logicalPlace,
          physicalPlaces: logicalPlace.physicalPlaces.map(oldPlace => {
            // Cerca la place aggiornata corrispondente
            const updatedPlace = newPlaces.find(p => p.id === oldPlace.id);
            return updatedPlace || oldPlace;
          }).filter(place => newPlaces.some(p => p.id === place.id)) // Rimuovi le place che non esistono più
        };
      }

      // Per le place logiche basate su condizioni, ricalcola le place fisiche
      const matchingPlaces = newPlaces.filter(place =>
        evaluateLogicalPlace(place, logicalPlace)
      );

      return {
        ...logicalPlace,
        physicalPlaces: matchingPlaces
      };
    });

    // Importante: confronta se ci sono cambiamenti prima di aggiornare lo stato
    // per evitare cicli di rendering infiniti
    if (JSON.stringify(updatedLogicalPlaces) !== JSON.stringify(logicalPlaces)) {
      setLogicalPlaces(updatedLogicalPlaces);
    }
  };

  // Funzione per valutare una condizione su una place
  const evaluateCondition = (place: Place, condition: Condition): boolean => {
    const attributeValue = place.attributes[condition.attribute];
    if (attributeValue === undefined) return false;

    // Converti i valori in numeri se possibile per confronti numerici
    const placeValue = !isNaN(Number(attributeValue)) ? Number(attributeValue) : attributeValue;
    const conditionValue = !isNaN(Number(condition.value)) ? Number(condition.value) : condition.value;

    switch (condition.operator) {
      case '==': return placeValue === conditionValue;
      case '!=': return placeValue !== conditionValue;
      case '>': return placeValue > conditionValue;
      case '<': return placeValue < conditionValue;
      case '>=': return placeValue >= conditionValue;
      case '<=': return placeValue <= conditionValue;
      default: return false;
    }
  };

  // Funzione per valutare se una place soddisfa tutte le condizioni di una place logica
  const evaluateLogicalPlace = (place: Place, logicalPlace: LogicalPlace): boolean => {
    if (logicalPlace.conditions.length === 0) return false; // Should not happen for condition-based logical places

    if (logicalPlace.operator === 'AND') {
      return logicalPlace.conditions.every(condition =>
        evaluateCondition(place, condition)
      );
    } else { // OR
      return logicalPlace.conditions.some(condition =>
        evaluateCondition(place, condition)
      );
    }
  };

  // Funzione per ottenere gli elementi direttamente
  const fetchElements = () => {
    try {
      const polygonManager = (window as any).polygonManager;
      const edgeManager = (window as any).edgeManager;

      if (!polygonManager || !edgeManager) {
        console.log("Sidebar2: Managers not available");
        return;
      }

      const placeFeatures = polygonManager.getPlaceSource().getFeatures();
      const edgeFeatures = edgeManager.getEdgeSource().getFeatures();

      console.log("Sidebar2: Features obtained", {
        places: placeFeatures.length,
        edges: edgeFeatures.length
      });

      const elements = [
        ...placeFeatures.map((feature: any) => ({
          id: feature.get('id'),
          type: 'place',
          attributes: feature.get('attributes') || {},
        })),
        ...edgeFeatures.map((feature: any) => ({
          id: feature.get('id'),
          type: 'edge',
          source: feature.get('source'),
          target: feature.get('target'),
          attributes: feature.get('attributes') || {},
        })),
      ];

      updateElements(elements);
    } catch (error) {
      console.error("Sidebar2: Error in retrieving items", error);
    }
  };

  // Esponi la funzione updateElements globalmente e imposta un timer per l'aggiornamento
  useEffect(() => {
    console.log("Sidebar2: Initialization");
    (window as any).updateSidebar2Elements = updateElements;

    // Esponi la funzione per aggiungere una place logica dalla sidebar sinistra
    (window as any).addLogicalPlace = (logicalPlace: LogicalPlace) => {
      console.log("Sidebar2: Ricevuta nuova place logica", logicalPlace);

      // Verifica se esiste già una place logica con lo stesso ID
      const existingIndex = logicalPlaces.findIndex(place => place.id === logicalPlace.id);

      if (existingIndex >= 0) {
        // Aggiorna la place logica esistente
        const updatedLogicalPlaces = [...logicalPlaces];
        updatedLogicalPlaces[existingIndex] = {
          ...logicalPlace,
          // Mantieni la descrizione esistente se presente
          description: logicalPlaces[existingIndex].description || logicalPlace.description
        };
        setLogicalPlaces(updatedLogicalPlaces);
      } else {
        // Aggiungi la nuova place logica
        setLogicalPlaces(prev => [...prev, logicalPlace]); // Use functional update
      }
    };

    // Esponi la funzione per evidenziare più elementi contemporaneamente
    (window as any).highlightMultipleElements = (elementIds: string[]) => {
      // Utilizziamo direttamente il PolygonManager se disponibile
      if (typeof (window as any).polygonManager !== 'undefined' &&
          typeof (window as any).polygonManager.highlightMultipleFeatures === 'function') {
        (window as any).polygonManager.highlightMultipleFeatures(elementIds);
      } else {
        // Fallback nel caso in cui il PolygonManager non sia disponibile
        console.log("PolygonManager not available, using fallback highlighting");

        // Prima rimuoviamo tutte le evidenziazioni
        if (typeof (window as any).unhighlightElement === 'function') {
          (window as any).unhighlightElement();
        }

        // Poi evidenziamo ogni elemento
        elementIds.forEach(id => {
          if (typeof (window as any).highlightElement === 'function') {
            (window as any).highlightElement(id);
          }
        });
      }
    };

    // Esponi la funzione per evidenziare un singolo elemento
    (window as any).highlightElement = (elementId: string) => {
      if (typeof (window as any).polygonManager !== 'undefined' &&
          typeof (window as any).polygonManager.highlightFeature === 'function') {
        (window as any).polygonManager.highlightFeature(elementId);
      }
    };

    // Esponi la funzione per rimuovere le evidenziazioni
    (window as any).unhighlightElement = () => {
      if (typeof (window as any).polygonManager !== 'undefined' &&
          typeof (window as any).polygonManager.unhighlightFeatures === 'function') {
        (window as any).polygonManager.unhighlightFeatures();
      }
    };

    // Carica le place logiche e le views salvate
    loadLogicalPlacesFromLocalStorage();
    loadViewsFromLocalStorage();

    // Inizializza con gli elementi esistenti se disponibili
    if ((window as any).elements) {
      console.log("Sidebar2: Existing elements found", (window as any).elements);
      updateElements((window as any).elements);
    }

    // Recupera gli elementi direttamente
    fetchElements();

    // Imposta un timer per aggiornare periodicamente gli elementi
    const timer = setInterval(() => {
      console.log("Sidebar2: Periodic update");
      fetchElements();
    }, 1000); // Update every second - might be too frequent? Consider increasing interval.

    return () => {
      // Rimuovi le funzioni globali e il timer quando il componente viene smontato
      delete (window as any).updateSidebar2Elements;
      delete (window as any).addLogicalPlace;
      delete (window as any).highlightMultipleElements;
      delete (window as any).highlightElement;
      delete (window as any).unhighlightElement;
      clearInterval(timer);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Salva le place logiche quando cambiano
  useEffect(() => {
    saveLogicalPlacesToLocalStorage();
  }, [logicalPlaces, selectedAggregations]); // *** ADDED selectedAggregations dependency ***

  // Salva le views quando cambiano
  useEffect(() => {
    saveViewsToLocalStorage();
  }, [views]);

  // Funzione per evidenziare un elemento sulla mappa
  const highlightElement = (elementId: string) => {
    setHoveredElements([elementId]);

    if (typeof (window as any).highlightElement === 'function') {
      (window as any).highlightElement(elementId);
    }
  };

  // Funzione per evidenziare più elementi sulla mappa (per place logiche)
  const highlightMultipleElements = (elementIds: string[]) => {
    if (elementIds.length === 0) return;

    // Imposta tutti gli elementi come hoveredElements
    setHoveredElements(elementIds);

    // Utilizziamo il PolygonManager direttamente se disponibile
    if (typeof (window as any).polygonManager !== 'undefined' &&
        typeof (window as any).polygonManager.highlightMultipleFeatures === 'function') {
      // Chiamata diretta al PolygonManager
      (window as any).polygonManager.highlightMultipleFeatures(elementIds);
    } else if (typeof (window as any).highlightMultipleElements === 'function') {
      // Fallback alla funzione globale
      (window as any).highlightMultipleElements(elementIds);
    } else {
      // Fallback nel caso in cui nessuna delle funzioni sia disponibile
      console.log("Highlighting multiple elements:", elementIds);

      // Prima rimuoviamo tutte le evidenziazioni
      if (typeof (window as any).unhighlightElement === 'function') {
        (window as any).unhighlightElement();
      }
    }
  };

  // Funzione per rimuovere l'evidenziazione
  const unhighlightElement = () => {
    setHoveredElements([]);

    if (typeof (window as any).unhighlightElement === 'function') {
      (window as any).unhighlightElement();
    }
  };

  // Funzione per eliminare una place logica
  const deleteLogicalPlace = (id: string) => {
    // Remove from logicalPlaces state
    setLogicalPlaces(prev => prev.filter(place => place.id !== id));

    // *** ADDED: Remove aggregations associated with this logical place ***
    setSelectedAggregations(prev => {
        const newState = {...prev};
        delete newState[id];
        return newState;
    });

    // Rimuovi anche la place logica da tutte le views che la contengono
    setViews(prevViews => prevViews.map(view => ({
      ...view,
      logicalPlaces: view.logicalPlaces.filter(placeId => placeId !== id)
    })));
  };

  // Funzione per eliminare una view
  const deleteView = (id: string) => {
    setViews(prev => prev.filter(view => view.id !== id));
  };

  // Funzione per attivare/disattivare la modalità di selezione
  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) { // If turning OFF selection mode
      // Resettiamo le place selezionate
      setSelectedPlaces([]);
    }
  };

  // Funzione per gestire la selezione/deselezione di una place
  const togglePlaceSelection = (place: Place) => {
    if (!selectionMode) return;

    setSelectedPlaces(prevSelected => {
      const isSelected = prevSelected.some(p => p.id === place.id);
      if (isSelected) {
        // Deseleziona la place
        return prevSelected.filter(p => p.id !== place.id);
      } else {
        // Seleziona la place
        return [...prevSelected, place];
      }
    });
  };

  // Funzione per gestire la selezione/deselezione di una place logica per una view
  const toggleLogicalPlaceSelection = (logicalPlaceId: string) => {
    if (!showViewEditor) return;

    setSelectedLogicalPlaces(prevSelected => {
        const isSelected = prevSelected.includes(logicalPlaceId);
        if (isSelected) {
          // Deseleziona la place logica
          return prevSelected.filter(id => id !== logicalPlaceId);
        } else {
          // Seleziona la place logica
          return [...prevSelected, logicalPlaceId];
        }
    });
  };

  // Funzione per creare una place logica dalle place selezionate
  const createLogicalPlaceFromSelection = () => {
    if (selectedPlaces.length === 0 || !newManualLogicalPlaceName.trim()) return;

    const newLogicalPlace: LogicalPlace = {
      id: `logical-${Date.now()}`,
      name: newManualLogicalPlaceName.trim(),
      description: `Manually created with ${selectedPlaces.length} physical place(s)`,
      conditions: [], // Nessuna condizione, solo selezione manuale
      operator: 'OR', // Operator doesn't matter here
      physicalPlaces: [...selectedPlaces] // Copy selected places
    };

    // Importante: usa l'aggiornamento funzionale per evitare race conditions
    setLogicalPlaces(prev => [...prev, newLogicalPlace]);

    // Reset dopo la creazione
    setNewManualLogicalPlaceName('');
    setSelectedPlaces([]);
    setSelectionMode(false);
    setShowLogicalPlaceEditor(false); // Close modal

    // Forza un refresh del componente (potrebbe non essere necessario con l'aggiornamento dello stato)
    // setRefreshKey(prev => prev + 1);
  };

  // Stato per gli attributi da aggregare (Potentially deprecated)
  // const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  // const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);

  // Funzione per ottenere tutti gli attributi unici dalle place (Potentially deprecated)
  // const getUniqueAttributes = (): string[] => {
  //   const attributes = new Set<string>();
  //   places.forEach(place => {
  //     Object.keys(place.attributes).forEach(attr => attributes.add(attr));
  //   });
  //   return Array.from(attributes).sort();
  // };

  // Aggiorna gli attributi disponibili quando cambiano le place (Potentially deprecated)
  // useEffect(() => {
  //   setAvailableAttributes(getUniqueAttributes());
  // }, [places]);

  // Funzione per gestire la selezione/deselezione di un attributo (Potentially deprecated)
  // const toggleAttributeSelection = (attribute: string) => {
  //   if (selectedAttributes.includes(attribute)) {
  //     setSelectedAttributes(selectedAttributes.filter(attr => attr !== attribute));
  //   } else {
  //     setSelectedAttributes([...selectedAttributes, attribute]);
  //   }
  // };

  // Funzione per creare una view dalle place logiche selezionate
  const createViewFromSelection = () => {
    if (selectedLogicalPlaces.length === 0 || !newViewName.trim()) return;

    const newView: View = {
      id: `view-${Date.now()}`,
      name: newViewName.trim(),
      description: `View created with ${selectedLogicalPlaces.length} logical place(s)`,
      logicalPlaces: [...selectedLogicalPlaces],
      // aggregatedAttributes: selectedAttributes.length > 0 ? [...selectedAttributes] : undefined // Deprecated for now
    };

    // Importante: usa l'aggiornamento funzionale
    setViews(prev => [...prev, newView]);

    // Reset dopo la creazione
    setNewViewName('');
    setSelectedLogicalPlaces([]);
    // setSelectedAttributes([]); // Deprecated
    setShowViewEditor(false); // Close modal

    // Forza un refresh del componente (potrebbe non essere necessario)
    // setRefreshKey(prev => prev + 1);
  };

  // Funzione per espandere/comprimere i dettagli di una place logica
  const toggleLogicalPlaceExpansion = (logicalPlaceId: string) => {
    setExpandedLogicalPlaces(prevExpanded => {
        if (prevExpanded.includes(logicalPlaceId)) {
          // Comprimi
          return prevExpanded.filter(id => id !== logicalPlaceId);
        } else {
          // Espandi
          return [...prevExpanded, logicalPlaceId];
        }
    });
  };

  // Funzione per renderizzare una sezione di elementi con supporto per la selezione
  const renderElementSection = (title: string, elements: Element[], showZone: boolean = false) => {
    if (elements.length === 0 && !selectionMode) return null; // Don't render empty sections unless in selection mode

    return (
      <div className="sidebar2-section">
        <h3>{title}</h3>
        {elements.length === 0 && selectionMode && <p className="text-muted small">No elements of this type to select.</p>}
        <div className="sidebar2-items">
          {elements.map(element => {
            // Verifica se l'elemento è una place e se è selezionato
            const isPlace = element.type === 'place';
            const isSelected = isPlace && selectedPlaces.some(p => p.id === element.id);

            return (
              <div
                key={`${element.id}-${refreshKey}`} // Include refreshKey if needed
                className={`sidebar2-item
                  ${hoveredElements.includes(element.id) ? 'hovered' : ''}
                  ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => highlightElement(element.id)}
                onMouseLeave={unhighlightElement}
                onClick={() => isPlace && togglePlaceSelection(element as Place)}
                style={selectionMode && isPlace ? { cursor: 'pointer' } : {}}
              >
                <h6>
                  {isPlace && selectionMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly // State managed by parent div click
                      className="me-2"
                      style={{ pointerEvents: 'none' }} // Prevent direct interaction
                    />
                  )}
                  {element.id}
                </h6>
                {showZone && element.type === 'place' && element.attributes.zone && (
                  <div className="sidebar2-attribute small">
                    <span>zone: </span>
                    {element.attributes.zone}
                  </div>
                )}
                {element.type === 'edge' && (
                  <div className="sidebar2-attribute small">
                    <span>from: </span>
                    {element.source}
                    <span> to: </span>
                    {element.target}
                  </div>
                )}
                {Object.entries(element.attributes)
                  .filter(([key]) => key !== 'zone' || !showZone) // Evita di mostrare zone due volte
                  .map(([key, value]) => (
                    <div key={`${element.id}-${key}`} className="sidebar2-attribute small">
                      <span>{key}: </span>
                      {value}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Funzione per renderizzare una sezione di stanze disponibili (Potentially deprecated)
  const renderAvailableRoomsSection = (title: string, elements: Place[], type: string) => {
    const filteredRooms = elements.filter(room =>
      room.attributes.type?.toLowerCase() === type.toLowerCase() ||
      room.id.toLowerCase().includes(type.toLowerCase())
    );

    if (filteredRooms.length === 0) return null;

    return (
      <div className="sidebar2-section">
        <h3>{title}</h3>
        <div className="sidebar2-items">
          <div className="sidebar2-available">
            <span>available: </span>
            {filteredRooms.length}
          </div>
          {filteredRooms.map(room => {
            const isSelected = selectedPlaces.some(p => p.id === room.id);

            return (
              <div
                key={`${room.id}-${refreshKey}`} // Include refreshKey if needed
                className={`sidebar2-item
                  ${hoveredElements.includes(room.id) ? 'hovered' : ''}
                  ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => highlightElement(room.id)}
                onMouseLeave={unhighlightElement}
                onClick={() => togglePlaceSelection(room)}
                style={selectionMode ? { cursor: 'pointer' } : {}}
              >
                <h6>
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="me-2"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {room.id}
                </h6>
                {room.attributes.zone && (
                  <div className="sidebar2-attribute small">
                    <span>zone: </span>
                    {room.attributes.zone}
                  </div>
                )}
                {Object.entries(room.attributes)
                  .filter(([key]) => key !== 'zone') // Evita di mostrare zone due volte
                  .map(([key, value]) => (
                    <div key={`${room.id}-${key}`} className="sidebar2-attribute small">
                      <span>{key}: </span>
                      {value}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // *** ADDED: Aggregation Helper Functions ***
  const isNumeric = (value: string): boolean => {
    if (typeof value !== 'string' || value.trim() === '') return false;
    // Allow numbers with commas as decimal separators for robustness, replace before parsing
    const normalizedValue = value.replace(',', '.');
    return !isNaN(parseFloat(normalizedValue)) && isFinite(Number(normalizedValue));
  };

  const calculateAggregation = (values: string[], func: 'MAX' | 'MIN' | 'AVG' | 'SUM' | 'COUNT'): number | string => {
    const numericValues = values
        .map(v => typeof v === 'string' ? v.replace(',', '.') : v) // Normalize commas
        .map(v => parseFloat(v as string))
        .filter(n => !isNaN(n) && isFinite(n));

    if (func === 'COUNT') {
      // Count all original non-empty/null values provided
      return values.filter(v => v != null && v !== '').length;
    }

    if (numericValues.length === 0) {
      return 'N/A'; // No numeric values to aggregate
    }

    let result: number;
    switch (func) {
      case 'MAX':
        result = Math.max(...numericValues);
        break;
      case 'MIN':
        result = Math.min(...numericValues);
        break;
      case 'SUM':
        result = numericValues.reduce((sum, current) => sum + current, 0);
        break;
      case 'AVG':
        const sum = numericValues.reduce((s, c) => s + c, 0);
        result = sum / numericValues.length;
        break;
      default:
        return 'N/A'; // Should not happen
    }
    // Format result to a reasonable number of decimal places, e.g., 2
    return Number.isInteger(result) ? result : result.toFixed(2);
  };
  // *** End Aggregation Helper Functions ***


  // Renderizza la sezione delle place logiche (MODIFIED with Aggregation)
  const renderLogicalPlacesSection = () => {
    return (
      <div className="sidebar2-section logical-places-section">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3>Logical Places</h3>
          <div>
            <button
              className="btn btn-sm btn-outline-primary me-2"
              title="Create New Logical Place Manually"
              onClick={() => setShowLogicalPlaceEditor(true)}
            >
              + New LP
            </button>
            <button
              className="btn btn-sm btn-outline-success"
              title="Create New View"
              onClick={() => setShowViewEditor(true)}
            >
              + New View
            </button>
          </div>
        </div>

        {logicalPlaces.length === 0 ? (
          <p className="text-muted small">No logical places defined yet. Create one from the sidebar on the left or manually using '+ New LP'.</p>
        ) : (
          <div className="sidebar2-items">
            {logicalPlaces.map(logicalPlace => {
              const isExpanded = expandedLogicalPlaces.includes(logicalPlace.id);
              const isSelectedForView = showViewEditor && selectedLogicalPlaces.includes(logicalPlace.id);

              // *** ADDED: Aggregation Data Preparation ***
              const attributesSummary: Record<string, { values: string[], isNumeric: boolean, count: number }> = {};
              let totalPlaces = 0;
              if (logicalPlace.physicalPlaces) { // Ensure physicalPlaces exists
                  totalPlaces = logicalPlace.physicalPlaces.length;
                  logicalPlace.physicalPlaces.forEach(place => {
                    if (place && place.attributes) { // Ensure place and attributes exist
                        Object.entries(place.attributes).forEach(([key, value]) => {
                          if (value == null || value === '') return; // Skip empty/null attributes

                          if (!attributesSummary[key]) {
                            attributesSummary[key] = { values: [], isNumeric: true, count: 0 };
                          }
                          attributesSummary[key].values.push(value);
                          attributesSummary[key].count++;
                          // If *any* value for this key across all places is not numeric, mark the whole attribute as non-numeric
                          if (attributesSummary[key].isNumeric && !isNumeric(value)) {
                            attributesSummary[key].isNumeric = false;
                          }
                        });
                    }
                  });
                  // Ensure isNumeric is false if not all places have the attribute
                  Object.keys(attributesSummary).forEach(key => {
                      if (attributesSummary[key].count < totalPlaces) {
                          // If an attribute doesn't exist in all places, treat it as non-numeric for aggregation consistency
                          // Or decide on another handling strategy (e.g., ignore missing for AVG/SUM)
                          // For simplicity, let's mark as non-numeric for now if missing in some places.
                          // attributesSummary[key].isNumeric = false; // Revisit this logic if needed
                      }
                      // Re-check numeric status based on all collected values
                      if (attributesSummary[key].isNumeric) {
                          attributesSummary[key].isNumeric = attributesSummary[key].values.every(isNumeric);
                      }
                  });
              }
              // *** End Aggregation Data Preparation ***

              // *** ADDED: Handle Aggregation Change ***
              const handleAggregationChange = (attributeName: string, func: 'MAX' | 'MIN' | 'AVG' | 'SUM' | 'COUNT' | null) => {
                setSelectedAggregations(prev => ({
                  ...prev,
                  [logicalPlace.id]: {
                    ...(prev[logicalPlace.id] || {}),
                    [attributeName]: func,
                  }
                }));
              };

              return (
                <div
                  key={`${logicalPlace.id}-${refreshKey}`} // Use refreshKey if needed
                  className={`sidebar2-logical-place mb-2 p-2 border rounded ${isSelectedForView ? 'selected-for-view' : ''}`}
                  onMouseEnter={() => logicalPlace.physicalPlaces && highlightMultipleElements(logicalPlace.physicalPlaces.map(p => p.id))}
                  onMouseLeave={unhighlightElement}
                  onClick={() => showViewEditor && toggleLogicalPlaceSelection(logicalPlace.id)}
                  style={showViewEditor ? { cursor: 'pointer' } : {}}
                >
                  <div className="sidebar2-logical-place-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {showViewEditor && (
                        <input
                          type="checkbox"
                          checked={isSelectedForView}
                          readOnly
                          className="me-2 form-check-input" // Added Bootstrap class
                          style={{ pointerEvents: 'none' }} // Prevent direct interaction
                          onClick={(e) => e.stopPropagation()} // Prevent container click
                        />
                      )}
                      <h6 className="mb-0">{logicalPlace.name} <span className="badge bg-light text-dark ms-1">{totalPlaces} place(s)</span></h6>
                      {/* Expansion button restored */}
                      <button
                        className="btn btn-sm btn-link ms-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLogicalPlaceExpansion(logicalPlace.id);
                        }}
                        title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                      >
                        {isExpanded ? '▼' : '►'}
                      </button>
                    </div>
                    <div className="sidebar2-logical-place-actions">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Delete Logical Place"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLogicalPlace(logicalPlace.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {logicalPlace.description && (
                    <div className="sidebar2-logical-place-description small text-muted mt-1">
                      {logicalPlace.description}
                    </div>
                  )}

                  {/* *** ADDED: Display Aggregated Attributes *** */}
                  <div className="sidebar2-logical-place-attributes-summary mt-2">
                    {Object.entries(attributesSummary).length === 0 ? (
                        <p className="text-muted small fst-italic">No common attributes found in physical places.</p>
                    ) : (
                        <div className="list-group list-group-flush small">
                            {Object.entries(attributesSummary).map(([attrName, summary]) => {
                                const selectedFunc = selectedAggregations[logicalPlace.id]?.[attrName] ?? null;
                                // Aggregate numeric attributes present in at least one place. COUNT works always.
                                const canAggregateNumeric = summary.isNumeric && summary.values.length > 0;
                                const showAggregationControls = canAggregateNumeric || attrName === 'posti'; // Always allow aggregation for 'posti' as requested? Or check if numeric? Let's stick to numeric check.
                                                                                                            // Let's enable for numeric attributes found in >= 1 place.
                                const enableAggregation = summary.isNumeric && summary.values.length > 0;


                                return (
                                    <div key={attrName} className="list-group-item d-flex justify-content-between align-items-center p-1 border-0">
                                        <div className="flex-grow-1 me-2">
                                            <span className="fw-bold">{attrName}:</span>
                                            {enableAggregation && selectedFunc ? (
                                                <span className="ms-1 badge bg-primary">{selectedFunc} = {calculateAggregation(summary.values, selectedFunc)}</span>
                                            ) : (
                                                // Show unique values if not aggregating or not possible, limit display
                                                <span className="ms-1 text-muted fst-italic">
                                                    {[...new Set(summary.values)].slice(0, 3).join(', ')}
                                                    {summary.values.length > 3 ? '...' : ''}
                                                    {!summary.isNumeric && summary.values.length > 0 ? ' (Text)' : ''}
                                                </span>
                                            )}
                                        </div>
                                        {enableAggregation && (
                                            <div className="btn-group btn-group-sm" role="group" aria-label={`Aggregation for ${attrName}`}>
                                                {(['SUM', 'AVG', 'MAX', 'MIN', 'COUNT'] as const).map(func => (
                                                    <button
                                                        key={func}
                                                        type="button"
                                                        className={`btn btn-outline-secondary p-1 ${selectedFunc === func ? 'active' : ''}`}
                                                        onClick={(e) => { e.stopPropagation(); handleAggregationChange(attrName, selectedFunc === func ? null : func); }}
                                                        onMouseEnter={(e) => e.stopPropagation()} // Prevent parent mouseEnter/Leave
                                                        onMouseLeave={(e) => e.stopPropagation()} // Prevent parent mouseEnter/Leave
                                                        title={func}
                                                        style={{fontSize: '0.7rem', lineHeight: '1'}} // Smaller buttons
                                                    >
                                                        {func.substring(0,3)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                  </div>
                  {/* *** End Aggregated Attributes *** */}

                  {/* Display Physical Places (conditionally based on expansion) */}
                  {isExpanded && (
                    <div className="sidebar2-logical-place-physical mt-2">
                      <strong>Physical Places ({logicalPlace.physicalPlaces?.length || 0}):</strong>
                      {logicalPlace.physicalPlaces && logicalPlace.physicalPlaces.length > 0 ? (
                        <div className="sidebar2-logical-place-physical-list small" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {logicalPlace.physicalPlaces.map(place => (
                            <div
                              key={`${place.id}-${refreshKey}`}
                              className="sidebar2-logical-place-physical-item border-top pt-1 mt-1"
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>{place.id}</span>
                              </div>
                              {Object.entries(place.attributes).length > 0 && (
                                <div className="sidebar2-logical-place-physical-attributes text-muted" style={{ fontSize: '0.8em' }}>
                                  {Object.entries(place.attributes).map(([key, value]) => (
                                    <div key={`${place.id}-${key}-${refreshKey}`} className="sidebar2-attribute">
                                      <span>{key}: </span>
                                      {value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted small fst-italic">No physical places match the conditions.</p>
                      )}
                    </div>
                  )}
                </div> // End sidebar2-logical-place
              );
            })}
          </div> // End sidebar2-items
        )}

        {/* --- Modals --- */}
        {/* Modal per creare/modificare place logiche manualmente */}
        {showLogicalPlaceEditor && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Manual Logical Place</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowLogicalPlaceEditor(false); setSelectionMode(false); setSelectedPlaces([]); }}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="manualLogicalPlaceName" className="form-label">Logical Place Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="manualLogicalPlaceName"
                      value={newManualLogicalPlaceName}
                      onChange={(e) => setNewManualLogicalPlaceName(e.target.value)}
                      placeholder="Enter a name"
                    />
                  </div>
                  <p>Select physical places on the map or from the list below.</p>
                  <button
                    className={`btn ${selectionMode ? 'btn-warning' : 'btn-outline-primary'} mb-2 w-100`}
                    onClick={toggleSelectionMode}
                  >
                    {selectionMode ? 'Stop Selecting Places' : 'Start Selecting Places'}
                  </button>
                  {selectionMode && (
                    <div className="selected-places-list border p-2 rounded bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <h6>Selected Places ({selectedPlaces.length}):</h6>
                      {selectedPlaces.length === 0 ? (
                        <p className="text-muted small">No places selected yet. Click on places in the list below or on the map.</p>
                      ) : (
                        <ul className="list-unstyled small mb-0">
                          {selectedPlaces.map(p => <li key={p.id}>{p.id}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowLogicalPlaceEditor(false); setSelectionMode(false); setSelectedPlaces([]); }}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={createLogicalPlaceFromSelection}
                    disabled={selectedPlaces.length === 0 || !newManualLogicalPlaceName.trim()}
                  >
                    Create Logical Place
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal per creare/modificare views */}
        {showViewEditor && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg"> {/* Larger modal for views */}
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create View</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowViewEditor(false); setSelectedLogicalPlaces([]); /*setSelectedAttributes([]);*/ }}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="viewName" className="form-label">View Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="viewName"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      placeholder="Enter a name for the view"
                    />
                  </div>

                  {/* Select Logical Places */}
                  <div className="mb-3">
                    <label className="form-label">Select Logical Places for this View:</label>
                    <div className="logical-place-selection-list border p-2 rounded bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {logicalPlaces.length === 0 ? (
                        <p className="text-muted small">No logical places available. Create logical places first.</p>
                      ) : (
                        logicalPlaces.map(lp => (
                          <div key={lp.id} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value={lp.id}
                              id={`lp-select-${lp.id}`}
                              checked={selectedLogicalPlaces.includes(lp.id)}
                              onChange={() => toggleLogicalPlaceSelection(lp.id)}
                            />
                            <label className="form-check-label" htmlFor={`lp-select-${lp.id}`}>
                              {lp.name} ({lp.physicalPlaces?.length || 0} places)
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                   {/* Select Attributes to Aggregate (Optional - DEPRECATED) */}

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowViewEditor(false); setSelectedLogicalPlaces([]); /*setSelectedAttributes([]);*/ }}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={createViewFromSelection}
                    disabled={selectedLogicalPlaces.length === 0 || !newViewName.trim()}
                  >
                    Create View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div> // End logical-places-section
    );
  };



  // Renderizza la sezione delle views
  const renderViewsSection = () => {
    if (views.length === 0) return null;

    return (
      <div className="sidebar2-section views-section">
        <h3>Views</h3>
        <div className="sidebar2-items">
          {views.map(view => {
            // Trova tutte le place logiche contenute nella view
            const viewLogicalPlaces = logicalPlaces.filter(lp =>
              view.logicalPlaces.includes(lp.id)
            );

            // Calcola tutte le place fisiche contenute nelle place logiche della view
            const allPhysicalPlaceIds = viewLogicalPlaces.flatMap(lp =>
              lp.physicalPlaces.map(p => p.id)
            );

            // Rimuovi duplicati
            const uniquePhysicalPlaceIds = [...new Set(allPhysicalPlaceIds)];

            return (
              <div
                key={`${view.id}-${refreshKey}`}
                className="sidebar2-view mb-2 p-2 border rounded"
                onMouseEnter={() => highlightMultipleElements(uniquePhysicalPlaceIds)}
                onMouseLeave={unhighlightElement}
              >
                <div className="sidebar2-view-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{view.name}</h6>
                  <div className="sidebar2-view-actions">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title="Delete View"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteView(view.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {view.description && (
                  <div className="sidebar2-view-description small text-muted mt-1">
                    {view.description}
                  </div>
                )}

                <div className="sidebar2-view-logical-places mt-2">
                  <strong>Logical Places ({viewLogicalPlaces.length}):</strong>
                  <div className="sidebar2-view-logical-places-list small">
                    {viewLogicalPlaces.map(logicalPlace => (
                      <div
                        key={`${view.id}-${logicalPlace.id}-${refreshKey}`}
                        className="sidebar2-view-logical-place-item"
                      >
                        {logicalPlace.name} ({logicalPlace.physicalPlaces?.length || 0} places)
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aggregation display in views is removed as it's now per Logical Place */}
                {/* {view.aggregatedAttributes && view.aggregatedAttributes.length > 0 && (...) } */}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizza l'interfaccia per la creazione manuale di place logiche (MODIFIED - Now uses Modal)
  const renderManualSelectionInterface = () => {
      // This is now handled by the modal triggered from renderLogicalPlacesSection
      return null;
  };

  // Renderizza l'interfaccia per la creazione di views (MODIFIED - Now uses Modal)
  const renderViewCreationInterface = () => {
      // This is now handled by the modal triggered from renderLogicalPlacesSection
      return null;
  };

  // Mostra sempre la sezione Places anche se vuota, per debug o selection mode
  const debugPlaces = (
    <div className="sidebar2-section">
      <h3>Physical Places (Debug/Select)</h3>
      <div className="sidebar2-items">
        {places.length === 0 ? (
          <div className="sidebar2-item">
            <h6>No physical places loaded</h6>
            <div className="sidebar2-attribute small text-muted">
              Waiting for map data...
            </div>
          </div>
        ) : (
          places.map(place => {
            const isSelected = selectedPlaces.some(p => p.id === place.id);

            return (
              <div
                key={`${place.id}-${refreshKey}`}
                className={`sidebar2-item
                  ${hoveredElements.includes(place.id) ? 'hovered' : ''}
                  ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => highlightElement(place.id)}
                onMouseLeave={unhighlightElement}
                onClick={() => togglePlaceSelection(place)}
                style={selectionMode ? { cursor: 'pointer' } : {}}
              >
                <h6>
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="me-2"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {place.id}
                </h6>
                {Object.entries(place.attributes).map(([key, value]) => (
                  <div key={`${key}-${refreshKey}`} className="sidebar2-attribute small">
                    <span>{key}: </span>
                    {value}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Funzione per mostrare/nascondere la sidebar
  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  // Renderizza il pulsante per mostrare/nascondere la sidebar
  const renderToggleButton = () => (
    <button
      className={`sidebar2-toggle-button ${!isVisible ? 'sidebar2-hidden' : ''}`}
      onClick={toggleSidebar}
      title={isVisible ? 'Hide Sidebar' : 'Show Sidebar'}
    >
      {isVisible ? '▶' : '◀'}
    </button>
  );

  return (
    <>
      {renderToggleButton()}
      <div className={`sidebar2 ${!isVisible ? 'sidebar2-hidden' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-2">
            <h3 className="mb-0">Map Elements</h3>
            <button
              className="sidebar2-refresh-button btn btn-sm btn-outline-secondary"
              onClick={fetchElements}
              title="Refresh elements from map"
            >
              🔄
            </button>
        </div>

        {/* Main Content Sections */} 
        {renderViewsSection()}
        {renderLogicalPlacesSection()} 

         {/* Conditionally render physical places list only if in selection mode */}
        {selectionMode && debugPlaces}

        {/* Render other sections */}
        {renderElementSection("Roads", roads, true)}
        {renderElementSection("Departments", departments)}
        {renderAvailableRoomsSection("Available Emergency Rooms", availableRooms, "emergency")}
        {renderAvailableRoomsSection("Available Radiology Rooms", availableRooms, "radiology")}
        {renderElementSection("Places", places)}
        {renderElementSection("Edges", edges)}

      </div>
    </>
  );
};

export default Sidebar2;

