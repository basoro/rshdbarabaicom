import { useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Clock3, Menu, Phone, X } from 'lucide-react';
import type { MenuItem } from '@/types';

type SiteHeaderProps = {
  menu: MenuItem[];
  siteName: string;
};

function resolveItemUrl(item: MenuItem): string {
  if (item.href) return item.href;
  if (item.slug) return `/${item.slug}`;
  return '#';
}

function DropdownItem({ item, parentLabel }: { item: MenuItem; parentLabel: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const url = resolveItemUrl(item);
  const external = url.startsWith('http');
  const hasChildren = !!item.children?.length;
  const keyBase = `${parentLabel}-${item.label}`;

  const handleMouseEnter = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 150);
  };

  const linkClass =
    'flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm text-slate-600 transition hover:bg-[#fff3f8] hover:text-[#b73567]';

  if (hasChildren) {
    return (
      <div key={keyBase} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {external ? (
          <a href={url} target="_blank" rel="noreferrer" className={linkClass}>
            <span>{item.label}</span>
            <span className="text-sm text-slate-400">›</span>
          </a>
        ) : (
          <NavLink to={url} className={linkClass}>
            <span>{item.label}</span>
            <span className="text-sm text-slate-400">›</span>
          </NavLink>
        )}
        <div
          className={`absolute left-full top-0 z-20 ml-1 min-w-72 rounded-[1.75rem] border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-900/10 transition duration-200 ${
            isOpen ? 'visible opacity-100 translate-x-0' : 'invisible opacity-0 -translate-x-1 pointer-events-none'
          }`}
        >
          {item.children!.map((grandchild) => (
            <DropdownItem key={`${keyBase}-${grandchild.label}`} item={grandchild} parentLabel={keyBase} />
          ))}
        </div>
      </div>
    );
  }

  return external ? (
    <a
      key={keyBase}
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl px-4 py-3 text-sm text-slate-600 transition hover:bg-[#fff3f8] hover:text-[#b73567]"
    >
      {item.label}
    </a>
  ) : (
    <NavLink
      key={keyBase}
      to={url}
      className="block rounded-2xl px-4 py-3 text-sm text-slate-600 transition hover:bg-[#fff3f8] hover:text-[#b73567]"
    >
      {item.label}
    </NavLink>
  );
}

function HeaderMenu({ item }: { item: MenuItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 150);
  };

  if (item.children?.length) {
    return (
      <div className="relative pb-2" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-3 py-3 text-[15px] font-semibold transition ${
            isOpen ? 'text-[#c74378]' : 'text-slate-700 hover:text-[#c74378]'
          }`}
        >
          {item.label}
          <span className={`text-base leading-none transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
            +
          </span>
        </button>
        <div
          className={`absolute left-0 top-full z-20 mt-0 min-w-72 rounded-[1.75rem] border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-900/10 transition duration-200 ${
            isOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          {item.children.map((child) => (
            <DropdownItem key={`${item.label}-${child.label}`} item={child} parentLabel={item.label} />
          ))}
        </div>
      </div>
    );
  }

  const url = resolveItemUrl(item);
  const external = url.startsWith('http');
  const className =
    'inline-flex items-center px-3 py-3 text-[15px] font-semibold text-slate-700 transition hover:text-[#c74378]';

  return (
    <div className="relative pb-2">
      {external ? (
        <a href={url} target="_blank" rel="noreferrer" className={className}>
          {item.label}
        </a>
      ) : (
        <NavLink to={url} className={className}>
          {item.label}
        </NavLink>
      )}
    </div>
  );
}

export default function SiteHeader({ menu, siteName }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 bg-white text-slate-500">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-2 text-[11px] md:text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span>Jl. Murakata No. 04 Barabai, Kalimantan Selatan</span>
            <span>rshd@hstkab.go.id</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700">IGD 24 Jam</span>
            <span>Pengaduan 0852-4980-8800</span>
          </div>
        </div>
      </div>
      <div className="container flex items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-emerald-700/10 ring-1 ring-emerald-100">
              <img src="/favicon.ico" alt={siteName} className="h-11 w-11 object-contain" />
            </div>
            <div>
              <p className="font-display text-3xl leading-none text-slate-900 md:text-4xl">{siteName}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-emerald-700 md:text-xs">
                Smart, Green and Friendly Hospital
              </p>
            </div>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex rounded-2xl border border-emerald-200 p-3 text-emerald-800 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 px-5 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
              <Clock3 className="h-4 w-4" />
              Jam Pelayanan
            </p>
            <p className="mt-1 text-sm text-slate-600">08:00 - 11:00 • 14:00 - 16:00</p>
          </div>
          {/* <Link
            to="/admin/login"
            className="rounded-full border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 transition hover:border-[#d84f86]/30 hover:text-[#b73567]"
          >
            CMS
          </Link> */}
          <a
            href="https://play.google.com/store/apps/details?id=com.rshdbarabai.apam"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#d84f86] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#d84f86]/25 transition hover:bg-[#c43d72]"
          >
            Daftar
          </a>
        </div>
      </div>
      <div className="hidden border-t border-slate-100 bg-white lg:block">
        <div className="container flex items-center justify-between gap-3">
          <nav className="flex items-center gap-2 py-2">
            {menu.map((item) => (
              <HeaderMenu key={item.label} item={item} />
            ))}
          </nav>
          <div className="shrink-0 flex items-center gap-2 rounded-full bg-[#fff3f8] px-4 py-2 text-sm text-[#b73567]">
            <Phone className="h-4 w-4" />
            0811-800-5050
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-emerald-100 bg-white lg:hidden">
          <div className="container space-y-3 py-5">
            {menu.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 p-4">
                {resolveItemUrl(item).startsWith('http') ? (
                  <a
                    href={resolveItemUrl(item)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-slate-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={resolveItemUrl(item)}
                    className="text-sm font-semibold text-slate-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
                {item.children?.length ? (
                  <div className="mt-3 grid gap-2">
                    {item.children.map((child) => (
                      resolveItemUrl(child).startsWith('http') ? (
                        <a
                          key={child.label}
                          href={resolveItemUrl(child)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </a>
                      ) : (
                        <Link
                          key={child.label}
                          to={resolveItemUrl(child)}
                          className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      )
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Link
              to="/admin/login"
              className="block rounded-2xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Buka CMS
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
