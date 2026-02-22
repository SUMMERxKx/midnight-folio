import { Canvas } from '@/components/folio/Canvas';
import { BottomToolbar } from '@/components/folio/BottomToolbar';
import { SelectionMenu } from '@/components/folio/SelectionMenu';
import { SpreadsSidebar } from '@/components/folio/SpreadsSidebar';
import { TopBar } from '@/components/folio/TopBar';

const Index = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
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
