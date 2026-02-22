import { useRef, useEffect, useCallback, useState } from 'react';
import { useFolioStore } from '@/lib/store';
import { DrawingStroke } from '@/lib/types';

interface Props {
  width: number;
  height: number;
  strokes: DrawingStroke[];
}

export function DrawingLayer({ width, height, strokes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activeTool, drawColor, drawThickness, addDrawingStroke } = useFolioStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, width, height]);

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== 'draw') return;
      setIsDrawing(true);
      currentStroke.current = [getPos(e)];
    },
    [activeTool],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;
      const pos = getPos(e);
      currentStroke.current.push(pos);
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || currentStroke.current.length < 2) return;
      const pts = currentStroke.current;
      ctx.beginPath();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawThickness;
      ctx.lineCap = 'round';
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, drawColor, drawThickness],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.current.length > 1) {
      addDrawingStroke({
        points: [...currentStroke.current],
        color: drawColor,
        thickness: drawThickness,
      });
    }
    currentStroke.current = [];
  }, [isDrawing, drawColor, drawThickness, addDrawingStroke]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0"
      style={{
        pointerEvents: activeTool === 'draw' ? 'auto' : 'none',
        cursor: activeTool === 'draw' ? 'crosshair' : 'default',
        zIndex: 50,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
