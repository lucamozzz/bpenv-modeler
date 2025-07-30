import { useEffect, useRef } from 'react';
import ToolbarComponent from './ToolbarComponent';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { Tile as TileLayer } from 'ol/layer.js';
import { OSM } from 'ol/source.js';
import { useGeographic } from 'ol/proj';
import { enablePolygonDrawing, enableEdgeDrawing, disableDrawing, initVectorLayer } from '../utils/drawUtils';
import SidebarComponent from './SidebarComponent';
import { useEnvStore } from '../envStore';

const MapComponent = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);

    const mapInstance = useEnvStore((state) => state.mapInstance);
    const setMapInstance = useEnvStore((state) => state.setMapInstance);
    const activeTool = useEnvStore((state) => state.activeTool);
    const setActiveTool = useEnvStore((state) => state.setActiveTool);
    const isEditable = useEnvStore((state) => state.isEditable);
    

    useEffect(() => {
        if (!mapRef.current) return;

        useGeographic();

        const raster = new TileLayer({
            source: new OSM(),
            zIndex: 0,
        });

        const map = new Map({
            layers: [raster],
            target: mapRef.current,
            view: new View({
                center: [13.068307772123394, 43.139407493133405],
                zoom: 14,
            }),
            controls: [],
        });

        initVectorLayer(map);
        setMapInstance(map);

        return () => map.setTarget(undefined);
    }, []);

    const handleHandTool = () => {
        if (mapInstance) {
            disableDrawing(mapInstance);
            setActiveTool('hand');
        }
    };

    const handlePlaceTool = () => {
        if (mapInstance) {
            disableDrawing(mapInstance);
            enablePolygonDrawing(mapInstance);
            setActiveTool('place');
        }
    };

    const handleEdgeTool = () => {
        if (mapInstance) {
            disableDrawing(mapInstance);
            enableEdgeDrawing(mapInstance);
            setActiveTool('edge');
        }
    };

    return (
        <div className="map-wrapper">
            <div id="map" ref={mapRef} className="map" />
            {isEditable && (
                <ToolbarComponent
                    activeTool={activeTool}
                    onHandTool={handleHandTool}
                    onPlaceTool={handlePlaceTool}
                    onEdgeTool={handleEdgeTool}
                />
            )}
            <SidebarComponent />
        </div>
    );
};

export default MapComponent;