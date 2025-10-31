// ============================================
// DATA MANAGER - Sistema de gestión de datos con archivos locales (Electron)
// ============================================

class DataManager {
    constructor() {
        this.users = [];
        this.projects = [];
        this.config = {};
        this.currentUser = null;
    }

    // ==================== LOAD DATA ====================

    async loadAllData() {
        try {
            await Promise.all([
                this.loadUsers(),
                this.loadProjects(),
                this.loadConfig()
            ]);
            console.log('✓ Todos los datos cargados correctamente');
            return true;
        } catch (error) {
            console.error('✗ Error cargando datos:', error);
            return false;
        }
    }

    async loadUsers() {
        try {
            // Cargar desde archivo local con file-manager
            const users = await fileManager.loadUsers();
            this.users = users;
            console.log(`✓ ${this.users.length} usuarios cargados`);
            return this.users;
        } catch (error) {
            console.error('✗ Error cargando usuarios:', error);
            // Fallback: cargar desde data/users.json vía fetch (primera vez)
            try {
                const response = await fetch('data/users.json');
                const data = await response.json();
                this.users = data.users;
                // Guardar en sistema local
                await fileManager.saveUsers(this.users);
                console.log(`✓ ${this.users.length} usuarios cargados (desde JSON)`);
                return this.users;
            } catch (fallbackError) {
                console.error('✗ Error en fallback:', fallbackError);
                return [];
            }
        }
    }

    async loadProjects() {
        try {
            // Cargar índice de proyectos
            const projectsIndex = await fileManager.loadProjectsIndex();
            this.projects = projectsIndex;
            console.log(`✓ ${this.projects.length} proyectos cargados`);
            return this.projects;
        } catch (error) {
            console.error('✗ Error cargando proyectos:', error);
            // Fallback: cargar desde data/projects.json (primera vez)
            try {
                const response = await fetch('data/projects.json');
                const data = await response.json();
                this.projects = data.projects;
                // Guardar índice inicial
                await fileManager.saveProjectsIndex(this.projects);
                console.log(`✓ ${this.projects.length} proyectos cargados (desde JSON)`);
                return this.projects;
            } catch (fallbackError) {
                console.error('✗ Error en fallback:', fallbackError);
                return [];
            }
        }
    }

    async loadConfig() {
        try {
            // Cargar desde archivo local
            const config = await fileManager.loadConfig();
            this.config = config;
            console.log('✓ Configuración cargada');
            return this.config;
        } catch (error) {
            console.error('✗ Error cargando configuración:', error);
            // Fallback: cargar desde data/config.json
            try {
                const response = await fetch('data/config.json');
                this.config = await response.json();
                // Guardar en sistema local
                await fileManager.saveConfig(this.config);
                console.log('✓ Configuración cargada (desde JSON)');
                return this.config;
            } catch (fallbackError) {
                console.error('✗ Error en fallback:', fallbackError);
                return {};
            }
        }
    }

    // ==================== USER METHODS ====================

    getUserById(userId) {
        return this.users.find(user => user.id === userId);
    }

    getUserByUsername(username) {
        return this.users.find(user => user.username === username);
    }

    validateCredentials(username, password) {
        const user = this.getUserByUsername(username);
        if (user && user.password === password) {
            return user;
        }
        return null;
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            console.log(`✓ Usuario autenticado: ${user.name}`);
        } else {
            sessionStorage.removeItem('currentUser');
            console.log('✓ Sesión cerrada');
        }
    }

    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }
        
        const stored = sessionStorage.getItem('currentUser');
        if (stored) {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        }
        
        return null;
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    logout() {
        this.setCurrentUser(null);
    }

    // ==================== PROJECT METHODS ====================

    getProjectById(projectId) {
        return this.projects.find(project => project.id === projectId);
    }

    getProjectsByUserId(userId) {
        return this.projects.filter(project => project.ownerId === userId);
    }

    getProjectsByStatus(status) {
        return this.projects.filter(project => project.status === status);
    }

    getAllProjects() {
        return this.projects;
    }

    getMyProjects() {
        const user = this.getCurrentUser();
        if (!user) return [];
        return this.getProjectsByUserId(user.id);
    }

    canEditProject(projectId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        const project = this.getProjectById(projectId);
        if (!project) return false;

        return project.ownerId === currentUser.id;
    }

    // ==================== SAVE DATA (Local File System) ====================

    async saveProject(projectData) {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                console.error('❌ No hay usuario autenticado');
                return false;
            }

            const isNewProject = !this.getProjectById(projectData.id);

            // Guardar proyecto completo en file system
            const saved = await fileManager.saveProject(currentUser.id, projectData);

            if (!saved) {
                console.error('❌ Error guardando proyecto en file system');
                return false;
            }

            // Actualizar índice en memoria
            if (isNewProject) {
                // Crear versión ligera para el índice (sin archivos pesados)
                const projectIndex = this.createProjectIndex(projectData);
                this.projects.push(projectIndex);
                console.log('✓ Nuevo proyecto creado:', projectData.title);
            } else {
                const index = this.projects.findIndex(p => p.id === projectData.id);
                if (index !== -1) {
                    const projectIndex = this.createProjectIndex(projectData);
                    this.projects[index] = projectIndex;
                    console.log('✓ Proyecto actualizado:', projectData.title);
                }
            }

            // Guardar índice de proyectos
            await fileManager.saveProjectsIndex(this.projects);

            // Disparar evento de actualización
            window.dispatchEvent(new CustomEvent('projectUpdated', {
                detail: projectData
            }));

            return true;

        } catch (error) {
            console.error('✗ Error al guardar proyecto:', error);
            alert('Error al guardar el proyecto. Revisa la consola para más detalles.');
            return false;
        }
    }

    // Crear versiÃ³n ligera del proyecto para el Ã­ndice (sin base64)
    createProjectIndex(projectData) {
        return {
            id: projectData.id,
            title: projectData.title,
            icon: projectData.icon || 'ðŸ"‹',
            currentPhase: projectData.currentPhase || '',
            status: projectData.status,
            priority: projectData.priority,
            progress: projectData.progress,
            targetDate: projectData.targetDate || '',
            ownerId: projectData.ownerId,
            createdAt: projectData.createdAt,
            updatedAt: projectData.updatedAt,
            // Incluir achievements, blockers, nextSteps
            achievements: projectData.achievements || {},
            blockers: projectData.blockers || { type: 'info', message: '' },
            nextSteps: projectData.nextSteps || {},
            // Multimedia (rutas/referencias, no base64)
            ganttImage: projectData.ganttImage || projectData.ganttImagePath || '',
            images: projectData.images ? projectData.images.map(img => ({
                src: img.src || img.path || '',
                title: img.title || 'Imagen'
            })) : [],
            videos: projectData.videos ? projectData.videos.map(v => ({
                src: v.src || v.path || '',
                title: v.title || 'Video'
            })) : [],
            // Referencias sin datos pesados (mantener por compatibilidad)
            hasGantt: !!projectData.ganttImage || !!projectData.ganttImagePath,
            imageCount: projectData.images ? projectData.images.length : 0,
            videoCount: projectData.videos ? projectData.videos.length : 0
        };
    }

    // ==================== LOAD FULL PROJECT ====================

    async loadFullProject(projectId) {
        try {
            const project = this.getProjectById(projectId);
            if (!project) {
                console.error('❌ Proyecto no encontrado en índice');
                return null;
            }

            // Cargar proyecto completo con archivos multimedia
            const fullProject = await fileManager.loadProject(project.ownerId, projectId);
            return fullProject;

        } catch (error) {
            console.error('❌ Error cargando proyecto completo:', error);
            return null;
        }
    }

    generateProjectId() {
        const maxId = this.projects.reduce((max, project) => {
            const num = parseInt(project.id.replace('proj', ''));
            return num > max ? num : max;
        }, 0);
        
        return `proj${String(maxId + 1).padStart(3, '0')}`;
    }

    // ==================== STATISTICS ====================

    getStats() {
        const stats = {
            totalProjects: this.projects.length,
            inProgress: this.projects.filter(p => p.status === 'in-progress').length,
            hold: this.projects.filter(p => p.status === 'hold').length,
            discovery: this.projects.filter(p => p.status === 'discovery').length,
            paused: this.projects.filter(p => p.status === 'paused').length,
            completed: this.projects.filter(p => p.status === 'completed').length,
            highPriority: this.projects.filter(p => p.priority === 'high').length,
            mediumPriority: this.projects.filter(p => p.priority === 'medium').length,
            lowPriority: this.projects.filter(p => p.priority === 'low').length,
            avgProgress: Math.round(
                this.projects.reduce((sum, p) => sum + p.progress, 0) / this.projects.length
            )
        };
        
        return stats;
    }

    getUserStats(userId) {
        const userProjects = this.getProjectsByUserId(userId);
        
        return {
            totalProjects: userProjects.length,
            inProgress: userProjects.filter(p => p.status === 'in-progress').length,
            hold: userProjects.filter(p => p.status === 'hold').length,
            discovery: userProjects.filter(p => p.status === 'discovery').length,
            paused: userProjects.filter(p => p.status === 'paused').length,
            completed: userProjects.filter(p => p.status === 'completed').length,
            avgProgress: userProjects.length > 0
                ? Math.round(userProjects.reduce((sum, p) => sum + p.progress, 0) / userProjects.length)
                : 0
        };
    }

    // ==================== SEARCH & FILTER ====================

    searchProjects(query) {
        const lowerQuery = query.toLowerCase();
        return this.projects.filter(project =>
            project.title.toLowerCase().includes(lowerQuery) ||
            project.currentPhase.toLowerCase().includes(lowerQuery) ||
            project.status.toLowerCase().includes(lowerQuery)
        );
    }

    filterProjects(filters) {
        let filtered = [...this.projects];
        
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }
        
        if (filters.priority) {
            filtered = filtered.filter(p => p.priority === filters.priority);
        }
        
        if (filters.ownerId) {
            filtered = filtered.filter(p => p.ownerId === filters.ownerId);
        }
        
        return filtered;
    }

    // ==================== CONFIG HELPERS ====================

    getStatusConfig(status) {
        return this.config.projectStatuses?.[status] || {};
    }

    getPriorityConfig(priority) {
        return this.config.priorities?.[priority] || {};
    }

    getBlockerConfig(type) {
        return this.config.blockerTypes?.[type] || {};
    }

    // ==================== INITIALIZATION ====================

    async init() {
        console.log('🚀 Inicializando DataManager (Electron)...');

        try {
            // 1. Cargar datos desde archivos locales
            await this.loadAllData();

            // 2. Cargar sesión guardada
            this.loadSession();

            // 3. Notificar que los datos están listos
            this.notifyDataLoaded();

            console.log('✅ DataManager inicializado correctamente');
            console.log(`📊 ${this.projects.length} proyectos disponibles`);
            console.log(`👥 ${this.users.length} usuarios registrados`);
            
            // Mostrar info de almacenamiento
            const storageInfo = await fileManager.getStorageInfo();
            if (storageInfo) {
                console.log(`💾 Almacenamiento: ${storageInfo.type} - ${storageInfo.quota}`);
            }
            
            return true;
        } catch (error) {
            console.error('✗ Error inicializando DataManager:', error);
            return false;
        }
    }

    loadSession() {
        const user = this.getCurrentUser();
        if (user) {
            console.log(`👤 Sesión activa: ${user.name}`);
        }
    }

    notifyDataLoaded() {
        document.dispatchEvent(new Event('dataLoaded'));
    }

    // ==================== DELETE PROJECT ====================

    async deleteProject(projectId) {
        try {
            // Verificar permisos
            if (!this.canEditProject(projectId)) {
                console.error('❌ No tienes permisos para eliminar este proyecto');
                return false;
            }

            const project = this.getProjectById(projectId);
            if (!project) {
                console.error('❌ Proyecto no encontrado');
                return false;
            }

            console.log(`🗑️ Eliminando proyecto: ${project.title} (${projectId})`);

            // 1. Eliminar del file system (esto limpia todo: JSON, imágenes, videos)
            const deleted = await fileManager.deleteProject(project.ownerId, projectId);
            
            if (!deleted) {
                console.error('❌ Error eliminando del file system');
                return false;
            }

            console.log('  ✓ Eliminado del file system');

            // 2. Eliminar del array en memoria
            const index = this.projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                this.projects.splice(index, 1);
                console.log('  ✓ Eliminado de memoria');
            }

            // 3. Actualizar índice de proyectos
            await fileManager.saveProjectsIndex(this.projects);
            console.log('  ✓ Índice actualizado');

            console.log('✅ Proyecto eliminado completamente');
            return true;

        } catch (error) {
            console.error('❌ Error eliminando proyecto:', error);
            return false;
        }
    }
}

// ==================== GLOBAL INSTANCE ====================

const dataManager = new DataManager();

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    await dataManager.init();
});

console.log('✓ Data Manager (Electron) cargado');
