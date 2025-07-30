import { useState } from 'react';
import PhysicalPlaceItem from './PhysicalPlaceItem';
import EdgeItem from './EdgeItem';
import { useEnvStore } from '../envStore';

const PhysicalLayerSection = () => {
    const [isPlacesOpen, setIsPlacesOpen] = useState(true);
    const [isEdgesOpen, setIsEdgesOpen] = useState(true);

    const places = useEnvStore((state) => state.places);
    const edges = useEnvStore((state) => state.edges);

    return (
        <div className="mb-3">
            <h5 className="text-white mb-3">Physical Layer</h5>

            <button
                className="btn btn-outline-light w-100 text-start mb-2"
                onClick={() => setIsPlacesOpen(!isPlacesOpen)}
            >
                {isPlacesOpen ? '▼' : '▶'} Places
            </button>
            {isPlacesOpen && (
                places.length === 0 ? (
                    <h6 className="text-secondary mb-3">Nothing to see here...</h6>
                ) : (
                    <ul className="list-group list-group-flush mb-3">
                        {places.map((p) => (
                            <PhysicalPlaceItem key={p.id} place={p} />
                        ))}
                    </ul>
                )
            )}

            <button
                className="btn btn-outline-light w-100 text-start mb-2"
                onClick={() => setIsEdgesOpen(!isEdgesOpen)}
            >
                {isEdgesOpen ? '▼' : '▶'} Edges
            </button>
            {isEdgesOpen && (
                edges.length === 0 ? (
                    <h6 className="text-secondary mb-3">Nothing to see here...</h6>
                ) : (
                    <ul className="list-group list-group-flush">
                        {edges.map((e) => (
                            <EdgeItem key={e.id} edge={e} />
                        ))}
                    </ul>
                ))}
        </div>
    );
};

export default PhysicalLayerSection;