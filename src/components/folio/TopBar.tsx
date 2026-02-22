import { useFolioStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Download, ZoomIn, ZoomOut, LogOut } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

export function TopBar() {
  const { user, signOut } = useAuth();
  const { spreads, activeSpreadId, updateSpreadMeta, zoom, setZoom } = useFolioStore();
  const spread = spreads.find((s) => s.id === activeSpreadId);

  const handleExport = async () => {
    const node = document.getElementById('spread-capture');
    if (!node) return;

    try {
      const pixelRatio = 2;
      const drawingCanvas = node.querySelector('canvas');

      // Capture DOM excluding the drawing canvas (html-to-image can be unreliable with <canvas>)
      const domDataUrl = await toPng(node, {
        quality: 1,
        pixelRatio,
        cacheBust: true,
        filter: (n) => !(n instanceof HTMLCanvasElement),
      });

      // Composite: DOM capture + drawing canvas on top
      if (drawingCanvas && drawingCanvas.width > 0 && drawingCanvas.height > 0) {
        const img = new Image();
        img.src = domDataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
        });

        const composite = document.createElement('canvas');
        composite.width = img.width;
        composite.height = img.height;
        const ctx = composite.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        ctx.drawImage(drawingCanvas, 0, 0, composite.width, composite.height);
        triggerDownload(composite.toDataURL('image/png'));
      } else {
        triggerDownload(domDataUrl);
      }
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    }

    function triggerDownload(dataUrl: string) {
      const link = document.createElement('a');
      link.download = `${spread?.title || 'spread'}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div
      className="h-12 flex items-center justify-between px-4 border-b"
      style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}
    >
      <div className="flex items-center gap-4 ml-12">
        {spread && (
          <>
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
              onChange={(e) =>
                updateSpreadMeta(spread.id, {
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Tags (comma separated)"
              className="text-xs bg-transparent border rounded px-2 py-1 w-40 outline-none"
              style={{ color: '#6b6560', borderColor: '#2a2a2a' }}
            />
          </>
        )}
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

        {spread && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs"
            style={{ backgroundColor: 'rgba(201,169,110,0.1)', color: '#c9a96e' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.2)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.1)')
            }
          >
            <Download className="w-3.5 h-3.5" /> Export PNG
          </button>
        )}

        <div className="w-px h-6 mx-1" style={{ backgroundColor: '#2a2a2a' }} />

        <span
          className="text-xs truncate max-w-[120px] hidden sm:inline"
          style={{ color: '#6b6560' }}
        >
          {user?.email}
        </span>
        <button onClick={signOut} className="sel-btn" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
