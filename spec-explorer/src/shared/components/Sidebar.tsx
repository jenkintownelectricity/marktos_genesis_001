import { NavLink } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FolderIcon,
  PlusCircleIcon,
  Cog6ToothIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Explorer', href: '/explorer', icon: MagnifyingGlassIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Generator', href: '/generator', icon: PlusCircleIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <FireIcon className="h-8 w-8 text-fire-500" />
        <span className="ml-3 text-xl font-bold">SPEC Explorer</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <p>SPEC Explorer v1.0.0</p>
          <p>Offline-First Architecture</p>
        </div>
      </div>
    </div>
  );
}
