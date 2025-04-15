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

  // Funzione per aggiornare gli elementi dalla mappa
  const updateElements = (newElements: Element[]) => {
    console.log("Sidebar2: Aggiornamento elementi", newElements);
    
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
    
    // Forza un refresh del componente
    setRefreshKey(prev => prev + 1);
  };

  // Funzione per ottenere gli elementi direttamente
  const fetchElements = () => {
    try {
      const polygonManager = (window as any).polygonManager;
      const edgeManager = (window as any).edgeManager;
      
      if (!polygonManager || !edgeManager) {
        console.log("Sidebar2: Manager non disponibili");
        return;
      }
      
      const placeFeatures = polygonManager.getPlaceSource().getFeatures();
      const edgeFeatures = edgeManager.getEdgeSource().getFeatures();
      
      console.log("Sidebar2: Features ottenute", { 
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
      console.error("Sidebar2: Errore nel recupero degli elementi", error);
    }
  };

  // Esponi la funzione updateElements globalmente e imposta un timer per l'aggiornamento
  useEffect(() => {
    console.log("Sidebar2: Inizializzazione");
    (window as any).updateSidebar2Elements = updateElements;
    
    // Inizializza con gli elementi esistenti se disponibili
    if ((window as any).elements) {
      console.log("Sidebar2: Elementi esistenti trovati", (window as any).elements);
      updateElements((window as any).elements);
    }
    
    // Recupera gli elementi direttamente
    fetchElements();
    
    // Imposta un timer per aggiornare periodicamente gli elementi
    const timer = setInterval(() => {
      console.log("Sidebar2: Aggiornamento periodico");
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

  // Funzione per rimuovere l'evidenziazione
  const unhighlightElement = () => {
    setHoveredElement(null);
    
    if (typeof (window as any).unhighlightElement === 'function') {
      (window as any).unhighlightElement();
    }
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
                  <span>da: </span>
                  {element.source}
                  <span> a: </span>
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

  console.log("Sidebar2: Rendering", { 
    roads: roads.length, 
    departments: departments.length, 
    availableRooms: availableRooms.length, 
    places: places.length, 
    edges: edges.length 
  });

  // Mostra sempre la sezione Places anche se vuota, per debug
  const debugPlaces = (
    <div className="sidebar2-section">
      <h3>Places (Debug)</h3>
      <div className="sidebar2-items">
        {places.length === 0 ? (
          <div className="sidebar2-item">
            <h6>Nessun poligono presente</h6>
            <div className="sidebar2-attribute">
              <span>Stato: </span>
              In attesa di creazione poligoni
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

  return (
    <div className="sidebar2">
      <h3>Elementi della Mappa</h3>
      <button 
        className="sidebar2-refresh-button"
        onClick={fetchElements}
      >
        Aggiorna Elementi
      </button>
      {renderElementSection("Roads", roads, true)}
      {renderElementSection("Departments", departments)}
      {renderAvailableRoomsSection("Available Emergency Rooms", availableRooms, "emergency")}
      {renderAvailableRoomsSection("Available Radiology Rooms", availableRooms, "radiology")}
      {debugPlaces}
      {renderElementSection("Edges", edges)}
    </div>
  );
};

export default Sidebar2;
