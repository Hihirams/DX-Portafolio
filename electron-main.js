// ============================================
// ELECTRON MAIN - Proceso principal
// ============================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

let mainWindow;

// Ruta base del proyecto (donde están los archivos)
const PROJECT_ROOT = app.getAppPath();
const USERS_DIR = path.join(PROJECT_ROOT, 'users');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

// ==================== CREAR VENTANA ====================

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false
        },
        backgroundColor: '#000000',
        show: false,
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Abrir DevTools en modo desarrollo
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    initializeDirectories();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ==================== INICIALIZAR DIRECTORIOS ====================

function initializeDirectories() {
    const dirs = [
        USERS_DIR,
        DATA_DIR
    ];

    dirs.forEach(dir => {
        if (!fsSync.existsSync(dir)) {
            fsSync.mkdirSync(dir, { recursive: true });
            console.log(`✓ Directorio creado: ${dir}`);
        }
    });
}

// ==================== IPC HANDLERS ====================

// ====== FILE OPERATIONS ======

// Leer archivo JSON
ipcMain.handle('file:readJSON', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const data = await fs.readFile(fullPath, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error('Error leyendo JSON:', error);
        return { success: false, error: error.message };
    }
});

// Escribir archivo JSON
ipcMain.handle('file:writeJSON', async (event, filePath, data) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const dir = path.dirname(fullPath);
        
        // Crear directorio si no existe
        if (!fsSync.existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }

        await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true };
    } catch (error) {
        console.error('Error escribiendo JSON:', error);
        return { success: false, error: error.message };
    }
});

// Guardar archivo (imagen, video, etc.)
ipcMain.handle('file:saveMedia', async (event, filePath, base64Data) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const dir = path.dirname(fullPath);
        
        // Crear directorio si no existe
        if (!fsSync.existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }

        // Extraer data real del base64 (quitar "data:image/png;base64,")
        const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(base64String, 'base64');
        
        await fs.writeFile(fullPath, buffer);
        return { success: true, path: filePath };
    } catch (error) {
        console.error('Error guardando media:', error);
        return { success: false, error: error.message };
    }
});

// Leer archivo como base64
ipcMain.handle('file:readMedia', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const buffer = await fs.readFile(fullPath);
        const base64 = buffer.toString('base64');
        
        // Detectar tipo de archivo
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
            mimeType = `image/${ext.substring(1)}`;
        } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
            mimeType = `video/${ext.substring(1)}`;
        }
        
        return { 
            success: true, 
            data: `data:${mimeType};base64,${base64}`,
            mimeType 
        };
    } catch (error) {
        console.error('Error leyendo media:', error);
        return { success: false, error: error.message };
    }
});

// Eliminar archivo
ipcMain.handle('file:delete', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        await fs.unlink(fullPath);
        return { success: true };
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        return { success: false, error: error.message };
    }
});

// Eliminar directorio recursivamente
ipcMain.handle('file:deleteDir', async (event, dirPath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, dirPath);
        await fs.rm(fullPath, { recursive: true, force: true });
        return { success: true };
    } catch (error) {
        console.error('Error eliminando directorio:', error);
        return { success: false, error: error.message };
    }
});

// Verificar si existe archivo/directorio
ipcMain.handle('file:exists', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const exists = fsSync.existsSync(fullPath);
        return { success: true, exists };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Listar archivos en directorio
ipcMain.handle('file:listDir', async (event, dirPath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, dirPath);
        const files = await fs.readdir(fullPath);
        return { success: true, files };
    } catch (error) {
        console.error('Error listando directorio:', error);
        return { success: false, error: error.message };
    }
});

// ====== DIALOG OPERATIONS ======

// Abrir diálogo para seleccionar archivo
ipcMain.handle('dialog:openFile', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: options.filters || []
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString('base64');
        const ext = path.extname(filePath).toLowerCase();
        
        let mimeType = 'application/octet-stream';
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
            mimeType = `image/${ext.substring(1)}`;
        } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
            mimeType = `video/${ext.substring(1)}`;
        }

        return {
            success: true,
            path: filePath,
            fileName: path.basename(filePath),
            data: `data:${mimeType};base64,${base64}`,
            mimeType
        };
    }

    return { success: false, canceled: true };
});

// ====== PROJECT OPERATIONS ======

// Crear directorio para nuevo proyecto
ipcMain.handle('project:createDir', async (event, userId, projectId) => {
    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        const subdirs = ['images', 'videos', 'gantt'];
        
        // Crear directorio principal del proyecto
        await fs.mkdir(projectDir, { recursive: true });
        
        // Crear subdirectorios
        for (const subdir of subdirs) {
            await fs.mkdir(path.join(projectDir, subdir), { recursive: true });
        }
        
        console.log(`✓ Directorio del proyecto creado: ${projectDir}`);
        return { success: true, path: projectDir };
    } catch (error) {
        console.error('Error creando directorio de proyecto:', error);
        return { success: false, error: error.message };
    }
});

// Guardar proyecto completo
ipcMain.handle('project:save', async (event, userId, projectId, projectData) => {
    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        const projectFile = path.join(projectDir, 'project.json');
        
        // Asegurar que existe el directorio
        if (!fsSync.existsSync(projectDir)) {
            await fs.mkdir(projectDir, { recursive: true });
        }
        
        // Guardar JSON del proyecto (sin archivos pesados)
        await fs.writeFile(projectFile, JSON.stringify(projectData, null, 2), 'utf8');
        
        console.log(`✓ Proyecto guardado: ${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Error guardando proyecto:', error);
        return { success: false, error: error.message };
    }
});

// Cargar proyecto
ipcMain.handle('project:load', async (event, userId, projectId) => {
    try {
        const projectFile = path.join(USERS_DIR, userId, 'projects', projectId, 'project.json');
        const data = await fs.readFile(projectFile, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error('Error cargando proyecto:', error);
        return { success: false, error: error.message };
    }
});

// Eliminar proyecto completo
ipcMain.handle('project:delete', async (event, userId, projectId) => {
    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        await fs.rm(projectDir, { recursive: true, force: true });
        console.log(`✓ Proyecto eliminado: ${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Error eliminando proyecto:', error);
        return { success: false, error: error.message };
    }
});

// Listar todos los proyectos de un usuario
ipcMain.handle('project:listByUser', async (event, userId) => {
    try {
        const projectsDir = path.join(USERS_DIR, userId, 'projects');
        
        if (!fsSync.existsSync(projectsDir)) {
            return { success: true, projects: [] };
        }
        
        const projectFolders = await fs.readdir(projectsDir);
        const projects = [];
        
        for (const folder of projectFolders) {
            const projectFile = path.join(projectsDir, folder, 'project.json');
            if (fsSync.existsSync(projectFile)) {
                const data = await fs.readFile(projectFile, 'utf8');
                projects.push(JSON.parse(data));
            }
        }
        
        return { success: true, projects };
    } catch (error) {
        console.error('Error listando proyectos:', error);
        return { success: false, error: error.message };
    }
});

// ====== USER OPERATIONS ======

// Crear directorio para nuevo usuario
ipcMain.handle('user:createDir', async (event, userId) => {
    try {
        const userDir = path.join(USERS_DIR, userId);
        const projectsDir = path.join(userDir, 'projects');
        
        await fs.mkdir(projectsDir, { recursive: true });
        
        console.log(`✓ Directorio de usuario creado: ${userDir}`);
        return { success: true, path: userDir };
    } catch (error) {
        console.error('Error creando directorio de usuario:', error);
        return { success: false, error: error.message };
    }
});

console.log('✓ Electron Main Process cargado');
