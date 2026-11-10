// Personajes decorativos propios de BITE (misma línea simple y geométrica
// que SnackIcons) — el capibara del checkout y los "snackers" aleatorios
// que aparecen y desaparecen en la tienda.
export function CapybaraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 16c0-5.2 4-9 10-9h9c6 0 12 3 12 8 0 2.5-2.5 4-6 4H9c-4 0-6-1-6-3z" />
      <path d="M25.5 7c1.3-2.1 3.8-2.5 5 0" />
      <circle cx="27" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M8 19v2M14 19.3v1.8M20 19.3v1.8" />
    </svg>
  );
}

export function BirdIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14c0-4.2 3.2-7 8-7 5 0 8.2 3 9 6.3" />
      <path d="M21 13l2-1-1 2.6" />
      <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d="M7 17c1 1 3 1.5 5 1.5s4-.5 5-1.5" />
      <path d="M8 18.8v2M14 18.8v2" />
    </svg>
  );
}

export function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v7" />
      <path d="M12 10.5c-2.3 0-3.8 1.6-3.8 4v5.5" />
      <path d="M12 10.5c2.3 0 3.6 2 4 4.3" />
      <path d="M6.5 20h4M15.5 20h2" />
    </svg>
  );
}
