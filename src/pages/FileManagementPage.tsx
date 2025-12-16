import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, Trash2, Copy, Check, Folder, FolderPlus, Home, ChevronRight, Move, Edit, Download } from 'lucide-react';
import { uploadImage, deleteImage, getFiles } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface UploadedFile {
  url: string;
  name: string;
  uploadedAt: Date;
  folder: string; // folder path like "documents/images" or "documents"
  size?: number; // File size in bytes
  uploaderName?: string; // Name of user who uploaded the file
}

interface FolderItem {
  name: string;
  path: string;
  fileCount: number;
}

const FOLDERS_STORAGE_KEY = 'file-management-folders';

const FileManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Fichiers');
  const { addNotification } = useNotification();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [folders, setFolders] = useState<string[]>(() => {
    // Load folders from localStorage on init
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : ['documents'];
  });
  const [currentFolder, setCurrentFolder] = useState<string>('documents');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [fileToMove, setFileToMove] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<UploadedFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const dragCounter = useRef(0);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load files from API on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoadingFiles(true);
        const fetchedFiles = await getFiles();

        // Convert API response to UploadedFile format
        const convertedFiles: UploadedFile[] = fetchedFiles.map(file => ({
          url: file.url,
          name: file.fileName,
          uploadedAt: new Date(file.createdAt),
          folder: file.folder,
          size: file.size || undefined,
          uploaderName: file.uploader
            ? `${file.uploader.firstName} ${file.uploader.lastName}`
            : undefined,
        }));

        setFiles(convertedFiles);

        // Extract unique folders from files and merge with existing folders
        const fileFolders = [...new Set(fetchedFiles.map(f => f.folder))];
        setFolders(prev => {
          const merged = [...new Set([...prev, ...fileFolders])];
          return merged.sort();
        });
      } catch (error: any) {
        console.error('Failed to load files:', error);
        addNotification('error', 'Erreur lors du chargement des fichiers');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFiles();
  }, [addNotification]);

  // Save folders to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  // Get child folders of current folder
  const getChildFolders = (): FolderItem[] => {
    return folders
      .filter(folderPath => {
        // Only show direct children of current folder
        if (!folderPath.startsWith(currentFolder) || folderPath === currentFolder) {
          return false;
        }
        const relativePath = folderPath.substring(currentFolder.length + 1);
        return !relativePath.includes('/'); // No nested paths
      })
      .map(folderPath => ({
        name: folderPath.split('/').pop() || folderPath,
        path: folderPath,
        fileCount: files.filter(f => f.folder === folderPath).length,
      }));
  };

  // Get files in current folder (not in subfolders)
  const getCurrentFolderFiles = () => {
    return files.filter(file => file.folder === currentFolder);
  };

  // Get breadcrumb navigation
  const getBreadcrumbs = () => {
    const parts = currentFolder.split('/');
    const breadcrumbs: { name: string; path: string }[] = [];

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      breadcrumbs.push({ name: part, path });
    });

    return breadcrumbs;
  };

  // Format file size in human-readable format
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const uploadFiles = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        const result = await uploadImage(file, currentFolder);
        return {
          url: result.imageUrl, // Use imageUrl from response
          name: file.name,
          uploadedAt: new Date(),
          folder: currentFolder,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Fetch the complete file info from the server to get size and other metadata
      const refreshedFiles = await getFiles();
      const convertedFiles: UploadedFile[] = refreshedFiles.map(file => ({
        url: file.url,
        name: file.fileName,
        uploadedAt: new Date(file.createdAt),
        folder: file.folder,
        size: file.size || undefined,
        uploaderName: file.uploader
          ? `${file.uploader.firstName} ${file.uploader.lastName}`
          : undefined,
      }));

      setFiles(convertedFiles);
      addNotification('success', `${uploadedFiles.length} fichier(s) uploadé(s) avec succès !`);
    } catch (error: any) {
      console.error('Upload error:', error);
      addNotification('error', error.message || 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      await uploadFiles(selectedFiles);
      e.target.value = ''; // Reset input
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    await uploadFiles(droppedFiles);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      addNotification('error', 'Le nom du dossier ne peut pas être vide');
      return;
    }

    const folderPath = `${currentFolder}/${newFolderName.trim()}`;

    // Check if folder already exists
    if (folders.includes(folderPath)) {
      addNotification('error', 'Ce dossier existe déjà');
      return;
    }

    // Add folder to state
    setFolders(prev => [...prev, folderPath]);
    addNotification('success', `Dossier "${newFolderName}" créé avec succès !`);
    setNewFolderName('');
    setIsCreateFolderModalOpen(false);
  };

  const handleDeleteFolder = (folderPath: string) => {
    const folderFiles = files.filter(f => f.folder.startsWith(folderPath));
    const subFolders = folders.filter(f => f.startsWith(folderPath) && f !== folderPath);

    const performDelete = () => {
      // Delete all files in the folder and subfolders
      folderFiles.forEach(file => {
        deleteImage(file.url).catch(console.error);
      });

      setFiles(prev => prev.filter(f => !f.folder.startsWith(folderPath)));
      setFolders(prev => {
        const newFolders = prev.filter(f => f !== folderPath && !f.startsWith(folderPath + '/'));
        // Also update localStorage immediately
        localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(newFolders));
        return newFolders;
      });
      addNotification('success', 'Dossier supprime avec succes !');
    };

    const totalItems = folderFiles.length + subFolders.length;
    const message = totalItems > 0
      ? `Ce dossier contient ${totalItems} element(s). Voulez-vous vraiment le supprimer ?`
      : `Voulez-vous vraiment supprimer le dossier "${folderPath.split('/').pop()}" ?`;

    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le dossier',
      message,
      onConfirm: () => {
        performDelete();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDelete = async (file: UploadedFile) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le fichier',
      message: `Voulez-vous vraiment supprimer "${file.name}" ?`,
      onConfirm: async () => {
        try {
          await deleteImage(file.url);
          setFiles(prev => prev.filter(f => f.url !== file.url));
          addNotification('success', 'Fichier supprimé avec succès !');
        } catch (error: any) {
          console.error('Delete error:', error);
          addNotification('error', error.message || 'Erreur lors de la suppression');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleMoveFile = (targetFolder: string) => {
    if (!fileToMove) return;

    // In a real implementation, you would move the file on the server
    // For now, we'll just update the local state
    setFiles(prev => prev.map(f =>
      f.url === fileToMove.url ? { ...f, folder: targetFolder } : f
    ));

    addNotification('success', 'Fichier déplacé avec succès !');
    setIsMoveModalOpen(false);
    setFileToMove(null);
  };

  const handleRenameFile = () => {
    if (!fileToRename || !newFileName.trim()) {
      addNotification('error', 'Le nom du fichier ne peut pas être vide');
      return;
    }

    // Update the file name in local state
    setFiles(prev => prev.map(f =>
      f.url === fileToRename.url ? { ...f, name: newFileName.trim() } : f
    ));

    addNotification('success', 'Fichier renommé avec succès !');
    setIsRenameModalOpen(false);
    setFileToRename(null);
    setNewFileName('');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    addNotification('success', 'URL copiée dans le presse-papier');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const childFolders = getChildFolders();
  const currentFiles = getCurrentFolderFiles();
  const breadcrumbs = getBreadcrumbs();
  const allFolders = folders.sort();

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-accent-mint font-koulen">GESTION DES FICHIERS</h1>
        <button
          onClick={() => setIsCreateFolderModalOpen(true)}
          className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center gap-2"
        >
          <FolderPlus size={20} />
          <span className="hidden sm:inline">Nouveau dossier</span><span className="sm:hidden">Dossier</span>
        </button>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button
          onClick={() => setCurrentFolder('documents')}
          className="flex items-center gap-1 text-accent-mint hover:text-white transition-colors"
        >
          <Home size={16} />
          Racine
        </button>
        {breadcrumbs.slice(1).map((crumb) => (
          <React.Fragment key={crumb.path}>
            <ChevronRight size={16} className="text-gray-600" />
            <button
              onClick={() => setCurrentFolder(crumb.path)}
              className="text-accent-mint hover:text-white transition-colors"
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Upload Area */}
      <div
        className={`card p-6 mb-8 text-center border-2 border-dashed transition-all ${
          isDragging
            ? 'border-accent-mint bg-accent-mint/10'
            : 'border-gray-700'
        } ${isUploading ? 'opacity-50' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer inline-flex flex-col items-center ${
            isUploading ? 'cursor-not-allowed' : ''
          }`}
        >
          <Upload size={36} className="text-accent-mint mb-3" />
          <p className="text-lg font-bold mb-1">
            {isUploading ? 'Upload en cours...' : isDragging ? 'Déposez vos fichiers ici' : 'Cliquez ou glissez vos fichiers ici'}
          </p>
          <p className="text-xs text-gray-400">
            Upload dans: {currentFolder}
          </p>
        </label>
      </div>

      {/* Folders */}
      {childFolders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Dossiers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {childFolders.map((folder) => (
              <div
                key={folder.path}
                className="card p-4 flex items-center justify-between group cursor-pointer hover:border-accent-mint transition-colors"
                onClick={() => setCurrentFolder(folder.path)}
              >
                <div className="flex items-center gap-3 flex-grow">
                  <Folder size={32} className="text-accent-mint" />
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-xs text-gray-500">{folder.fileCount} fichier(s)</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List */}
      {isLoadingFiles ? (
        <div className="card p-12 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-mint"></div>
            <p className="text-gray-400">Chargement des fichiers...</p>
          </div>
        </div>
      ) : currentFiles.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Fichiers ({currentFiles.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFiles.map((file) => {
              const isImage = file.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

              return (
                <div key={file.url} className="card p-4 flex flex-col">
                  {/* Preview */}
                  {isImage ? (
                    <div className="w-full h-32 bg-dark-bg rounded mb-3 flex items-center justify-center overflow-hidden">
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-dark-bg rounded mb-3 flex items-center justify-center">
                      <File size={64} className="text-accent-mint" />
                    </div>
                  )}

                  {/* File Info */}
                  <p className="text-sm font-medium mb-1 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    <p>{file.uploadedAt.toLocaleDateString()} {file.uploadedAt.toLocaleTimeString()}</p>
                    <p className="font-medium text-accent-mint">{formatFileSize(file.size)}</p>
                    {file.uploaderName && (
                      <p className="text-gray-400">Par {file.uploaderName}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-5 gap-2 mt-auto">
                    <button
                      onClick={() => handleCopyUrl(file.url)}
                      className="bg-accent-mint/20 text-accent-mint font-bold py-2 px-2 rounded hover:bg-accent-mint/30 transition-colors flex items-center justify-center"
                      title="Copier l'URL"
                    >
                      {copiedUrl === file.url ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <a
                      href={file.url}
                      download={file.name}
                      className="bg-green-900/20 text-green-400 font-bold py-2 px-2 rounded hover:bg-green-900/30 transition-colors flex items-center justify-center"
                      title="Télécharger"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      onClick={() => {
                        setFileToRename(file);
                        setNewFileName(file.name);
                        setIsRenameModalOpen(true);
                      }}
                      className="bg-blue-900/20 text-blue-400 font-bold py-2 px-2 rounded hover:bg-blue-900/30 transition-colors flex items-center justify-center"
                      title="Renommer"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setFileToMove(file);
                        setIsMoveModalOpen(true);
                      }}
                      className="bg-purple-900/20 text-purple-400 font-bold py-2 px-2 rounded hover:bg-purple-900/30 transition-colors flex items-center justify-center"
                      title="Déplacer"
                    >
                      <Move size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="bg-red-900/20 text-red-400 font-bold py-2 px-2 rounded hover:bg-red-900/30 transition-colors flex items-center justify-center"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <File size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucun fichier dans ce dossier</p>
        </div>
      )}

      {/* Create Folder Modal */}
      <Modal
        isOpen={isCreateFolderModalOpen}
        onClose={() => {
          setIsCreateFolderModalOpen(false);
          setNewFolderName('');
        }}
        title="Créer un nouveau dossier"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Nom du dossier</label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: Images, Documents..."
              className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Sera créé dans: {currentFolder}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreateFolderModalOpen(false);
                setNewFolderName('');
              }}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors"
            >
              Créer
            </button>
          </div>
        </form>
      </Modal>

      {/* Move File Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setFileToMove(null);
        }}
        title="Déplacer le fichier"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Fichier: <span className="text-white font-medium">{fileToMove?.name}</span>
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Dossier actuel: <span className="text-accent-mint">{fileToMove?.folder}</span>
          </p>

          <div>
            <label className="block text-gray-400 mb-2">Déplacer vers:</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allFolders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => handleMoveFile(folder)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    folder === fileToMove?.folder
                      ? 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-50'
                      : 'bg-dark-bg border-gray-700 hover:border-accent-mint hover:bg-accent-mint/10'
                  }`}
                  disabled={folder === fileToMove?.folder}
                >
                  <div className="flex items-center gap-2">
                    <Folder size={18} className="text-accent-mint" />
                    <span>{folder}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                setIsMoveModalOpen(false);
                setFileToMove(null);
              }}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename File Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setFileToRename(null);
          setNewFileName('');
        }}
        title="Renommer le fichier"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleRenameFile(); }} className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Fichier: <span className="text-white font-medium">{fileToRename?.name}</span>
            </p>
            <label className="block text-gray-400 mb-1">Nouveau nom</label>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Nom du fichier"
              className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsRenameModalOpen(false);
                setFileToRename(null);
                setNewFileName('');
              }}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors"
            >
              Renommer
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
};

export default FileManagementPage;
