import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import axios from 'axios'

interface Property {
  id: number
  name: string
  slug: string
  description: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  basePrice: number
  featuredImage?: string
  images?: string[]
}

interface Filters {
  minPrice: string
  maxPrice: string
  bedrooms: string
  maxGuests: string
  city: string
  sortBy: string
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    maxGuests: '',
    city: '',
    sortBy: 'featured'
  })

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [properties, filters])

  const loadProperties = async () => {
    try {
      const response = await axios.get('/api/public/properties')
      if (response.data.success) {
        setProperties(response.data.properties)
        setFilteredProperties(response.data.properties)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...properties]

    // Price filter
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.basePrice >= parseFloat(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.basePrice <= parseFloat(filters.maxPrice))
    }

    // Bedrooms filter
    if (filters.bedrooms) {
      filtered = filtered.filter(p => p.bedrooms >= parseInt(filters.bedrooms))
    }

    // Guests filter
    if (filters.maxGuests) {
      filtered = filtered.filter(p => p.maxGuests >= parseInt(filters.maxGuests))
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(p =>
        p.city.toLowerCase().includes(filters.city.toLowerCase())
      )
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.basePrice - b.basePrice)
        break
      case 'price-high':
        filtered.sort((a, b) => b.basePrice - a.basePrice)
        break
      case 'bedrooms':
        filtered.sort((a, b) => b.bedrooms - a.bedrooms)
        break
    }

    setFilteredProperties(filtered)
  }

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      maxGuests: '',
      city: '',
      sortBy: 'featured'
    })
  }

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const FilterSection = () => (
    <>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
        <select
          value={filters.bedrooms}
          onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Guests</label>
        <select
          value={filters.maxGuests}
          onChange={(e) => handleFilterChange('maxGuests', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Any</option>
          <option value="2">2+</option>
          <option value="4">4+</option>
          <option value="6">6+</option>
          <option value="8">8+</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
        <input
          type="text"
          placeholder="City name"
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    </>
  )

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold mb-2">Browse Properties</h1>
          <p className="text-xl text-teal-50">Find your perfect vacation rental</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full bg-white text-gray-700 px-4 py-3 rounded-lg font-medium shadow-sm border border-gray-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            Filters
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar (Desktop) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
              <FilterSection />
              <button
                onClick={clearFilters}
                className="w-full mt-2 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredProperties.length}</span> properties found
              </p>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="bedrooms">Bedrooms</option>
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading properties...</p>
                </div>
              </div>
            )}

            {/* Properties Grid */}
            {!loading && filteredProperties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProperties.map(property => {
                  const imageUrl = property.featuredImage || property.images?.[0] || 'https://via.placeholder.com/600x400?text=Property+Image'
                  return (
                    <Link
                      key={property.id}
                      to={`/property/${property.slug}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 cursor-pointer"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img src={imageUrl} alt={property.name} className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-teal-600">
                          ${property.basePrice}/night
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
                        <p className="text-gray-600 mb-4 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                          </svg>
                          {property.city}, {property.state}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <span>{property.bedrooms} bed</span>
                          <span>{property.bathrooms} bath</span>
                          <span>Sleeps {property.maxGuests}</span>
                        </div>
                        <div className="w-full bg-teal-600 text-white text-center py-3 rounded-lg font-medium hover:bg-teal-700 transition">
                          View Details & Book
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* No Results */}
            {!loading && filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters to see more results</p>
                <button
                  onClick={clearFilters}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 lg:hidden max-h-[90vh] overflow-hidden">
            <div className="flex flex-col h-full max-h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <FilterSection />
              </div>
              <div className="p-4 border-t bg-white sticky bottom-0">
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
