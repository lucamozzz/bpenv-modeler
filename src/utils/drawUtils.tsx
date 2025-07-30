import { Feature } from 'ol';
import Map from 'ol/Map';
import { Polygon } from 'ol/geom';
import { LineString } from 'ol/geom';
import { Point } from 'ol/geom';
import Draw from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import Select from 'ol/interaction/Select';
// TODO: Add Modify interaction back if needed
// import Modify from 'ol/interaction/Modify';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { click } from 'ol/events/condition';
import { Style, Fill, Stroke, Text } from 'ol/style';

import { PhysicalPlace } from '../envTypes';
import { Edge } from '../envTypes';
import { useEnvStore } from '../envStore';

let drawInteraction: Draw | null = null;
let snapInteraction: Snap | null = null;
let selectInteraction: Select | null = null;
// let modifyInteraction: Modify | null = null;
let vectorLayer: VectorLayer<VectorSource> | null = null;

export function enablePolygonDrawing(map: Map) {
    if (selectInteraction) {
        map.removeInteraction(selectInteraction);
        selectInteraction = null;
    }

    const source = vectorLayer!.getSource()!;

    drawInteraction = new Draw({
        source,
        type: 'Polygon',
    });

    snapInteraction = new Snap({
        source,
    });

    // modifyInteraction = new Modify({
    //     source,
    //     deleteCondition: (event) => {
    //         return event.originalEvent.shiftKey;
    //     }
    // });

    map.addInteraction(drawInteraction);
    map.addInteraction(snapInteraction);
    // map.addInteraction(modifyInteraction);

    drawInteraction.on('drawend', (event) => {
        const uid = "Place_" + Math.random().toString(36).substring(2, 15);
        const feature = event.feature;
        feature.set('name', uid);

        const place: PhysicalPlace = {
            id: uid,
            name: uid,
            coordinates: event.target.sketchLineCoords_,
            attributes: []
        }

        useEnvStore.getState().addPlace(place);
    });
}

export function initVectorLayer(map: Map) {
    if (!vectorLayer) {
        const source = new VectorSource();
        vectorLayer = new VectorLayer({
            source,
            style: (feature) => {
                const name = feature.get('name') || '';
                const styled = placeStyle.clone();
                styled.getText()?.setText(name);
                return styled;
            }
        });
        map.addLayer(vectorLayer);
    }
}

export function addPlaceFromCoordinates(
    id: string,
    coordinates: [number, number][]
) {
    if (!vectorLayer) {
        console.warn('Vector layer not initialized. Call enablePolygonDrawing first.');
        return;
    }

    const source = vectorLayer.getSource();
    if (!source) return;

    const polygon = new Polygon([[...coordinates]]);
    const feature = new Feature({
        geometry: polygon,
        name: id,
    });

    source.addFeature(feature);

    // const place: PhysicalPlace = {
    //     id,
    //     name: id,
    //     coordinates,
    //     attributes: []
    // };

    // useEnvStore.getState().addPlace(place);
}

export function enableEdgeDrawing(map: Map) {
    const selectedPolygons: Feature[] = [];

    if (selectInteraction) {
        map.removeInteraction(selectInteraction);
        selectInteraction = null;
    }

    selectInteraction = new Select({
        condition: click,
        filter: (feature) => feature.getGeometry() instanceof Polygon
    });

    map.addInteraction(selectInteraction);

    selectInteraction.on('select', (e) => {
        const selected = e.selected[0];

        if (selected && !selectedPolygons.includes(selected)) {
            selectedPolygons.push(selected);
        }

        if (selectedPolygons.length === 2) {
            const [p1, p2] = selectedPolygons;
            const id1 = p1.getProperties().name;
            const id2 = p2.getProperties().name;

            if (!id1 || !id2) {
                console.warn('Missing IDs on features');
            } else {
                const uid = "Edge_" + Math.random().toString(36).substring(2, 15);
                const newEdge: Edge = {
                    id: uid,
                    name: uid,
                    source: id1,
                    target: id2,
                    attributes: []
                };

                useEnvStore.getState().addEdge(newEdge);
                drawArrowBetweenPolygons(p1, p2, uid);
            }

            // Pulisci selezioni
            selectedPolygons.length = 0;
            selectInteraction?.getFeatures().clear();
        }
    });
}

// export function enableEdgeDrawing(map: Map) {
//     const source = new VectorSource();

//     vectorLayer = new VectorLayer({
//         source,
//     });

//     map.addLayer(vectorLayer);

//     drawInteraction = new Draw({
//         source,
//         type: 'LineString',
//     });

//     map.addInteraction(drawInteraction);

//     drawInteraction.on('drawend', (event) => {
//         console.log('Edge drawn:', event.feature);
//     });
// }

export function disableDrawing(map: Map) {
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }

    if (selectInteraction) {
        map.removeInteraction(selectInteraction);
        selectInteraction = null;
    }
}

// let arrowLayer: VectorLayer<VectorSource> | null = null;
export function getFeatureById(id: string): Feature | undefined {
    if (!vectorLayer) return undefined;
    const source = vectorLayer.getSource();
    if (!source) return undefined;
    return source.getFeatures().find(f => f.get('name') === id);
}

export function drawArrowBetweenPolygons(p1: Feature, p2: Feature, uid: string) {
    const center1 = (p1.getGeometry() as Polygon)?.getInteriorPoint().getCoordinates();
    const center2 = (p2.getGeometry() as Polygon)?.getInteriorPoint().getCoordinates();

    if (!center1 || !center2) return;

    const line = new Feature({
        geometry: new LineString([center1, center2])
    });
    line.set('name', uid);

    // Arrowhead
    const arrow = new Feature({
        geometry: new Point(center2)
    });

    // const source = new VectorSource({
    //     features: [line, arrow]
    // });

    // if (!vectorLayer) {
    //     vectorLayer = new VectorLayer({
    //         source,
    //         style: edgeStyle
    //     });

    //     map.addLayer(vectorLayer);
    // } else {
    vectorLayer?.getSource()?.addFeatures([line, arrow]);
    // }
}

const placeStyle = new Style({
    stroke: new Stroke({
        color: 'red',
        width: 2,
    }),
    fill: new Fill({
        color: 'rgba(0, 0, 0, 0.1)',
    }),
    text: new Text({
        font: '8px sans-serif',
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
        textAlign: 'center',
        textBaseline: 'middle',
        overflow: true,
    }),
});

// TODO: refactor this functions
// function setPlaceStyle(id: string | null, style: Style) {
//     vectorLayer?.getSource()?.getFeatures().forEach((f: Feature) => {
//         if (f.getGeometry() instanceof Polygon) {
//             if (f.getProperties().name === id) {
//                 f.setStyle(style);
//             }
//         }
//     });
// }

export function highlightPlace(id: string | null) {
    const style = placeStyle.clone();
    vectorLayer?.getSource()?.getFeatures().forEach((f: Feature) => {
        if (f.getGeometry() instanceof Polygon) {
            if (f.getProperties().name === id) {
                style.setFill(new Fill({ color: 'rgba(255, 0, 0, 0.4)' }));
                f.setStyle(style);
            }
        }
    });
}

export function unhighlightPlace(id: string | null) {
    const style = placeStyle.clone();
    vectorLayer?.getSource()?.getFeatures().forEach((f: Feature) => {
        if (f.getGeometry() instanceof Polygon) {
            if (f.getProperties().name === id) {
                style.setFill(new Fill({ color: 'rgba(0, 0, 0, 0.1)' }));
                f.setStyle(placeStyle);
            }
        }
    });
}

const edgeStyle = new Style({
    stroke: new Stroke({
        color: 'rgb(255, 255, 0)',
        width: 2
    })
});

// TODO: Fix this function to properly highlight edges
export function highlightEdge(id: string | null) {
    const style = edgeStyle.clone();
    vectorLayer?.getSource()?.getFeatures().forEach((f: Feature) => {
        if (f.getGeometry() instanceof LineString) {
            if (f.getProperties().name === id) {
                style.setStroke(new Stroke({
                    color: 'rgba(255, 0, 0, 0.4)',
                    width: 2
                }));
                f.setStyle(style);
            } else {
                f.setStyle(edgeStyle);
            }
        }
    });
}

export function clearAllFeatures() {
    if (vectorLayer) {
        const source = vectorLayer.getSource();
        if (source) {
            source.clear(); // removes all features (polygons + lines + arrows)
        }
    }
}