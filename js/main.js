let currentSlide = 1;
        const totalSlides = 6;

        function updateSlides() {
            const slides = document.querySelectorAll('.slide');
            slides.forEach((slide, index) => {
                slide.classList.remove('active', 'prev', 'next');
                const slideNum = index + 1;
                
                if (slideNum === currentSlide) {
                    slide.classList.add('active');
                } else if (slideNum < currentSlide) {
                    slide.classList.add('prev');
                } else {
                    slide.classList.add('next');
                }
            });

            document.getElementById('current-slide').textContent = currentSlide;
        }

        function nextSlide() {
            if (currentSlide < totalSlides) {
                currentSlide++;
                updateSlides();
            }
        }

        function previousSlide() {
            if (currentSlide > 1) {
                currentSlide--;
                updateSlides();
            }
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                previousSlide();
            }
        });

        // Touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) {
                nextSlide();
            }
            if (touchEndX > touchStartX + 50) {
                previousSlide();
            }
        }

// Modal Gantt Functions - Replace these paths with your actual image paths
const ganttImages = {
    'quality-clinic': 'images/1.png',  // Tu imagen aquí
    'qc-alt': 'images/2.png',                // Tu imagen aquí
    'ai-camera': 'images/4.png',          // Tu imagen aquí
    'lorenzobot': 'images/3.png'         // Tu imagen aquí
};

const ganttTitles = {
    'quality-clinic': '🌐 Quality Clinic Unity - Gantt',
    'qc-alt': '🧠 QC ALT / DQITS - Gantt',
    'ai-camera': '🎥 AI Camera - Gantt',
    'lorenzobot': '🤖 LorenzoBot - Gantt'
};

// ============ VIDEO GALLERY ============
const videoGalleries = {
    'quality-clinic': [
        { src: 'videos/Demo_0.9.5_QCU.mp4', title: 'Demo 0.9.5' }
    ],
    'qc-alt': [
        { src: 'videos/Demo_v1.0.1_DQITS.mp4', title: 'Detección en Acción' }
    ],
    'ai-camera': [
        { src: 'videos/Demo_v1.1.2_AICAMERA.mp4', title: 'Detección de Movimiento' },
        { src: 'videos/Demo2_v1.1.2_AICAMERA.mp4', title: 'Visión de Operador' }
    ],
    'lorenzobot': [
        { src: 'videos/Demo_v1.3.0_DENBOT.mp4', title: 'Bot en Acción' }
    ]
};

// ============ IMAGE GALLERY ============
const imageGalleries = {
    'quality-clinic': [
        { src: 'images/QCU1.png', title: 'Vista inicial Planeta' },
        { src: 'images/QCU2.png', title: 'Vista libre MTS' },
        { src: 'images/QCU3.PNG', title: 'Vista Cenital' },
        { src: 'images/QCU4.png', title: 'Datos en vivo API REST' }
    ],
    'qc-alt': [
        { src: 'images/DQITS1.png', title: 'Interfaz Principal' },
        { src: 'images/DQITS2.png', title: 'Detección Activa' },
        { src: 'images/DQITS3.png', title: 'Respuesta de FASTAPI' }
    ],
    'ai-camera': [
        { src: 'images/AICAMERA1.png', title: 'Interfaz de programa' },
        { src: 'images/AICAMERA2.png', title: 'Multi Visión' },
        { src: 'images/AICAMERA3.png', title: 'Interfaz de Operador' },
        { src: 'images/AICAMERA4.png', title: 'Editor de RIO' },
        { src: 'images/AICAMERA5.png', title: 'Detección en vivo' },
        { src: 'images/AICAMERA6.png', title: 'Alerta y detección de objeto' }
    ],
    'lorenzobot': [
        { src: 'images/DENBOT1.png', title: 'Interfaz Bot' },
        { src: 'images/DENBOT2.png', title: 'Reportes' },
        { src: 'images/DENBOT3.png', title: 'Flujo General' }
    ]
};

function openVideoGallery(projectId) {
    const modal = document.getElementById('videoGalleryModal');
    const title = document.getElementById('videoGalleryTitle');
    const grid = document.getElementById('videoGalleryGrid');

    const videos = videoGalleries[projectId] || [];

    title.textContent = ganttTitles[projectId]?.replace('Gantt', 'Videos') || 'Galería de Videos';

    grid.innerHTML = videos.map((video, index) => `
        <div class="gallery-item" onclick="playVideo('${projectId}', ${index})">
            <video src="${video.src}" preload="metadata"></video>
            <div class="gallery-item-title">${video.title}</div>
        </div>
    `).join('');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoGallery() {
    const modal = document.getElementById('videoGalleryModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function playVideo(projectId, index) {
    const video = videoGalleries[projectId][index];
    const modal = document.getElementById('videoPlayerModal');
    const title = document.getElementById('videoPlayerTitle');
    const player = document.getElementById('videoPlayer');

    title.textContent = video.title;
    player.src = video.src;
    player.load();

    closeVideoGallery();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoPlayer() {
    const modal = document.getElementById('videoPlayerModal');
    const player = document.getElementById('videoPlayer');

    player.pause();
    player.src = '';

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openImageGallery(projectId) {
    const modal = document.getElementById('imageGalleryModal');
    const title = document.getElementById('imageGalleryTitle');
    const grid = document.getElementById('imageGalleryGrid');

    const images = imageGalleries[projectId] || [];

    title.textContent = ganttTitles[projectId]?.replace('Gantt', 'Imágenes') || 'Galería de Imágenes';

    grid.innerHTML = images.map((image, index) => `
        <div class="gallery-item" onclick="openImageLightbox('${projectId}', ${index})">
            <img src="${image.src}" alt="${image.title}">
            <div class="gallery-item-title">${image.title}</div>
        </div>
    `).join('');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageGallery() {
    const modal = document.getElementById('imageGalleryModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openImageLightbox(projectId, index) {
    const image = imageGalleries[projectId][index];
    const modal = document.getElementById('imageLightboxModal');
    const title = document.getElementById('imageLightboxTitle');
    const img = document.getElementById('lightboxImage');

    title.textContent = image.title;
    img.src = image.src;
    img.alt = image.title;

    closeImageGallery();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
    const modal = document.getElementById('imageLightboxModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openGanttModal(projectId) {
    const modal = document.getElementById('ganttModal');
    const modalTitle = document.getElementById('modalTitle');
    const ganttImage = document.getElementById('ganttImage');

    modalTitle.textContent = ganttTitles[projectId] || 'Gantt del Proyecto';
    ganttImage.src = ganttImages[projectId] || '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGanttModal() {
    const modal = document.getElementById('ganttModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on outside click
document.getElementById('ganttModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeGanttModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeGanttModal();
    }
});

// Zoom functionality for Gantt images with click position
function toggleZoom(img, event) {
    if (!img.classList.contains('zoomed')) {
        // Obtener las coordenadas del clic relativas a la imagen
        const rect = img.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calcular el porcentaje de posición en la imagen
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        // Establecer el punto de transformación donde se hizo clic
        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;

        // Aplicar zoom
        img.classList.add('zoomed');
        img.style.transform = 'scale(2)';

            // Actualizar indicador
        const zoomLevel = document.getElementById('zoomLevel');
        zoomLevel.textContent = '200%';

        // Ajustar scroll del contenedor para centrar el punto clickeado
        const container = img.parentElement;
        const scrollX = (x * 2) - (container.clientWidth / 2);
        const scrollY = (y * 2) - (container.clientHeight / 2);

        container.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'smooth'
        });
    } else {
        // Hacer zoom out
        img.classList.remove('zoomed');
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = 'center center';

        // Resetear indicador de zoom
        const zoomLevel = document.getElementById('zoomLevel');
        zoomLevel.textContent = '100%';
    }
}

// Reset zoom when closing modal
const originalCloseGanttModal = closeGanttModal;
closeGanttModal = function() {
    const ganttImage = document.getElementById('ganttImage');
    const zoomLevel = document.getElementById('zoomLevel');
    const container = document.querySelector('#ganttModal .modal-image-container');

    ganttImage.classList.remove('zoomed');
    ganttImage.style.transform = 'scale(1)';
    ganttImage.style.transformOrigin = 'center center';

    // Resetear scroll del contenedor
    container.scrollTo(0, 0);

    // Resetear indicador de zoom
    zoomLevel.textContent = '100%';

    originalCloseGanttModal();
};



// Close modals on outside click
document.getElementById('videoGalleryModal').addEventListener('click', function(e) {
    if (e.target === this) closeVideoGallery();
});

document.getElementById('imageGalleryModal').addEventListener('click', function(e) {
    if (e.target === this) closeImageGallery();
});

document.getElementById('videoPlayerModal').addEventListener('click', function(e) {
    if (e.target === this) closeVideoPlayer();
});

document.getElementById('imageLightboxModal').addEventListener('click', function(e) {
    if (e.target === this) closeImageLightbox();
});

        // Close modals on ESC (actualizar el existente)
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeGanttModal();
                closeVideoGallery();
                closeImageGallery();
                closeVideoPlayer();
                closeImageLightbox();
            }
        });

        // Theme Toggle
        function toggleTheme() {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        }

        // Load saved theme
        function loadTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
            }
        }

        // Initialize theme on page load
        loadTheme();

// Zoom con rueda del mouse (opcional)
function setupImageZoom() {
    const ganttImage = document.getElementById('ganttImage');
    const zoomLevel = document.getElementById('zoomLevel');

    ganttImage.addEventListener('wheel', function(e) {
        if (ganttImage.classList.contains('zoomed')) {
            e.preventDefault();

            const computedStyle = window.getComputedStyle(ganttImage);
            const transform = computedStyle.transform;
            let currentScale = 1;

            if (transform && transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                currentScale = matrix.a;
            }

            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(Math.max(1, currentScale + delta), 4);

            ganttImage.style.transform = `scale(${newScale})`;
            zoomLevel.textContent = Math.round(newScale * 100) + '%';

            if (newScale === 1) {
                ganttImage.classList.remove('zoomed');
                ganttImage.style.transformOrigin = 'center center';
                zoomLevel.textContent = '100%';
            }
        }
    });
}

// Llamar esta funcion cuando se carga la pagina
document.addEventListener('DOMContentLoaded', setupImageZoom);

        // Initialize
        updateSlides();
