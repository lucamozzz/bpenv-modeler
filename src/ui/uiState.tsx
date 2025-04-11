// ui/uiState.ts
import React from 'react';
import Sidebar from './Sidebar';
import { undoLastAction } from '../utils/historyManager';
import { exportModel } from '../utils/exporter';
import { renameElement } from '../utils/attributeManager';

// Stato dell’interfaccia (esportabile e modificabile)
export let uiState = {
  canDrawEdge: false,
  hasSelectedElement: false,
};

// Aggiorna lo stato dell'interfaccia
export function updateUIState(): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  const selectionManager = (window as any).selectionManager;

  if (!polygonManager || !edgeManager || !selectionManager) return;

  uiState = {
    canDrawEdge: polygonManager.getPolygonCount() >= 2,
    hasSelectedElement: selectionManager.hasSelectedElement(),
  };

  updateSidebar();
}

// Renderizza la sidebar
export function updateSidebar(): void {
  const sidebarRoot = (window as any).sidebarRoot;
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;
  const selectionManager = (window as any).selectionManager;

  if (!sidebarRoot || !polygonManager || !edgeManager || !selectionManager) return;

  sidebarRoot.render(
    <React.StrictMode>
      <Sidebar
        onDrawPolygon={() => polygonManager.activateDrawPolygon()}
        onDrawEdge={() => edgeManager.activateDrawEdge()}
        onSelect={() => selectionManager.activateSelection()}
        onDelete={() => selectionManager.deleteSelectedElement()}
        onUndo={undoLastAction}
        onExportModel={exportModel}
        canDrawEdge={uiState.canDrawEdge}
        hasSelectedElement={uiState.hasSelectedElement}
        onRenameElement={renameElement}
      />
    </React.StrictMode>
  );
}

// Aggiorna gli elementi visualizzati nella sidebar
export function updateSidebarElements(): void {
  const polygonManager = (window as any).polygonManager;
  const edgeManager = (window as any).edgeManager;

  if (!polygonManager || !edgeManager) return;

  const placeFeatures = polygonManager.getPlaceSource().getFeatures();
  const edgeFeatures = edgeManager.getEdgeSource().getFeatures();

  const elements = [
    ...placeFeatures.map((feature: any) => ({
      id: feature.get('id'),
      type: 'place',
      attributes: feature.get('attributes') || {},
    })),
    ...edgeFeatures.map((feature: any) => ({
      id: feature.get('id'),
      type: 'edge',
      source: feature.get('source'),
      target: feature.get('target'),
      attributes: feature.get('attributes') || {},
    })),
  ];

  if (typeof (window as any).updateSidebarElements === 'function') {
    (window as any).updateSidebarElements(elements);
  }

  updateUIState();
}
