import { useState } from 'react';
import LogicalElementItem from './LogicalElementItem';
import ViewModal from './ViewModal';
import { View, LogicalPlace } from '../envTypes';
import { useEnvStore } from '../envStore';

const LogicalLayerSection = () => {
    const [openViews, setOpenViews] = useState<Record<string, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingView, setEditingView] = useState<View | null>(null);
    const isEditable = useEnvStore((state) => state.isEditable);
    const removeView = useEnvStore((state) => state.removeView);

    const logicalPlaces: LogicalPlace[] = useEnvStore((state) => state.logicalPlaces);
    const views: View[] = useEnvStore((state) => state.views);

    const toggleView = (viewId: string) => {
        setOpenViews((prev) => ({
            ...prev,
            [viewId]: !prev[viewId]
        }));
    };

    return (
        <div className="mb-3">
            <h5 className="text-white mb-3">Logical Layer</h5>
            {views.length === 0 ? (
                <h6 className="text-secondary mb-3">Nothing to see here...</h6>
            ) : (
                views.map((view) => {
                    const isOpen = openViews[view.id];
                    const placesInView = logicalPlaces.filter(lp => view.logicalPlaces.includes(lp.id));
                    return (
                        <div key={view.id} className="mb-2">
                            <div
                                className="btn btn-outline-light w-100 text-start d-flex justify-content-between align-items-center"
                                onClick={() => toggleView(view.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>
                                    {isOpen ? '▼' : '▶'} {view.name}
                                </span>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className="btn btn-sm btn-outline-light p-1 me-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingView(view);
                                        }}
                                        title="Edit view"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        className="btn btn-outline-danger p-1"
                                        onClick={() => removeView(view.id)}
                                        title="Delete View"
                                    >
                                        x
                                    </button>
                                </div>
                            </div>

                            {isOpen && (
                                <ul className="list-group list-group-flush">
                                    {placesInView.map(lp => (
                                        <LogicalElementItem key={lp.id} item={lp} />
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })
            )}

            {editingView && (
                <ViewModal
                    onClose={() => setEditingView(null)}
                    initialView={editingView}
                />
            )}

            {isEditable && (
                <button
                    className="btn btn-outline-light w-100 mt-3"
                    onClick={() => setIsModalOpen(true)}
                >
                    + Add View
                </button>
            )}

            {isModalOpen && <ViewModal onClose={() => {
                setIsModalOpen(false)
            }} />}
        </div>
    );
};

export default LogicalLayerSection;