import { create } from 'zustand';
import { Spread, SpreadElement, DrawingStroke, ToolMode } from './types';
import { initialSpreads } from './mockData';

const genId = () => Math.random().toString(36).substr(2, 9);

interface FolioStore {
  spreads: Spread[];
  activeSpreadId: string;
  selectedElementId: string | null;
  activeTool: ToolMode;
  drawColor: string;
  drawThickness: number;
  sidebarOpen: boolean;
  zoom: number;

  setActiveSpread: (id: string) => void;
  addSpread: () => void;
  duplicateSpread: (id: string) => void;
  deleteSpread: (id: string) => void;
  updateSpreadMeta: (id: string, updates: Partial<Pick<Spread, 'title' | 'date' | 'tags'>>) => void;

  addElement: (element: Omit<SpreadElement, 'id' | 'zIndex'>) => void;
  updateElement: (elementId: string, updates: Partial<SpreadElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  moveToFront: (elementId: string) => void;
  moveToBack: (elementId: string) => void;

  selectElement: (id: string | null) => void;
  setTool: (tool: ToolMode) => void;
  setDrawColor: (color: string) => void;
  setDrawThickness: (thickness: number) => void;
  toggleSidebar: () => void;
  setZoom: (zoom: number) => void;

  addDrawingStroke: (stroke: DrawingStroke) => void;
  clearDrawing: () => void;
}

export const useFolioStore = create<FolioStore>((set, get) => ({
  spreads: initialSpreads,
  activeSpreadId: initialSpreads[0].id,
  selectedElementId: null,
  activeTool: 'select',
  drawColor: '#1a1a1a',
  drawThickness: 3,
  sidebarOpen: false,
  zoom: 1,

  setActiveSpread: (id) => set({ activeSpreadId: id, selectedElementId: null }),

  addSpread: () => {
    const s: Spread = {
      id: genId(), title: 'Untitled', date: new Date().toISOString().split('T')[0],
      tags: [], elements: [], drawingStrokes: [],
    };
    set((st) => ({ spreads: [...st.spreads, s], activeSpreadId: s.id }));
  },

  duplicateSpread: (id) => {
    const sp = get().spreads.find((s) => s.id === id);
    if (!sp) return;
    const ns = { ...JSON.parse(JSON.stringify(sp)), id: genId(), title: sp.title + ' (copy)' };
    set((st) => ({ spreads: [...st.spreads, ns] }));
  },

  deleteSpread: (id) => {
    const spreads = get().spreads.filter((s) => s.id !== id);
    if (spreads.length === 0) return;
    set((st) => ({
      spreads,
      activeSpreadId: st.activeSpreadId === id ? spreads[0].id : st.activeSpreadId,
    }));
  },

  updateSpreadMeta: (id, updates) =>
    set((st) => ({
      spreads: st.spreads.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp)),
    })),

  addElement: (element) => {
    const id = genId();
    const spread = get().spreads.find((s) => s.id === get().activeSpreadId);
    const maxZ = spread ? Math.max(0, ...spread.elements.map((e) => e.zIndex)) : 0;
    const ne: SpreadElement = { ...element, id, zIndex: maxZ + 1 };
    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId ? { ...sp, elements: [...sp.elements, ne] } : sp
      ),
      selectedElementId: id,
      activeTool: 'select',
    }));
  },

  updateElement: (elementId, updates) =>
    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId
          ? { ...sp, elements: sp.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)) }
          : sp
      ),
    })),

  deleteElement: (elementId) =>
    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId
          ? { ...sp, elements: sp.elements.filter((el) => el.id !== elementId) }
          : sp
      ),
      selectedElementId: null,
    })),

  duplicateElement: (elementId) => {
    const spread = get().spreads.find((s) => s.id === get().activeSpreadId);
    const el = spread?.elements.find((e) => e.id === elementId);
    if (!el || !spread) return;
    const maxZ = Math.max(0, ...spread.elements.map((e) => e.zIndex));
    const ne = { ...el, id: genId(), x: el.x + 20, y: el.y + 20, zIndex: maxZ + 1 };
    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId ? { ...sp, elements: [...sp.elements, ne] } : sp
      ),
      selectedElementId: ne.id,
    }));
  },

  moveToFront: (elementId) => {
    const spread = get().spreads.find((s) => s.id === get().activeSpreadId);
    if (!spread) return;
    const maxZ = Math.max(0, ...spread.elements.map((e) => e.zIndex));
    get().updateElement(elementId, { zIndex: maxZ + 1 });
  },

  moveToBack: (elementId) => {
    const spread = get().spreads.find((s) => s.id === get().activeSpreadId);
    if (!spread) return;
    const minZ = Math.min(0, ...spread.elements.map((e) => e.zIndex));
    get().updateElement(elementId, { zIndex: minZ - 1 });
  },

  selectElement: (id) => set({ selectedElementId: id }),
  setTool: (tool) => set({ activeTool: tool, selectedElementId: tool === 'draw' ? null : get().selectedElementId }),
  setDrawColor: (color) => set({ drawColor: color }),
  setDrawThickness: (thickness) => set({ drawThickness: thickness }),
  toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
  setZoom: (zoom) => set({ zoom: Math.max(0.3, Math.min(2, zoom)) }),

  addDrawingStroke: (stroke) =>
    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId
          ? { ...sp, drawingStrokes: [...sp.drawingStrokes, stroke] }
          : sp
      ),
    })),

  clearDrawing: () =>
    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId ? { ...sp, drawingStrokes: [] } : sp
      ),
    })),
}));
