// Íconos decorativos propios de BITE (línea simple, geométricos) — se usan
// en la pantalla de carga del catálogo y en la decoración de los costados.
export function PackageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8l1-4h10l1 4" />
      <path d="M5 8h14l-1.3 11.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 8z" />
      <path d="M9 12c1 .8 2 .8 3 0s2-.8 3 0" />
    </svg>
  );
}

export function DrinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 3l2 2-2.4 2.4" />
      <path d="M7 8h11l-1.4 11.3A2 2 0 0 1 14.6 21H9.4a2 2 0 0 1-2-1.7L6 8z" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function CandyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 9l-4-2v10l4-2z" />
      <path d="M15 9l4-2v10l-4-2z" />
      <rect x="9" y="8.5" width="6" height="7" rx="1.4" />
    </svg>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l1.8 5.6H19l-4.6 3.4 1.8 5.6L12 14.2l-4.2 3.4 1.8-5.6L5 8.6h5.2z" />
    </svg>
  );
}
