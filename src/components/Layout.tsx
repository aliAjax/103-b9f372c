import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Moon, Search, CalendarDays } from 'lucide-react'
import StarField from './StarField'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen font-body relative">
      <StarField />
      <div className="relative z-10 flex min-h-screen">
        <nav className="w-16 flex flex-col items-center py-6 gap-2 border-r border-dreamscape/20 bg-midnight/60 backdrop-blur-md">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dreamscape to-nebula flex items-center justify-center">
              <span className="text-lg font-display text-white">梦</span>
            </div>
          </div>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-dreamscape/30 text-dreamscape shadow-lg shadow-dreamscape/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard size={20} />
          </NavLink>
          <NavLink
            to="/record"
            className={({ isActive }) =>
              `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-dreamscape/30 text-dreamscape shadow-lg shadow-dreamscape/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <Moon size={20} />
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-dreamscape/30 text-dreamscape shadow-lg shadow-dreamscape/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <Search size={20} />
          </NavLink>
          <NavLink
            to="/monthly"
            className={({ isActive }) =>
              `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-dreamscape/30 text-dreamscape shadow-lg shadow-dreamscape/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <CalendarDays size={20} />
          </NavLink>
        </nav>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Sidebar />
    </div>
  )
}
