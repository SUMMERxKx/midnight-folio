export type ElementType = 'photo' | 'text' | 'sticker' | 'shape' | 'doodle';
export type ShapeVariant = 'rectangle' | 'circle' | 'line' | 'arrow';
export type ToolMode = 'select' | 'draw';

export interface SpreadElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  sticker?: string;
  shapeVariant?: ShapeVariant;
  fillColor?: string;
  strokeColor?: string;
  imageUrl?: string;
}

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  thickness: number;
}

export interface Spread {
  id: string;
  title: string;
  date: string;
  tags: string[];
  elements: SpreadElement[];
  drawingStrokes: DrawingStroke[];
}

export interface DbSpreadRow {
  id: string;
  user_id: string;
  title: string;
  date: string | null;
  tags: string[];
  page_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbElementRow {
  id: string;
  spread_id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  data: string | null;
  style: Record<string, any>;
  created_at: string;
}
