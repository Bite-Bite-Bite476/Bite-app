// Logotipo oficial de BITE. — siempre esta imagen, nunca texto ni emoji.
export default function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return <img src="/bite-logo.png" alt="BITE." className={className} />;
}
