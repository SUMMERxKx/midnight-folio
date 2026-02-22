import { create } from 'zustand';
import { Spread, SpreadElement, DrawingStroke, ToolMode } from './types';
import * as api from './api';
import { toast } from 'sonner';

// Debounce timers living outside reactive state
const spreadMetaTimers = new Map<string, ReturnType<typeof setTimeout>>();
let strokeSaveTimer: ReturnType<typeof setTimeout> | null = null;

interface FolioStore {
  spreads: Spread[];
  activeSpreadId: string | null;
  selectedElementId: string | null;
  activeTool: ToolMode;
  drawColor: string;
  drawThickness: number;
  sidebarOpen: boolean;
  zoom: number;
  loading: boolean;
  userId: string | null;

  initialize: (userId: string) => Promise<void>;

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
  spreads: [],
  activeSpreadId: null,
  selectedElementId: null,
  activeTool: 'select',
  drawColor: '#1a1a1a',
  drawThickness: 3,
  sidebarOpen: false,
  zoom: 1,
  loading: true,
  userId: null,

  // ── Initialization ──────────────────────────────────────────────

  initialize: async (userId) => {
    set({ loading: true, userId });
    try {
      const dbSpreads = await api.getSpreads(userId);
      const spreads: Spread[] = [];

      for (const row of dbSpreads) {
        const { elements, drawingStrokes } = await api.getSpreadData(row.id);
        spreads.push({
          id: row.id,
          title: row.title,
          date: row.date ?? '',
          tags: row.tags ?? [],
          elements,
          drawingStrokes,
        });
      }

      set({
        spreads,
        activeSpreadId: spreads.length > 0 ? spreads[0].id : null,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to load scrapbook data:', err);
      toast.error('Failed to load your scrapbook');
      set({ loading: false });
    }
  },

  // ── Spread actions ──────────────────────────────────────────────

  setActiveSpread: (id) => set({ activeSpreadId: id, selectedElementId: null }),

  addSpread: () => {
    const userId = get().userId;
    if (!userId) return;

    const id = crypto.randomUUID();
    const s: Spread = {
      id,
      title: 'Untitled',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      elements: [],
      drawingStrokes: [],
    };

    set((st) => ({ spreads: [...st.spreads, s], activeSpreadId: s.id }));

    api
      .createSpread(userId, {
        id,
        title: s.title,
        date: s.date,
        tags: s.tags,
        page_order: get().spreads.length - 1,
      })
      .catch((err) => {
        console.error('Failed to create spread:', err);
        toast.error('Failed to save new spread');
      });
  },

  duplicateSpread: (id) => {
    const userId = get().userId;
    if (!userId) return;

    const sp = get().spreads.find((s) => s.id === id);
    if (!sp) return;

    const newId = crypto.randomUUID();
    const newElements = sp.elements.map((el) => ({ ...el, id: crypto.randomUUID() }));
    const ns: Spread = {
      ...JSON.parse(JSON.stringify(sp)),
      id: newId,
      title: sp.title + ' (copy)',
      elements: newElements,
      drawingStrokes: [...sp.drawingStrokes],
    };

    set((st) => ({ spreads: [...st.spreads, ns] }));

    (async () => {
      try {
        await api.createSpread(userId, {
          id: newId,
          title: ns.title,
          date: ns.date,
          tags: ns.tags,
          page_order: get().spreads.length - 1,
        });
        for (const el of newElements) {
          await api.createElement(el, newId);
        }
        if (ns.drawingStrokes.length > 0) {
          await api.saveDoodleStrokes(newId, ns.drawingStrokes);
        }
      } catch (err) {
        console.error('Failed to duplicate spread:', err);
        toast.error('Failed to duplicate spread');
      }
    })();
  },

  deleteSpread: (id) => {
    const spreads = get().spreads.filter((s) => s.id !== id);
    if (spreads.length === 0) return;

    set((st) => ({
      spreads,
      activeSpreadId: st.activeSpreadId === id ? spreads[0].id : st.activeSpreadId,
    }));

    api.deleteSpread(id).catch((err) => {
      console.error('Failed to delete spread:', err);
      toast.error('Failed to delete spread');
    });
  },

  updateSpreadMeta: (id, updates) => {
    set((st) => ({
      spreads: st.spreads.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp)),
    }));

    // Debounce DB write for typing fields
    const existing = spreadMetaTimers.get(id);
    if (existing) clearTimeout(existing);

    spreadMetaTimers.set(
      id,
      setTimeout(() => {
        spreadMetaTimers.delete(id);
        api.updateSpread(id, updates).catch((err) => {
          console.error('Failed to update spread:', err);
        });
      }, 800),
    );
  },

  // ── Element actions ─────────────────────────────────────────────

  addElement: (element) => {
    const activeSpreadId = get().activeSpreadId;
    if (!activeSpreadId) return;

    const id = crypto.randomUUID();
    const spread = get().spreads.find((s) => s.id === activeSpreadId);
    const maxZ = spread ? Math.max(0, ...spread.elements.map((e) => e.zIndex)) : 0;
    const ne: SpreadElement = { ...element, id, zIndex: maxZ + 1 };

    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId ? { ...sp, elements: [...sp.elements, ne] } : sp,
      ),
      selectedElementId: id,
      activeTool: 'select',
    }));

    api.createElement(ne, activeSpreadId).catch((err) => {
      console.error('Failed to create element:', err);
      toast.error('Failed to save element');
    });
  },

  updateElement: (elementId, updates) => {
    const activeSpreadId = get().activeSpreadId;
    if (!activeSpreadId) return;

    const spread = get().spreads.find((s) => s.id === activeSpreadId);
    const currentEl = spread?.elements.find((e) => e.id === elementId);
    if (!currentEl) return;

    const merged = { ...currentEl, ...updates };

    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId
          ? { ...sp, elements: sp.elements.map((el) => (el.id === elementId ? merged : el)) }
          : sp,
      ),
    }));

    api.updateElement(elementId, merged, activeSpreadId).catch((err) => {
      console.error('Failed to update element:', err);
    });
  },

  deleteElement: (elementId) => {
    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId
          ? { ...sp, elements: sp.elements.filter((el) => el.id !== elementId) }
          : sp,
      ),
      selectedElementId: null,
    }));

    api.deleteElement(elementId).catch((err) => {
      console.error('Failed to delete element:', err);
      toast.error('Failed to delete element');
    });
  },

  duplicateElement: (elementId) => {
    const activeSpreadId = get().activeSpreadId;
    if (!activeSpreadId) return;

    const spread = get().spreads.find((s) => s.id === activeSpreadId);
    const el = spread?.elements.find((e) => e.id === elementId);
    if (!el || !spread) return;

    const maxZ = Math.max(0, ...spread.elements.map((e) => e.zIndex));
    const ne: SpreadElement = {
      ...el,
      id: crypto.randomUUID(),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: maxZ + 1,
    };

    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId ? { ...sp, elements: [...sp.elements, ne] } : sp,
      ),
      selectedElementId: ne.id,
    }));

    api.createElement(ne, activeSpreadId).catch((err) => {
      console.error('Failed to duplicate element:', err);
      toast.error('Failed to duplicate element');
    });
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

  // ── UI state ────────────────────────────────────────────────────

  selectElement: (id) => set({ selectedElementId: id }),

  setTool: (tool) =>
    set({ activeTool: tool, selectedElementId: tool === 'draw' ? null : get().selectedElementId }),

  setDrawColor: (color) => set({ drawColor: color }),
  setDrawThickness: (thickness) => set({ drawThickness: thickness }),
  toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
  setZoom: (zoom) => set({ zoom: Math.max(0.3, Math.min(2, zoom)) }),

  // ── Drawing ─────────────────────────────────────────────────────

  addDrawingStroke: (stroke) => {
    const activeSpreadId = get().activeSpreadId;

    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId
          ? { ...sp, drawingStrokes: [...sp.drawingStrokes, stroke] }
          : sp,
      ),
    }));

    if (!activeSpreadId) return;

    if (strokeSaveTimer) clearTimeout(strokeSaveTimer);
    strokeSaveTimer = setTimeout(() => {
      strokeSaveTimer = null;
      const spread = get().spreads.find((s) => s.id === activeSpreadId);
      if (spread) {
        api.saveDoodleStrokes(activeSpreadId, spread.drawingStrokes).catch((err) => {
          console.error('Failed to save drawing:', err);
        });
      }
    }, 1000);
  },

  clearDrawing: () => {
    const activeSpreadId = get().activeSpreadId;

    set((st) => ({
      spreads: st.spreads.map((sp) =>
        sp.id === st.activeSpreadId ? { ...sp, drawingStrokes: [] } : sp,
      ),
    }));

    if (activeSpreadId) {
      api.clearDoodleStrokes(activeSpreadId).catch((err) => {
        console.error('Failed to clear drawing:', err);
      });
    }
  },
}));
