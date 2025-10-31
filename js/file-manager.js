// ============================================
// FILE MANAGER - Sistema de gestiÃ³n de archivos local (Electron)
// ============================================

class FileManager {
    constructor() {
        this.api = window.electronAPI;
        this.isElectron = typeof window.electronAPI !== 'undefined';
        
        if (!this.isElectron) {
            console.error('❌ Electron API no disponible. Esta aplicación requiere Electron.');
        }
    }

    // ==================== PROJECT OPERATIONS ====================

    async saveProject(userId, projectData) {
        if (!this.isElectron) {
            console.error('❌ Electron API no disponible');
            return false;
        }

        try {
            const projectId = projectData.id;
            console.log(`💾 Guardando proyecto ${projectId} de usuario ${userId}...`);

            // 1. Crear estructura de directorios si no existe
            await this.api.createProjectDir(userId, projectId);

            // 2. Procesar y guardar Gantt (si existe)
            if (projectData.ganttImage) {
                const ganttPath = await this.saveGantt(userId, projectId, projectData.ganttImage);
                projectData.ganttImagePath = ganttPath;
                // Limpiar data URI para ahorrar espacio en JSON
                delete projectData.ganttImage;
            }

            // 3. Procesar y guardar imágenes
            if (projectData.images && projectData.images.length > 0) {
                const imagePaths = await this.saveImages(userId, projectId, projectData.images);
                projectData.images = imagePaths;
            }

            // 4. Procesar y guardar videos
            if (projectData.videos && projectData.videos.length > 0) {
                const videoPaths = await this.saveVideos(userId, projectId, projectData.videos);
                projectData.videos = videoPaths;
            }

            // 5. Guardar JSON del proyecto (ligero, sin base64)
            const result = await this.api.saveProject(userId, projectId, projectData);

            if (result.success) {
                console.log(`✅ Proyecto ${projectId} guardado correctamente`);
                return true;
            } else {
                console.error('❌ Error guardando proyecto:', result.error);
                return false;
            }

        } catch (error) {
            console.error('❌ Error en saveProject:', error);
            return false;
        }
    }

    async loadProject(userId, projectId) {
        if (!this.isElectron) {
            console.error('❌ Electron API no disponible');
            return null;
        }

        try {
            console.log(`📂 Cargando proyecto ${projectId}...`);

            // 1. Cargar JSON del proyecto
            const result = await this.api.loadProject(userId, projectId);

            if (!result.success) {
                console.error('❌ Error cargando proyecto:', result.error);
                return null;
            }

            const projectData = result.data;

            // 2. Cargar Gantt (si existe)
            if (projectData.ganttImagePath) {
                const ganttResult = await this.api.readMedia(projectData.ganttImagePath);
                if (ganttResult.success) {
                    projectData.ganttImage = ganttResult.data;
                }
            }

            // 3. Cargar imágenes
            if (projectData.images && projectData.images.length > 0) {
                const loadedImages = [];
                for (const imageRef of projectData.images) {
                    if (imageRef.path) {
                        const imageResult = await this.api.readMedia(imageRef.path);
                        if (imageResult.success) {
                            loadedImages.push({
                                src: imageResult.data,
                                title: imageRef.title,
                                fileName: imageRef.fileName,
                                fileType: imageRef.fileType,
                                fileSize: imageRef.fileSize
                            });
                        }
                    }
                }
                projectData.images = loadedImages;
            }

            // 4. Cargar videos
            if (projectData.videos && projectData.videos.length > 0) {
                const loadedVideos = [];
                for (const videoRef of projectData.videos) {
                    if (videoRef.path) {
                        const videoResult = await this.api.readMedia(videoRef.path);
                        if (videoResult.success) {
                            loadedVideos.push({
                                src: videoResult.data,
                                title: videoRef.title,
                                fileName: videoRef.fileName,
                                fileType: videoRef.fileType,
                                fileSize: videoRef.fileSize
                            });
                        }
                    }
                }
                projectData.videos = loadedVideos;
            }

            console.log(`✅ Proyecto ${projectId} cargado correctamente`);
            return projectData;

        } catch (error) {
            console.error('❌ Error en loadProject:', error);
            return null;
        }
    }

    async deleteProject(userId, projectId) {
        if (!this.isElectron) {
            console.error('❌ Electron API no disponible');
            return false;
        }

        try {
            console.log(`🗑️ Eliminando proyecto ${projectId}...`);
            const result = await this.api.deleteProject(userId, projectId);

            if (result.success) {
                console.log(`✅ Proyecto ${projectId} eliminado`);
                return true;
            } else {
                console.error('❌ Error eliminando proyecto:', result.error);
                return false;
            }

        } catch (error) {
            console.error('❌ Error en deleteProject:', error);
            return false;
        }
    }

    async listProjectsByUser(userId) {
        if (!this.isElectron) {
            console.error('❌ Electron API no disponible');
            return [];
        }

        try {
            const result = await this.api.listProjectsByUser(userId);

            if (result.success) {
                return result.projects;
            } else {
                console.error('❌ Error listando proyectos:', result.error);
                return [];
            }

        } catch (error) {
            console.error('❌ Error en listProjectsByUser:', error);
            return [];
        }
    }

    // ==================== MEDIA OPERATIONS ====================

    async saveGantt(userId, projectId, base64Data) {
        try {
            const fileName = 'gantt.png';
            const filePath = `users/${userId}/projects/${projectId}/gantt/${fileName}`;

            const result = await this.api.saveMedia(filePath, base64Data);

            if (result.success) {
                console.log(`  ✓ Gantt guardado: ${filePath}`);
                return filePath;
            } else {
                console.error('  ✗ Error guardando Gantt:', result.error);
                return null;
            }

        } catch (error) {
            console.error('❌ Error en saveGantt:', error);
            return null;
        }
    }

    async saveImages(userId, projectId, images) {
        const savedImages = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            
            try {
                // Si la imagen ya tiene path, significa que ya está guardada
                if (image.path) {
                    savedImages.push({
                        path: image.path,
                        title: image.title,
                        fileName: image.fileName,
                        fileType: image.fileType,
                        fileSize: image.fileSize
                    });
                    continue;
                }

                // Si no, guardar nueva imagen
                const fileName = image.fileName || `image_${i + 1}.png`;
                const filePath = `users/${userId}/projects/${projectId}/images/${fileName}`;

                const result = await this.api.saveMedia(filePath, image.src);

                if (result.success) {
                    console.log(`  ✓ Imagen guardada: ${fileName}`);
                    savedImages.push({
                        path: filePath,
                        title: image.title,
                        fileName: fileName,
                        fileType: image.fileType || 'image/png',
                        fileSize: image.fileSize
                    });
                } else {
                    console.error(`  ✗ Error guardando imagen ${fileName}:`, result.error);
                }

            } catch (error) {
                console.error(`❌ Error procesando imagen ${i}:`, error);
            }
        }

        return savedImages;
    }

    async saveVideos(userId, projectId, videos) {
        const savedVideos = [];

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            
            try {
                // Si el video ya tiene path, significa que ya está guardado
                if (video.path) {
                    savedVideos.push({
                        path: video.path,
                        title: video.title,
                        fileName: video.fileName,
                        fileType: video.fileType,
                        fileSize: video.fileSize
                    });
                    continue;
                }

                // Si no, guardar nuevo video
                const fileName = video.fileName || `video_${i + 1}.mp4`;
                const filePath = `users/${userId}/projects/${projectId}/videos/${fileName}`;

                const result = await this.api.saveMedia(filePath, video.src);

                if (result.success) {
                    console.log(`  ✓ Video guardado: ${fileName}`);
                    savedVideos.push({
                        path: filePath,
                        title: video.title,
                        fileName: fileName,
                        fileType: video.fileType || 'video/mp4',
                        fileSize: video.fileSize
                    });
                } else {
                    console.error(`  ✗ Error guardando video ${fileName}:`, result.error);
                }

            } catch (error) {
                console.error(`❌ Error procesando video ${i}:`, error);
            }
        }

        return savedVideos;
    }

    // ==================== FILE DIALOG ====================

    async openFileDialog(type = 'image') {
        if (!this.isElectron) {
            console.error('❌ Electron API no disponible');
            return null;
        }

        try {
            let filters = [];

            switch (type) {
                case 'image':
                    filters = [
                        { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
                        { name: 'Todos los archivos', extensions: ['*'] }
                    ];
                    break;
                case 'video':
                    filters = [
                        { name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'avi'] },
                        { name: 'Todos los archivos', extensions: ['*'] }
                    ];
                    break;
                case 'gantt':
                    filters = [
                        { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] },
                        { name: 'Todos los archivos', extensions: ['*'] }
                    ];
                    break;
            }

            const result = await this.api.openFileDialog({ filters });

            if (result.success && !result.canceled) {
                return {
                    success: true,
                    fileName: result.fileName,
                    data: result.data,
                    mimeType: result.mimeType
                };
            }

            return { success: false, canceled: true };

        } catch (error) {
            console.error('❌ Error abriendo diálogo:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== DATA FILES (users.json, config.json) ====================

    async loadUsers() {
        try {
            const result = await this.api.readJSON('data/users.json');
            if (result.success) {
                return result.data.users || [];
            }
            return [];
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            return [];
        }
    }

    async saveUsers(users) {
        try {
            const result = await this.api.writeJSON('data/users.json', { users });
            return result.success;
        } catch (error) {
            console.error('❌ Error guardando usuarios:', error);
            return false;
        }
    }

    async loadConfig() {
        try {
            const result = await this.api.readJSON('data/config.json');
            if (result.success) {
                return result.data;
            }
            return {};
        } catch (error) {
            console.error('❌ Error cargando config:', error);
            return {};
        }
    }

    async saveConfig(config) {
        try {
            const result = await this.api.writeJSON('data/config.json', config);
            return result.success;
        } catch (error) {
            console.error('❌ Error guardando config:', error);
            return false;
        }
    }

    // ==================== PROJECTS INDEX ====================

    async loadProjectsIndex() {
        try {
            const result = await this.api.readJSON('data/projects-index.json');
            if (result.success) {
                return result.data.projects || [];
            }
            return [];
        } catch (error) {
            console.warn('⚠️ No existe projects-index.json, se creará uno nuevo');
            return [];
        }
    }

    async saveProjectsIndex(projects) {
        try {
            const result = await this.api.writeJSON('data/projects-index.json', { projects });
            return result.success;
        } catch (error) {
            console.error('❌ Error guardando projects index:', error);
            return false;
        }
    }

    // ==================== USER OPERATIONS ====================

    async createUserDirectory(userId) {
        try {
            const result = await this.api.createUserDir(userId);
            return result.success;
        } catch (error) {
            console.error('❌ Error creando directorio de usuario:', error);
            return false;
        }
    }

    // ==================== STORAGE INFO ====================

    async getStorageInfo() {
        // En Electron, el storage depende del disco local
        // No hay límite como en navegador
        return {
            type: 'local',
            quota: 'Depende del espacio en disco',
            usage: 'Ver carpeta users/'
        };
    }
}

// ==================== INSTANCIA GLOBAL ====================

const fileManager = new FileManager();

console.log('✓ File Manager (Electron) cargado');
