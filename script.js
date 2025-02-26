// Configuration
const frameColors = {
    black: '#000000',
    navy: '#001F3F',
    pink: '#FF69B4',
    green: '#4CAF50',
    blue: '#2196F3', 
    yellow: '#FFEB3B',
    purple: '#9C27B0',
    red: '#F44336'
};

// Actual sticker URLs should replace placeholders in production
const stickerSets = {
    girlypop: [
        { url: '/api/placeholder/60/60', offsetX: 0.1, offsetY: 0.1 },
        { url: '/api/placeholder/50/50', offsetX: 0.8, offsetY: 0.2 },
        { url: '/api/placeholder/70/70', offsetX: 0.5, offsetY: 0.8 }
    ],
    cute: [
        { url: '/api/placeholder/50/50', offsetX: 0.2, offsetY: 0.2 },
        { url: '/api/placeholder/60/60', offsetX: 0.7, offsetY: 0.3 },
        { url: '/api/placeholder/40/40', offsetX: 0.5, offsetY: 0.7 }
    ],
    party: [
        { url: '/api/placeholder/70/70', offsetX: 0.8, offsetY: 0.1 },
        { url: '/api/placeholder/60/60', offsetX: 0.2, offsetY: 0.8 },
        { url: '/api/placeholder/50/50', offsetX: 0.5, offsetY: 0.5 }
    ],
    none: []
};

// State variables
let cameraActive = false;
let imageUrl = null;
let selectedFrame = 'black';
let selectedTheme = 'none';
let stream = null;
let activeStickers = [];
let isDragging = false;
let currentSticker = null;
let initialX = 0;
let initialY = 0;

// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startCameraBtn = document.getElementById('start-camera-btn');
const captureBtn = document.getElementById('capture-btn');
const cancelBtn = document.getElementById('cancel-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const cameraSection = document.getElementById('camera-section');
const previewSection = document.getElementById('preview-section');
const startScreen = document.getElementById('start-screen');
const loadingScreen = document.getElementById('loading-screen');
const stickersContainer = document.getElementById('stickers-container');

// Initialize UI
function initializeUI() {
    // Initialize frame color options
    const frameColorContainer = document.getElementById('frame-colors');
    frameColorContainer.innerHTML = '';
    
    Object.entries(frameColors).forEach(([color, hex]) => {
        const div = document.createElement('div');
        div.className = 'color-option';
        div.dataset.color = color;
        div.style.backgroundColor = hex;
        
        if (color === selectedFrame) {
            div.classList.add('selected');
        }
        
        div.addEventListener('click', () => selectFrame(color, div));
        frameColorContainer.appendChild(div);
    });

    // Initialize theme options
    const themeContainer = document.getElementById('themes');
    themeContainer.innerHTML = '';
    
    ['none', 'girlypop', 'cute', 'party'].forEach(theme => {
        const btn = document.createElement('button');
        btn.className = 'theme-option';
        btn.dataset.theme = theme;
        btn.textContent = theme === 'none' ? 'Tanpa Stiker' : theme;
        
        if (theme === selectedTheme) {
            btn.classList.add('selected');
        }
        
        btn.addEventListener('click', () => selectTheme(theme, btn));
        themeContainer.appendChild(btn);
    });
}

// Frame and Theme Selection
function selectFrame(color, element) {
    selectedFrame = color;
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    updatePreview();
}

function selectTheme(theme, element) {
    selectedTheme = theme;
    document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    updateStickers();
}

// Camera Functions
async function startCamera() {
    showLoading();
    try {
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // Make sure video is loaded
        video.onloadedmetadata = () => {
            cameraActive = true;
            hideLoading();
            showSection(cameraSection);
        };
    } catch (error) {
        console.error('Camera error:', error);
        hideLoading();
        showAlert('Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses kamera atau coba di perangkat lain.');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        cameraActive = false;
    }
}

function captureImage() {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to image URL
    imageUrl = canvas.toDataURL('image/png');
    
    // Stop the camera
    stopCamera();
    
    // Show preview
    showPreview();
}

// Image Handling
function handleImageUpload(file) {
    showLoading();
    
    const reader = new FileReader();
    reader.onload = (e) => {
        imageUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
            // Set canvas dimensions based on image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw the image
            ctx.drawImage(img, 0, 0);
            
            hideLoading();
            showPreview();
        };
        img.onerror = () => {
            hideLoading();
            showAlert('Tidak dapat memuat gambar. Silakan coba gambar lain.');
            resetApp();
        };
        img.src = imageUrl;
    };
    reader.onerror = () => {
        hideLoading();
        showAlert('Gagal membaca file. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
}

// Preview and editing
function showPreview() {
    showSection(previewSection);
    initializeUI();
    updatePreview();
}

function updatePreview() {
    if (!imageUrl) return;
    
    const img = new Image();
    img.onload = () => {
        // Draw image on canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Add frame
        drawFrame();
    };
    img.src = imageUrl;
}

function drawFrame() {
    // Draw border/frame
    const frameWidth = 20;
    const frameColor = frameColors[selectedFrame];
    
    ctx.save();
    
    // Draw outer frame
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Add watermark
    ctx.fillStyle = frameColor;
    ctx.globalAlpha = 0.7;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Photobooth App', canvas.width - 30, canvas.height - 20);
    
    // Add date
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(new Date().toLocaleDateString(), 30, canvas.height - 20);
    
    ctx.restore();
}

function updateStickers() {
    // Clear existing stickers
    stickersContainer.innerHTML = '';
    activeStickers = [];
    
    if (selectedTheme === 'none') return;
    
    // Add new stickers
    const stickers = stickerSets[selectedTheme];
    stickers.forEach(sticker => {
        const stickerImg = document.createElement('img');
        stickerImg.src = sticker.url;
        stickerImg.className = 'sticker';
        stickerImg.draggable = false; // Handle drag manually
        
        // Position sticker
        const x = sticker.offsetX * canvas.width - (stickerImg.width || 50) / 2;
        const y = sticker.offsetY * canvas.height - (stickerImg.height || 50) / 2;
        
        stickerImg.style.left = x + 'px';
        stickerImg.style.top = y + 'px';
        
        // Add drag events
        setupStickerDrag(stickerImg);
        
        // Add to container
        stickersContainer.appendChild(stickerImg);
        
        // Add to active stickers array
        activeStickers.push({
            element: stickerImg,
            x: x,
            y: y
        });
    });
}

// Sticker Dragging
function setupStickerDrag(element) {
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag, { passive: false });
    
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, { passive: false });
    
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    e.preventDefault();
    
    if (e.type === 'mousedown') {
        initialX = e.clientX;
        initialY = e.clientY;
    } else if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX;
        initialY = e.touches[0].clientY;
    }
    
    isDragging = true;
    currentSticker = this;
    
    // Bring to front
    currentSticker.style.zIndex = 10;
    
    // Find the sticker in our array
    const stickerIndex = activeStickers.findIndex(s => s.element === currentSticker);
    if (stickerIndex >= 0) {
        activeStickers[stickerIndex].startX = parseInt(currentSticker.style.left) || 0;
        activeStickers[stickerIndex].startY = parseInt(currentSticker.style.top) || 0;
    }
}

function drag(e) {
    if (!isDragging || !currentSticker) return;
    
    e.preventDefault();
    
    let currentX, currentY;
    
    if (e.type === 'mousemove') {
        currentX = e.clientX;
        currentY = e.clientY;
    } else if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    }
    
    // Find the sticker in our array
    const stickerIndex = activeStickers.findIndex(s => s.element === currentSticker);
    if (stickerIndex >= 0) {
        const dx = currentX - initialX;
        const dy = currentY - initialY;
        
        const newX = activeStickers[stickerIndex].startX + dx;
        const newY = activeStickers[stickerIndex].startY + dy;
        
        activeStickers[stickerIndex].x = newX;
        activeStickers[stickerIndex].y = newY;
        
        currentSticker.style.left = newX + 'px';
        currentSticker.style.top = newY + 'px';
    }
}

function endDrag() {
    isDragging = false;
    if (currentSticker) {
        currentSticker.style.zIndex = 1;
        currentSticker = null;
    }
}

// Download with applied effects
function downloadImage() {
    // Create a new canvas for the final image with frame and stickers
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    
    // Draw the current canvas content (includes frame)
    finalCtx.drawImage(canvas, 0, 0);
    
    // Add stickers to final image
    if (selectedTheme !== 'none') {
        activeStickers.forEach(sticker => {
            const img = sticker.element;
            const x = parseInt(img.style.left) || 0;
            const y = parseInt(img.style.top) || 0;
            const width = img.width || 50;
            const height = img.height || 50;
            
            finalCtx.drawImage(img, x, y, width, height);
        });
    }
    
    // Create download link
    const link = document.createElement('a');
    link.download = `photobooth-${Date.now()}.png`;
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
}

// App state management
function resetApp() {
    imageUrl = null;
    selectedFrame = 'black';
    selectedTheme = 'none';
    activeStickers = [];
    
    if (cameraActive) {
        stopCamera();
    }
    
    showSection(startScreen);
}

// UI Helpers
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.add('hidden');
    });
    
    // Show desired section
    section.classList.remove('hidden');
}

function showLoading() {
    loadingScreen.classList.remove('hidden');
}

function hideLoading() {
    loadingScreen.classList.add('hidden');
}

function showAlert(message) {
    alert(message);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Start with a check if we have camera access
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {
            startCameraBtn.disabled = true;
            startCameraBtn.title = 'Akses kamera tidak tersedia';
            startCameraBtn.classList.add('btn-disabled');
        });
    
    // Initialize UI
    initializeUI();
    
    // Setup event listeners
    startCameraBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', captureImage);
    cancelBtn.addEventListener('click', () => {
        stopCamera();
        showSection(startScreen);
    });
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
    downloadBtn.addEventListener('click', downloadImage);
    resetBtn.addEventListener('click', resetApp);
    
    // Prevent context menu on stickers for better UX
    stickersContainer.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('sticker')) {
            e.preventDefault();
        }
    });
});
