import { useFolioStore } from '@/lib/store';
import { Image, Type, Smile, Square, Pencil, MousePointer2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const STICKERS = ['❤️', '⭐', '🌸', '✈️', '📷', '🎵', '🌙', '☀️', '🎨', '📌', '🏔️', '🌊', '🎪', '🎭', '🎈', '🍕', '🎸', '🐾', '🦋', '🌈'];

const SHAPES = [
  { variant: 'rectangle' as const, label: 'Rectangle', icon: '▬' },
  { variant: 'circle' as const, label: 'Circle', icon: '●' },
  { variant: 'line' as const, label: 'Line', icon: '─' },
  { variant: 'arrow' as const, label: 'Arrow', icon: '→' },
];

export function BottomToolbar() {
  const { addElement, activeTool, setTool, drawColor, setDrawColor, drawThickness, setDrawThickness } = useFolioStore();

  const addPhoto = () => {
    addElement({ type: 'photo', x: 100 + Math.random() * 60, y: 100 + Math.random() * 60, width: 200, height: 260, rotation: Math.random() * 6 - 3 });
  };

  const addText = () => {
    addElement({ type: 'text', x: 100 + Math.random() * 60, y: 100 + Math.random() * 60, width: 250, height: 60, rotation: 0, text: 'Type here...', fontFamily: 'DM Sans', fontSize: 18, fontColor: '#2a2a2a' });
  };

  const addSticker = (sticker: string) => {
    addElement({ type: 'sticker', x: 200 + Math.random() * 80, y: 200 + Math.random() * 80, width: 60, height: 60, rotation: Math.random() * 20 - 10, sticker });
  };

  const addShape = (variant: 'rectangle' | 'circle' | 'line' | 'arrow') => {
    addElement({
      type: 'shape', x: 150 + Math.random() * 60, y: 150 + Math.random() * 60,
      width: 120, height: variant === 'line' || variant === 'arrow' ? 40 : 120,
      rotation: 0, shapeVariant: variant, fillColor: 'transparent', strokeColor: '#2a2a2a',
    });
  };

  return (
    <div className="h-14 flex items-center justify-center gap-1 px-4 border-t"
      style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}>
      <button onClick={() => setTool('select')}
        className={`toolbar-btn ${activeTool === 'select' ? 'toolbar-btn-active' : ''}`}>
        <MousePointer2 className="w-4 h-4" />
        <span className="text-xs">Select</span>
      </button>

      <div className="w-px h-8 mx-1" style={{ backgroundColor: '#2a2a2a' }} />

      <button onClick={addPhoto} className="toolbar-btn">
        <Image className="w-4 h-4" />
        <span className="text-xs">Photo</span>
      </button>

      <button onClick={addText} className="toolbar-btn">
        <Type className="w-4 h-4" />
        <span className="text-xs">Text</span>
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button className="toolbar-btn">
            <Smile className="w-4 h-4" />
            <span className="text-xs">Sticker</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" side="top"
          style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}>
          <div className="grid grid-cols-5 gap-2">
            {STICKERS.map((s) => (
              <button key={s} onClick={() => addSticker(s)}
                className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-white/5">
                {s}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button className="toolbar-btn">
            <Square className="w-4 h-4" />
            <span className="text-xs">Shape</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" side="top"
          style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}>
          <div className="flex flex-col gap-1">
            {SHAPES.map((s) => (
              <button key={s.variant} onClick={() => addShape(s.variant)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                style={{ color: '#e0ddd5' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(42,42,42,0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-8 mx-1" style={{ backgroundColor: '#2a2a2a' }} />

      <button onClick={() => setTool('draw')}
        className={`toolbar-btn ${activeTool === 'draw' ? 'toolbar-btn-active' : ''}`}>
        <Pencil className="w-4 h-4" />
        <span className="text-xs">Draw</span>
      </button>

      {activeTool === 'draw' && (
        <div className="flex items-center gap-2 ml-2">
          <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
          <input type="range" min="1" max="12" value={drawThickness}
            onChange={(e) => setDrawThickness(Number(e.target.value))}
            className="w-20" style={{ accentColor: '#c9a96e' }} />
        </div>
      )}
    </div>
  );
}
