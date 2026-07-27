import { useState, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/assets/resources/aspiretowards-logo-optimized.png" alt="AspireTowards Logo" className="h-16 w-16 sm:h-20 sm:w-20" />
              <span className="text-2xl sm:text-3xl font-display font-bold text-gray-900 leading-none mt-0.5">
                AspireTowards
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-teal-600 font-medium transition">Home</Link>
              <Link to="/properties" className="text-gray-600 hover:text-teal-600 font-medium transition">Properties</Link>
              {isHomePage ? (
                <>
                  <a href="#why-direct" className="text-gray-600 hover:text-teal-600 font-medium transition">Why Book Direct</a>
                  <a href="#contact" className="text-gray-600 hover:text-teal-600 font-medium transition">Contact</a>
                </>
              ) : (
                <>
                  <Link to="/#why-direct" className="text-gray-600 hover:text-teal-600 font-medium transition">Why Book Direct</Link>
                  <Link to="/#contact" className="text-gray-600 hover:text-teal-600 font-medium transition">Contact</Link>
                </>
              )}
            </div>
            <div className="hidden md:block">
              <Link to="/auth/login" className="text-gray-600 hover:text-teal-600 font-medium transition">
                Host Login
              </Link>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-2xl z-50 md:hidden">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-display font-bold text-gray-900">Menu</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Home</Link>
                <Link to="/properties" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Properties</Link>
                {isHomePage ? (
                  <>
                    <a href="#why-direct" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Why Book Direct</a>
                    <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Contact</a>
                  </>
                ) : (
                  <>
                    <Link to="/#why-direct" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Why Book Direct</Link>
                    <Link to="/#contact" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Contact</Link>
                  </>
                )}
                <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Host Login</Link>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-display font-bold text-xl mb-4">AspireTowards</h3>
              <p className="text-gray-400">Mountain escapes and family-friendly vacation rentals</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/properties" className="hover:text-white transition">Properties</Link></li>
                <li><a href="#why-direct" className="hover:text-white transition">Why Book Direct</a></li>
                <li><Link to="/auth/login" className="hover:text-white transition">Host Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2">
                <li>Email: aspiretowards@gmail.com</li>
                <li>Phone: +1 (518) 217-8257</li>
                <li>Available 24/7</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AspireTowards. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
