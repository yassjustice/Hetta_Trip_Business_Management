import React, { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  FolderIcon,
  ChartBarSquareIcon,
  DocumentTextIcon,
  UserIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Vendors', href: '/vendors', icon: BuildingOfficeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Quote Comparison', href: '/quotes/compare', icon: ChartBarSquareIcon },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const SidebarContent = ({ isCollapsed = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo and Toggle Button */}
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-blue-900">
        {!isCollapsed && (
          <h1 className="text-white text-xl font-bold">Trip-Tex</h1>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1 rounded-md text-blue-300 hover:text-white hover:bg-blue-800 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1 rounded-md text-blue-300 hover:text-white hover:bg-blue-800 transition-colors mx-auto"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-blue-800 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  isActive
                    ? 'bg-blue-900 text-white'
                    : 'text-blue-300 hover:bg-blue-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isCollapsed ? 'justify-center' : ''
                )}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-blue-300' : 'text-blue-400 group-hover:text-blue-300',
                    'flex-shrink-0 h-6 w-6 transition-colors',
                    isCollapsed ? '' : 'mr-3'
                  )}
                  aria-hidden="true"
                />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* User section */}
        <div className="flex-shrink-0 flex border-t border-blue-700 p-4 bg-blue-800">
          {!isCollapsed ? (
            <>
              <Link 
                to="/profile" 
                className="flex-shrink-0 group block"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <div className="inline-block h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center">
                    {user?.avatar ? (
                      <img 
                        className="h-9 w-9 rounded-full" 
                        src={user.avatar} 
                        alt={user.name}
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs font-medium text-blue-300">View profile</p>
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                className="ml-auto flex items-center px-3 py-2 text-sm text-blue-300 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2 w-full">
              <Link 
                to="/profile" 
                className="group block"
                onClick={() => setSidebarOpen(false)}
                title={user?.name || 'Profile'}
              >
                <div className="inline-block h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      className="h-9 w-9 rounded-full" 
                      src={user.avatar} 
                      alt={user.name}
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-white" />
                  )}
                </div>
              </Link>
              <button
                onClick={logout}
                className="text-xs text-blue-300 hover:text-white"
                title="Logout"
              >
                Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-800">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent isCollapsed={false} />
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 z-20 ${
        sidebarCollapsed ? 'md:w-16' : 'md:w-64'
      }`}>
        <SidebarContent isCollapsed={sidebarCollapsed} />
      </div>
    </>
  );
};

export default Sidebar;
