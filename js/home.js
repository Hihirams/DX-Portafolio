// ============================================
// HOME.JS - Lógica de la página principal
// ============================================

let currentFilter = 'all';

// ==================== INIT ====================

document.addEventListener('dataLoaded', () => {
    console.log('✅ Datos cargados, inicializando Home...');
    initHome();
});

function initHome() {
    updateUserSection();
    renderStatsOverview();
    renderFeaturedProjects();
    renderTeamGrid();
    setupSearch();
    setupFilters();
    
    // Si está loggeado, mostrar "Mis Proyectos"
    if (dataManager.isLoggedIn()) {
        showMyProjects();
    }
}

// ==================== USER SECTION ====================

function updateUserSection() {
    const userSection = document.getElementById('userSection');
    const user = dataManager.getCurrentUser();
    
    if (user) {
        // Usuario loggeado
        userSection.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${getInitials(user.name)}</div>
                <span class="user-name">${user.name}</span>
            </div>
            <button class="btn-logout" onclick="handleLogout()">
                Cerrar Sesión
            </button>
        `;
    } else {
        // No loggeado
        userSection.innerHTML = `
            <button class="btn-login" onclick="openLoginModal()">
                Iniciar Sesión
            </button>
        `;
    }
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ==================== STATS OVERVIEW ====================

function renderStatsOverview() {
    const statsOverview = document.getElementById('statsOverview');
    const stats = dataManager.getStats();
    
    statsOverview.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.totalProjects}</div>
            <div class="stat-label">Proyectos Totales</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.inProgress}</div>
            <div class="stat-label">En Progreso</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.hold}</div>
            <div class="stat-label">En Hold</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.discovery}</div>
            <div class="stat-label">En Discovery</div>
        </div>
    `;
}

// ==================== MY PROJECTS ====================

function showMyProjects() {
    const section = document.getElementById('myProjectsSection');
    const grid = document.getElementById('myProjectsGrid');
    
    section.style.display = 'block';
    
    const myProjects = dataManager.getMyProjects();
    
    if (myProjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📂</div>
                <div class="empty-state-title">No tienes proyectos aún</div>
                <div class="empty-state-description">
                    Crea tu primer proyecto para empezar
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = myProjects.map(project => createProjectCard(project, true)).join('');
}

// ==================== FEATURED PROJECTS ====================

function renderFeaturedProjects(filter = 'all') {
    const grid = document.getElementById('featuredProjectsGrid');
    
    let projects = dataManager.getAllProjects();
    
    if (filter !== 'all') {
        projects = projects.filter(p => p.status === filter);
    }
    
    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">No hay proyectos en esta categoría</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = projects.map(project => createProjectCard(project)).join('');
}

function createProjectCard(project, showEditButton = false) {
    const statusConfig = dataManager.getStatusConfig(project.status);
    const owner = dataManager.getUserById(project.ownerId);
    const ownerName = owner ? owner.name : 'Desconocido';
    const currentUser = dataManager.getCurrentUser();
    const canEdit = currentUser && project.ownerId === currentUser.id;
    
    return `
        <div class="project-card" onclick="viewProject('${project.id}')">
            <div class="project-card-header">
                <div class="project-icon">${project.icon}</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${canEdit ? `
                        <button class="btn-edit-mini" onclick="event.stopPropagation(); editProject('${project.id}')" title="Editar proyecto">
                            ✏️
                        </button>
                    ` : ''}
                    <div class="project-badge ${statusConfig.badgeClass}">${statusConfig.badge}</div>
                </div>
            </div>
            <h4 class="project-card-title">${project.title}</h4>
            <p class="project-card-phase">${project.currentPhase}</p>
            <div class="project-card-footer">
                <div class="project-progress">
                    <div class="progress-label">${project.progress}% completado</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                <div class="project-owner">
                    <div class="owner-avatar">${getInitials(ownerName)}</div>
                </div>
            </div>
        </div>
    `;
}

// ==================== TEAM GRID ====================

function renderTeamGrid() {
    const grid = document.getElementById('teamGrid');
    const users = dataManager.users;
    
    grid.innerHTML = users.map(user => {
        const stats = dataManager.getUserStats(user.id);
        
        return `
            <div class="team-card" onclick="viewUserPortfolio('${user.id}')">
                <div class="team-avatar">${getInitials(user.name)}</div>
                <h4 class="team-name">${user.name}</h4>
                <p class="team-role">${user.role}</p>
                <div class="team-stats">
                    <div class="team-stat">
                        <div class="team-stat-number">${stats.totalProjects}</div>
                        <div class="team-stat-label">Proyectos</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-number">${stats.avgProgress}%</div>
                        <div class="team-stat-label">Progreso</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== FILTERS ====================

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Agregar active al clickeado
            btn.classList.add('active');
            
            // Filtrar proyectos
            const filter = btn.dataset.filter;
            currentFilter = filter;
            renderFeaturedProjects(filter);
        });
    });
}

// ==================== SEARCH ====================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        const projects = dataManager.searchProjects(query);
        const users = dataManager.users.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase())
        );
        
        if (projects.length === 0 && users.length === 0) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">No se encontraron resultados</div>
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }
        
        let html = '';
        
        if (projects.length > 0) {
            html += '<h4 style="margin-bottom: 15px; color: var(--text-primary);">Proyectos</h4>';
            projects.forEach(project => {
                html += `
                    <div class="search-result-item" onclick="viewProject('${project.id}')">
                        <div class="search-result-title">${project.icon} ${project.title}</div>
                        <div class="search-result-meta">${project.currentPhase.substring(0, 80)}...</div>
                    </div>
                `;
            });
        }
        
        if (users.length > 0) {
            html += '<h4 style="margin: 20px 0 15px; color: var(--text-primary);">Personas</h4>';
            users.forEach(user => {
                html += `
                    <div class="search-result-item" onclick="viewUserPortfolio('${user.id}')">
                        <div class="search-result-title">👤 ${user.name}</div>
                        <div class="search-result-meta">${user.role}</div>
                    </div>
                `;
            });
        }
        
        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
    });
    
    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// ==================== NAVIGATION ====================

function viewProject(projectId) {
    // Guardar el ID del proyecto en localStorage
    localStorage.setItem('viewingProjectId', projectId);
    
    // Redirigir al visor de portafolio
    window.location.href = 'portfolio-viewer.html';
}

function viewUserPortfolio(userId) {
    // Guardar el ID del usuario en localStorage
    localStorage.setItem('viewingUserId', userId);
    
    // Redirigir al visor de portafolio
    window.location.href = 'portfolio-viewer.html';
}

function editProject(projectId) {
    if (!dataManager.isLoggedIn()) {
        alert('Debes iniciar sesión para editar un proyecto');
        openLoginModal();
        return;
    }
    
    // Verificar permisos
    if (!dataManager.canEditProject(projectId)) {
        alert('No tienes permisos para editar este proyecto');
        return;
    }
    
    // Configurar modo edición
    localStorage.setItem('editorMode', 'edit');
    localStorage.setItem('editingProjectId', projectId);
    
    // Redirigir al editor
    window.location.href = 'portfolio-editor.html';
}

function createNewProject() {
    if (!dataManager.isLoggedIn()) {
        alert('Debes iniciar sesión para crear un proyecto');
        openLoginModal();
        return;
    }
    
    // Redirigir al editor con modo "nuevo"
    localStorage.setItem('editorMode', 'new');
    localStorage.removeItem('editingProjectId');
    window.location.href = 'portfolio-editor.html';
}

// ==================== LOGIN/LOGOUT ====================

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus en el input de usuario
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Limpiar formulario
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    const user = dataManager.validateCredentials(username, password);
    
    if (user) {
        // Login exitoso
        dataManager.setCurrentUser(user);
        closeLoginModal();
        
        // Actualizar la UI
        updateUserSection();
        showMyProjects();
        
        // Re-renderizar proyectos destacados para mostrar botones de edición
        renderFeaturedProjects(currentFilter);
        
        console.log('✅ Login exitoso:', user.name);
        
        // Mostrar mensaje de bienvenida
        showWelcomeMessage(user.name);
    } else {
        // Login fallido
        errorDiv.style.display = 'block';
        console.log('❌ Login fallido');
    }
}

function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        dataManager.logout();
        
        // Actualizar la UI
        updateUserSection();
        document.getElementById('myProjectsSection').style.display = 'none';
        
        // Re-renderizar proyectos destacados para ocultar botones de edición
        renderFeaturedProjects(currentFilter);
        
        console.log('✅ Sesión cerrada');
    }
}

function showWelcomeMessage(userName) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'welcome-notification';
    notification.innerHTML = `
        <div class="welcome-content">
            <span class="welcome-icon">👋</span>
            <span class="welcome-text">¡Bienvenido, ${userName.split(' ')[0]}!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ==================== MODAL HELPERS ====================

// Cerrar modal al hacer clic fuera
document.getElementById('loginModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLoginModal();
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

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

// Cargar tema al iniciar
loadTheme();

console.log('✅ Home.js cargado');

// Escuchar cuando se recargan los datos
window.addEventListener('dataReloaded', () => {
    console.log('🔄 Datos recargados, actualizando UI...');
    initHome();
});
