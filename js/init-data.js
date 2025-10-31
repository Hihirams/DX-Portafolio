// ============================================
// INIT DATA - Inicializar estructura de datos  
// VERSIÓN FINAL: Con badges corregidos
// ============================================

async function initializeData() {
    console.log('🔧 Verificando estructura de datos...');

    try {
        const usersExist = await fileManager.api.fileExists('data/users.json');
        let createdUsers = null;

        if (!usersExist.exists) {
            console.log('📦 Creando estructura inicial de datos...');

            createdUsers = {
                users: [
                    {
                        id: "user1",
                        username: "hiram",
                        password: "password123",
                        name: "Hiram",
                        role: "DX Engineer",
                        email: "hiram@dx.com",
                        avatar: null,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: "user2",
                        username: "ana",
                        password: "password123",
                        name: "Ana García",
                        role: "DX Lead",
                        email: "ana@dx.com",
                        avatar: null,
                        createdAt: new Date().toISOString()
                    }
                ]
            };

            await fileManager.api.writeJSON('data/users.json', createdUsers);
            console.log('✅ users.json creado');
            
            // RECARGAR USUARIOS
            console.log('🔄 Recargando usuarios...');
            await dataManager.loadUsers();
        }

        const configExist = await fileManager.api.fileExists('data/config.json');
        
        if (!configExist.exists) {
            const initialConfig = {
                appName: "Portafolio DX",
                version: "1.0.0",
                projectStatuses: {
                    "in-progress": {
                        label: "En Progreso",
                        badge: "En Progreso",
                        badgeClass: "badge-in-progress",
                        color: "#00D9FF",
                        icon: "▶"
                    },
                    "hold": {
                        label: "Hold",
                        badge: "Hold",
                        badgeClass: "badge-hold",
                        color: "#FF6B00",
                        icon: "⏸"
                    },
                    "discovery": {
                        label: "Discovery",
                        badge: "Discovery",
                        badgeClass: "badge-discovery",
                        color: "#9D00FF",
                        icon: "🔍"
                    },
                    "paused": {
                        label: "Pausado",
                        badge: "Pausado",
                        badgeClass: "badge-paused",
                        color: "#FFD600",
                        icon: "⏸"
                    },
                    "completed": {
                        label: "Completado",
                        badge: "Completado",
                        badgeClass: "badge-completed",
                        color: "#00FF85",
                        icon: "✓"
                    }
                },
                priorities: {
                    "high": {
                        label: "Alta",
                        badge: "Alta Prioridad",
                        badgeClass: "badge-priority-high",
                        color: "#FF0000"
                    },
                    "medium": {
                        label: "Media",
                        badge: "Prioridad Media",
                        badgeClass: "badge-priority-medium",
                        color: "#FFA500"
                    },
                    "low": {
                        label: "Baja",
                        badge: "Baja Prioridad",
                        badgeClass: "badge-priority-low",
                        color: "#00FF00"
                    }
                },
                blockerTypes: {
                    "technical": { label: "Técnico", icon: "⚙️" },
                    "resources": { label: "Recursos", icon: "👥" },
                    "dependencies": { label: "Dependencias", icon: "🔗" },
                    "approval": { label: "Aprobación", icon: "✋" }
                }
            };

            await fileManager.api.writeJSON('data/config.json', initialConfig);
            console.log('✅ config.json creado');
            
            // RECARGAR CONFIG
            console.log('🔄 Recargando config...');
            await dataManager.loadConfig();
        }

        const projectsIndexExist = await fileManager.api.fileExists('data/projects-index.json');
        
        if (!projectsIndexExist.exists) {
            console.log('📦 Importando proyectos desde projects.json...');
            
            try {
                const projectsResult = await fileManager.api.readJSON('projects.json');
                
                if (projectsResult.success && projectsResult.data) {
                    const projectsData = projectsResult.data;
                    
                    if (projectsData.projects && projectsData.projects.length > 0) {
                        console.log(`📦 Encontrados ${projectsData.projects.length} proyectos para importar`);
                        
                        const initialProjectsIndex = {
                            projects: projectsData.projects.map(p => ({
                                id: p.id,
                                title: p.title,
                                icon: p.icon || '📋',
                                currentPhase: p.currentPhase || '',
                                status: p.status,
                                priority: p.priority,
                                progress: p.progress,
                                targetDate: p.targetDate || '',
                                ownerId: p.ownerId,
                                createdAt: p.createdAt,
                                updatedAt: p.updatedAt,
                                achievements: p.achievements || {},
                                blockers: p.blockers || { type: 'info', message: '' },
                                nextSteps: p.nextSteps || {},
                                ganttImage: p.ganttImage || '',
                                images: p.images || [],
                                videos: p.videos || [],
                                hasGantt: !!p.ganttImage,
                                imageCount: p.images ? p.images.length : 0,
                                videoCount: p.videos ? p.videos.length : 0
                            }))
                        };
                        
                        await fileManager.api.writeJSON('data/projects-index.json', initialProjectsIndex);
                        console.log('✅ Índice de proyectos creado');
                        
                        for (const project of projectsData.projects) {
                            console.log(`  📁 Guardando proyecto: ${project.title}`);
                            await fileManager.api.createProjectDir(project.ownerId, project.id);
                            await fileManager.api.saveProject(project.ownerId, project.id, project);
                        }
                        
                        console.log(`✅ ${projectsData.projects.length} proyectos importados correctamente`);
                        console.log('   Proyectos disponibles:');
                        projectsData.projects.forEach(p => {
                            console.log(`   - ${p.icon} ${p.title} (${p.progress}%)`);
                        });
                        
                        // RECARGAR PROYECTOS
                        console.log('🔄 Recargando proyectos...');
                        await dataManager.loadProjects();
                    } else {
                        const initialProjectsIndex = { projects: [] };
                        await fileManager.api.writeJSON('data/projects-index.json', initialProjectsIndex);
                    }
                } else {
                    const initialProjectsIndex = { projects: [] };
                    await fileManager.api.writeJSON('data/projects-index.json', initialProjectsIndex);
                }
            } catch (error) {
                console.warn('⚠️ Error importando projects.json:', error);
                const initialProjectsIndex = { projects: [] };
                await fileManager.api.writeJSON('data/projects-index.json', initialProjectsIndex);
            }
        }

        if (createdUsers) {
            console.log('📁 Creando directorios de usuarios...');
            for (const user of createdUsers.users) {
                await fileManager.api.createUserDir(user.id);
                console.log(`  ✅ Directorio creado: users/${user.id}/`);
            }
        }

        console.log('🎉 Estructura de datos inicializada correctamente');
        
        // Disparar evento para recargar UI
        window.dispatchEvent(new Event('dataReloaded'));
        
        return true;

    } catch (error) {
        console.error('❌ Error inicializando datos:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        await initializeData();
    }, 100);
});

console.log('✅ Init Data (FINAL) cargado');