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

interface Condition {
  attribute: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string;
}

interface Expression {
  id: string;
  name: string;
  conditions: Condition[];
  operator: 'AND' | 'OR';
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
  const [isVisible, setIsVisible] = useState(true);
  
  // Stati per le espressioni condizionali
  const [expressions, setExpressions] = useState<Expression[]>([]);
  const [currentExpression, setCurrentExpression] = useState<Expression | null>(null);
  const [showExpressionEditor, setShowExpressionEditor] = useState(false);
  const [newExpressionName, setNewExpressionName] = useState('');
  const [expressionOperator, setExpressionOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [filteredElements, setFilteredElements] = useState<Element[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);

  
  // Funzione per aggiornare gli elementi dalla mappa
  const updateElements = (newElements: Element[]) => {
    setElements(newElements);
    
    // Aggiorna anche gli elementi filtrati se un filtro è attivo
    if (isFilterActive && currentExpression) {
      const filtered = newElements.filter(element => 
        evaluateExpression(element, currentExpression)
      );
      setFilteredElements(filtered);
    } else {
      setFilteredElements(newElements);
    }
    
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

  // Funzione per valutare una condizione su un elemento
  const evaluateCondition = (element: Element, condition: Condition): boolean => {
    // Ignora gli archi se stiamo filtrando per attributi di place
    if (element.type !== 'place') return false;
    
    const attributeValue = element.attributes[condition.attribute];
    if (attributeValue === undefined) return false;
    
    // Converti i valori in numeri se possibile per confronti numerici
    const elementValue = !isNaN(Number(attributeValue)) ? Number(attributeValue) : attributeValue;
    const conditionValue = !isNaN(Number(condition.value)) ? Number(condition.value) : condition.value;
    
    switch (condition.operator) {
      case '==': return elementValue === conditionValue;
      case '!=': return elementValue !== conditionValue;
      case '>': return elementValue > conditionValue;
      case '<': return elementValue < conditionValue;
      case '>=': return elementValue >= conditionValue;
      case '<=': return elementValue <= conditionValue;
      default: return false;
    }
  };

  // Funzione per valutare un'espressione su un elemento
  const evaluateExpression = (element: Element, expression: Expression): boolean => {
    if (expression.conditions.length === 0) return true;
    
    if (expression.operator === 'AND') {
      return expression.conditions.every(condition => 
        evaluateCondition(element, condition)
      );
    } else { // OR
      return expression.conditions.some(condition => 
        evaluateCondition(element, condition)
      );
    }
  };

  // Funzione per applicare un'espressione come filtro
  const applyExpressionFilter = (expression: Expression | null) => {
    if (!expression) {
      setIsFilterActive(false);
      setFilteredElements(elements);
      setCurrentExpression(null);
      return;
    }
    
    setCurrentExpression(expression);
    setIsFilterActive(true);
    
    const filtered = elements.filter(element => 
      evaluateExpression(element, expression)
    );
    setFilteredElements(filtered);
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

  // Funzione per salvare l'espressione corrente
  const saveExpression = () => {
    if (!newExpressionName || conditions.length === 0) return;
    
    const newExpression: Expression = {
      id: Date.now().toString(), // ID unico basato sul timestamp
      name: newExpressionName,
      conditions: [...conditions],
      operator: expressionOperator
    };
    
    setExpressions([...expressions, newExpression]);
    resetExpressionEditor();
  };
  
  // Funzione per creare una place logica da un'espressione
  const createLogicalPlaceFromExpression = (expression: Expression) => {
    // Filtra le place che soddisfano l'espressione
    const matchingPlaces = elements
      .filter(element => element.type === 'place')
      .filter(element => evaluateExpression(element, expression));
    
    // Crea una nuova place logica
    const logicalPlace = {
      id: `logical-${expression.id}`,
      name: expression.name,
      description: `Place logica creata dall'espressione: ${expression.name}`,
      conditions: [...expression.conditions],
      operator: expression.operator,
      physicalPlaces: matchingPlaces
    };
    
    // Invia la place logica alla sidebar destra
    if (typeof (window as any).addLogicalPlace === 'function') {
      (window as any).addLogicalPlace(logicalPlace);
      console.log('Place logica creata:', logicalPlace);
    } else {
      console.error('Funzione addLogicalPlace non disponibile');
    }
  };

  // Funzione per resettare l'editor di espressioni
  const resetExpressionEditor = () => {
    setNewExpressionName('');
    setExpressionOperator('AND');
    setConditions([]);
    setShowExpressionEditor(false);
  };

  // Funzione per eliminare un'espressione
  const deleteExpression = (id: string) => {
    const newExpressions = expressions.filter(expr => expr.id !== id);
    setExpressions(newExpressions);
    
    // Se l'espressione eliminata era quella attiva, disattiva il filtro
    if (currentExpression && currentExpression.id === id) {
      applyExpressionFilter(null);
    }
  };

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

  // Funzione per mostrare/nascondere la sidebar
  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  // Estrai tutti gli attributi unici dalle place per il dropdown
  const getUniqueAttributes = (): string[] => {
    const attributes = new Set<string>();
    elements.forEach(element => {
      if (element.type === 'place') {
        Object.keys(element.attributes).forEach(attr => attributes.add(attr));
      }
    });
    return Array.from(attributes).sort();
  };

  // Renderizza il pulsante per mostrare/nascondere la sidebar
  const renderToggleButton = () => (
    <button 
      className={`sidebar-toggle-button ${!isVisible ? 'sidebar-hidden' : ''}`}
      onClick={toggleSidebar}
    >
      {isVisible ? '◀' : '▶'}
    </button>
  );

  // Renderizza l'editor di espressioni
  const renderExpressionEditor = () => (
    <div className="expression-editor">
      <h5>Create Expression</h5>
      
      <div className="mb-3">
        <label htmlFor="expressionName" className="form-label">Expression Name</label>
        <input 
          type="text" 
          className="form-control" 
          id="expressionName"
          value={newExpressionName}
          onChange={(e) => setNewExpressionName(e.target.value)}
          placeholder="Enter a name for this expression"
        />
      </div>
      
      <div className="mb-3">
        <label className="form-label">Combine Conditions with</label>
        <div className="btn-group w-100">
          <button 
            className={`btn ${expressionOperator === 'AND' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setExpressionOperator('AND')}
          >
            AND
          </button>
          <button 
            className={`btn ${expressionOperator === 'OR' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setExpressionOperator('OR')}
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
          onClick={resetExpressionEditor}
        >
          Cancel
        </button>
        <button 
          className="btn btn-primary"
          onClick={saveExpression}
          disabled={!newExpressionName || conditions.length === 0}
        >
          Save Expression
        </button>
      </div>
    </div>
  );

  // Renderizza la lista delle espressioni salvate
  const renderExpressionsList = () => (
    <div className="expressions-list">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Expressions</h5>
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowExpressionEditor(true)}
        >
          + New Expression
        </button>
      </div>
      
      {expressions.length === 0 ? (
        <p className="text-muted">No expressions defined yet.</p>
      ) : (
        <div className="list-group">
          {expressions.map(expr => (
            <div 
              key={expr.id} 
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${currentExpression?.id === expr.id ? 'active' : ''}`}
            >
              <div className="expression-info" onClick={() => applyExpressionFilter(expr)}>
                <div className="expression-name">{expr.name}</div>
                <div className="expression-details">
                  {expr.conditions.map((cond, i) => (
                    <span key={i}>
                      {i > 0 && <span className="operator"> {expr.operator} </span>}
                      <span className="condition">{cond.attribute} {cond.operator} {cond.value}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="expression-actions">
                <button 
                  className="btn btn-sm btn-success me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    createLogicalPlaceFromExpression(expr);
                  }}
                  title="Create logical place from this expression"
                >
                  Create Place
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteExpression(expr.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isFilterActive && (
        <div className="mt-2">
          <button 
            className="btn btn-sm btn-warning"
            onClick={() => applyExpressionFilter(null)}
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderToggleButton()}
      <div className={`sidebar ${!isVisible ? 'sidebar-hidden' : ''}`}>
        <h4>BPEnv Modeler</h4>
        
        <div className="control-panel">
          <h5>Drawing tools</h5>
          <div className="grid-container">
            <button 
              className={`btn ${activeButton === 'polygon' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={handleDrawPolygon}
            >
              Draw Place
            </button>
           
            <button 
              className={`btn ${activeButton === 'edge' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={handleDrawEdge}
              disabled={!canDrawEdge}
              title={!canDrawEdge ? "At least two polygons are needed to draw an edge" : ""}
            >
              Draw Edge
            </button>

            <button 
              className={`btn ${activeButton === 'select' ? 'btn-primary' : 'btn-outline-primary'} btn-wide`}
              onClick={handleSelect}
            >
              Select Item
            </button>

            <button 
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={!hasSelectedElement}
              title={!hasSelectedElement ? "Select an element to delete first" : ""}
            >
              Delete Item
            </button>

            <button 
              className="btn btn-warning"
              onClick={handleUndo}
            >
              Go back
            </button>
          </div>
        </div>
        
        <div className="expression-panel">
          {showExpressionEditor ? renderExpressionEditor() : renderExpressionsList()}
        </div>
        
        <div className="attribute-panel">
          <h5>Attributes</h5>
          <div className="mb-3">
            <label htmlFor="elementSelector" className="form-label">Select Item</label>
            <select 
              id="elementSelector" 
              className="form-select" 
              value={selectedElement?.id || ''}
              onChange={handleElementSelect}
            >
              <option value="">Select an element</option>
              
              {(isFilterActive ? filteredElements : elements).length > 0 && (
                <>
                  <optgroup label="Places">
                    {(isFilterActive ? filteredElements : elements)
                      .filter(el => el.type === 'place')
                      .map(place => (
                        <option key={place.id} value={place.id}>
                          {place.id}
                        </option>
                      ))}
                  </optgroup>
                  
                  {(isFilterActive ? filteredElements : elements).filter(el => el.type === 'edge').length > 0 && (
                    <optgroup label="Edges">
                      {(isFilterActive ? filteredElements : elements)
                        .filter(el => el.type === 'edge')
                        .map(edge => (
                          <option key={edge.id} value={edge.id}>
                            Edge: {edge.source} → {edge.target}
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
                  ? 'Attributes of the Place' 
                  : 'Attributes of the Edge'}
                <span className={`element-type-badge element-type-${selectedElement.type}`}>
                  {selectedElement.type === 'place' ? 'Place' : 'Edge'}
                </span>
              </h5>
              
              <div className="element-id-editor">
                <label htmlFor="elementId" className="form-label">ID Element</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    id="elementId"
                    value={newElementId}
                    onChange={(e) => setNewElementId(e.target.value)}
                    placeholder="Enter a new ID"
                  />
                  <button 
                    className="btn btn-outline-primary" 
                    type="button"
                    onClick={handleRenameElement}
                    disabled={!newElementId.trim() || newElementId === selectedElement.id}
                  >
                    Rename
                  </button>
                </div>
              </div>
              
              {Object.keys(selectedElement.attributes).length > 0 ? (
                <table className="attributes-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Value</th>
                      <th>Actions</th>
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
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No attribute present</p>
              )}
              
              <div className="row g-2 mb-3">
                <div className="col">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Name"
                    value={newAttributeName}
                    onChange={(e) => setNewAttributeName(e.target.value)}
                  />
                </div>
                <div className="col">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    placeholder="Value"
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
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p>Select an item to view attributes</p>
          )}
        </div>
        
        <div className="mt-4">
          <button 
            className="btn btn-success w-100"
            onClick={onExportModel}
          >
            Export Model (JSON)
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
