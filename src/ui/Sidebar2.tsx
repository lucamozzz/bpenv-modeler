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

type Element = Place | Edge;

// Componente per la sidebar a destra
const Sidebar2: React.FC<Sidebar2Props> = () => {
  const [roads, setRoads] = useState<Place[]>([]);
  const [departments, setDepartments] = useState<Place[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Place[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0); // Stato per forzare il refresh
  const [isVisible, setIsVisible] = useState(true);
  
  // Stati per le place logiche
  const [logicalPlaces, setLogicalPlaces] = useState<LogicalPlace[]>([]);
  const [showLogicalPlaceEditor, setShowLogicalPlaceEditor] = useState(false);
  const [newLogicalPlaceName, setNewLogicalPlaceName] = useState('');
  const [newLogicalPlaceDescription, setNewLogicalPlaceDescription] = useState('');
  const [logicalPlaceOperator, setLogicalPlaceOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<Condition[]>([]);

  // Funzione per aggiornare gli elementi dalla mappa
  const updateElements = (newElements: Element[]) => {
    console.log("Sidebar2: Update elements", newElements); 
    
    // Filtra gli elementi per tipo
    const newPlaces = newElements.filter(el => el.type === 'place') as Place[];
    const newEdges = newElements.filter(el => el.type === 'edge') as Edge[];
    
    // Categorizza i poligoni in base agli attributi
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
    if (logicalPlace.conditions.length === 0) return false;
    
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

  // Funzione per aggiornare le place logiche con le nuove place fisiche
  const updateLogicalPlaces = (newPlaces: Place[]) => {
    const updatedLogicalPlaces = logicalPlaces.map(logicalPlace => {
      // Trova tutte le place fisiche che soddisfano le condizioni
      const matchingPlaces = newPlaces.filter(place => 
        evaluateLogicalPlace(place, logicalPlace)
      );
      
      return {
        ...logicalPlace,
        physicalPlaces: matchingPlaces
      };
    });
    
    setLogicalPlaces(updatedLogicalPlaces);
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
    }, 1000);
    
    return () => {
      // Rimuovi la funzione globale e il timer quando il componente viene smontato
      delete (window as any).updateSidebar2Elements;
      clearInterval(timer);
    };
  }, []);

  // Funzione per evidenziare un elemento sulla mappa
  const highlightElement = (elementId: string) => {
    setHoveredElement(elementId);
    
    if (typeof (window as any).highlightElement === 'function') {
      (window as any).highlightElement(elementId);
    }
  };

  // Funzione per evidenziare più elementi sulla mappa (per place logiche)
  const highlightMultipleElements = (elementIds: string[]) => {
    setHoveredElement(elementIds[0]); // Imposta solo il primo come hoveredElement per semplicità
    
    elementIds.forEach(id => {
      if (typeof (window as any).highlightElement === 'function') {
        (window as any).highlightElement(id);
      }
    });
  };

  // Funzione per rimuovere l'evidenziazione
  const unhighlightElement = () => {
    setHoveredElement(null);
    
    if (typeof (window as any).unhighlightElement === 'function') {
      (window as any).unhighlightElement();
    }
  };

  // Funzione per aggiungere una nuova condizione vuota
  const addCondition = () => {
    setConditions([...conditions, { attribute: '', operator: '==', value: '' }]);
  };

  // Funzione per rimuovere una condizione
  const removeCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
  };

  // Funzione per aggiornare una condizione
  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { 
      ...newConditions[index], 
      [field]: field === 'operator' 
        ? value as '==' | '!=' | '>' | '<' | '>=' | '<=' 
        : value 
    };
    setConditions(newConditions);
  };

  // Funzione per salvare la place logica corrente
  const saveLogicalPlace = () => {
    if (!newLogicalPlaceName || conditions.length === 0) return;
    
    // Trova tutte le place fisiche che soddisfano le condizioni
    const matchingPlaces = places.filter(place => {
      if (logicalPlaceOperator === 'AND') {
        return conditions.every(condition => evaluateCondition(place, condition));
      } else { // OR
        return conditions.some(condition => evaluateCondition(place, condition));
      }
    });
    
    const newLogicalPlace: LogicalPlace = {
      id: Date.now().toString(), // ID unico basato sul timestamp
      name: newLogicalPlaceName,
      description: newLogicalPlaceDescription,
      conditions: [...conditions],
      operator: logicalPlaceOperator,
      physicalPlaces: matchingPlaces
    };
    
    setLogicalPlaces([...logicalPlaces, newLogicalPlace]);
    resetLogicalPlaceEditor();
  };

  // Funzione per resettare l'editor di place logiche
  const resetLogicalPlaceEditor = () => {
    setNewLogicalPlaceName('');
    setNewLogicalPlaceDescription('');
    setLogicalPlaceOperator('AND');
    setConditions([]);
    setShowLogicalPlaceEditor(false);
  };

  // Funzione per eliminare una place logica
  const deleteLogicalPlace = (id: string) => {
    const newLogicalPlaces = logicalPlaces.filter(place => place.id !== id);
    setLogicalPlaces(newLogicalPlaces);
  };

  // Estrai tutti gli attributi unici dalle place per il dropdown
  const getUniqueAttributes = (): string[] => {
    const attributes = new Set<string>();
    places.forEach(place => {
      Object.keys(place.attributes).forEach(attr => attributes.add(attr));
    });
    return Array.from(attributes).sort();
  };

  // Funzione per renderizzare una sezione di elementi
  const renderElementSection = (title: string, elements: Element[], showZone: boolean = false) => {
    if (elements.length === 0) return null;
    
    return (
      <div className="sidebar2-section">
        <h3>{title}</h3>
        <div className="sidebar2-items">
          {elements.map(element => (
            <div 
              key={`${element.id}-${refreshKey}`}
              className={`sidebar2-item ${hoveredElement === element.id ? 'hovered' : ''}`}
              onMouseEnter={() => highlightElement(element.id)}
              onMouseLeave={unhighlightElement}
            >
              <h6>{element.id}</h6>
              {showZone && element.type === 'place' && element.attributes.zone && (
                <div className="sidebar2-attribute">
                  <span>zone: </span>
                  {element.attributes.zone}
                </div>
              )}
              {element.type === 'edge' && (
                <div className="sidebar2-attribute">
                  <span>from: </span>
                  {element.source}
                  <span> to: </span>
                  {element.target}
                </div>
              )}
              {Object.entries(element.attributes)
                .filter(([key]) => key !== 'zone' || !showZone) // Evita di mostrare zone due volte
                .map(([key, value]) => (
                  <div key={`${key}-${refreshKey}`} className="sidebar2-attribute">
                    <span>{key}: </span>
                    {value}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Funzione per renderizzare una sezione di stanze disponibili
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
          {filteredRooms.map(room => (
            <div 
              key={`${room.id}-${refreshKey}`}
              className={`sidebar2-item ${hoveredElement === room.id ? 'hovered' : ''}`}
              onMouseEnter={() => highlightElement(room.id)}
              onMouseLeave={unhighlightElement}
            >
              <h6>{room.id}</h6>
              {room.attributes.zone && (
                <div className="sidebar2-attribute">
                  <span>zone: </span>
                  {room.attributes.zone}
                </div>
              )}
              {Object.entries(room.attributes)
                .filter(([key]) => key !== 'zone') // Evita di mostrare zone due volte
                .map(([key, value]) => (
                  <div key={`${key}-${refreshKey}`} className="sidebar2-attribute">
                    <span>{key}: </span>
                    {value}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizza la sezione delle place logiche
  const renderLogicalPlacesSection = () => {
    return (
      <div className="sidebar2-section logical-places-section">
        <div className="d-flex justify-content-between align-items-center">
          <h3>Logical Places</h3>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowLogicalPlaceEditor(true)}
          >
            + New Logical Place
          </button>
        </div>
        
        {logicalPlaces.length === 0 ? (
          <p className="text-muted">No logical places defined yet.</p>
        ) : (
          <div className="sidebar2-items">
            {logicalPlaces.map(logicalPlace => (
              <div 
                key={`${logicalPlace.id}-${refreshKey}`}
                className="sidebar2-logical-place"
              >
                <div 
                  className="sidebar2-logical-place-header"
                  onMouseEnter={() => highlightMultipleElements(logicalPlace.physicalPlaces.map(p => p.id))}
                  onMouseLeave={unhighlightElement}
                >
                  <h6>{logicalPlace.name}</h6>
                  <div className="sidebar2-logical-place-actions">
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteLogicalPlace(logicalPlace.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {logicalPlace.description && (
                  <div className="sidebar2-logical-place-description">
                    {logicalPlace.description}
                  </div>
                )}
                
                <div className="sidebar2-logical-place-conditions">
                  <strong>Conditions ({logicalPlace.operator}):</strong>
                  <ul>
                    {logicalPlace.conditions.map((condition, index) => (
                      <li key={index}>
                        {condition.attribute} {condition.operator} {condition.value}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="sidebar2-logical-place-physical">
                  <strong>Physical Places ({logicalPlace.physicalPlaces.length}):</strong>
                  <div className="sidebar2-logical-place-physical-list">
                    {logicalPlace.physicalPlaces.map(place => (
                      <div 
                        key={`${place.id}-${refreshKey}`}
                        className="sidebar2-logical-place-physical-item"
                        onMouseEnter={() => highlightElement(place.id)}
                        onMouseLeave={unhighlightElement}
                      >
                        {place.id}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizza l'editor di place logiche
  const renderLogicalPlaceEditor = () => (
    <div className="sidebar2-logical-place-editor">
      <h3>Create Logical Place</h3>
      
      <div className="mb-3">
        <label htmlFor="logicalPlaceName" className="form-label">Name</label>
        <input 
          type="text" 
          className="form-control" 
          id="logicalPlaceName"
          value={newLogicalPlaceName}
          onChange={(e) => setNewLogicalPlaceName(e.target.value)}
          placeholder="Enter a name for this logical place"
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="logicalPlaceDescription" className="form-label">Description (optional)</label>
        <textarea 
          className="form-control" 
          id="logicalPlaceDescription"
          value={newLogicalPlaceDescription}
          onChange={(e) => setNewLogicalPlaceDescription(e.target.value)}
          placeholder="Enter a description"
          rows={2}
        />
      </div>
      
      <div className="mb-3">
        <label className="form-label">Combine Conditions with</label>
        <div className="btn-group w-100">
          <button 
            className={`btn ${logicalPlaceOperator === 'AND' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setLogicalPlaceOperator('AND')}
          >
            AND
          </button>
          <button 
            className={`btn ${logicalPlaceOperator === 'OR' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setLogicalPlaceOperator('OR')}
          >
            OR
          </button>
        </div>
      </div>
      
      <div className="conditions-container">
        <label className="form-label">Conditions</label>
        
        {conditions.length === 0 ? (
          <p className="text-muted">No conditions added yet. Add a condition below.</p>
        ) : (
          conditions.map((condition, index) => (
            <div key={index} className="condition-row mb-2">
              <div className="row g-2">
                <div className="col">
                  <select 
                    className="form-select form-select-sm"
                    value={condition.attribute}
                    onChange={(e) => updateCondition(index, 'attribute', e.target.value)}
                  >
                    <option value="">Select attribute</option>
                    {getUniqueAttributes().map(attr => (
                      <option key={attr} value={attr}>{attr}</option>
                    ))}
                  </select>
                </div>
                <div className="col-3">
                  <select 
                    className="form-select form-select-sm"
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  >
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                  </select>
                </div>
                <div className="col">
                  <input 
                    type="text" 
                    className="form-control form-control-sm"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="Value"
                  />
                </div>
                <div className="col-auto">
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => removeCondition(index)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        
        <div className="mt-2">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={addCondition}
          >
            + Add Condition
          </button>
        </div>
      </div>
      
      <div className="mt-3 d-flex justify-content-end">
        <button 
          className="btn btn-secondary me-2"
          onClick={resetLogicalPlaceEditor}
        >
          Cancel
        </button>
        <button 
          className="btn btn-primary"
          onClick={saveLogicalPlace}
          disabled={!newLogicalPlaceName || conditions.length === 0}
        >
          Save Logical Place
        </button>
      </div>
    </div>
  );

  // Mostra sempre la sezione Places anche se vuota, per debug
  const debugPlaces = (
    <div className="sidebar2-section">
      <h3>Physical Places (Debug)</h3>
      <div className="sidebar2-items">
        {places.length === 0 ? (
          <div className="sidebar2-item">
            <h6>No place present</h6>
            <div className="sidebar2-attribute">
              <span>State: </span>
              Waiting for creation of place
            </div>
          </div>
        ) : (
          places.map(place => (
            <div 
              key={`${place.id}-${refreshKey}`}
              className={`sidebar2-item ${hoveredElement === place.id ? 'hovered' : ''}`}
              onMouseEnter={() => highlightElement(place.id)}
              onMouseLeave={unhighlightElement}
            >
              <h6>{place.id}</h6>
              {Object.entries(place.attributes).map(([key, value]) => (
                <div key={`${key}-${refreshKey}`} className="sidebar2-attribute">
                  <span>{key}: </span>
                  {value}
                </div>
              ))}
            </div>
          ))
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
    >
      {isVisible ? '▶' : '◀'}
    </button>
  );

  return (
    <>
      {renderToggleButton()}
      <div className={`sidebar2 ${!isVisible ? 'sidebar2-hidden' : ''}`}>
        <h3>Elements of the map</h3>
        <button 
          className="sidebar2-refresh-button"
          onClick={fetchElements}
        >
          Update Elements
        </button>
        
        {showLogicalPlaceEditor ? (
          renderLogicalPlaceEditor()
        ) : (
          <>
            {renderLogicalPlacesSection()}
            {renderElementSection("Roads", roads, true)}
            {renderElementSection("Departments", departments)}
            {renderAvailableRoomsSection("Available Emergency Rooms", availableRooms, "emergency")}
            {renderAvailableRoomsSection("Available Radiology Rooms", availableRooms, "radiology")}
            {debugPlaces}
            {renderElementSection("Edges", edges)}
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar2;
