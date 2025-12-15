import React, { useState, useRef } from 'react';
import { Upload, File, Trash2, Copy, Check, Folder, FolderPlus, Home, ChevronRight, Move, Edit } from 'lucide-react';
import { uploadImage, deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

interface UploadedFile {
  url: string;
  name: string;
  uploadedAt: Date;
  folder: string; // folder path like "documents/images" or "documents"
}

interface FolderItem {
  name: string;
  path: string;
  fileCount: number;
}

const FOLDERS_STORAGE_KEY = 'file-management-folders';

const FileManagementPage: React.FC = () => {
  const { addNotification } = useNotification();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [folders, setFolders] = useState<string[]>(() => {
    // Load folders from localStorage on init
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : ['documents'];
  });
  const [currentFolder, setCurrentFolder] = useState<string>('documents');
  const [isUploading, setIsUploading] = useState(false);
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
      setFiles(prev => [...uploadedFiles, ...prev]);
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
      setFolders(prev => prev.filter(f => !f.startsWith(folderPath) || f === 'documents'));
      addNotification('success', 'Dossier supprimé avec succès !');
    };

    if (folderFiles.length > 0 || subFolders.length > 0) {
      const totalItems = folderFiles.length + subFolders.length;
      setConfirmDialog({
        isOpen: true,
        title: 'Supprimer le dossier',
        message: `Ce dossier contient ${totalItems} élément(s). Voulez-vous vraiment le supprimer ?`,
        onConfirm: () => {
          performDelete();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      performDelete();
    }
  };

  const handleDelete = async (fileUrl: string) => {
    try {
      await deleteImage(fileUrl);
      setFiles(prev => prev.filter(f => f.url !== fileUrl));
      addNotification('success', 'Fichier supprimé avec succès !');
    } catch (error: any) {
      console.error('Delete error:', error);
      addNotification('error', error.message || 'Erreur lors de la suppression');
    }
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

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    if (imageExts.includes(ext || '')) {
      return 'Image';
    }

    switch (ext) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'Word';
      case 'xls':
      case 'xlsx':
        return 'Excel';
      case 'zip':
      case 'rar':
        return 'Archive';
      default:
        return 'Fichier';
    }
  };

  const childFolders = getChildFolders();
  const currentFiles = getCurrentFolderFiles();
  const breadcrumbs = getBreadcrumbs();
  const allFolders = folders.sort();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-accent-mint font-koulen">Gestion des Fichiers</h1>
        <button
          onClick={() => setIsCreateFolderModalOpen(true)}
          className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center gap-2"
        >
          <FolderPlus size={20} />
          Nouveau dossier
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
        {breadcrumbs.slice(1).map((crumb, index) => (
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
      {currentFiles.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Fichiers ({currentFiles.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFiles.map((file, index) => {
              const isImage = file.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

              return (
                <div key={index} className="card p-4 flex flex-col">
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
                  <p className="text-xs text-gray-500 mb-3">
                    {file.uploadedAt.toLocaleDateString()} {file.uploadedAt.toLocaleTimeString()}
                  </p>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2 mt-auto">
                    <button
                      onClick={() => handleCopyUrl(file.url)}
                      className="bg-accent-mint/20 text-accent-mint font-bold py-2 px-2 rounded hover:bg-accent-mint/30 transition-colors flex items-center justify-center"
                      title="Copier l'URL"
                    >
                      {copiedUrl === file.url ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setFileToRename(file);
                        setNewFileName(file.name);
                        setIsRenameModalOpen(true);
                      }}
                      className="bg-blue-900/20 text-blue-400 font-bold py-2 px-2 rounded hover:bg-blue-900/30 transition-colors"
                      title="Renommer"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setFileToMove(file);
                        setIsMoveModalOpen(true);
                      }}
                      className="bg-purple-900/20 text-purple-400 font-bold py-2 px-2 rounded hover:bg-purple-900/30 transition-colors"
                      title="Déplacer"
                    >
                      <Move size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(file.url)}
                      className="bg-red-900/20 text-red-400 font-bold py-2 px-2 rounded hover:bg-red-900/30 transition-colors"
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
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default FileManagementPage;
