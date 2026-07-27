import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import axios from 'axios'

interface Property {
  id: number
  name: string
  slug: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  basePrice: number
  pricePerNight: number
  cleaningFee: number
  featuredImage?: string
  images?: string[]
  amenities?: string[]
  cancellationPolicy?: string
}

type Season = 'winter' | 'autumn' | 'summer' | null

const seasonalThemes = {
  winter: {
    message: '❄️ Perfect for winter skiing at Bromley Mountain!',
    bgClass: 'from-blue-50 to-blue-100',
    cardClass: 'from-blue-50 to-white',
    btnClass: 'from-blue-700 to-blue-600',
    btnHoverClass: 'from-blue-800 to-blue-700',
    priceClass: 'from-blue-100 to-blue-50',
    borderClass: 'border-blue-400'
  },
  autumn: {
    message: '🍂 Experience stunning fall foliage!',
    bgClass: 'from-amber-50 to-orange-100',
    cardClass: 'from-amber-50 to-white',
    btnClass: 'from-amber-700 to-orange-600',
    btnHoverClass: 'from-amber-800 to-orange-700',
    priceClass: 'from-amber-100 to-amber-50',
    borderClass: 'border-orange-400'
  },
  summer: {
    message: '☀️ Enjoy hiking the Appalachian Trail!',
    bgClass: 'from-green-50 to-emerald-100',
    cardClass: 'from-green-50 to-white',
    btnClass: 'from-green-700 to-emerald-600',
    btnHoverClass: 'from-green-800 to-emerald-700',
    priceClass: 'from-green-100 to-green-50',
    borderClass: 'border-green-400'
  }
}

export default function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [nights, setNights] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [season, setSeason] = useState<Season>(null)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [cryptoPrices, setCryptoPrices] = useState({ eth: 0, btc: 0 })

  useEffect(() => {
    loadProperty()
    checkWalletConnection()
  }, [slug])

  useEffect(() => {
    if (checkIn && checkOut) {
      calculateNights()
      updateSeasonalTheme()
    }
  }, [checkIn, checkOut])

  useEffect(() => {
    if (walletConnected) {
      fetchCryptoPrices()
    }
  }, [walletConnected, nights])

  const getSeason = (dateString: string): Season => {
    if (!dateString) return null
    const date = new Date(dateString)
    const month = date.getMonth() + 1

    // Winter: December to April
    if (month === 12 || (month >= 1 && month <= 4)) {
      return 'winter'
    }
    // Autumn: September to November
    else if (month >= 9 && month <= 11) {
      return 'autumn'
    }
    // Summer: May to August
    else {
      return 'summer'
    }
  }

  const updateSeasonalTheme = () => {
    const newSeason = getSeason(checkIn)
    setSeason(newSeason)
  }

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setWalletConnected(true)
          setWalletAddress(`${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
        }
      } catch (error) {
        console.error('Error checking wallet:', error)
      }
    }
  }

  const connectWallet = async (walletType: string) => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet to use crypto payments')
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length > 0) {
        setWalletConnected(true)
        setWalletAddress(`${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`)
        setShowWalletModal(false)
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Failed to connect wallet')
    }
  }

  const fetchCryptoPrices = async () => {
    const total = calculateTotal()
    if (total === 0) return

    // Mock crypto prices - in production, fetch from an API
    const ethPrice = 2500 // USD per ETH
    const btcPrice = 45000 // USD per BTC

    setCryptoPrices({
      eth: parseFloat((total / ethPrice).toFixed(4)),
      btc: parseFloat((total / btcPrice).toFixed(6))
    })
  }

  const loadProperty = async () => {
    try {
      const response = await axios.get(`/api/public/properties/${slug}`)
      if (response.data.success) {
        setProperty(response.data.property)
      }
    } catch (error) {
      console.error('Error loading property:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateNights = () => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn)
      const end = new Date(checkOut)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNights(diffDays)
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates')
      return
    }

    const params = new URLSearchParams({
      propertyId: property?.id.toString() || '',
      checkIn,
      checkOut,
      guests: guests.toString(),
      ...(walletConnected && { paymentMethod: 'crypto' })
    })
    navigate(`/booking?${params.toString()}`)
  }

  const handleCryptoPayment = () => {
    if (!walletConnected) {
      setShowWalletModal(true)
      return
    }
    // Navigate to booking with crypto payment method
    const params = new URLSearchParams({
      propertyId: property?.id.toString() || '',
      checkIn,
      checkOut,
      guests: guests.toString(),
      paymentMethod: 'crypto'
    })
    navigate(`/booking?${params.toString()}`)
  }

  const getImages = () => {
    if (!property) return []
    const images = property.images || []
    if (property.featuredImage && !images.includes(property.featuredImage)) {
      return [property.featuredImage, ...images]
    }
    return images.length > 0 ? images : ['https://via.placeholder.com/800x600?text=Property+Image']
  }

  const calculateTotal = () => {
    if (!property || nights === 0) return 0
    const baseTotal = (property.pricePerNight * nights) + (property.cleaningFee || 0)
    // Apply 10% crypto discount if wallet connected
    return walletConnected ? baseTotal * 0.9 : baseTotal
  }

  const calculateDeposit = () => {
    return calculateTotal() * 0.1
  }

  const calculateBalance = () => {
    return calculateTotal() - calculateDeposit()
  }

  const theme = season ? seasonalThemes[season] : null

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!property) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <Link to="/properties" className="text-teal-600 hover:text-teal-700">
            Back to Properties
          </Link>
        </div>
      </Layout>
    )
  }

  const images = getImages()

  return (
    <Layout>
      <div className={`transition-all duration-500 ${theme ? `bg-gradient-to-b ${theme.bgClass}` : ''}`}>
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/properties" className="text-teal-600 hover:text-teal-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Properties
          </Link>
        </div>

        {/* Crypto Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold">₿</div>
                <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-sm font-bold">Ξ</div>
              </div>
              <div>
                <p className="font-bold">Accept Crypto Payments</p>
                <p className="text-xs opacity-90">10% discount when paying with BTC or ETH</p>
              </div>
            </div>
            {!walletConnected && (
              <button
                onClick={() => setShowWalletModal(true)}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Property Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <h1 className={`text-4xl font-display font-bold mb-2 transition-colors ${theme ? 'text-gray-900' : 'text-gray-900'}`}>
            {property.name}
          </h1>
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
            </svg>
            <span>{property.city}, {property.state}</span>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div
              className="h-96 lg:h-[400px] rounded-2xl lg:rounded-l-2xl lg:rounded-r-none overflow-hidden cursor-pointer"
              onClick={() => { setSelectedImageIndex(0); setLightboxOpen(true); }}
            >
              <img src={images[0]} alt={property.name} className="w-full h-full object-cover hover:opacity-90 transition" />
            </div>
            <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-1">
              {images.slice(1, 5).map((img, idx) => (
                <div
                  key={idx}
                  className={`overflow-hidden cursor-pointer ${idx === 3 ? 'rounded-br-2xl' : ''} ${idx === 1 ? 'rounded-tr-2xl' : ''}`}
                  onClick={() => { setSelectedImageIndex(idx + 1); setLightboxOpen(true); }}
                >
                  <img src={img} alt={`${property.name} ${idx + 2}`} className="w-full h-full object-cover hover:opacity-90 transition" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Property Details & Booking */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                    <div className="text-sm text-gray-600">Bedrooms</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                    <div className="text-sm text-gray-600">Bathrooms</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{property.maxGuests}</div>
                    <div className="text-sm text-gray-600">Max Guests</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this property</h2>
                <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {property.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center">
                        <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancellation Policy</h2>
                <p className="text-gray-700">{property.cancellationPolicy || 'Flexible cancellation policy. Contact host for details.'}</p>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className={`bg-white rounded-xl shadow-lg p-6 sticky top-24 transition-all duration-500 ${theme ? `bg-gradient-to-br ${theme.cardClass} border-2 ${theme.borderClass}` : ''}`}>
                {/* Wallet Connected Badge */}
                {walletConnected && (
                  <div className="mb-3 flex items-center bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
                    </svg>
                    <span>{walletAddress}</span>
                  </div>
                )}

                {/* Seasonal Message */}
                {season && theme && (
                  <div className={`mb-3 p-2 rounded-lg text-center text-sm font-medium bg-gradient-to-r ${theme.priceClass}`}>
                    {theme.message}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">${property.pricePerNight}</span>
                    <span className="text-gray-600 ml-2">/ night</span>
                  </div>
                  {property.cleaningFee > 0 && (
                    <p className="text-sm text-gray-500 mt-1">+ ${property.cleaningFee} cleaning fee</p>
                  )}
                  {walletConnected && (
                    <p className="text-sm text-purple-600 font-semibold mt-1">10% crypto discount applied!</p>
                  )}
                </div>

                {/* Crypto Price Display */}
                {walletConnected && nights > 0 && (
                  <div className="mb-4 text-sm text-purple-600 font-bold">
                    <span>≈ {cryptoPrices.eth} ETH</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span>≈ {cryptoPrices.btc} BTC</span>
                  </div>
                )}

                {/* Booking Form */}
                <form onSubmit={handleBooking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Breakdown */}
                  {nights > 0 && (
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-700">
                        <span>${property.pricePerNight} × {nights} nights</span>
                        <span>${property.pricePerNight * nights}</span>
                      </div>
                      {property.cleaningFee > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>Cleaning fee</span>
                          <span>${property.cleaningFee}</span>
                        </div>
                      )}
                      {walletConnected && (
                        <div className="flex justify-between text-purple-600 font-semibold">
                          <span>Crypto discount (10%)</span>
                          <span>-${((property.pricePerNight * nights + (property.cleaningFee || 0)) * 0.1).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className={`rounded-lg p-3 text-sm bg-gradient-to-r ${theme ? theme.priceClass : 'bg-teal-50'}`}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-700">Deposit (10% now):</span>
                          <span className="font-semibold text-teal-700">${calculateDeposit().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Balance (at check-in):</span>
                          <span className="font-semibold text-gray-700">${calculateBalance().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`w-full text-white py-3 rounded-lg font-semibold transition ${
                      theme
                        ? `bg-gradient-to-r ${theme.btnClass} hover:${theme.btnHoverClass}`
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    {nights > 0 ? 'Reserve' : 'Check Availability'}
                  </button>

                  {/* Crypto Payment Button */}
                  {nights > 0 && (
                    <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-purple-500 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-purple-700">Pay with Crypto</span>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">₿</div>
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">Ξ</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">BTC & ETH accepted • <strong className="text-purple-600">10% discount applied</strong></p>
                      <button
                        type="button"
                        onClick={handleCryptoPayment}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                      >
                        {walletConnected ? 'Book with Crypto' : 'Connect Wallet & Book'}
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    You won't be charged yet. Card will be authorized but not charged until host approves.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connect Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 relative border-2 border-purple-500">
              <button
                onClick={() => setShowWalletModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6 text-sm">Choose your preferred wallet to unlock Web3 payments</p>

              <div className="space-y-3">
                <div
                  onClick={() => connectWallet('metamask')}
                  className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      M
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">MetaMask</h3>
                      <p className="text-gray-400 text-xs">Most popular wallet</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>

                <div
                  onClick={() => connectWallet('walletconnect')}
                  className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      W
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">WalletConnect</h3>
                      <p className="text-gray-400 text-xs">Scan with mobile</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>

                <div
                  onClick={() => connectWallet('coinbase')}
                  className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      C
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Coinbase Wallet</h3>
                      <p className="text-gray-400 text-xs">Secure & easy</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-xs">By connecting, you agree to our Terms of Service</p>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {lightboxOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white text-4xl font-light hover:text-gray-300"
            >
              ×
            </button>

            <button
              onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-5xl font-light hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
            >
              ‹
            </button>

            <button
              onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % images.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-5xl font-light hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
            >
              ›
            </button>

            <div className="max-w-7xl max-h-screen p-8 w-full h-full flex flex-col items-center justify-center">
              <img
                src={images[selectedImageIndex]}
                alt={`${property.name} ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              <p className="text-white text-center mt-4 text-lg">
                {selectedImageIndex + 1} / {images.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
