import React, { useState, useEffect } from 'react';
import "./Sidebar.css";



interface SidebarProps {
  onDrawPolygon: () => void;
  onDrawEdge: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onExportModel: () => void;
  canDrawEdge: boolean;
  hasSelectedElement: boolean;
  onRenameElement: (newId: string) => void;
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

const Sidebar: React.FC<SidebarProps> = ({ 
  onDrawPolygon, 
  onDrawEdge,
  onSelect,
  onDelete,
  onUndo,
  onExportModel,
  canDrawEdge,
  hasSelectedElement,
  onRenameElement
}) => {
  const [activeButton, setActiveButton] = useState<'polygon' | 'edge' | 'select' | null>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [newElementId, setNewElementId] = useState('');
  const [pendingRename, setPendingRename] = useState<{id: string, newId: string} | null>(null);

  // Funzione per aggiornare gli elementi dalla mappa
  const updateElements = (newElements: Element[]) => {
    setElements(newElements);
    
    // Se l'elemento selezionato è stato aggiornato, aggiorna anche quello
    if (selectedElement) {
      const updatedSelectedElement = newElements.find(el => el.id === selectedElement.id);
      if (updatedSelectedElement) {
        setSelectedElement(updatedSelectedElement);
        setNewElementId(updatedSelectedElement.id);
      } else {
        // Se l'elemento selezionato non esiste più, deselezionalo
        setSelectedElement(null);
        setNewElementId('');
      }
    }
  };

  // Esponi la funzione updateElements globalmente
  useEffect(() => {
    (window as any).updateSidebarElements = updateElements;
  }, []);

  // Effetto per applicare la rinomina in sospeso quando cambia la selezione
  useEffect(() => {
    if (pendingRename) {
      console.log('Applicazione rinomina in sospeso:', pendingRename);
      onRenameElement(pendingRename.newId);
      setPendingRename(null);
    }
  }, [pendingRename, onRenameElement]);

  const handleDrawPolygon = () => {
    // Applica eventuali rinomina in sospeso prima di cambiare modalità
    applyPendingRename();
    
    setActiveButton('polygon');
    onDrawPolygon();
  };

  
 
  const handleDrawEdge = () => {
    // Applica eventuali rinomina in sospeso prima di cambiare modalità
    applyPendingRename();
    
    
   

    setActiveButton('edge');
    onDrawEdge();
  };

  const handleSelect = () => {
    // Applica eventuali rinomina in sospeso prima di cambiare modalità
    applyPendingRename();
    
    setActiveButton('select');
    onSelect();
  };

  const handleDelete = () => {
    // Applica eventuali rinomina in sospeso prima di eliminare
    applyPendingRename();
    
    onDelete();
  };

  const handleUndo = () => {
    // Applica eventuali rinomina in sospeso prima di annullare
    applyPendingRename();
    
    onUndo();
  };

  // Funzione per applicare la rinomina in sospeso
  const applyPendingRename = () => {
    if (selectedElement && newElementId && newElementId !== selectedElement.id) {
      console.log('Applicazione rinomina prima del cambio:', selectedElement.id, '->', newElementId);
      onRenameElement(newElementId);
    }
  };

  const handleElementSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Applica eventuali rinomina in sospeso prima di cambiare selezione
    applyPendingRename();
    
    const elementId = event.target.value;
    if (!elementId) {
      setSelectedElement(null);
      setNewElementId('');
      return;
    }

    const element = elements.find(el => el.id === elementId) || null;
    setSelectedElement(element);
    if (element) {
      setNewElementId(element.id);
    }
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

  const handleRenameElement = () => {
    if (!selectedElement || !newElementId.trim() || newElementId === selectedElement.id) return;
    
    // Applica immediatamente la rinomina
    onRenameElement(newElementId);
  };

  return (
    <div className="sidebar">
      <h4>BPEnv Modeler</h4>
      
      <div className="control-panel">
        <h5>Strumenti di disegno</h5>
        <div className="grid-container">
          <button 
            className={`btn ${activeButton === 'polygon' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={handleDrawPolygon}
          >
            Disegna Poligono
          </button>
         
          <button 
            className={`btn ${activeButton === 'edge' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={handleDrawEdge}
            disabled={!canDrawEdge}
            title={!canDrawEdge ? "Servono almeno due poligoni per disegnare un arco" : ""}
          >
            Disegna Arco
          </button>

          <button 
            className={`btn ${activeButton === 'select' ? 'btn-primary' : 'btn-outline-primary'} btn-wide`}
            onClick={handleSelect}
          >
            Seleziona Elemento
          </button>

          <button 
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={!hasSelectedElement}
            title={!hasSelectedElement ? "Seleziona prima un elemento da cancellare" : ""}
          >
            Cancella Elemento
          </button>

          <button 
            className="btn btn-warning"
            onClick={handleUndo}
          >
            Torna Indietro
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
              <span className={`element-type-badge element-type-${selectedElement.type}`}>
                {selectedElement.type === 'place' ? 'Poligono' : 'Arco'}
              </span>
            </h5>
            
            <div className="element-id-editor">
              <label htmlFor="elementId" className="form-label">ID Elemento</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  id="elementId"
                  value={newElementId}
                  onChange={(e) => setNewElementId(e.target.value)}
                  placeholder="Inserisci un nuovo ID"
                />
                <button 
                  className="btn btn-outline-primary" 
                  type="button"
                  onClick={handleRenameElement}
                  disabled={!newElementId.trim() || newElementId === selectedElement.id}
                >
                  Rinomina
                </button>
              </div>
            </div>
            
            {Object.keys(selectedElement.attributes).length > 0 ? (
              <table className="attributes-table">
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
                  disabled={!newAttributeName.trim() || !newAttributeValue.trim()}
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
