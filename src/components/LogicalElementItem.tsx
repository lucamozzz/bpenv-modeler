import { useState } from 'react';
import { LogicalPlace, PhysicalPlace } from '../envTypes';
import { useEnvStore } from '../envStore';
import LogicalPlaceEditor from './LogicalPlaceEditor';
import { highlightPlace, unhighlightPlace } from '../utils/drawUtils';

const LogicalElementItem = ({ item }: { item: LogicalPlace }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const physicalPlaces = useEnvStore((state) => state.places);
  const removeLogicalPlace = useEnvStore((state) => state.removeLogicalPlace);

  const getMatchingPhysicalPlaceIds = (
    logicalPlace: LogicalPlace,
    physicalPlaces: PhysicalPlace[]
  ): string[] => {
    return physicalPlaces
      .filter((place) =>
        logicalPlace.conditions.every((cond) => {
          const attrValue = place.attributes[cond.attribute];

          switch (cond.operator) {
            case '==':
              return attrValue == cond.value;
            case '!=':
              return attrValue != cond.value;
            case '<':
              return parseFloat(attrValue) < parseFloat(cond.value);
            case '>':
              return parseFloat(attrValue) > parseFloat(cond.value);
            default:
              return false;
          }
        })
      )
      .map((p) => p.id);
  };

  return (
    <>
      <li
        className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center"
        onMouseEnter={() => {
          const matchingIds = getMatchingPhysicalPlaceIds(item, physicalPlaces);
          matchingIds.forEach((id) => highlightPlace(id));
        }}
        onMouseLeave={() => {
          const matchingIds = getMatchingPhysicalPlaceIds(item, physicalPlaces);
          matchingIds.forEach((id) => unhighlightPlace(id));
        }}
      >
        <span>{item.name}</span>

        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-secondary p-1 me-1"
            onClick={() => setIsModalOpen(true)}
            title="Edit Logical Place"
          >
            ✎
          </button>
          <button
            className="btn btn-outline-danger p-1"
            onClick={() => removeLogicalPlace(item.id)}
            title="Delete Logical Place"
          >
            x
          </button>
        </div>
      </li>

      {isModalOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">Edit Logical Place</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <LogicalPlaceEditor
                  initialPlace={item}
                  onSave={() => setIsModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogicalElementItem;