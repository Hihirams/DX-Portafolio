// ============================================
// PRELOAD - Bridge seguro entre renderer y main
// ============================================

const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    
    // ====== FILE OPERATIONS ======
    
    readJSON: (filePath) => ipcRenderer.invoke('file:readJSON', filePath),
    
    writeJSON: (filePath, data) => ipcRenderer.invoke('file:writeJSON', filePath, data),
    
    saveMedia: (filePath, base64Data) => ipcRenderer.invoke('file:saveMedia', filePath, base64Data),
    
    readMedia: (filePath) => ipcRenderer.invoke('file:readMedia', filePath),
    
    deleteFile: (filePath) => ipcRenderer.invoke('file:delete', filePath),
    
    deleteDir: (dirPath) => ipcRenderer.invoke('file:deleteDir', dirPath),
    
    fileExists: (filePath) => ipcRenderer.invoke('file:exists', filePath),
    
    listDir: (dirPath) => ipcRenderer.invoke('file:listDir', dirPath),
    
    // ====== DIALOG OPERATIONS ======
    
    openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
    
    // ====== PROJECT OPERATIONS ======
    
    createProjectDir: (userId, projectId) => ipcRenderer.invoke('project:createDir', userId, projectId),
    
    saveProject: (userId, projectId, projectData) => ipcRenderer.invoke('project:save', userId, projectId, projectData),
    
    loadProject: (userId, projectId) => ipcRenderer.invoke('project:load', userId, projectId),
    
    deleteProject: (userId, projectId) => ipcRenderer.invoke('project:delete', userId, projectId),
    
    listProjectsByUser: (userId) => ipcRenderer.invoke('project:listByUser', userId),
    
    // ====== USER OPERATIONS ======
    
    createUserDir: (userId) => ipcRenderer.invoke('user:createDir', userId)
});

console.log('✓ Preload script cargado');
