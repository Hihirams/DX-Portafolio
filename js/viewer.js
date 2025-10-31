// ============================================
// VIEWER.JS - Visor dinámico de portafolios
// ============================================

let currentSlide = 1;
let totalSlides = 0;
let projectsToShow = [];
let viewingUser = null;

// ==================== INIT ====================

document.addEventListener('dataLoaded', () => {
    console.log('✅ Datos cargados, inicializando Viewer...');
    initViewer();
});

async function initViewer() {
    // Determinar qué mostrar según localStorage
    const viewingUserId = localStorage.getItem('viewingUserId');
    const viewingProjectId = localStorage.getItem('viewingProjectId');
    
    if (viewingProjectId) {
        // Mostrar un proyecto específico - CARGAR PROYECTO COMPLETO
        console.log(`📂 Cargando proyecto completo ${viewingProjectId}...`);
        const fullProject = await dataManager.loadFullProject(viewingProjectId);
        if (fullProject) {
            projectsToShow = [fullProject];
            viewingUser = dataManager.getUserById(fullProject.ownerId);
        } else {
            // Fallback: usar índice si falla la carga completa
            const project = dataManager.getProjectById(viewingProjectId);
            if (project) {
                projectsToShow = [project];
                viewingUser = dataManager.getUserById(project.ownerId);
            }
        }
    } else if (viewingUserId) {
        // Mostrar TODOS los proyectos de un usuario - CARGAR PROYECTOS COMPLETOS
        const projectsIndex = dataManager.getProjectsByUserId(viewingUserId);
        viewingUser = dataManager.getUserById(viewingUserId);
        console.log(`📊 Cargando ${projectsIndex.length} proyectos completos de ${viewingUser?.name || 'usuario'}...`);
        
        // Cargar cada proyecto completo
        projectsToShow = [];
        for (const projectIndex of projectsIndex) {
            const fullProject = await dataManager.loadFullProject(projectIndex.id);
            if (fullProject) {
                projectsToShow.push(fullProject);
            } else {
                // Fallback: usar índice si falla
                projectsToShow.push(projectIndex);
            }
        }
    } else {
        // Sin parámetros, mostrar todos los proyectos del área - CARGAR COMPLETOS
        const projectsIndex = dataManager.getAllProjects();
        console.log(`📊 Cargando ${projectsIndex.length} proyectos completos totales...`);
        
        // Cargar cada proyecto completo
        projectsToShow = [];
        for (const projectIndex of projectsIndex) {
            const fullProject = await dataManager.loadFullProject(projectIndex.id);
            if (fullProject) {
                projectsToShow.push(fullProject);
            } else {
                // Fallback: usar índice si falla
                projectsToShow.push(projectIndex);
            }
        }
        viewingUser = null;
    }
    
    if (projectsToShow.length === 0) {
        showError('No se encontraron proyectos para mostrar');
        return;
    }
    
    // Generar las slides
    generateSlides();
    
    // Limpiar localStorage después de leer
    localStorage.removeItem('viewingUserId');
    localStorage.removeItem('viewingProjectId');
}


// ==================== GENERATE SLIDES ====================

function generateSlides() {
    // 1. Generar slide de portada
    generateCoverSlide();
    
    // 2. Generar slides de proyectos
    generateProjectSlides();
    
    // 3. Generar slide de resumen
    generateSummarySlide();
    
    // 4. Actualizar contador
    updateSlideCount();
    
    // 5. Inicializar navegación
    updateSlides();
    
    console.log(`✅ ${totalSlides} slides generadas`);
}

// ==================== COVER SLIDE ====================

function generateCoverSlide() {
    const coverSlide = document.getElementById('coverSlide');
    
    const title = viewingUser 
        ? `📊 Portfolio de ${viewingUser.name}`
        : '📊 Portfolio Q4 2025';
    
    const subtitle = viewingUser
        ? `${viewingUser.role} | ${projectsToShow.length} proyecto(s)`
        : `Duración: 15 minutos | Enfoque en impacto y próximos pasos`;
    
    // Calcular estadísticas
    const stats = {
        total: projectsToShow.length,
        inProgress: projectsToShow.filter(p => p.status === 'in-progress').length,
        hold: projectsToShow.filter(p => p.status === 'hold').length,
        discovery: projectsToShow.filter(p => p.status === 'discovery').length,
        paused: projectsToShow.filter(p => p.status === 'paused').length
    };
    
    coverSlide.innerHTML = `
        <h1 class="slide-title">${title}</h1>
        <p class="slide-subtitle">${subtitle}</p>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Proyectos Totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.inProgress}</div>
                <div class="stat-label">En Progreso Activo</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.discovery}</div>
                <div class="stat-label">En Discovery</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.hold + stats.paused}</div>
                <div class="stat-label">En Hold</div>
            </div>
        </div>

        <div class="timeline">
            <div class="timeline-item">
                <div class="timeline-time">1 min</div>
                <div class="timeline-section">Contexto General</div>
            </div>
            ${projectsToShow.slice(0, 4).map((project, index) => `
                <div class="timeline-item">
                    <div class="timeline-time">${3 + (index * 3)} min</div>
                    <div class="timeline-section">${project.icon} ${project.title}</div>
                </div>
            `).join('')}
            ${projectsToShow.length > 4 ? `
                <div class="timeline-item">
                    <div class="timeline-time">2 min</div>
                    <div class="timeline-section">Otros Proyectos + Resumen</div>
                </div>
            ` : `
                <div class="timeline-item">
                    <div class="timeline-time">2 min</div>
                    <div class="timeline-section">Resumen Ejecutivo</div>
                </div>
            `}
        </div>
    `;
}

// ==================== PROJECT SLIDES ====================

function generateProjectSlides() {
    const coverSlide = document.getElementById('coverSlide');
    
    const slidesHTML = projectsToShow.map((project, index) => {
        const slideNumber = index + 2; // +2 porque la primera es la portada
        const statusConfig = dataManager.getStatusConfig(project.status);
        const priorityConfig = dataManager.getPriorityConfig(project.priority);
        
        return `
            <div class="slide" data-slide="${slideNumber}">
                <div class="project-header">
                    <h2 class="project-title">${project.icon} ${project.title}</h2>
                    <span class="badge ${priorityConfig.badgeClass || statusConfig.badgeClass}">${priorityConfig.badge || statusConfig.badge}</span>
                </div>

                <div class="progress-container">
                    <div class="progress-header">
                        <span class="progress-percentage">${project.progress}%</span>
                        <span class="progress-date">🎯 ${formatDate(project.targetDate)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-title">📋 Fase Actual</div>
                    <div class="info-content">${project.currentPhase}</div>
                </div>

                ${generateAchievementsSection(project.achievements)}
                
                ${generateBlockersSection(project.blockers)}
                
                ${generateNextStepsSection(project.nextSteps)}

                <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                    ${project.ganttImage ? `
                        <a href="#" class="gantt-link" onclick="openGanttModal('${project.id}'); return false;">
                            📊 Ver Gantt del Proyecto →
                        </a>
                    ` : ''}
                    
                    ${project.videos && project.videos.length > 0 ? `
                        <a href="#" class="gantt-link video-link" onclick="openVideoGallery('${project.id}'); return false;">
                            🎬 Galería de Videos →
                        </a>
                    ` : ''}
                    
                    ${project.images && project.images.length > 0 ? `
                        <a href="#" class="gantt-link image-link" onclick="openImageGallery('${project.id}'); return false;">
                            🖼️ Galería de Imágenes →
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Insertar las slides después del coverSlide
    coverSlide.insertAdjacentHTML('afterend', slidesHTML);
}

function generateAchievementsSection(achievements) {
    if (!achievements || Object.keys(achievements).length === 0) return '';
    
    const entries = Object.entries(achievements).map(([date, text]) => 
        `<strong>${formatMonth(date)}:</strong> ${text}`
    ).join('<br>');
    
    return `
        <div class="info-section success">
            <div class="info-title">✅ Logros Recientes</div>
            <div class="info-content">${entries}</div>
        </div>
    `;
}

function generateBlockersSection(blockers) {
    if (!blockers || !blockers.message) return '';
    
    // Usar directamente el tipo como clase (warning, alert, info)
    const className = `info-section ${blockers.type}`;
    
    return `
        <div class="${className}">
            <div class="info-title">${getBlockerIcon(blockers.type)} ${getBlockerTitle(blockers.type)}</div>
            <div class="info-content">${blockers.message}</div>
        </div>
    `;
}

function generateNextStepsSection(nextSteps) {
    if (!nextSteps || Object.keys(nextSteps).length === 0) return '';
    
    const entries = Object.entries(nextSteps).map(([date, text]) => 
        `<strong>${formatMonth(date)}:</strong> ${text}`
    ).join('<br>');
    
    return `
        <div class="info-section">
            <div class="info-title">🎯 Próximos Pasos</div>
            <div class="info-content">${entries}</div>
        </div>
    `;
}

// ==================== SUMMARY SLIDE ====================

function generateSummarySlide() {
    const summarySlide = document.getElementById('summarySlide');
    const lastSlideNumber = projectsToShow.length + 2;
    summarySlide.setAttribute('data-slide', lastSlideNumber);
    
    const stats = {
        inProgress: projectsToShow.filter(p => p.status === 'in-progress').length,
        hold: projectsToShow.filter(p => p.status === 'hold').length,
        discovery: projectsToShow.filter(p => p.status === 'discovery').length,
        paused: projectsToShow.filter(p => p.status === 'paused').length
    };
    
    // Recopilar próximas fechas clave de todos los proyectos
    let upcomingMilestones = {};
    projectsToShow.forEach(project => {
        if (project.nextSteps) {
            Object.entries(project.nextSteps).forEach(([date, step]) => {
                if (!upcomingMilestones[date]) {
                    upcomingMilestones[date] = [];
                }
                upcomingMilestones[date].push(`${project.title}: ${step}`);
            });
        }
    });
    
    // Ordenar fechas
    const sortedDates = Object.keys(upcomingMilestones).sort();
    
    summarySlide.innerHTML = `
        <h2 class="project-title" style="margin-bottom: 40px;">🎬 Resumen Ejecutivo</h2>

        <div class="summary-grid">
            ${stats.inProgress > 0 ? `
                <div class="summary-item" style="border-left-color: #30d158;">
                    <div class="info-title">✅ ${stats.inProgress} proyecto(s) avanzando según plan</div>
                    <div class="info-content">
                        ${projectsToShow.filter(p => p.status === 'in-progress').map(p => 
                            `${p.title} (${p.progress}%)`
                        ).join(' • ')}
                    </div>
                </div>
            ` : ''}

            ${stats.hold > 0 ? `
                <div class="summary-item" style="border-left-color: #ff9500;">
                    <div class="info-title">⏸ ${stats.hold} proyecto(s) con hold técnico temporal</div>
                    <div class="info-content">
                        ${projectsToShow.filter(p => p.status === 'hold').map(p => 
                            `${p.title} (${p.progress}%) - ${p.blockers?.message || 'Desbloqueo en proceso'}`
                        ).join(' • ')}
                    </div>
                </div>
            ` : ''}

            ${stats.paused > 0 ? `
                <div class="summary-item" style="border-left-color: #8e8e93;">
                    <div class="info-title">❄️ ${stats.paused} proyecto(s) pausado(s)</div>
                    <div class="info-content">
                        ${projectsToShow.filter(p => p.status === 'paused').map(p => 
                            `${p.title} (${p.progress}%)`
                        ).join(' • ')}
                    </div>
                </div>
            ` : ''}

            ${stats.discovery > 0 ? `
                <div class="summary-item" style="border-left-color: #ff9f0a;">
                    <div class="info-title">🔍 ${stats.discovery} proyecto(s) en discovery</div>
                    <div class="info-content">
                        ${projectsToShow.filter(p => p.status === 'discovery').map(p => 
                            `${p.title}`
                        ).join(' • ')}
                    </div>
                </div>
            ` : ''}
        </div>

        ${sortedDates.length > 0 ? `
            <div class="info-section" style="margin-top: 30px;">
                <div class="info-title">🎯 Próximas Fechas Clave</div>
                <div class="info-content">
                    ${sortedDates.slice(0, 5).map(date => `
                        <strong>${formatMonth(date)}:</strong><br>
                        ${upcomingMilestones[date].map(step => `• ${step}`).join('<br>')}
                    `).join('<br><br>')}
                </div>
            </div>
        ` : ''}

        <div class="cta-box">
            <div class="cta-text">¿Decisiones o recursos necesarios?</div>
            <p style="margin-top: 15px; font-size: 16px; color: white;">Espacio para preguntas y respuestas</p>
        </div>
    `;
}

// ==================== NAVIGATION ====================

function updateSlideCount() {
    totalSlides = projectsToShow.length + 2; // +2 por portada y resumen
    document.getElementById('total-slides').textContent = totalSlides;
}

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

// Touch/swipe support
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

// ==================== MODALS ====================

function openGanttModal(projectId) {
    const project = dataManager.getProjectById(projectId);
    if (!project || !project.ganttImage) return;
    
    const modal = document.getElementById('ganttModal');
    const modalTitle = document.getElementById('modalTitle');
    const ganttImage = document.getElementById('ganttImage');

    modalTitle.textContent = `${project.icon} ${project.title} - Gantt`;
    ganttImage.src = project.ganttImage;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGanttModal() {
    const modal = document.getElementById('ganttModal');
    const ganttImage = document.getElementById('ganttImage');
    const zoomLevel = document.getElementById('zoomLevel');
    
    ganttImage.classList.remove('zoomed');
    ganttImage.style.transform = 'scale(1)';
    ganttImage.style.transformOrigin = 'center center';
    zoomLevel.textContent = '100%';
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openVideoGallery(projectId) {
    const project = dataManager.getProjectById(projectId);
    if (!project || !project.videos || project.videos.length === 0) return;
    
    const modal = document.getElementById('videoGalleryModal');
    const title = document.getElementById('videoGalleryTitle');
    const grid = document.getElementById('videoGalleryGrid');

    title.textContent = `${project.icon} ${project.title} - Videos`;

    grid.innerHTML = project.videos.map((video, index) => `
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
    const project = dataManager.getProjectById(projectId);
    const video = project.videos[index];
    
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
    const project = dataManager.getProjectById(projectId);
    if (!project || !project.images || project.images.length === 0) return;
    
    const modal = document.getElementById('imageGalleryModal');
    const title = document.getElementById('imageGalleryTitle');
    const grid = document.getElementById('imageGalleryGrid');

    title.textContent = `${project.icon} ${project.title} - Imágenes`;

    grid.innerHTML = project.images.map((image, index) => `
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
    const project = dataManager.getProjectById(projectId);
    const image = project.images[index];
    
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

// Zoom functionality
function toggleZoom(img, event) {
    if (!img.classList.contains('zoomed')) {
        const rect = img.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        img.classList.add('zoomed');
        img.style.transform = 'scale(2)';

        const zoomLevel = document.getElementById('zoomLevel');
        zoomLevel.textContent = '200%';
    } else {
        img.classList.remove('zoomed');
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = 'center center';

        const zoomLevel = document.getElementById('zoomLevel');
        zoomLevel.textContent = '100%';
    }
}

// Close modals on outside click
document.getElementById('ganttModal').addEventListener('click', function(e) {
    if (e.target === this) closeGanttModal();
});

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

// Close modals on ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeGanttModal();
        closeVideoGallery();
        closeImageGallery();
        closeVideoPlayer();
        closeImageLightbox();
    }
});

// ==================== HELPERS ====================

function formatDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return "N/A";
    }

    const parts = dateString.split('-');
    if (parts.length < 3) {
        // Si no viene en formato YYYY-MM-DD, la regresamos como está
        return dateString;
    }

    const [year, month, day] = parts;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Validar mes numérico
    const monthIndex = parseInt(month) - 1;
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return dateString;
    }

    return `${months[monthIndex]} ${day}, ${year}`;
}

function formatMonth(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return "N/A";
    }

    const parts = dateString.split('-');
    if (parts.length < 2) {
        return dateString;
    }

    const [year, month] = parts;
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const monthIndex = parseInt(month) - 1;
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return dateString;
    }

    return `${months[monthIndex]} ${year}`;
}


function getBlockerIcon(type) {
    const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        alert: '🚫',
        success: '✅'
    };
    return icons[type] || 'ℹ️';
}

function getBlockerTitle(type) {
    const titles = {
        info: 'Información',
        warning: 'Atención',
        alert: 'Bloqueo Temporal',
        success: 'Estado'
    };
    return titles[type] || 'Información';
}

function showError(message) {
    document.body.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h2 class="error-title">Error al cargar el portafolio</h2>
            <p class="error-description">${message}</p>
            <button class="error-button" onclick="goBack()">Volver al Home</button>
        </div>
    `;
}

function goBack() {
    window.location.href = 'index.html';
}

// ==================== THEME ====================

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

loadTheme();

console.log('✅ Viewer.js cargado');
