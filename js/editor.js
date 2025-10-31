// ============================================
// EDITOR.JS - Lógica del Editor de Portafolios
// ============================================

let currentProject = null;
let editorMode = 'edit'; // 'new' or 'edit'
let hasUnsavedChanges = false;

// ==================== INIT ====================

document.addEventListener('dataLoaded', () => {
    console.log('✅ Datos cargados, inicializando Editor...');
    initEditor();
});

function initEditor() {
    // Verificar que el usuario esté loggeado
    if (!dataManager.isLoggedIn()) {
        alert('Debes iniciar sesión para acceder al editor');
        window.location.href = 'index.html';
        return;
    }

    // Determinar el modo del editor
    editorMode = localStorage.getItem('editorMode') || 'edit';
    const projectId = localStorage.getItem('editingProjectId');

    if (editorMode === 'new') {
        // Modo: Nuevo Proyecto
        console.log('📝 Modo: Nuevo Proyecto');
        createNewProject();
    } else if (editorMode === 'edit' && projectId) {
        // Modo: Editar Proyecto Existente
        console.log('✏️ Modo: Editar Proyecto', projectId);
        loadProject(projectId);
    } else {
        alert('No se especificó un proyecto para editar');
        window.location.href = 'index.html';
        return;
    }

    // Setup event listeners
    setupEventListeners();
    
    // Cargar tema guardado
    loadTheme();
    
    // Limpiar localStorage
    localStorage.removeItem('editorMode');
    localStorage.removeItem('editingProjectId');
}

// ==================== NEW PROJECT ====================

function createNewProject() {
    const user = dataManager.getCurrentUser();
    
    currentProject = {
        id: `proj${Date.now()}`, // ID temporal
        ownerId: user.id,
        title: 'Nuevo Proyecto',
        icon: '📋',
        status: 'discovery',
        priority: 'medium',
        progress: 0,
        targetDate: new Date().toISOString().split('T')[0],
        currentPhase: '',
        achievements: {},
        blockers: {
            type: 'info',
            message: ''
        },
        nextSteps: {},
        ganttImage: '',
        videos: [],
        images: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };

    loadProjectData();
    updateEditorTitle('Nuevo Proyecto');
}

// ==================== LOAD PROJECT ====================

async function loadProject(projectId) {
    console.log(`📂 Cargando proyecto ${projectId}...`);

    // 1. Intentar obtener el proyecto completo desde el DataManager
    let project = await dataManager.loadFullProject(projectId);

    // 2. Si no lo encuentra completo, usar el índice básico
    if (!project) {
        console.warn("⚠️ Proyecto completo no encontrado, usando índice.");
        project = dataManager.getProjectById(projectId);
    }

    if (!project) {
        alert('❌ Proyecto no encontrado.');
        window.location.href = 'index.html';
        return;
    }

    // 3. Verificar que el usuario pueda editar este proyecto
    if (!dataManager.canEditProject(projectId)) {
        alert('No tienes permisos para editar este proyecto');
        window.location.href = 'index.html';
        return;
    }

    // 4. Normalizar y asegurar campos mínimos
    currentProject = JSON.parse(JSON.stringify(project));

    if (!currentProject.images) currentProject.images = [];
    if (!currentProject.videos) currentProject.videos = [];
    if (!currentProject.ganttImage && currentProject.ganttImagePath) {
        currentProject.ganttImage = currentProject.ganttImagePath;
    }

    // 5. Normalizar rutas: convertir `path` → `src` para usar en preview
    currentProject.images = currentProject.images.map(img => ({
        src: img.src || img.path || '',
        title: img.title || img.fileName || 'Imagen',
        fileName: img.fileName || '',
        fileType: img.fileType || 'image/png',
        fileSize: img.fileSize || 0
    }));

    currentProject.videos = currentProject.videos.map(v => ({
        src: v.src || v.path || '',
        title: v.title || v.fileName || 'Video',
        fileName: v.fileName || '',
        fileType: v.fileType || 'video/mp4',
        fileSize: v.fileSize || 0
    }));

    // 6. Cargar en formulario
    loadProjectData();
    updateEditorTitle(currentProject.title);

    console.log("✅ Proyecto cargado correctamente:", currentProject.title);
}


// ==================== LOAD PROJECT DATA INTO FORM ====================

function loadProjectData() {
    // Información Básica
    document.getElementById('projectIcon').value = currentProject.icon || '';
    document.getElementById('projectTitle').value = currentProject.title || '';
    document.getElementById('currentPhase').value = currentProject.currentPhase || '';
    document.getElementById('projectStatus').value = currentProject.status || 'discovery';
    document.getElementById('projectPriority').value = currentProject.priority || 'medium';

    // Progreso y Fechas
    document.getElementById('projectProgress').value = currentProject.progress || 0;
    document.getElementById('targetDate').value = currentProject.targetDate || '';
    updateProgressDisplay();

    // Logros
    loadAchievements();

    // Bloqueos
    document.getElementById('blockerType').value = currentProject.blockers?.type || 'info';
    document.getElementById('blockerMessage').value = currentProject.blockers?.message || '';

    // Próximos Pasos
    loadNextSteps();

    // Multimedia
    loadGantt();
    loadImages();
    loadVideos();
}

// ==================== ACHIEVEMENTS ====================

function loadAchievements() {
    const container = document.getElementById('achievementsList');
    container.innerHTML = '';

    const achievements = currentProject.achievements || {};
    
    if (Object.keys(achievements).length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No hay logros agregados aún</p>';
        return;
    }

    Object.entries(achievements).forEach(([date, text]) => {
        container.appendChild(createAchievementItem(date, text));
    });
}

function createAchievementItem(date = '', text = '') {
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    
    item.innerHTML = `
        <div class="dynamic-item-header">
            <span class="dynamic-item-title">Logro</span>
            <button class="btn-remove-item" onclick="removeAchievementItem(this)">×</button>
        </div>
        <div class="form-group">
            <label>Fecha (YYYY-MM)</label>
            <input type="text" class="achievement-date" placeholder="2025-10" value="${date}" pattern="\\d{4}-\\d{2}">
        </div>
        <div class="form-group">
            <label>Descripción del Logro</label>
            <textarea class="achievement-text" rows="2" placeholder="Describe el logro...">${text}</textarea>
        </div>
    `;
    
    return item;
}

function addAchievement() {
    const container = document.getElementById('achievementsList');
    
    // Remover mensaje de "no hay logros" si existe
    if (container.querySelector('p')) {
        container.innerHTML = '';
    }
    
    container.appendChild(createAchievementItem());
    markAsUnsaved();
}

function removeAchievementItem(btn) {
    btn.closest('.dynamic-item').remove();
    markAsUnsaved();
    
    // Si no quedan items, mostrar mensaje
    const container = document.getElementById('achievementsList');
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No hay logros agregados aún</p>';
    }
}

// ==================== NEXT STEPS ====================

function loadNextSteps() {
    const container = document.getElementById('nextStepsList');
    container.innerHTML = '';

    const nextSteps = currentProject.nextSteps || {};
    
    if (Object.keys(nextSteps).length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No hay próximos pasos definidos</p>';
        return;
    }

    Object.entries(nextSteps).forEach(([date, text]) => {
        container.appendChild(createNextStepItem(date, text));
    });
}

function createNextStepItem(date = '', text = '') {
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    
    item.innerHTML = `
        <div class="dynamic-item-header">
            <span class="dynamic-item-title">Próximo Paso</span>
            <button class="btn-remove-item" onclick="removeNextStepItem(this)">×</button>
        </div>
        <div class="form-group">
            <label>Fecha (YYYY-MM)</label>
            <input type="text" class="nextstep-date" placeholder="2025-11" value="${date}" pattern="\\d{4}-\\d{2}">
        </div>
        <div class="form-group">
            <label>Descripción del Paso</label>
            <textarea class="nextstep-text" rows="2" placeholder="Describe el próximo paso...">${text}</textarea>
        </div>
    `;
    
    return item;
}

function addNextStep() {
    const container = document.getElementById('nextStepsList');
    
    if (container.querySelector('p')) {
        container.innerHTML = '';
    }
    
    container.appendChild(createNextStepItem());
    markAsUnsaved();
}

function removeNextStepItem(btn) {
    btn.closest('.dynamic-item').remove();
    markAsUnsaved();
    
    const container = document.getElementById('nextStepsList');
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No hay próximos pasos definidos</p>';
    }
}

// ==================== MULTIMEDIA - GANTT ====================

function loadGantt() {
    const preview = document.getElementById('ganttPreview');
    
    if (currentProject.ganttImage) {
        preview.style.display = 'block';
        preview.querySelector('img').src = currentProject.ganttImage;
    } else {
        preview.style.display = 'none';
    }
}

function handleGanttUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen (PNG, JPG) o PDF');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('ganttPreview');
        preview.style.display = 'block';
        
        // Si es PDF, mostrar icono, si es imagen, mostrar preview
        if (file.type === 'application/pdf') {
            preview.querySelector('img').src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="15" font-size="14">📄 PDF</text></svg>';
        } else {
            preview.querySelector('img').src = e.target.result;
        }
        
        // Guardar en el proyecto con metadata
        currentProject.ganttImage = e.target.result;
        currentProject.ganttImageType = file.type;
        currentProject.ganttImageName = file.name;
        
        markAsUnsaved();
        console.log('✅ Gantt cargado:', file.name);
    };
    
    reader.readAsDataURL(file);
}

function removeGantt() {
    currentProject.ganttImage = '';
    currentProject.ganttImageType = '';
    currentProject.ganttImageName = '';
    document.getElementById('ganttPreview').style.display = 'none';
    document.getElementById('ganttUpload').value = '';
    markAsUnsaved();
}

// ==================== MULTIMEDIA - IMAGES ====================

function loadImages() {
    const container = document.getElementById('imagesList');
    container.innerHTML = '';

    if (!currentProject.images || currentProject.images.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No hay imágenes agregadas</p>';
        return;
    }

    currentProject.images.forEach((image, index) => {
        container.appendChild(createImageItem(image, index));
    });
}

function createImageItem(image, index) {
    const item = document.createElement('div');
    item.className = 'media-item';
    item.dataset.index = index;
    
    item.innerHTML = `
        <div class="media-item-preview">
            <img src="${image.src}" alt="${image.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22><text y=%2250%%22 x=%2250%%22>🖼️</text></svg>'">
        </div>
        <input type="text" class="media-item-title" value="${image.title}" placeholder="Título de la imagen" onchange="updateImageTitle(${index}, this.value)">
        <div class="media-item-actions">
            <button class="btn-change" onclick="changeImage(${index})">Cambiar</button>
            <button class="btn-delete" onclick="deleteImage(${index})">Eliminar</button>
        </div>
    `;
    
    return item;
}

function triggerImageUpload() {
    document.getElementById('imageUpload').click();
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen válida (PNG, JPG, GIF, WebP)');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (!currentProject.images) currentProject.images = [];
        
        currentProject.images.push({
            src: e.target.result,
            title: file.name.replace(/\.[^/.]+$/, ""), // Nombre sin extensión
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
        });
        
        loadImages();
        markAsUnsaved();
        
        // Limpiar input para permitir subir el mismo archivo de nuevo
        event.target.value = '';
        
        console.log('✅ Imagen agregada:', file.name);
    };
    
    reader.readAsDataURL(file);
}

function updateImageTitle(index, newTitle) {
    if (currentProject.images[index]) {
        currentProject.images[index].title = newTitle;
        markAsUnsaved();
    }
}

function changeImage(index) {
    // Crear input temporal para cambiar la imagen
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Por favor selecciona una imagen válida');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            currentProject.images[index] = {
                ...currentProject.images[index],
                src: e.target.result,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            };
            
            loadImages();
            markAsUnsaved();
            console.log('✅ Imagen reemplazada:', file.name);
        };
        
        reader.readAsDataURL(file);
    };
    
    input.click();
}

function deleteImage(index) {
    if (confirm('¿Eliminar esta imagen?')) {
        currentProject.images.splice(index, 1);
        loadImages();
        markAsUnsaved();
    }
}

// ==================== MULTIMEDIA - VIDEOS ====================

function loadVideos() {
    const container = document.getElementById('videosList');
    container.innerHTML = '';

    if (!currentProject.videos || currentProject.videos.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No hay videos agregados</p>';
        return;
    }

    currentProject.videos.forEach((video, index) => {
        container.appendChild(createVideoItem(video, index));
    });
}

function createVideoItem(video, index) {
    const item = document.createElement('div');
    item.className = 'media-item';
    item.dataset.index = index;
    
    item.innerHTML = `
        <div class="media-item-preview">
            <video src="${video.src}" preload="metadata" onerror="this.parentElement.innerHTML='🎬'"></video>
        </div>
        <input type="text" class="media-item-title" value="${video.title}" placeholder="Título del video" onchange="updateVideoTitle(${index}, this.value)">
        <div class="media-item-actions">
            <button class="btn-change" onclick="changeVideo(${index})">Cambiar</button>
            <button class="btn-delete" onclick="deleteVideo(${index})">Eliminar</button>
        </div>
    `;
    
    return item;
}

function triggerVideoUpload() {
    document.getElementById('videoUpload').click();
}

function handleVideoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tipo
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona un video válido (MP4, WebM, OGG, MOV)');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (!currentProject.videos) currentProject.videos = [];
        
        currentProject.videos.push({
            src: e.target.result,
            title: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
        });
        
        loadVideos();
        markAsUnsaved();
        
        // Limpiar input
        event.target.value = '';
        
        console.log('✅ Video agregado:', file.name);
    };
    
    reader.readAsDataURL(file);
}

function updateVideoTitle(index, newTitle) {
    if (currentProject.videos[index]) {
        currentProject.videos[index].title = newTitle;
        markAsUnsaved();
    }
}

function changeVideo(index) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (!validTypes.includes(file.type)) {
            alert('Por favor selecciona un video válido');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            alert('El video es demasiado grande. Máximo 50MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            currentProject.videos[index] = {
                ...currentProject.videos[index],
                src: e.target.result,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            };
            
            loadVideos();
            markAsUnsaved();
            console.log('✅ Video reemplazado:', file.name);
        };
        
        reader.readAsDataURL(file);
    };
    
    input.click();
}

function deleteVideo(index) {
    if (confirm('¿Eliminar este video?')) {
        currentProject.videos.splice(index, 1);
        loadVideos();
        markAsUnsaved();
    }
}

// ==================== PROGRESS UPDATE ====================

function updateProgressDisplay() {
    const value = document.getElementById('projectProgress').value;
    document.getElementById('progressValue').textContent = value + '%';
    document.getElementById('progressFillPreview').style.width = value + '%';
}

// ==================== SECTION SWITCHING ====================

function switchSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.editor-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remover active de todos los botones
    document.querySelectorAll('.editor-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar sección seleccionada
    document.getElementById('section-' + sectionName).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Detectar cambios en cualquier input
    document.querySelectorAll('input, textarea, select').forEach(element => {
        // Excluir inputs de archivo
        if (element.type !== 'file') {
            element.addEventListener('change', markAsUnsaved);
            element.addEventListener('input', markAsUnsaved);
        }
    });

    // Prevenir salir sin guardar
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function markAsUnsaved() {
    hasUnsavedChanges = true;
    const status = document.getElementById('editorStatus');
    status.textContent = 'Sin guardar';
    status.classList.remove('saved');
}

function markAsSaved() {
    hasUnsavedChanges = false;
    const status = document.getElementById('editorStatus');
    status.textContent = 'Guardado ✓';
    status.classList.add('saved');
}

// ==================== SAVE PROJECT ====================

function saveProject() {
    // Abrir modal de confirmación
    document.getElementById('saveModal').classList.add('active');
}

function closeSaveModal() {
    document.getElementById('saveModal').classList.remove('active');
}

async function confirmSave() {
    closeSaveModal();

    // Recopilar todos los datos del formulario
    const updatedProject = {
        ...currentProject,
        icon: document.getElementById('projectIcon').value,
        title: document.getElementById('projectTitle').value,
        currentPhase: document.getElementById('currentPhase').value,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        progress: parseInt(document.getElementById('projectProgress').value),
        targetDate: document.getElementById('targetDate').value,
        blockers: {
            type: document.getElementById('blockerType').value,
            message: document.getElementById('blockerMessage').value
        },
        achievements: collectAchievements(),
        nextSteps: collectNextSteps(),
        updatedAt: new Date().toISOString().split('T')[0]
    };

    // Guardar usando el data manager
    const success = await dataManager.saveProject(updatedProject);

    if (success) {
        markAsSaved();
        alert('✅ Proyecto guardado exitosamente!');
        
        // Redirigir después de un momento
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        alert('❌ Error al guardar el proyecto');
    }
}

function collectAchievements() {
    const achievements = {};
    const items = document.querySelectorAll('#achievementsList .dynamic-item');
    
    items.forEach(item => {
        const date = item.querySelector('.achievement-date').value;
        const text = item.querySelector('.achievement-text').value;
        if (date && text) {
            achievements[date] = text;
        }
    });
    
    return achievements;
}

function collectNextSteps() {
    const nextSteps = {};
    const items = document.querySelectorAll('#nextStepsList .dynamic-item');
    
    items.forEach(item => {
        const date = item.querySelector('.nextstep-date').value;
        const text = item.querySelector('.nextstep-text').value;
        if (date && text) {
            nextSteps[date] = text;
        }
    });
    
    return nextSteps;
}

// ==================== PREVIEW ====================

function previewProject() {
    // Recopilar datos actuales (sin guardar)
    const previewData = {
        icon: document.getElementById('projectIcon').value,
        title: document.getElementById('projectTitle').value,
        currentPhase: document.getElementById('currentPhase').value,
        progress: parseInt(document.getElementById('projectProgress').value),
        targetDate: document.getElementById('targetDate').value,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        blockers: {
            type: document.getElementById('blockerType').value,
            message: document.getElementById('blockerMessage').value
        },
        achievements: collectAchievements(),
        nextSteps: collectNextSteps()
    };

    // Generar HTML de vista previa
    const previewHTML = generatePreviewHTML(previewData);
    
    // Mostrar en modal
    document.getElementById('previewContent').innerHTML = previewHTML;
    document.getElementById('previewModal').classList.add('active');
}

function generatePreviewHTML(data) {
    const statusConfig = dataManager.getStatusConfig(data.status);
    const priorityConfig = dataManager.getPriorityConfig(data.priority);
    
    return `
        <div style="padding: 40px; background: var(--bg-card); border-radius: 12px;">
            <div class="project-header">
                <h2 class="project-title">${data.icon} ${data.title}</h2>
                <span class="badge ${priorityConfig.badgeClass || statusConfig.badgeClass}">
                    ${priorityConfig.badge || statusConfig.badge}
                </span>
            </div>

            <div class="progress-container">
                <div class="progress-header">
                    <span class="progress-percentage">${data.progress}%</span>
                    <span class="progress-date">🎯 ${data.targetDate}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.progress}%"></div>
                </div>
            </div>

            <div class="info-section">
                <div class="info-title">📋 Fase Actual</div>
                <div class="info-content">${data.currentPhase}</div>
            </div>

            ${Object.keys(data.achievements).length > 0 ? `
                <div class="info-section success">
                    <div class="info-title">✅ Logros Recientes</div>
                    <div class="info-content">
                        ${Object.entries(data.achievements).map(([date, text]) => 
                            `<strong>${date}:</strong> ${text}`
                        ).join('<br>')}
                    </div>
                </div>
            ` : ''}

            ${data.blockers.message ? `
                <div class="info-section ${data.blockers.type}">
                    <div class="info-title">⚠️ ${data.blockers.type === 'alert' ? 'Bloqueo' : 'Estado'}</div>
                    <div class="info-content">${data.blockers.message}</div>
                </div>
            ` : ''}

            ${Object.keys(data.nextSteps).length > 0 ? `
                <div class="info-section">
                    <div class="info-title">🎯 Próximos Pasos</div>
                    <div class="info-content">
                        ${Object.entries(data.nextSteps).map(([date, text]) => 
                            `<strong>${date}:</strong> ${text}`
                        ).join('<br>')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('active');
}

// ==================== CANCEL EDIT ====================

function cancelEdit() {
    if (hasUnsavedChanges) {
        if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
            return;
        }
    }
    
    window.location.href = 'index.html';
}

// ==================== THEME TOGGLE ====================

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

// Función para eliminar proyecto
function deleteProject() {
    if (!currentProject) {
        alert('No hay proyecto para eliminar');
        return;
    }

    // Mostrar modal
    document.getElementById('deleteProjectTitle').textContent = currentProject.title;
    document.getElementById('deleteModal').classList.add('active');
    document.getElementById('confirmDeleteText').value = '';
    document.getElementById('btnConfirmDelete').disabled = true;

    // Validación en tiempo real
    const confirmInput = document.getElementById('confirmDeleteText');
    const confirmBtn = document.getElementById('btnConfirmDelete');
    
    confirmInput.oninput = function() {
        if (this.value.trim() === currentProject.title.trim()) {
            confirmBtn.disabled = false;
        } else {
            confirmBtn.disabled = true;
        }
    };
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    document.getElementById('confirmDeleteText').value = '';
}

async function confirmDelete() {
    const confirmText = document.getElementById('confirmDeleteText').value.trim();
    
    if (confirmText !== currentProject.title.trim()) {
        alert('El nombre del proyecto no coincide');
        return;
    }

    closeDeleteModal();

    // Mostrar feedback
    const originalTitle = document.getElementById('editorTitle').textContent;
    document.getElementById('editorTitle').textContent = '🗑️ Eliminando proyecto...';
    document.getElementById('editorStatus').textContent = 'Procesando';

    try {
        // Llamar a la eliminación real
        const success = await dataManager.deleteProject(currentProject.id);

        if (success) {
            console.log('✅ Proyecto eliminado correctamente');
            alert('✅ Proyecto eliminado exitosamente');
            
            // No hay cambios sin guardar
            hasUnsavedChanges = false;
            
            // Redirigir al home
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            throw new Error('Error al eliminar el proyecto');
        }
    } catch (error) {
        console.error('❌ Error eliminando proyecto:', error);
        alert('❌ Error al eliminar el proyecto. Inténtalo de nuevo.');
        document.getElementById('editorTitle').textContent = originalTitle;
        document.getElementById('editorStatus').textContent = 'Error';
    }
}

// ==================== HELPERS ====================

function updateEditorTitle(title) {
    document.getElementById('editorTitle').textContent = `Editando: ${title}`;
}

console.log('✅ Editor.js cargado');