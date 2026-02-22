import { useCallback, useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { useFolioStore } from '@/lib/store';
import { SpreadElement as ElementData } from '@/lib/types';
import { Image } from 'lucide-react';

interface Props {
  element: ElementData;
  isSelected: boolean;
}

export function SpreadElement({ element, isSelected }: Props) {
  const { updateElement, selectElement, activeTool } = useFolioStore();
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const handleDragStop = useCallback((_: any, d: { x: number; y: number }) => {
    updateElement(element.id, { x: d.x, y: d.y });
  }, [element.id, updateElement]);

  const handleResizeStop = useCallback((_: any, __: any, ref: HTMLElement, ___: any, pos: { x: number; y: number }) => {
    updateElement(element.id, {
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height),
      x: pos.x,
      y: pos.y,
    });
  }, [element.id, updateElement]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      selectElement(element.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type === 'text') {
      setIsEditing(true);
    }
  };

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      // Place cursor at end
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleTextBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      updateElement(element.id, { text: textRef.current.innerText });
    }
  };

  const renderContent = () => {
    switch (element.type) {
      case 'photo':
        return (
          <div className="w-full h-full flex items-center justify-center rounded-sm overflow-hidden"
            style={{ backgroundColor: '#d5cfc3' }}>
            {element.imageUrl ? (
              <img src={element.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image className="w-10 h-10" style={{ color: '#9a9489' }} />
            )}
          </div>
        );

      case 'text':
        return (
          <div
            ref={textRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleTextBlur}
            className="w-full h-full outline-none overflow-hidden"
            style={{
              fontFamily: element.fontFamily || 'DM Sans',
              fontSize: element.fontSize || 16,
              color: element.fontColor || '#2a2a2a',
              fontWeight: element.bold ? 'bold' : 'normal',
              fontStyle: element.italic ? 'italic' : 'normal',
              lineHeight: 1.4,
              cursor: isEditing ? 'text' : 'move',
              userSelect: isEditing ? 'text' : 'none',
            }}
          >
            {element.text || 'Type here...'}
          </div>
        );

      case 'sticker':
        return (
          <div className="w-full h-full flex items-center justify-center select-none"
            style={{ fontSize: Math.min(element.width, element.height) * 0.7 }}>
            {element.sticker}
          </div>
        );

      case 'shape':
        return renderShape();

      default:
        return null;
    }
  };

  const renderShape = () => {
    const fill = element.fillColor || 'transparent';
    const stroke = element.strokeColor || '#2a2a2a';
    switch (element.shapeVariant) {
      case 'rectangle':
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} preserveAspectRatio="none">
            <rect x="2" y="2" width={element.width - 4} height={element.height - 4} fill={fill} stroke={stroke} strokeWidth="2" />
          </svg>
        );
      case 'circle':
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} preserveAspectRatio="none">
            <ellipse cx={element.width / 2} cy={element.height / 2} rx={element.width / 2 - 2} ry={element.height / 2 - 2} fill={fill} stroke={stroke} strokeWidth="2" />
          </svg>
        );
      case 'line':
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} preserveAspectRatio="none">
            <line x1="0" y1={element.height / 2} x2={element.width} y2={element.height / 2} stroke={stroke} strokeWidth="2" />
          </svg>
        );
      case 'arrow':
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} preserveAspectRatio="none">
            <defs>
              <marker id={`ah-${element.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
              </marker>
            </defs>
            <line x1="0" y1={element.height / 2} x2={element.width - 12} y2={element.height / 2} stroke={stroke} strokeWidth="2" markerEnd={`url(#ah-${element.id})`} />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Rnd
      position={{ x: element.x, y: element.y }}
      size={{ width: element.width, height: element.height }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      disableDragging={activeTool !== 'select' || isEditing}
      enableResizing={activeTool === 'select' && isSelected && !isEditing}
      style={{ zIndex: element.zIndex }}
      bounds="parent"
      resizeHandleStyles={{
        topLeft: { cursor: 'nw-resize' },
        topRight: { cursor: 'ne-resize' },
        bottomLeft: { cursor: 'sw-resize' },
        bottomRight: { cursor: 'se-resize' },
      }}
    >
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full ${isSelected ? 'ring-2 ring-offset-0' : ''}`}
        style={{
          transform: `rotate(${element.rotation}deg)`,
          boxShadow: isSelected ? '0 0 0 2px #c9a96e' : undefined,
        }}
      >
        {renderContent()}
      </div>
    </Rnd>
  );
}
