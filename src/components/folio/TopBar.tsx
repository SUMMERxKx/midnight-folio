import { useFolioStore } from '@/lib/store';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { toPng } from 'html-to-image';

export function TopBar() {
  const { spreads, activeSpreadId, updateSpreadMeta, zoom, setZoom } = useFolioStore();
  const spread = spreads.find((s) => s.id === activeSpreadId);

  const handleExport = async () => {
    const node = document.getElementById('spread-capture');
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${spread?.title || 'spread'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (!spread) return null;

  return (
    <div className="h-12 flex items-center justify-between px-4 border-b"
      style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}>
      <div className="flex items-center gap-4 ml-12">
        <input
          value={spread.title}
          onChange={(e) => updateSpreadMeta(spread.id, { title: e.target.value })}
          className="font-medium bg-transparent border-none outline-none"
          style={{ fontFamily: 'EB Garamond', fontSize: 18, color: '#e0ddd5' }}
        />
        <input
          type="date"
          value={spread.date}
          onChange={(e) => updateSpreadMeta(spread.id, { date: e.target.value })}
          className="text-xs bg-transparent border rounded px-2 py-1 outline-none"
          style={{ color: '#6b6560', borderColor: '#2a2a2a' }}
        />
        <input
          value={spread.tags.join(', ')}
          onChange={(e) => updateSpreadMeta(spread.id, { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
          placeholder="Tags (comma separated)"
          className="text-xs bg-transparent border rounded px-2 py-1 w-40 outline-none"
          style={{ color: '#6b6560', borderColor: '#2a2a2a' }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setZoom(zoom - 0.1)} className="sel-btn">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs w-12 text-center" style={{ color: '#6b6560' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => setZoom(zoom + 0.1)} className="sel-btn">
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-6 mx-1" style={{ backgroundColor: '#2a2a2a' }} />
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs"
          style={{ backgroundColor: 'rgba(201,169,110,0.1)', color: '#c9a96e' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.1)')}>
          <Download className="w-3.5 h-3.5" /> Export PNG
        </button>
      </div>
    </div>
  );
}
