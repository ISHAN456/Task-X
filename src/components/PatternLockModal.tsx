import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';

interface PatternLockModalProps {
  open: boolean;
  mode: 'setup' | 'unlock';
  expectedPattern?: string;
  onSuccess: (pattern: string) => void;
  onCancel?: () => void;
}

const GRID_POINTS = [
  { id: 0, x: 48, y: 48 },
  { id: 1, x: 132, y: 48 },
  { id: 2, x: 216, y: 48 },
  { id: 3, x: 48, y: 132 },
  { id: 4, x: 132, y: 132 },
  { id: 5, x: 216, y: 132 },
  { id: 6, x: 48, y: 216 },
  { id: 7, x: 132, y: 216 },
  { id: 8, x: 216, y: 216 },
];

export const PatternLockModal: React.FC<PatternLockModalProps> = ({
  open,
  mode,
  expectedPattern = '',
  onSuccess,
  onCancel,
}) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmStep, setConfirmStep] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setIsDrawing(false);
      setPointerPos(null);
      setErrorMsg('');
      setConfirmStep(null);
    }
  }, [open, mode]);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 264;
    const y = ((clientY - rect.top) / rect.height) * 264;
    return { x, y };
  }, []);

  const hitTestNode = useCallback((pt: { x: number; y: number }) => {
    for (const node of GRID_POINTS) {
      const dist = Math.hypot(pt.x - node.x, pt.y - node.y);
      if (dist <= 26) return node.id;
    }
    return null;
  }, []);

  const finishStroke = useCallback(
    (sequence: number[]) => {
      setIsDrawing(false);
      setPointerPos(null);
      if (sequence.length === 0) return;

      const patternStr = sequence.join('-');
      if (sequence.length < 4) {
        setErrorMsg('Connect at least 4 dots.');
        setSelected([]);
        return;
      }

      if (mode === 'unlock') {
        if (patternStr === expectedPattern) {
          setErrorMsg('');
          onSuccess(patternStr);
        } else {
          setErrorMsg('Pattern did not match. Try again.');
          setSelected([]);
        }
      } else {
        if (!confirmStep) {
          setConfirmStep(patternStr);
          setErrorMsg('');
          setSelected([]);
        } else if (confirmStep === patternStr) {
          setErrorMsg('');
          onSuccess(patternStr);
        } else {
          setErrorMsg('Patterns did not match. Draw your new pattern again.');
          setConfirmStep(null);
          setSelected([]);
        }
      }
    },
    [mode, expectedPattern, confirmStep, onSuccess]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getRelativePoint(e.clientX, e.clientY);
    if (!pt) return;
    setIsDrawing(true);
    setPointerPos(pt);
    setErrorMsg('');
    const hit = hitTestNode(pt);
    setSelected(hit !== null ? [hit] : []);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const pt = getRelativePoint(e.clientX, e.clientY);
    if (!pt) return;
    setPointerPos(pt);
    const hit = hitTestNode(pt);
    if (hit !== null) {
      setSelected((prev) => (prev.includes(hit) ? prev : [...prev, hit]));
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    finishStroke(selected);
  };

  if (!open) return null;

  const polylinePoints = selected
    .map((id) => {
      const p = GRID_POINTS[id];
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const lastNode = selected.length > 0 ? GRID_POINTS[selected[selected.length - 1]] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] p-6 shadow-2xl text-center">
        <div className="flex items-center justify-between">
          <div className="w-10" />
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--tx-accent-soft)] text-[var(--tx-accent)]">
            {mode === 'setup' ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          {mode === 'setup' && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Cancel pattern setup"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          {mode === 'unlock'
            ? 'Task X Locked'
            : confirmStep
              ? 'Confirm Pattern'
              : 'Set Pattern Lock'}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {mode === 'unlock'
            ? 'Draw your saved pattern across at least 4 dots to unlock.'
            : confirmStep
              ? 'Draw the same pattern once more to confirm.'
              : 'Drag across at least 4 dots to create your security pattern.'}
        </p>

        <div className="mt-5 flex justify-center">
          <svg
            ref={svgRef}
            width={264}
            height={264}
            viewBox="0 0 264 264"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="touch-none select-none rounded-2xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 cursor-crosshair"
          >
            {selected.length > 1 && (
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="var(--tx-accent)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {isDrawing && lastNode && pointerPos && (
              <line
                x1={lastNode.x}
                y1={lastNode.y}
                x2={pointerPos.x}
                y2={pointerPos.y}
                stroke="var(--tx-accent)"
                strokeWidth="3"
                strokeOpacity="0.55"
                strokeLinecap="round"
              />
            )}
            {GRID_POINTS.map((pt) => {
              const activeIndex = selected.indexOf(pt.id);
              const isActive = activeIndex !== -1;
              return (
                <g key={pt.id}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 20 : 14}
                    fill={isActive ? 'var(--tx-accent-soft)' : 'transparent'}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 8 : 6}
                    fill={isActive ? 'var(--tx-accent)' : '#94a3b8'}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 min-h-[20px]">
          {errorMsg ? (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
          ) : (
            <p className="text-xs text-slate-400">
              {selected.length > 0 ? `${selected.length} dots connected` : 'Press and drag to draw'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
