import { FaHandPaper, FaRegCircle, FaArrowRight } from 'react-icons/fa';
import { useRef } from 'react';

type ToolbarProps = {
    activeTool: 'hand' | 'place' | 'edge';
    onHandTool: () => void;
    onPlaceTool: () => void;
    onEdgeTool: () => void;
};

const ToolbarComponent = ({ activeTool: activeTool, onHandTool: onHandTool, onPlaceTool: onPlaceTool, onEdgeTool: onEdgeTool }: ToolbarProps) => {
    const toolbarRef = useRef<HTMLDivElement | null>(null);

    return (
        <div ref={toolbarRef} className="toolbar draggable">
            <button className={activeTool === 'hand' ? "toolbar-btn" : "toolbar-btn-selected"} onClick={onHandTool}><FaHandPaper /></button>
            <button className={activeTool === 'place' ? "toolbar-btn" : "toolbar-btn-selected"} onClick={onPlaceTool}><FaRegCircle /></button>
            <button className={activeTool === 'edge' ? "toolbar-btn" : "toolbar-btn-selected"} onClick={onEdgeTool}><FaArrowRight /></button>
        </div>
    );
};

export default ToolbarComponent;