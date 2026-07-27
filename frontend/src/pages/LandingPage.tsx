import Layout from '../components/Layout'

export default function LandingPage() {
  return (
    <Layout>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-500 to-sky-500 text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
            Book Your Dream<br />Vacation Directly
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-teal-50 max-w-3xl mx-auto">
            Skip the fees. Support local hosts. Enjoy premium vacation rentals at better prices.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/properties" className="bg-white text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition hover:-translate-y-1">
              View Properties
            </a>
            <a href="#why-direct" className="bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-800 transition hover:-translate-y-1 border-2 border-white">
              Learn More
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
              </svg>
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
              </svg>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <section id="properties" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3 sm:mb-4">
              Featured Properties
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Discover our handpicked selection of premium vacation rentals
            </p>
          </div>

          <div className="text-center">
            <a href="/properties" className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-700 transition hover:-translate-y-1">
              View All Properties →
            </a>
          </div>
        </div>
      </section>

      {/* Why Book Direct */}
      <section id="why-direct" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Why Book Direct?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Save money and get a better experience by booking directly with us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Save Money */}
            <div className="bg-white p-6 sm:p-8 rounded-xl hover:-translate-y-1 transition text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-700 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Save 15-20%</h3>
              <p className="text-gray-600">No platform fees means better prices for you and better rates for hosts</p>
            </div>

            {/* Direct Support */}
            <div className="bg-white p-6 sm:p-8 rounded-xl hover:-translate-y-1 transition text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-700 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Direct Communication</h3>
              <p className="text-gray-600">Talk directly with your host for personalized service and local tips</p>
            </div>

            {/* Flexible Payments */}
            <div className="bg-white p-6 sm:p-8 rounded-xl hover:-translate-y-1 transition text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-700 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Payment</h3>
              <p className="text-gray-600">Pay just 10% deposit now, balance on arrival. Simple and secure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">Simple, fast, and secure booking process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Browse Properties</h3>
              <p className="text-gray-600 text-sm">Explore our collection of premium vacation rentals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Choose Dates</h3>
              <p className="text-gray-600 text-sm">Select your check-in and check-out dates</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Pay Deposit</h3>
              <p className="text-gray-600 text-sm">Secure your booking with just 10% deposit</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="font-bold text-lg mb-2">Enjoy Your Stay</h3>
              <p className="text-gray-600 text-sm">Get confirmed and enjoy your vacation!</p>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  )
}
