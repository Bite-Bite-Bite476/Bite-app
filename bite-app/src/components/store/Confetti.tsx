"use client";
import { useEffect, useState } from "react";

const COLORS = ["#FF642D", "#171717", "#2F7D4F", "#B6B1AB", "#E5D9C8"];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  color: string;
  rotate: number;
  drift: number;
};

/**
 * Lluvia de confeti de una sola vez (sin librerías externas), pensada para
 * la pantalla de "Pedido confirmado". Se monta con una `key` distinta por
 * pedido para que vuelva a jugar en cada compra, y se desmonta sola al
 * terminar la animación.
 */
export default function Confetti({ count = 46 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.7 + Math.random() * 1.1,
        width: 6 + Math.random() * 6,
        height: 10 + Math.random() * 6,
        color: COLORS[i % COLORS.length]!,
        rotate: 180 + Math.random() * 540,
        drift: (Math.random() - 0.5) * 140
      }))
    );
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, [count]);

  if (!visible || !pieces) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-24px] rounded-sm"
          style={
            {
              left: `${p.left}%`,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              animation: `confetti-fall ${p.duration}s cubic-bezier(0.25,0.46,0.45,0.94) ${p.delay}s forwards`,
              "--drift": `${p.drift}px`,
              "--rotate": `${p.rotate}deg`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
