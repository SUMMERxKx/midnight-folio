import { useFolioStore } from '@/lib/store';
import { Copy, Trash2, ArrowUpToLine, ArrowDownToLine, RotateCw, RotateCcw } from 'lucide-react';

const FONTS = [
  { value: 'EB Garamond', label: 'Serif' },
  { value: 'DM Sans', label: 'Sans' },
  { value: 'JetBrains Mono', label: 'Mono' },
  { value: 'Caveat', label: 'Handwritten' },
];

export function SelectionMenu() {
  const { spreads, activeSpreadId, selectedElementId, updateElement, deleteElement, duplicateElement, moveToFront, moveToBack } = useFolioStore();

  const spread = spreads.find((s) => s.id === activeSpreadId);
  const element = spread?.elements.find((e) => e.id === selectedElementId);

  if (!element) return null;

  const rotate = (deg: number) => updateElement(element.id, { rotation: element.rotation + deg });

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-2xl px-3 py-2 flex items-center gap-1.5 border"
      style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}>
      <button onClick={() => moveToFront(element.id)} className="sel-btn" title="Move to front">
        <ArrowUpToLine className="w-4 h-4" />
      </button>
      <button onClick={() => moveToBack(element.id)} className="sel-btn" title="Move to back">
        <ArrowDownToLine className="w-4 h-4" />
      </button>
      <button onClick={() => rotate(-15)} className="sel-btn" title="Rotate left">
        <RotateCcw className="w-4 h-4" />
      </button>
      <button onClick={() => rotate(15)} className="sel-btn" title="Rotate right">
        <RotateCw className="w-4 h-4" />
      </button>
      <button onClick={() => duplicateElement(element.id)} className="sel-btn" title="Duplicate">
        <Copy className="w-4 h-4" />
      </button>

      <div className="w-px h-6 mx-1" style={{ backgroundColor: '#2a2a2a' }} />

      {element.type === 'text' && (
        <>
          <select
            value={element.fontFamily || 'DM Sans'}
            onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
            className="rounded px-2 py-1 text-xs border outline-none"
            style={{ backgroundColor: '#151515', borderColor: '#2a2a2a', color: '#e0ddd5' }}>
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={element.fontSize || 16}
            onChange={(e) => updateElement(element.id, { fontSize: Number(e.target.value) })}
            className="w-14 rounded px-2 py-1 text-xs border outline-none"
            style={{ backgroundColor: '#151515', borderColor: '#2a2a2a', color: '#e0ddd5' }}
            min={8} max={72}
          />
          <input type="color" value={element.fontColor || '#2a2a2a'}
            onChange={(e) => updateElement(element.id, { fontColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
          <button onClick={() => updateElement(element.id, { bold: !element.bold })}
            className="sel-btn font-bold" style={{ color: element.bold ? '#c9a96e' : undefined }}>
            B
          </button>
          <button onClick={() => updateElement(element.id, { italic: !element.italic })}
            className="sel-btn italic" style={{ color: element.italic ? '#c9a96e' : undefined }}>
            I
          </button>
        </>
      )}

      {element.type === 'shape' && (
        <>
          <span className="text-xs" style={{ color: '#6b6560' }}>Fill</span>
          <input type="color" value={element.fillColor || '#000000'}
            onChange={(e) => updateElement(element.id, { fillColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
          <span className="text-xs" style={{ color: '#6b6560' }}>Stroke</span>
          <input type="color" value={element.strokeColor || '#2a2a2a'}
            onChange={(e) => updateElement(element.id, { strokeColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
        </>
      )}

      <div className="w-px h-6 mx-1" style={{ backgroundColor: '#2a2a2a' }} />

      <button onClick={() => deleteElement(element.id)} className="sel-btn" title="Delete"
        style={{ color: '#ef4444' }}>
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
