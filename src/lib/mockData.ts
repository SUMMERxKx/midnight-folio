import { Spread } from './types';

export const initialSpreads: Spread[] = [
  {
    id: 'spread-1',
    title: 'Tokyo 2024',
    date: '2024-03-15',
    tags: ['travel', 'japan', 'spring'],
    drawingStrokes: [],
    elements: [
      {
        id: 'el-1', type: 'photo', x: 40, y: 60, width: 200, height: 260,
        rotation: -3, zIndex: 1,
      },
      {
        id: 'el-2', type: 'photo', x: 280, y: 100, width: 160, height: 200,
        rotation: 2, zIndex: 2,
      },
      {
        id: 'el-3', type: 'text', x: 520, y: 80, width: 300, height: 60,
        rotation: 0, zIndex: 3, text: 'Cherry Blossoms in Shinjuku',
        fontFamily: 'Caveat', fontSize: 28, fontColor: '#2a2a2a',
      },
      {
        id: 'el-4', type: 'sticker', x: 500, y: 400, width: 60, height: 60,
        rotation: 15, zIndex: 4, sticker: '🌸',
      },
      {
        id: 'el-5', type: 'sticker', x: 800, y: 50, width: 50, height: 50,
        rotation: -10, zIndex: 5, sticker: '✈️',
      },
      {
        id: 'el-6', type: 'photo', x: 540, y: 180, width: 240, height: 180,
        rotation: 1, zIndex: 2,
      },
      {
        id: 'el-7', type: 'text', x: 60, y: 380, width: 350, height: 120,
        rotation: 0, zIndex: 6, text: 'First morning in Tokyo — the air smelled like rain and possibility.',
        fontFamily: 'EB Garamond', fontSize: 18, fontColor: '#3a3a3a', italic: true,
      },
    ],
  },
  {
    id: 'spread-2',
    title: 'Weekend Hike',
    date: '2024-06-22',
    tags: ['nature', 'hiking'],
    drawingStrokes: [],
    elements: [
      {
        id: 'el-8', type: 'shape', x: 60, y: 80, width: 350, height: 250,
        rotation: 0, zIndex: 1, shapeVariant: 'rectangle',
        fillColor: '#e8dcc8', strokeColor: '#8b7355',
      },
      {
        id: 'el-9', type: 'text', x: 80, y: 360, width: 300, height: 80,
        rotation: 0, zIndex: 2, text: 'Trail Notes',
        fontFamily: 'EB Garamond', fontSize: 36, fontColor: '#2a2a2a', bold: true,
      },
      {
        id: 'el-10', type: 'text', x: 500, y: 100, width: 360, height: 160,
        rotation: 0, zIndex: 3,
        text: '12 miles round trip, 2,400ft elevation gain. The wildflowers were incredible this year.',
        fontFamily: 'DM Sans', fontSize: 16, fontColor: '#3a3a3a',
      },
      {
        id: 'el-11', type: 'shape', x: 520, y: 320, width: 80, height: 80,
        rotation: 0, zIndex: 4, shapeVariant: 'circle',
        fillColor: '#6b8e5a', strokeColor: '#4a6340',
      },
      {
        id: 'el-12', type: 'sticker', x: 700, y: 400, width: 60, height: 60,
        rotation: 8, zIndex: 5, sticker: '🏔️',
      },
    ],
  },
];
