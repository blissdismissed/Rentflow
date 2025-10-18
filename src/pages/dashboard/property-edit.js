// Property Edit Page - Image Management with Drag & Drop
const API_URL = window.CONFIG?.API_URL || 'http://localhost:5000';

let currentProperty = null;
let propertyId = null;
let sortableInstance = null;
let selectedImageId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    propertyId = urlParams.get('id');

    if (!propertyId) {
        showToast('No property ID provided', 'error');
        window.location.href = '/src/pages/dashboard/properties.html';
        return;
    }

    initializePage();
});

async function initializePage() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Setup event listeners
    setupEventListeners();

    // Load property data
    await loadProperty();

    // Initialize drag and drop
    initializeSortable();
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Upload zone
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop on upload zone
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFileSelect({ target: { files: e.dataTransfer.files } });
    });

    // Forms
    document.getElementById('detailsForm').addEventListener('submit', handleDetailsSave);
    document.getElementById('pricingForm').addEventListener('submit', handlePricingSave);

    // Modal actions
    document.getElementById('setFeaturedBtn').addEventListener('click', handleSetFeatured);
    document.getElementById('editCaptionBtn').addEventListener('click', handleEditCaption);
    document.getElementById('deleteImageBtn').addEventListener('click', handleDeleteImage);
    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}

async function loadProperty() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/properties/${propertyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load property');

        const data = await response.json();
        currentProperty = data.data.property;

        // Update page title
        document.getElementById('propertyTitle').textContent = `Edit ${currentProperty.name}`;

        // Render images
        renderImages();

        // Populate form fields
        populateForms();
    } catch (error) {
        console.error('Error loading property:', error);
        showToast('Failed to load property', 'error');
    }
}

function renderImages() {
    const imageGrid = document.getElementById('imageGrid');
    const emptyState = document.getElementById('emptyState');
    const images = currentProperty.images || [];

    if (images.length === 0) {
        imageGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    imageGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Sort by order field if exists
    const sortedImages = images.sort((a, b) => (a.order || 0) - (b.order || 0));

    imageGrid.innerHTML = sortedImages.map((img, index) => `
        <div class="image-grid-item relative rounded-lg overflow-hidden bg-gray-100" data-image-id="${img.id}">
            <div class="aspect-w-4 aspect-h-3">
                <img src="${img.thumbnailUrl || img.url}" alt="${img.caption || 'Property image'}" class="object-cover w-full h-full">
            </div>

            <!-- Featured Badge -->
            ${img.isFeatured || img.url === currentProperty.featuredImage ? `
                <div class="featured-badge absolute top-2 left-2 px-2 py-1 text-xs text-white rounded-full">
                    ★ Cover Photo
                </div>
            ` : ''}

            <!-- Image Actions -->
            <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                <button onclick="openImageModal('${img.id}')" class="px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100">
                    Actions
                </button>
            </div>

            <!-- Caption -->
            ${img.caption ? `
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p class="text-white text-xs truncate">${img.caption}</p>
                </div>
            ` : ''}

            <!-- Drag Handle -->
            <div class="absolute top-2 right-2 bg-white rounded-full p-1 shadow cursor-move">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                </svg>
            </div>
        </div>
    `).join('');

    // Reinitialize sortable after rendering
    initializeSortable();
}

function initializeSortable() {
    const imageGrid = document.getElementById('imageGrid');

    // Destroy existing instance if any
    if (sortableInstance) {
        sortableInstance.destroy();
    }

    // Create new sortable instance
    sortableInstance = Sortable.create(imageGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.image-grid-item',
        onEnd: handleImageReorder
    });
}

async function handleImageReorder(evt) {
    // Get new order of image IDs
    const imageElements = document.querySelectorAll('.image-grid-item');
    const newOrder = Array.from(imageElements).map(el => el.dataset.imageId);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/properties/${propertyId}/images/reorder`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageOrder: newOrder })
        });

        if (!response.ok) throw new Error('Failed to reorder images');

        const data = await response.json();
        currentProperty = data.data.property;

        showToast('Images reordered successfully', 'success');
    } catch (error) {
        console.error('Error reordering images:', error);
        showToast('Failed to reorder images', 'error');
        renderImages(); // Revert to original order
    }
}

async function handleFileSelect(event) {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;
    if (files.length > 10) {
        showToast('Maximum 10 images allowed per upload', 'error');
        return;
    }

    // Validate files
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            showToast('Only image files are allowed', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('Maximum file size is 10MB', 'error');
            return;
        }
    }

    await uploadImages(files);
}

async function uploadImages(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const progressBar = document.getElementById('progressBar');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatus = document.getElementById('uploadStatus');

    try {
        uploadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        uploadStatus.textContent = 'Uploading images...';

        const token = localStorage.getItem('token');

        // Create XMLHttpRequest to track progress
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
                uploadStatus.textContent = `Uploading... ${Math.round(percentComplete)}%`;
            }
        });

        xhr.addEventListener('load', async () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                currentProperty = data.data.property;

                progressBar.style.width = '100%';
                uploadStatus.textContent = 'Upload complete!';

                setTimeout(() => {
                    uploadProgress.classList.add('hidden');
                }, 1500);

                renderImages();
                showToast(data.message, 'success');

                // Reset file input
                document.getElementById('fileInput').value = '';
            } else {
                throw new Error('Upload failed');
            }
        });

        xhr.addEventListener('error', () => {
            throw new Error('Upload failed');
        });

        xhr.open('POST', `${API_URL}/api/properties/${propertyId}/images`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);

    } catch (error) {
        console.error('Error uploading images:', error);
        showToast('Failed to upload images', 'error');
        uploadProgress.classList.add('hidden');
    }
}

function openImageModal(imageId) {
    selectedImageId = imageId;
    document.getElementById('imageModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('imageModal').classList.add('hidden');
    selectedImageId = null;
}

async function handleSetFeatured() {
    if (!selectedImageId) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/properties/${propertyId}/images/${selectedImageId}/featured`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to set featured image');

        const data = await response.json();
        currentProperty = data.data.property;

        closeModal();
        renderImages();
        showToast('Cover photo updated successfully', 'success');
    } catch (error) {
        console.error('Error setting featured image:', error);
        showToast('Failed to update cover photo', 'error');
    }
}

async function handleEditCaption() {
    if (!selectedImageId) return;

    const image = (currentProperty.images || []).find(img => img.id === selectedImageId);
    const currentCaption = image?.caption || '';

    const newCaption = prompt('Enter image caption:', currentCaption);
    if (newCaption === null) return; // User cancelled

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/properties/${propertyId}/images/${selectedImageId}/caption`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caption: newCaption })
        });

        if (!response.ok) throw new Error('Failed to update caption');

        const data = await response.json();
        currentProperty = data.data.property;

        closeModal();
        renderImages();
        showToast('Caption updated successfully', 'success');
    } catch (error) {
        console.error('Error updating caption:', error);
        showToast('Failed to update caption', 'error');
    }
}

async function handleDeleteImage() {
    if (!selectedImageId) return;

    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/properties/${propertyId}/images/${selectedImageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete image');

        const data = await response.json();
        currentProperty = data.data.property;

        closeModal();
        renderImages();
        showToast('Image deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting image:', error);
        showToast('Failed to delete image', 'error');
    }
}

function populateForms() {
    // Details form
    document.getElementById('name').value = currentProperty.name || '';
    document.getElementById('description').value = currentProperty.description || '';
    document.getElementById('bedrooms').value = currentProperty.bedrooms || '';
    document.getElementById('bathrooms').value = currentProperty.bathrooms || '';
    document.getElementById('maxGuests').value = currentProperty.maxGuests || '';
    document.getElementById('type').value = currentProperty.type || 'house';

    // Pricing form
    document.getElementById('basePrice').value = currentProperty.basePrice || '';
    document.getElementById('cleaningFee').value = currentProperty.cleaningFee || '';
    document.getElementById('minNights').value = currentProperty.minNights || '1';
    document.getElementById('maxNights').value = currentProperty.maxNights || '365';
    document.getElementById('publiclyVisible').checked = currentProperty.publiclyVisible || false;
}

async function handleDetailsSave(e) {
    e.preventDefault();

    const updatedData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        bedrooms: parseInt(document.getElementById('bedrooms').value),
        bathrooms: parseFloat(document.getElementById('bathrooms').value),
        maxGuests: parseInt(document.getElementById('maxGuests').value),
        type: document.getElementById('type').value
    };

    await updateProperty(updatedData);
}

async function handlePricingSave(e) {
    e.preventDefault();

    const updatedData = {
        basePrice: parseFloat(document.getElementById('basePrice').value),
        cleaningFee: parseFloat(document.getElementById('cleaningFee').value) || 0,
        minNights: parseInt(document.getElementById('minNights').value),
        maxNights: parseInt(document.getElementById('maxNights').value),
        publiclyVisible: document.getElementById('publiclyVisible').checked
    };

    await updateProperty(updatedData);
}

async function updateProperty(data) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/properties/${propertyId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update property');

        const result = await response.json();
        currentProperty = result.data.property;

        showToast('Property updated successfully', 'success');
    } catch (error) {
        console.error('Error updating property:', error);
        showToast('Failed to update property', 'error');
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active', 'border-blue-500', 'text-blue-600');
            btn.classList.remove('border-transparent', 'text-gray-500');
        } else {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `tab-${tabName}`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;

    toast.classList.remove('hidden', 'bg-green-500', 'bg-red-500', 'bg-blue-500');
    toast.classList.add(type === 'error' ? 'bg-red-500' : type === 'info' ? 'bg-blue-500' : 'bg-green-500');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
