import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/clubs", label: "Clubs" },
  { href: "/rankings", label: "Rankings" },
  { href: "/network", label: "Network" },
  { href: "/h2h", label: "H2H" },
  { href: "/coaches", label: "Coaches" },
  { href: "/chat", label: "AI Coach" },
];

export default function Footer() {
  return (
    <footer className="mt-20 pb-8 sm:mt-24">
      <div className="page-container">
        <div className="divider" />
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-dim sm:flex-row sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Padel Passport &middot; Data from
            Playtomic
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
