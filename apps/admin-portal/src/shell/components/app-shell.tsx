import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * The one Sidebar + Topbar + Content shell (W1/F10). Grid layout (no max-w container,
 * W2); content scrolls under a sticky topbar. RTL flips the columns via logical props.
 */
export function AppShell() {
  return (
    <div className="grid min-h-dvh grid-cols-shell bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <Topbar />
        <main className="flex-1 px-6 pb-14 pt-6 md:px-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
