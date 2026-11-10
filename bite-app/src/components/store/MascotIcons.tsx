// Personajes decorativos propios de BITE (misma línea simple y geométrica
// que SnackIcons) — la mariposa del checkout y los "snackers" aleatorios
// (persona, ave o mariposa) que aparecen y desaparecen en la tienda.
export function ButterflyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="1 0 38 27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 5Q15 1 13 2" />
      <path d="M21 5Q25 1 27 2" />
      <circle cx="20" cy="4.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M20 5L20 23" />
      <path d="M20 6C12 2 3 6 4 13C5 18 13 17 20 13Z" />
      <path d="M20 6C28 2 37 6 36 13C35 18 27 17 20 13Z" />
      <path d="M20 13C14 12 7 15 7 20C7 24 13 25 20 21Z" />
      <path d="M20 13C26 12 33 15 33 20C33 24 27 25 20 21Z" />
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
