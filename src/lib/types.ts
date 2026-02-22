export type ElementType = 'photo' | 'text' | 'sticker' | 'shape';
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
  // Text
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  // Sticker
  sticker?: string;
  // Shape
  shapeVariant?: ShapeVariant;
  fillColor?: string;
  strokeColor?: string;
  // Photo
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
