import { useCallback } from 'react';
import { useFolioStore } from '@/lib/store';
import { SpreadElement } from './SpreadElement';
import { DrawingLayer } from './DrawingLayer';

const PAGE_WIDTH = 480;
const PAGE_HEIGHT = 640;

export function Canvas() {
  const { spreads, activeSpreadId, selectedElementId, activeTool, zoom, setZoom, selectElement } =
    useFolioStore();
  const activeSpread = spreads.find((s) => s.id === activeSpreadId);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1));
      }
    },
    [zoom, setZoom],
  );

  const handleDeselect = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };

  if (!activeSpread) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <div className="text-center px-4">
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'EB Garamond', color: '#e0ddd5' }}
          >
            Your scrapbook is empty
          </h2>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            Open the sidebar and create your first spread
          </p>
        </div>
      </div>
    );
  }

  const totalWidth = PAGE_WIDTH * 2 + 2;

  return (
    <div
      className="flex-1 overflow-auto flex items-center justify-center"
      style={{ backgroundColor: '#0a0a0a' }}
      onWheel={handleWheel}
      onClick={handleDeselect}
    >
      <div
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        className="transition-transform duration-100"
      >
        <div
          id="spread-capture"
          className="relative flex"
          style={{ width: totalWidth, height: PAGE_HEIGHT }}
        >
          {/* Left page */}
          <div
            className="shadow-page"
            style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, backgroundColor: '#f5f0e8' }}
          />

          {/* Center spine */}
          <div className="relative" style={{ width: 2 }}>
            <div className="absolute inset-y-0 -left-4 -right-4 shadow-spine" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.05), rgba(0,0,0,0.15))',
              }}
            />
          </div>

          {/* Right page */}
          <div
            className="shadow-page"
            style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, backgroundColor: '#f5f0e8' }}
          />

          {/* Elements layer */}
          <div
            className="absolute inset-0"
            style={{ pointerEvents: activeTool === 'draw' ? 'none' : 'auto' }}
            onClick={handleDeselect}
          >
            {[...activeSpread.elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => (
                <SpreadElement
                  key={el.id}
                  element={el}
                  isSelected={el.id === selectedElementId}
                />
              ))}
          </div>

          {/* Drawing layer — always rendered above elements, pointer-events controlled by tool */}
          <DrawingLayer
            width={totalWidth}
            height={PAGE_HEIGHT}
            strokes={activeSpread.drawingStrokes}
          />
        </div>
      </div>
    </div>
  );
}
