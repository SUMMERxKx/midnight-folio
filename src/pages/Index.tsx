import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useFolioStore } from '@/lib/store';
import { subscribeToRealtime, unsubscribeFromRealtime } from '@/lib/realtime';
import { Canvas } from '@/components/folio/Canvas';
import { BottomToolbar } from '@/components/folio/BottomToolbar';
import { SelectionMenu } from '@/components/folio/SelectionMenu';
import { SpreadsSidebar } from '@/components/folio/SpreadsSidebar';
import { TopBar } from '@/components/folio/TopBar';

const Index = () => {
  const { user } = useAuth();
  const initialize = useFolioStore((s) => s.initialize);
  const loading = useFolioStore((s) => s.loading);
  const selectedElementId = useFolioStore((s) => s.selectedElementId);
  const deleteElement = useFolioStore((s) => s.deleteElement);
  const selectElement = useFolioStore((s) => s.selectElement);
  const duplicateElement = useFolioStore((s) => s.duplicateElement);
  const initRef = useRef(false);

  useEffect(() => {
    if (user && !initRef.current) {
      initRef.current = true;
      initialize(user.id).then(() => subscribeToRealtime());
    }
    return () => unsubscribeFromRealtime();
  }, [user, initialize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      )
        return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        deleteElement(selectedElementId);
      } else if (e.key === 'Escape') {
        selectElement(null);
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElementId) {
        e.preventDefault();
        duplicateElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement, selectElement, duplicateElement]);

  if (loading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: '#2a2a2a', borderTopColor: '#c9a96e' }}
          />
          <span style={{ color: '#6b6560', fontFamily: 'EB Garamond' }}>
            Loading your scrapbook…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <TopBar />
      <div className="flex-1 flex overflow-hidden relative">
        <SpreadsSidebar />
        <Canvas />
      </div>
      <SelectionMenu />
      <BottomToolbar />
    </div>
  );
};

export default Index;
