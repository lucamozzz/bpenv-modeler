import { useState } from 'react';
import { useEnvStore } from '../envStore';
import LogicalPlaceEditor from './LogicalPlaceEditor';

const ViewModal = ({
  onClose,
  initialView,
}: {
  onClose: () => void;
  initialView?: { id: string; name: string; logicalPlaces: string[] };
}) => {
  const [viewName, setViewName] = useState(initialView?.name ?? '');
  const [selectedLogicalPlaceIds, setSelectedLogicalPlaceIds] = useState<string[]>(
    initialView?.logicalPlaces ?? []
  );

  const addView = useEnvStore((state) => state.addView);
  const logicalPlaces = useEnvStore((state) => state.logicalPlaces);
  const views = useEnvStore((state) => state.views);

  const handleCheckboxChange = (id: string) => {
    setSelectedLogicalPlaceIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSaveView = () => {
    const updatedView = {
      id: initialView?.id ?? 'view_' + Math.random().toString(36).substring(2, 8),
      name: viewName,
      logicalPlaces: selectedLogicalPlaceIds,
    };

    if (initialView) {
      const updatedViews = views.map((v) => (v.id === updatedView.id ? updatedView : v));
      useEnvStore.setState({ views: updatedViews });
    } else {
      addView(updatedView);
    }

    onClose();
  };

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title">
              {initialView ? 'Edit View' : 'Create New View'}
            </h5>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <input
                className="form-control"
                placeholder="View Name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Select Logical Places</label>
              {logicalPlaces.map((lp) => (
                <div key={lp.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedLogicalPlaceIds.includes(lp.id)}
                    onChange={() => handleCheckboxChange(lp.id)}
                    id={`lp-${lp.id}`}
                  />
                  <label className="form-check-label" htmlFor={`lp-${lp.id}`}>
                    {lp.name}
                  </label>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <label className="form-label">Create New Logical Place</label>
              <LogicalPlaceEditor />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveView}
              disabled={
                !viewName.trim() ||
                selectedLogicalPlaceIds.length === 0 ||
                views.some(
                  (v) => v.name === viewName && v.id !== initialView?.id
                )
              }
            >
              Save View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;