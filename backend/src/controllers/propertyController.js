const { Property, Booking } = require('../models')
const { Op } = require('sequelize')
const imageService = require('../services/imageService')

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
  try {
    const { id } = req.params;

    // Verify property ownership
    const property = await Property.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    // Validate file types and sizes
    const uploadedImages = [];
    for (const file of req.files) {
      try {
        imageService.validateImage(file);

        // Upload to S3 with optimization
        const imageMetadata = await imageService.uploadPropertyImage(
          file.buffer,
          property.id,
          file.originalname,
          {
            isFeatured: false,
            caption: req.body.caption || '',
            maxWidth: 1920,
            quality: 85
          }
        );

        uploadedImages.push(imageMetadata);
      } catch (err) {
        console.error(`Failed to upload ${file.originalname}:`, err);
        // Continue with other files
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All image uploads failed'
      });
    }

    // Update property images array
    const currentImages = property.images || [];
    const newImages = [...currentImages, ...uploadedImages];

    // If this is the first image and no featured image set, make it featured
    if (!property.featuredImage && uploadedImages.length > 0) {
      await property.update({
        images: newImages,
        featuredImage: uploadedImages[0].url
      });
    } else {
      await property.update({
        images: newImages
      });
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      data: {
        uploadedImages,
        property: await Property.findByPk(property.id)
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
}

const deleteImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Verify property ownership
    const property = await Property.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Find image in property images array
    const currentImages = property.images || [];
    const imageToDelete = currentImages.find(img => img.id === imageId);

    if (!imageToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in property'
      });
    }

    // Delete from S3 only if the image has an S3 key (not a stock photo or external URL)
    if (imageToDelete.key && imageToDelete.key.startsWith('properties/')) {
      try {
        await imageService.deleteImage(imageToDelete.key);
        console.log(`✅ Deleted image from S3: ${imageToDelete.key}`);
      } catch (err) {
        console.error('⚠️  Failed to delete from S3:', err);
        // Continue even if S3 delete fails (image might not exist in S3)
      }
    } else {
      console.log(`ℹ️  Skipping S3 deletion for external/stock image: ${imageToDelete.url || imageToDelete.id}`);
    }

    // Remove from database
    const updatedImages = currentImages.filter(img => img.id !== imageId);

    // If deleting the featured image, set a new one
    const updateData = { images: updatedImages };
    if (property.featuredImage === imageToDelete.url && updatedImages.length > 0) {
      updateData.featuredImage = updatedImages[0].url;
    } else if (property.featuredImage === imageToDelete.url) {
      updateData.featuredImage = null;
    }

    await property.update(updateData);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        property: await Property.findByPk(property.id)
      }
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
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

const reorderImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageOrder } = req.body; // Array of image IDs in new order

    // Verify property ownership
    const property = await Property.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (!Array.isArray(imageOrder)) {
      return res.status(400).json({
        success: false,
        message: 'imageOrder must be an array of image IDs'
      });
    }

    const currentImages = property.images || [];

    // Reorder images based on provided order
    const reorderedImages = imageOrder.map(imageId => {
      return currentImages.find(img => img.id === imageId);
    }).filter(Boolean); // Remove any null/undefined

    // Add any images not in the order array at the end
    const remainingImages = currentImages.filter(
      img => !imageOrder.includes(img.id)
    );

    const finalImages = [...reorderedImages, ...remainingImages];

    // Update order field for each image
    const imagesWithOrder = finalImages.map((img, index) => ({
      ...img,
      order: index
    }));

    await property.update({
      images: imagesWithOrder
    });

    res.json({
      success: true,
      message: 'Images reordered successfully',
      data: {
        property: await Property.findByPk(property.id)
      }
    });
  } catch (error) {
    console.error('Reorder images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering images',
      error: error.message
    });
  }
}

const setFeaturedImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Verify property ownership
    const property = await Property.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Find image in property images array
    const currentImages = property.images || [];
    const imageToFeature = currentImages.find(img => img.id === imageId);

    if (!imageToFeature) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Update featured image and set isFeatured flag
    const updatedImages = currentImages.map(img => ({
      ...img,
      isFeatured: img.id === imageId
    }));

    await property.update({
      featuredImage: imageToFeature.url,
      images: updatedImages
    });

    res.json({
      success: true,
      message: 'Featured image updated successfully',
      data: {
        property: await Property.findByPk(property.id)
      }
    });
  } catch (error) {
    console.error('Set featured image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting featured image',
      error: error.message
    });
  }
}

const updateImageCaption = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const { caption } = req.body;

    // Verify property ownership
    const property = await Property.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Update caption for specific image
    const currentImages = property.images || [];
    const updatedImages = currentImages.map(img => {
      if (img.id === imageId) {
        return { ...img, caption: caption || '' };
      }
      return img;
    });

    await property.update({
      images: updatedImages
    });

    res.json({
      success: true,
      message: 'Image caption updated successfully',
      data: {
        property: await Property.findByPk(property.id)
      }
    });
  } catch (error) {
    console.error('Update image caption error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating image caption',
      error: error.message
    });
  }
}

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadImages,
  deleteImage,
  reorderImages,
  setFeaturedImage,
  updateImageCaption,
  getAvailability,
  blockDates
}
