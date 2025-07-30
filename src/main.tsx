import ReactDOM from 'react-dom/client';
import HeaderComponent from './components/HeaderComponent';
import MapComponent from './components/MapComponent';
import { PhysicalPlace, LogicalPlace, Edge, View } from './envTypes';
import { useEnvStore } from './envStore';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'ol/ol.css';
import './style.css';

let apis: any = null;
render('bpenv-container');

function render(containerId: string, headless: boolean = false) {
  const container = document.getElementById(containerId);
  if (!container)
    throw new Error(`Container element with id "${containerId}" not found.`);

  const root = ReactDOM.createRoot(container);

  root.render(
    <div style={{ height: '100%' }}>
      {!headless && <HeaderComponent />}
      <MapComponent />
    </div>
  );

  function getPlaces(): PhysicalPlace[] {
    return useEnvStore.getState().places;
  }

  function getEdges(): Edge[] {
    return useEnvStore.getState().edges;
  }

  function getLogicalPlaces(): LogicalPlace[] {
    return useEnvStore.getState().logicalPlaces;
  }

  function getViews(): View[] {
    return useEnvStore.getState().views;
  }

  function getModel(): any {
    return {
      places: getPlaces(),
      edges: getEdges(),
      logicalPlaces: getLogicalPlaces(),
      views: getViews(),
    };
  }

  function setModel(model: { places: PhysicalPlace[], edges: Edge[], logicalPlaces: LogicalPlace[], views: View[] }) {
    model.places.forEach((place: PhysicalPlace) => useEnvStore.getState().addPlace(place));
    model.edges.forEach((edge: Edge) => useEnvStore.getState().addEdge(edge));
    useEnvStore.getState().logicalPlaces = model.logicalPlaces;
    useEnvStore.getState().views = model.views;
  }

  function isEditable(): boolean {
    return useEnvStore.getState().isEditable;
  }

  function setEditable(isEditable: boolean) {
    useEnvStore.getState().setEditable(isEditable);
  }

  apis = {
    getPlaces,
    getEdges,
    getLogicalPlaces,
    getViews,
    getModel,
    setModel,
    isEditable,
    setEditable
  };

  return apis;
}

function getPlaces() {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  return apis.getPlaces();
}

function getEdges() {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  return apis.getEdges();
}

function getLogicalPlaces() {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  return apis.getLogicalPlaces();
}

function getViews() {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  return apis.getViews();
}

function getModel() {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  return apis.getModel();
}

function setModel(model: { places: PhysicalPlace[], edges: Edge[], logicalPlaces: LogicalPlace[], views: View[] }) {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  apis.setModel(model);
}

function isEditable() {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  return apis.isEditable();
}

function setEditable(isEditable: boolean) {
  if (!apis) throw new Error('Modeler not initialized. Call render() first.');
  apis.setEditable(isEditable);
}

const bpenvModeler = {
  render,
  getPlaces,
  getEdges,
  getLogicalPlaces,
  getViews,
  getModel,
  setModel,
  isEditable,
  setEditable
};

export default bpenvModeler;