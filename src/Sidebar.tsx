import React, { useState, useEffect } from 'react';
import "./Sidebar.css";



interface SidebarProps {
  onDrawPolygon: () => void;
  onDrawEdge: () => void;
  onExportModel: () => void;
}

interface Attribute {
  name: string;
  value: string;
}

interface Element {
  id: string;
  type: 'place' | 'edge';
  source?: string;
  target?: string;
  attributes: Record<string, string>;
}

const Sidebar: React.FC<SidebarProps> = ({ onDrawPolygon, onDrawEdge, onExportModel }) => {
  const [activeButton, setActiveButton] = useState<'polygon' | 'edge' | null>('polygon');
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  // Funzione per aggiornare gli elementi dalla mappa
  const updateElements = (newElements: Element[]) => {
    setElements(newElements);
    
    // Se l'elemento selezionato è stato aggiornato, aggiorna anche quello
    if (selectedElement) {
      const updatedSelectedElement = newElements.find(el => el.id === selectedElement.id);
      if (updatedSelectedElement) {
        setSelectedElement(updatedSelectedElement);
      }
    }
  };

  // Esponi la funzione updateElements globalmente
  useEffect(() => {
    (window as any).updateSidebarElements = updateElements;
  }, []);

  const handleDrawPolygon = () => {
    setActiveButton('polygon');
    onDrawPolygon();
  };

  const handleDrawEdge = () => {
    setActiveButton('edge');
    onDrawEdge();
  };

  const handleElementSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const elementId = event.target.value;
    if (!elementId) {
      setSelectedElement(null);
      return;
    }

    const element = elements.find(el => el.id === elementId) || null;
    setSelectedElement(element);
  };

  const handleAddAttribute = () => {
    if (!selectedElement || !newAttributeName || !newAttributeValue) return;

    // Chiama la funzione globale per aggiungere l'attributo
    if (typeof (window as any).addAttribute === 'function') {
      (window as any).addAttribute(selectedElement.id, newAttributeName, newAttributeValue);
    }
    
    setNewAttributeName('');
    setNewAttributeValue('');
  };

  const handleRemoveAttribute = (attributeName: string) => {
    if (!selectedElement) return;

    // Chiama la funzione globale per rimuovere l'attributo
    if (typeof (window as any).removeAttribute === 'function') {
      (window as any).removeAttribute(selectedElement.id, attributeName);
    }
  };

  return (
    <div className="sidebar">
      <h4>BPEnv Modeler</h4>
      
      <div className="control-panel">
        <h5>Strumenti di disegno</h5>
        <div className="btn-group w-100 mb-3">
          <button 
            className={`btn ${activeButton === 'polygon' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={handleDrawPolygon}
          >
            Disegna Poligono
          </button>
          <button 
            className={`btn ${activeButton === 'edge' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={handleDrawEdge}
          >
            Disegna Arco
          </button>
        </div>
      </div>
      
      <div className="attribute-panel">
        <h5>Attributi</h5>
        <div className="mb-3">
          <label htmlFor="elementSelector" className="form-label">Seleziona elemento</label>
          <select 
            id="elementSelector" 
            className="form-select" 
            value={selectedElement?.id || ''}
            onChange={handleElementSelect}
          >
            <option value="">Seleziona un elemento</option>
            
            {elements.length > 0 && (
              <>
                <optgroup label="Poligoni (Places)">
                  {elements.filter(el => el.type === 'place').map(place => (
                    <option key={place.id} value={place.id}>
                      {place.id}
                    </option>
                  ))}
                </optgroup>
                
                {elements.filter(el => el.type === 'edge').length > 0 && (
                  <optgroup label="Archi (Edges)">
                    {elements.filter(el => el.type === 'edge').map(edge => (
                      <option key={edge.id} value={edge.id}>
                        Arco: {edge.source} → {edge.target}
                      </option>
                    ))}
                  </optgroup>
                )}
              </>
            )}
          </select>
        </div>
        
        {selectedElement ? (
          <div className="attributes-container">
            <h5>
              {selectedElement.type === 'place' 
                ? 'Attributi del Poligono' 
                : 'Attributi dell\'Arco'}
            </h5>
            
            {Object.keys(selectedElement.attributes).length > 0 ? (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Valore</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedElement.attributes).map(([name, value]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{value}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveAttribute(name)}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Nessun attributo presente</p>
            )}
            
            <div className="row g-2 mb-3">
              <div className="col">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Nome attributo"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                />
              </div>
              <div className="col">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Valore attributo"
                  value={newAttributeValue}
                  onChange={(e) => setNewAttributeValue(e.target.value)}
                />
              </div>
              <div className="col-auto">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={handleAddAttribute}
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p>Seleziona un elemento per visualizzare gli attributi</p>
        )}
      </div>
      
      <div className="mt-4">
        <button 
          className="btn btn-success w-100"
          onClick={onExportModel}
        >
          Esporta Modello (JSON)
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
