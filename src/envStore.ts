import { create } from 'zustand';
import { PhysicalPlace, LogicalPlace, Edge, View } from './envTypes';
import Map from 'ol/Map.js';

type EnvStore = {
    mapInstance: Map;
    setMapInstance: (map: Map) => void;

    isEditable: boolean;
    setEditable: (editable: boolean) => void;

    activeTool: 'hand' | 'place' | 'edge';
    setActiveTool: (tool: 'hand' | 'place' | 'edge') => void;

    places: PhysicalPlace[];
    logicalPlaces: LogicalPlace[];
    edges: Edge[];
    views: View[];

    addPlace: (place: PhysicalPlace) => void;
    updatePlace: (id: string, updatedPlace: Partial<PhysicalPlace>) => void;
    removePlace: (id: string) => void;

    addEdge: (edge: Edge) => void;
    updateEdge: (id: string, updatedEdge: Partial<Edge>) => void;
    removeEdge: (id: string) => void;

    addLogicalPlace: (logicalPlace: LogicalPlace) => void;
    updateLogicalPlace: (id: string, updatedLogicalPlace: Partial<LogicalPlace>) => void;
    removeLogicalPlace: (id: string) => void;

    addView: (view: View) => void;
    updateView: (id: string, updatedView: Partial<View>) => void;
    removeView: (id: string) => void;

    clearModel: () => void;
};

export const useEnvStore = create<EnvStore>((set) => ({
    mapInstance: new Map(),
    setMapInstance: (map) => set({ mapInstance: map }),

    isEditable: true,
    setEditable: (editable) => set({ isEditable: editable }),

    activeTool: 'hand',
    setActiveTool: (tool) => set({ activeTool: tool }),

    places: [],
    logicalPlaces: [],
    edges: [],
    views: [],

    addPlace: (place) =>
        set((state) => ({
            places: [...state.places, place]
        })),

    updatePlace: (id, updatedPlace) =>
        set((state) => ({
            places: state.places.map((p) =>
                p.id === id ? { ...p, ...updatedPlace } : p
            )
        })),

    removePlace: (id) =>
        set((state) => ({
            places: state.places.filter((p) => p.id !== id)
        })),

    addEdge: (edge) =>
        set((state) => ({
            edges: [...state.edges, edge]
        })),

    updateEdge: (id, updatedEdge) =>
        set((state) => ({
            edges: state.edges.map((e) =>
                e.id === id ? { ...e, ...updatedEdge } : e
            )
        })),

    removeEdge: (id) =>
        set((state) => ({
            edges: state.edges.filter((e) => e.id !== id)
        })),

    addLogicalPlace: (logicalPlace) =>
        set((state) => ({
            logicalPlaces: [...state.logicalPlaces, logicalPlace]
        })),

    updateLogicalPlace: (id, updatedLogicalPlace) =>
        set((state) => ({
            logicalPlaces: state.logicalPlaces.map((lp) =>
                lp.id === id ? { ...lp, ...updatedLogicalPlace } : lp
            )
        })),

    removeLogicalPlace: (id) =>
        set((state) => ({
            logicalPlaces: state.logicalPlaces.filter((lp) => lp.id !== id)
        })),

    addView: (view) =>
        set((state) => ({
            views: [...state.views, view]
        })),

    updateView: (id, updatedView) =>
        set((state) => ({
            views: state.views.map((v) =>
                v.id === id ? { ...v, ...updatedView } : v
            )
        })),

    removeView: (id) =>
        set((state) => ({
            views: state.views.filter((v) => v.id !== id)
        })),

    clearModel: () =>
        set(() => ({
            places: [],
            logicalPlaces: [],
            edges: [],
            views: []
        })),
}));