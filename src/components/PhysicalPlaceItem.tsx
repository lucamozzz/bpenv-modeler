import { useState } from 'react';
import { PhysicalPlace } from '../envTypes';
import { useEnvStore } from '../envStore';
import { BsTrash } from 'react-icons/bs';
import AttributesForm from './AttributesForm';
import { highlightPlace, unhighlightPlace } from '../utils/drawUtils';

const PhysicalPlaceItem = ({ place }: { place: PhysicalPlace }) => {
  const [newName, setNewName] = useState(place.name);
  const updatePlace = useEnvStore((state) => state.updatePlace);
  const removePlace = useEnvStore((state) => state.removePlace);
  const isEditable = useEnvStore((state) => state.isEditable);

  const handleNameBlur = () => {
    if (newName.trim() !== '' && newName !== place.name) {
      updatePlace?.(place.id, { name: newName });
    }
  };

  // TODO: Remove place from map
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${place.name}"?`)) {
      removePlace(place.id);
    }
  };

  return (
    <li className="list-group-item bg-dark text-white"
      onMouseEnter={() => highlightPlace(place.id)}
      onMouseLeave={() => unhighlightPlace(place.id)}
    >
      <div className="d-flex justify-content-between align-items-center">
        <input
          className="form-control form-control-md border-0 bg-transparent text-white p-0 custom-placeholder"
          value={newName}
          placeholder="Place Name"
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleNameBlur}
          disabled={!isEditable}
        />
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-light p-1 me-1"
            onClick={() => {
              const updatedAttributes = { ...place.attributes };
              updatedAttributes["key"] = "value";
              updatePlace?.(place.id, { attributes: updatedAttributes });
            }}
            title="Add attribute"
            disabled={
              place.attributes.length > 0 &&
              Object.keys(place.attributes).some(key => key === '') ||
              !isEditable
            }
          >
            +
          </button>
          <button
            className="btn btn-outline-danger p-1"
            onClick={handleDelete}
            title="Delete"
            disabled={!isEditable}
          >
            <BsTrash />
          </button>
        </div>
      </div>

      <AttributesForm elementId={place.id} initialAttributes={place.attributes} />
    </li>
  );
};

export default PhysicalPlaceItem;