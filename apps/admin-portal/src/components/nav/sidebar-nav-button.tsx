import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';

interface SidebarNavButtonProps {
  to: string;
  label: string;
  icon?: ReactNode;
}

/**
 * A sidebar nav entry. Active = accent-soft fill + accent text + an inline-end accent
 * bar (`border-e`, logical so it flips under RTL — design-spec §4 / U7).
 */
export function SidebarNavButton({ to, label, icon }: SidebarNavButtonProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-nav px-3 py-2 text-sm text-dim transition-colors hover:bg-surface-2 hover:text-text',
          isActive && 'border-e-2 border-accent bg-accent-soft text-accent',
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
