import { useEffect, useState } from 'react';
import { Menu, Navigation, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useScrollPosition } from '@/shared/hooks';
import type { NavItem } from './nav';

export function NavBar({ items }: { items: NavItem[] }) {
  const scrolled = useScrollPosition() > 20;
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <nav className={`glass-nav fixed top-0 left-0 right-0 z-[1000] ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="返回 TransitReach 深圳首页">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Navigation size={18} color="white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[15px] font-bold text-slate-900 leading-tight">TransitReach 深圳</div>
              <div className="text-[10px] text-slate-500 leading-tight font-medium tracking-wide uppercase">深圳公共交通可达性</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {items.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-[3px] after:rounded-full ${isActive ? 'text-teal-700 after:bg-gradient-to-r after:from-teal-400 after:to-teal-600' : 'text-slate-500 hover:text-teal-700'}`}>
                <Icon size={15} strokeWidth={2.2} />{label}
              </NavLink>
            ))}
          </div>
          <button onClick={() => setOpen(value => !value)} className="btn-icon md:hidden" aria-label={open ? '关闭菜单' : '打开菜单'}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          {open && (
            <div className="md:hidden absolute top-16 right-4 glass-strong p-2 min-w-[210px] z-50 fade-slide-up">
              {items.map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${isActive ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon size={16} />{label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
