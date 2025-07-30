import { useState } from 'react';
import { Edge } from '../envTypes';
import { useEnvStore } from '../envStore';
import { BsTrash } from 'react-icons/bs';
import AttributesForm from './AttributesForm';
import { highlightEdge } from '../utils/drawUtils';

const EdgeItem = ({ edge }: { edge: Edge }) => {
  const [newName, setNewName] = useState(edge.name || '');
  const updateEdge = useEnvStore((state) => state.updateEdge);
  const removeEdge = useEnvStore((state) => state.removeEdge);

  const handleNameBlur = () => {
    if (newName.trim() !== '' && newName !== edge.name) {
      updateEdge?.(edge.id, { name: newName });
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete this edge?`)) {
      removeEdge(edge.id);
    }
  };

  return (
    <li className="list-group-item bg-dark text-white"
      onMouseEnter={() => highlightEdge(edge.id)}
      onMouseLeave={() => highlightEdge('')}>
      <div className="d-flex justify-content-between align-items-center">
        <input
          className="form-control form-control-md border-0 bg-transparent text-white p-0 custom-placeholder"
          value={newName}
          placeholder="Edge Name"
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleNameBlur}
        />
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-light"
            onClick={() => {
              const updatedAttributes = { ...edge.attributes };
              updatedAttributes["key"] = "value";
              updateEdge?.(edge.id, { attributes: updatedAttributes });
            }}
            title="Add attribute"
            disabled={
              edge.attributes.length > 0 &&
              Object.keys(edge.attributes).some(key => key === '')
            }
          >
            +
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={handleDelete}
            title="Delete"
          >
            <BsTrash />
          </button>
        </div>
      </div>

      <AttributesForm elementId={edge.id} initialAttributes={edge.attributes} />
    </li>
  );
};

export default EdgeItem;