import { useFolioStore } from '@/lib/store';
import { Plus, Copy, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react';

export function SpreadsSidebar() {
  const {
    spreads, activeSpreadId, sidebarOpen,
    setActiveSpread, addSpread, duplicateSpread, deleteSpread, toggleSidebar, updateSpreadMeta,
  } = useFolioStore();

  return (
    <>
      <button onClick={toggleSidebar}
        className="fixed top-3 left-3 z-50 sel-btn border rounded-md"
        style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}>
        {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </button>

      <div
        className={`fixed left-0 top-0 h-full z-40 border-r transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 260, backgroundColor: '#151515', borderColor: '#2a2a2a' }}>
        <div className="p-4 pt-16">
          <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: 'EB Garamond', color: '#e0ddd5' }}>
            Folio
          </h1>
          <p className="text-xs mt-1" style={{ color: '#6b6560' }}>Digital Scrapbook</p>

          <button onClick={addSpread}
            className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm"
            style={{ backgroundColor: 'rgba(201,169,110,0.1)', color: '#c9a96e' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(201,169,110,0.1)')}>
            <Plus className="w-4 h-4" /> New Spread
          </button>

          <div className="mt-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {spreads.map((spread) => (
              <div
                key={spread.id}
                onClick={() => setActiveSpread(spread.id)}
                className="group p-3 rounded-lg cursor-pointer transition border"
                style={{
                  backgroundColor: spread.id === activeSpreadId ? 'rgba(201,169,110,0.08)' : 'transparent',
                  borderColor: spread.id === activeSpreadId ? 'rgba(201,169,110,0.25)' : 'transparent',
                }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <input
                      value={spread.title}
                      onChange={(e) => updateSpreadMeta(spread.id, { title: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium bg-transparent border-none outline-none w-full truncate"
                      style={{ color: '#e0ddd5' }}
                    />
                    <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>{spread.date}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={(e) => { e.stopPropagation(); duplicateSpread(spread.id); }}
                      className="p-1 transition-colors" style={{ color: '#6b6560' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a96e')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6560')}>
                      <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSpread(spread.id); }}
                      className="p-1 transition-colors" style={{ color: '#6b6560' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6560')}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {spread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {spread.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(42,42,42,0.5)', color: '#6b6560' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
