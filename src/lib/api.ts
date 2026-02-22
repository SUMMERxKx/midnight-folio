import { supabase } from './supabase';
import type { Spread, SpreadElement, DrawingStroke, DbElementRow } from './types';

// ── Type conversions ────────────────────────────────────────────────────

function elementToDbRow(el: SpreadElement, spreadId: string): Record<string, any> {
  let data: string | null = null;
  const style: Record<string, any> = {};

  switch (el.type) {
    case 'text':
      data = el.text ?? null;
      if (el.fontFamily) style.fontFamily = el.fontFamily;
      if (el.fontSize !== undefined) style.fontSize = el.fontSize;
      if (el.fontColor) style.fontColor = el.fontColor;
      if (el.bold !== undefined) style.bold = el.bold;
      if (el.italic !== undefined) style.italic = el.italic;
      break;
    case 'photo':
      data = el.imageUrl ?? null;
      break;
    case 'sticker':
      data = el.sticker ?? null;
      break;
    case 'shape':
      if (el.shapeVariant) style.shapeVariant = el.shapeVariant;
      if (el.fillColor) style.fillColor = el.fillColor;
      if (el.strokeColor) style.strokeColor = el.strokeColor;
      break;
  }

  return {
    id: el.id,
    spread_id: spreadId,
    type: el.type,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    z_index: el.zIndex,
    data,
    style,
  };
}

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

// ── Spreads ─────────────────────────────────────────────────────────────

export async function getSpreads(userId: string) {
  const { data, error } = await supabase
    .from('spreads')
    .select('*')
    .eq('user_id', userId)
    .order('page_order');
  if (error) throw error;
  return data ?? [];
}

export async function createSpread(
  userId: string,
  spread: { id: string; title: string; date: string; tags: string[]; page_order?: number },
) {
  const { data, error } = await supabase
    .from('spreads')
    .insert({
      id: spread.id,
      user_id: userId,
      title: spread.title,
      date: spread.date || null,
      tags: spread.tags,
      page_order: spread.page_order ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSpread(
  id: string,
  updates: { title?: string; date?: string; tags?: string[] },
) {
  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.date !== undefined) row.date = updates.date || null;
  if (updates.tags !== undefined) row.tags = updates.tags;

  const { error } = await supabase.from('spreads').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteSpread(id: string) {
  const { error } = await supabase.from('spreads').delete().eq('id', id);
  if (error) throw error;
}

// ── Elements ────────────────────────────────────────────────────────────

export async function getSpreadData(
  spreadId: string,
): Promise<{ elements: SpreadElement[]; drawingStrokes: DrawingStroke[] }> {
  const { data, error } = await supabase
    .from('elements')
    .select('*')
    .eq('spread_id', spreadId)
    .order('z_index');
  if (error) throw error;

  const elements: SpreadElement[] = [];
  const drawingStrokes: DrawingStroke[] = [];

  for (const row of data ?? []) {
    if (row.type === 'doodle') {
      try {
        const strokes: DrawingStroke[] = JSON.parse(row.data ?? '[]');
        drawingStrokes.push(...strokes);
      } catch { /* skip malformed */ }
    } else {
      elements.push(dbRowToElement(row));
    }
  }

  return { elements, drawingStrokes };
}

export async function createElement(element: SpreadElement, spreadId: string) {
  const row = elementToDbRow(element, spreadId);
  const { error } = await supabase.from('elements').insert(row);
  if (error) throw error;
}

export async function updateElement(id: string, element: SpreadElement, spreadId: string) {
  const row = elementToDbRow(element, spreadId);
  const { spread_id: _s, id: _i, ...updateFields } = row;
  const { error } = await supabase.from('elements').update(updateFields).eq('id', id);
  if (error) throw error;
}

export async function deleteElement(id: string) {
  const { error } = await supabase.from('elements').delete().eq('id', id);
  if (error) throw error;
}

// ── Drawing strokes (stored as a single 'doodle' element per spread) ───

export async function saveDoodleStrokes(spreadId: string, strokes: DrawingStroke[]) {
  const { data } = await supabase
    .from('elements')
    .select('id')
    .eq('spread_id', spreadId)
    .eq('type', 'doodle')
    .maybeSingle();

  if (data) {
    await supabase
      .from('elements')
      .update({ data: JSON.stringify(strokes) })
      .eq('id', data.id);
  } else if (strokes.length > 0) {
    await supabase.from('elements').insert({
      spread_id: spreadId,
      type: 'doodle',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      z_index: 0,
      data: JSON.stringify(strokes),
      style: {},
    });
  }
}

export async function clearDoodleStrokes(spreadId: string) {
  await supabase
    .from('elements')
    .delete()
    .eq('spread_id', spreadId)
    .eq('type', 'doodle');
}

// ── Image upload (re-export from storage) ────────────────────────────────

export { uploadImage } from './storage';
