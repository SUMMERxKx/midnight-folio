import { supabase } from './supabase';
import { useFolioStore } from './store';
import type { DbElementRow } from './types';
import type { SpreadElement, DrawingStroke } from './types';

function dbRowToElement(row: DbElementRow): SpreadElement {
  const style = row.style || {};
  const base: SpreadElement = {
    id: row.id,
    type: row.type as SpreadElement['type'],
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation ?? 0,
    zIndex: row.z_index ?? 0,
  };

  switch (row.type) {
    case 'text':
      return { ...base, text: row.data ?? '', ...style };
    case 'photo':
      return { ...base, imageUrl: row.data ?? undefined };
    case 'sticker':
      return { ...base, sticker: row.data ?? undefined };
    case 'shape':
      return { ...base, ...style };
    default:
      return base;
  }
}

let channel: ReturnType<typeof supabase.channel> | null = null;

export function subscribeToRealtime() {
  if (channel) return;

  channel = supabase
    .channel('folio-elements')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'elements' },
      (payload) => {
        const store = useFolioStore.getState();

        if (payload.eventType === 'INSERT') {
          const row = payload.new as DbElementRow;
          if (row.type === 'doodle') {
            try {
              const strokes: DrawingStroke[] = JSON.parse(row.data ?? '[]');
              useFolioStore.setState((st) => ({
                spreads: st.spreads.map((sp) =>
                  sp.id === row.spread_id ? { ...sp, drawingStrokes: strokes } : sp,
                ),
              }));
            } catch { /* ignore */ }
          } else {
            const el = dbRowToElement(row);
            const existsAlready = store.spreads
              .find((s) => s.id === row.spread_id)
              ?.elements.some((e) => e.id === el.id);
            if (!existsAlready) {
              useFolioStore.setState((st) => ({
                spreads: st.spreads.map((sp) =>
                  sp.id === row.spread_id
                    ? { ...sp, elements: [...sp.elements, el] }
                    : sp,
                ),
              }));
            }
          }
        }

        if (payload.eventType === 'UPDATE') {
          const row = payload.new as DbElementRow;
          if (row.type === 'doodle') {
            try {
              const strokes: DrawingStroke[] = JSON.parse(row.data ?? '[]');
              useFolioStore.setState((st) => ({
                spreads: st.spreads.map((sp) =>
                  sp.id === row.spread_id ? { ...sp, drawingStrokes: strokes } : sp,
                ),
              }));
            } catch { /* ignore */ }
          } else {
            const el = dbRowToElement(row);
            useFolioStore.setState((st) => ({
              spreads: st.spreads.map((sp) =>
                sp.id === row.spread_id
                  ? {
                      ...sp,
                      elements: sp.elements.map((e) => (e.id === el.id ? el : e)),
                    }
                  : sp,
              ),
            }));
          }
        }

        if (payload.eventType === 'DELETE') {
          const row = payload.old as { id: string; spread_id?: string; type?: string };
          if (row.type === 'doodle' && row.spread_id) {
            useFolioStore.setState((st) => ({
              spreads: st.spreads.map((sp) =>
                sp.id === row.spread_id ? { ...sp, drawingStrokes: [] } : sp,
              ),
            }));
          } else {
            useFolioStore.setState((st) => ({
              spreads: st.spreads.map((sp) => ({
                ...sp,
                elements: sp.elements.filter((e) => e.id !== row.id),
              })),
            }));
          }
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'spreads' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as any;
          const exists = useFolioStore.getState().spreads.some((s) => s.id === row.id);
          if (!exists) {
            useFolioStore.setState((st) => ({
              spreads: [
                ...st.spreads,
                {
                  id: row.id,
                  title: row.title,
                  date: row.date ?? '',
                  tags: row.tags ?? [],
                  elements: [],
                  drawingStrokes: [],
                },
              ],
            }));
          }
        }

        if (payload.eventType === 'UPDATE') {
          const row = payload.new as any;
          useFolioStore.setState((st) => ({
            spreads: st.spreads.map((sp) =>
              sp.id === row.id
                ? { ...sp, title: row.title, date: row.date ?? '', tags: row.tags ?? [] }
                : sp,
            ),
          }));
        }

        if (payload.eventType === 'DELETE') {
          const row = payload.old as { id: string };
          useFolioStore.setState((st) => ({
            spreads: st.spreads.filter((sp) => sp.id !== row.id),
            activeSpreadId:
              st.activeSpreadId === row.id
                ? st.spreads.filter((sp) => sp.id !== row.id)[0]?.id ?? null
                : st.activeSpreadId,
          }));
        }
      },
    )
    .subscribe();
}

export function unsubscribeFromRealtime() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
