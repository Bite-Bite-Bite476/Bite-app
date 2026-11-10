// Personajes decorativos propios de BITE (misma línea simple y geométrica
// que SnackIcons) — el capibara del checkout y los "snackers" aleatorios
// que aparecen y desaparecen en la tienda.
export function CapybaraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="4 0 94 44" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 21 C10 12 18 7 32 8 C42 9 48 13 53 15 C56 10 60 7 66 7 L82 7 C88 7 92 9 93 13 C95 16 95 19 92 21 C89 23 85 23 81 22 C77 25 75 28 73 31 C60 35 40 35 24 34 C16 34 12 30 12 25 C12 22 13 21 14 21 Z" />
      <path d="M68 7 C68 2 74 2 74 7" />
      <circle cx="86" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <path d="M90 16 Q92.5 17.3 90.5 19" />
      <path d="M11 25 Q7 26 9 29" />
      <path d="M74 32 L73 40" />
      <path d="M70 40 L76 40" />
      <path d="M80 31 L80 39" />
      <path d="M77 39 L83 39" />
      <path d="M18 34 L17 41" />
      <path d="M14 41 L20 41" />
      <path d="M25 34 L26 42" />
      <path d="M23 42 L29 42" />
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
