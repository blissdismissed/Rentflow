const { Property, Booking } = require('../models')
const { Op } = require('sequelize')

const getProperties = async (req, res) => {
  try {
    const { status, type, search } = req.query
    const where = { userId: req.user.id }

    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } }
      ]
    }

    const properties = await Property.findAll({
      where,
      order: [['createdAt', 'DESC']]
    })

    res.json({
      success: true,
      data: { properties }
    })
  } catch (error) {
    console.error('Get properties error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    })
  }
}

const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          association: 'bookings',
          limit: 10,
          order: [['checkIn', 'DESC']]
        }
      ]
    })

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    res.json({
      success: true,
      data: { property }
    })
  } catch (error) {
    console.error('Get property error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching property',
      error: error.message
    })
  }
}

const createProperty = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      userId: req.user.id
    }

    const property = await Property.create(propertyData)

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: { property }
    })
  } catch (error) {
    console.error('Create property error:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating property',
      error: error.message
    })
  }
}

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    await property.update(req.body)

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: { property }
    })
  } catch (error) {
    console.error('Update property error:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating property',
      error: error.message
    })
  }
}

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    })

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    await property.destroy()

    res.json({
      success: true,
      message: 'Property deleted successfully'
    })
  } catch (error) {
    console.error('Delete property error:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting property',
      error: error.message
    })
  }
}

const uploadImages = async (req, res) => {
  // TODO: Implement S3 upload
  res.status(501).json({
    success: false,
    message: 'Image upload not yet implemented'
  })
}

const deleteImage = async (req, res) => {
  // TODO: Implement S3 delete
  res.status(501).json({
    success: false,
    message: 'Image deletion not yet implemented'
  })
}

const getAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const bookings = await Booking.findAll({
      where: {
        propertyId: req.params.id,
        status: { [Op.ne]: 'cancelled' },
        [Op.or]: [
          {
            checkIn: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            checkOut: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      }
    })

    res.json({
      success: true,
      data: { bookings }
    })
  } catch (error) {
    console.error('Get availability error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching availability',
      error: error.message
    })
  }
}

const blockDates = async (req, res) => {
  // TODO: Implement date blocking
  res.status(501).json({
    success: false,
    message: 'Date blocking not yet implemented'
  })
}

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadImages,
  deleteImage,
  getAvailability,
  blockDates
}
