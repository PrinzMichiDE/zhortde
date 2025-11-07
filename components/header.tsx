'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 transform">
              Zhort
            </Link>
            <div className="hidden md:flex space-x-1">
              <Link
                href="/"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-indigo-50 relative group"
              >
                Home
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
              <Link
                href="/paste/create"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-indigo-50 relative group"
              >
                Paste
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
              <Link
                href="/api"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-indigo-50 relative group"
              >
                API
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
              {session && (
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-indigo-50 relative group"
                >
                  Dashboard
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-200 to-purple-200 animate-pulse" />
            ) : session ? (
              <Menu as="div" className="relative">
                <MenuButton className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200 group">
                  <UserCircleIcon className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" />
                  <span className="hidden md:inline text-sm font-medium">
                    {session.user.email}
                  </span>
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 overflow-hidden">
                  <div className="py-1">
                    <MenuItem>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2.5 text-sm text-gray-700 data-[focus]:bg-gradient-to-r data-[focus]:from-indigo-50 data-[focus]:to-purple-50 data-[focus]:text-indigo-600 transition-all duration-200"
                      >
                        📊 Dashboard
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 data-[focus]:bg-gradient-to-r data-[focus]:from-red-50 data-[focus]:to-orange-50 data-[focus]:text-red-600 transition-all duration-200"
                      >
                        🚪 Logout
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-indigo-50"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

