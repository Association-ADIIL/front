import React, { useState, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';
import {
  Upload,
  File,
  Trash2,
  Copy,
  Check,
  Folder,
  FolderPlus,
  Home,
  ChevronRight,
  Move,
  Edit,
  Download,
  Loader2,
  Share2,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Link,
  Clock,
} from 'lucide-react';
import { uploadPrivateFile, deletePrivateFile, getFiles, getPrivateFileUrl, createFileShare, type CreateShareResponse } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface UploadedFile {
  id: number;
  url: string; // For private files, this is the S3 key
  name: string;
  uploadedAt: Date;
  folder: string;
  size?: number;
  uploaderName?: string;
  isPrivate: boolean;
}

interface FolderItem {
  name: string;
  path: string;
  fileCount: number;
}

const FOLDERS_STORAGE_KEY = 'file-management-folders';

// File type icon helper
const getFileIcon = (fileName: string, mimeType?: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mime = mimeType?.toLowerCase() || '';

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension) || mime.startsWith('image/')) {
    return { icon: FileImage, color: 'text-green-400', bg: 'bg-green-500/10' };
  }

  // PDF
  if (extension === 'pdf' || mime === 'application/pdf') {
    return { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' };
  }

  // Word documents
  if (['doc', 'docx', 'odt', 'rtf'].includes(extension) || mime.includes('word') || mime.includes('document')) {
    return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' };
  }

  // Excel/Spreadsheets
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension) || mime.includes('spreadsheet') || mime.includes('excel')) {
    return { icon: FileSpreadsheet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  }

  // PowerPoint/Presentations
  if (['ppt', 'pptx', 'odp'].includes(extension) || mime.includes('presentation') || mime.includes('powerpoint')) {
    return { icon: Presentation, color: 'text-orange-400', bg: 'bg-orange-500/10' };
  }

  // Videos
  if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv'].includes(extension) || mime.startsWith('video/')) {
    return { icon: FileVideo, color: 'text-purple-400', bg: 'bg-purple-500/10' };
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension) || mime.startsWith('audio/')) {
    return { icon: FileAudio, color: 'text-pink-400', bg: 'bg-pink-500/10' };
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension) || mime.includes('archive') || mime.includes('compressed')) {
    return { icon: FileArchive, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
  }

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sql'].includes(extension)) {
    return { icon: FileCode, color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
  }

  // Default file icon
  return { icon: File, color: 'text-gray-400', bg: 'bg-gray-500/10' };
};

// Expiration options for share links
const SHARE_EXPIRATION_OPTIONS = [
  { value: 3600, label: '1 heure' },
  { value: 86400, label: '24 heures' },
  { value: 604800, label: '7 jours' },
  { value: 2592000, label: '30 jours' },
  { value: 31536000, label: '1 an' },
];

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
  const [loadingUrls, setLoadingUrls] = useState<Set<number>>(new Set());

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState<UploadedFile | null>(null);
  const [shareExpiration, setShareExpiration] = useState(86400); // Default 24 hours
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [createdShare, setCreatedShare] = useState<CreateShareResponse | null>(null);

  // Load files from API on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoadingFiles(true);
        const fetchedFiles = await getFiles();

        // Convert API response to UploadedFile format
        const convertedFiles: UploadedFile[] = fetchedFiles.map(file => ({
          id: file.id,
          url: file.url,
          name: file.fileName,
          uploadedAt: new Date(file.createdAt),
          folder: file.folder,
          size: file.size || undefined,
          uploaderName: file.uploader
            ? `${file.uploader.firstName} ${file.uploader.lastName}`
            : undefined,
          isPrivate: file.isPrivate,
        }));

        setFiles(convertedFiles);

        // Extract unique folders from files and merge with existing folders
        const fileFolders = [...new Set(fetchedFiles.map(f => f.folder))];
        setFolders(prev => {
          const merged = [...new Set([...prev, ...fileFolders])];
          return merged.sort();
        });
      } catch (error) {
        logger.error('Failed to load files', error);
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
        // Upload to private bucket
        await uploadPrivateFile(file, currentFolder);
        return file.name;
      });

      const uploadedFileNames = await Promise.all(uploadPromises);

      // Fetch the complete file info from the server to get size and other metadata
      const refreshedFiles = await getFiles();
      const convertedFiles: UploadedFile[] = refreshedFiles.map(file => ({
        id: file.id,
        url: file.url,
        name: file.fileName,
        uploadedAt: new Date(file.createdAt),
        folder: file.folder,
        size: file.size || undefined,
        uploaderName: file.uploader
          ? `${file.uploader.firstName} ${file.uploader.lastName}`
          : undefined,
        isPrivate: file.isPrivate,
      }));

      setFiles(convertedFiles);
      addNotification('success', `${uploadedFileNames.length} fichier(s) uploadé(s) avec succès !`);
    } catch (error) {
      logger.error('Upload error', error);
      addNotification('error', (error as any).message || 'Erreur lors de l\'upload');
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

    const performDelete = async () => {
      // Delete all files in the folder and subfolders
      for (const file of folderFiles) {
        try {
          if (file.isPrivate) {
            await deletePrivateFile(file.id);
          }
        } catch (error) {
          logger.error('Failed to delete file', error);
        }
      }

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
          if (file.isPrivate) {
            await deletePrivateFile(file.id);
          }
          setFiles(prev => prev.filter(f => f.id !== file.id));
          addNotification('success', 'Fichier supprimé avec succès !');
        } catch (error) {
          logger.error('Delete error', error);
          addNotification('error', (error as any).message || 'Erreur lors de la suppression');
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

  const handleCopyUrl = async (file: UploadedFile) => {
    if (file.isPrivate) {
      // Generate signed URL on demand
      setLoadingUrls(prev => new Set(prev).add(file.id));
      try {
        const result = await getPrivateFileUrl(file.id);
        navigator.clipboard.writeText(result.url);
        setCopiedUrl(String(file.id));
        addNotification('success', 'URL copiée (valide 1h)');
      } catch (error) {
        addNotification('error', (error as any).message || 'Erreur lors de la génération de l\'URL');
      } finally {
        setLoadingUrls(prev => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
        setTimeout(() => setCopiedUrl(null), 2000);
      }
    } else {
      // Public file, use URL directly
      navigator.clipboard.writeText(file.url);
      setCopiedUrl(String(file.id));
      addNotification('success', 'URL copiée dans le presse-papier');
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const handleDownload = async (file: UploadedFile) => {
    if (file.isPrivate) {
      // Generate signed URL on demand
      setLoadingUrls(prev => new Set(prev).add(file.id));
      try {
        const result = await getPrivateFileUrl(file.id);
        // Open the signed URL in a new tab to trigger download
        window.open(result.url, '_blank');
      } catch (error) {
        addNotification('error', (error as any).message || 'Erreur lors du téléchargement');
      } finally {
        setLoadingUrls(prev => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
      }
    } else {
      // Public file, use URL directly
      window.open(file.url, '_blank');
    }
  };

  const handleOpenShareModal = (file: UploadedFile) => {
    setFileToShare(file);
    setShareExpiration(86400);
    setCreatedShare(null);
    setIsShareModalOpen(true);
  };

  const handleCreateShare = async () => {
    if (!fileToShare) return;

    setIsCreatingShare(true);
    try {
      const result = await createFileShare(fileToShare.id, shareExpiration);
      setCreatedShare(result);
      addNotification('success', 'Lien de partage créé !');
    } catch (error) {
      addNotification('error', (error as any).message || 'Erreur lors de la création du lien');
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyShareUrl = () => {
    if (createdShare) {
      navigator.clipboard.writeText(createdShare.shareUrl);
      addNotification('success', 'Lien copié dans le presse-papier !');
    }
  };

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const childFolders = getChildFolders();
  const currentFiles = getCurrentFolderFiles();
  const breadcrumbs = getBreadcrumbs();
  const allFolders = folders.sort();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-amber-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Systeme</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-koulen">FICHIERS</h1>
          </div>
        </div>
        <button
          onClick={() => setIsCreateFolderModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/20"
        >
          <FolderPlus size={18} />
          <span className="hidden sm:inline">Nouveau dossier</span><span className="sm:hidden">Dossier</span>
        </button>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button
          onClick={() => setCurrentFolder('documents')}
          className="flex items-center gap-1 text-amber-400 hover:text-white transition-colors"
        >
          <Home size={16} />
          Racine
        </button>
        {breadcrumbs.slice(1).map((crumb) => (
          <React.Fragment key={crumb.path}>
            <ChevronRight size={16} className="text-gray-600" />
            <button
              onClick={() => setCurrentFolder(crumb.path)}
              className="text-amber-400 hover:text-white transition-colors"
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
            ? 'border-amber-400 bg-amber-400/10'
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
          <Upload size={36} className="text-amber-400 mb-3" />
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
                className="card p-4 flex items-center justify-between group cursor-pointer hover:border-amber-400 transition-colors"
                onClick={() => setCurrentFolder(folder.path)}
              >
                <div className="flex items-center gap-3 flex-grow">
                  <Folder size={32} className="text-amber-400" />
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
            <p className="text-gray-400">Chargement des fichiers...</p>
          </div>
        </div>
      ) : currentFiles.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Fichiers ({currentFiles.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFiles.map((file) => {
              const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
              const isLoading = loadingUrls.has(file.id);
              const fileIconConfig = getFileIcon(file.name);
              const FileIcon = fileIconConfig.icon;

              return (
                <div key={file.id} className="card p-4 flex flex-col group">
                  {/* Preview - For private files or non-images, show file type icon */}
                  {isImage && !file.isPrivate ? (
                    <div className="w-full h-32 bg-dark-bg rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-gray-800">
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-full h-32 ${fileIconConfig.bg} rounded-xl mb-3 flex items-center justify-center border border-gray-800`}>
                      <FileIcon size={48} className={fileIconConfig.color} />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex items-start gap-2 mb-1">
                    <FileIcon size={16} className={`${fileIconConfig.color} flex-shrink-0 mt-0.5`} />
                    <p className="text-sm font-medium truncate flex-1" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 mb-3 space-y-1 pl-6">
                    <p>{file.uploadedAt.toLocaleDateString()} {file.uploadedAt.toLocaleTimeString()}</p>
                    <p className="font-medium text-amber-400">{formatFileSize(file.size)}</p>
                    {file.uploaderName && (
                      <p className="text-gray-400">Par {file.uploaderName}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-6 gap-1.5 mt-auto">
                    <button
                      onClick={() => handleOpenShareModal(file)}
                      className="bg-cyan-500/20 text-cyan-400 font-bold py-2 px-2 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center justify-center"
                      title="Partager"
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      onClick={() => handleCopyUrl(file)}
                      disabled={isLoading}
                      className="bg-amber-400/20 text-amber-400 font-bold py-2 px-2 rounded-lg hover:bg-amber-400/30 transition-colors flex items-center justify-center disabled:opacity-50"
                      title="Copier l'URL"
                    >
                      {isLoading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : copiedUrl === String(file.id) ? (
                        <Check size={15} />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isLoading}
                      className="bg-green-500/20 text-green-400 font-bold py-2 px-2 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center disabled:opacity-50"
                      title="Télécharger"
                    >
                      {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    </button>
                    <button
                      onClick={() => {
                        setFileToRename(file);
                        setNewFileName(file.name);
                        setIsRenameModalOpen(true);
                      }}
                      className="bg-blue-500/20 text-blue-400 font-bold py-2 px-2 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center"
                      title="Renommer"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setFileToMove(file);
                        setIsMoveModalOpen(true);
                      }}
                      className="bg-purple-500/20 text-purple-400 font-bold py-2 px-2 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center"
                      title="Déplacer"
                    >
                      <Move size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="bg-red-500/20 text-red-400 font-bold py-2 px-2 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <File size={40} className="text-gray-600" />
          </div>
          <p className="text-gray-400">Aucun fichier dans ce dossier</p>
          <p className="text-xs text-gray-600 mt-1">Glissez des fichiers ou cliquez sur la zone d'upload</p>
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
              className="bg-amber-400 text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors"
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
            Dossier actuel: <span className="text-amber-400">{fileToMove?.folder}</span>
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
                      : 'bg-dark-bg border-gray-700 hover:border-amber-400 hover:bg-amber-400/10'
                  }`}
                  disabled={folder === fileToMove?.folder}
                >
                  <div className="flex items-center gap-2">
                    <Folder size={18} className="text-amber-400" />
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
              className="bg-amber-400 text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors"
            >
              Renommer
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setFileToShare(null);
          setCreatedShare(null);
        }}
        title="Partager le fichier"
      >
        {fileToShare && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 bg-dark-bg rounded-xl border border-gray-700">
              {(() => {
                const config = getFileIcon(fileToShare.name);
                const Icon = config.icon;
                return (
                  <div className={`w-12 h-12 ${config.bg} rounded-lg flex items-center justify-center`}>
                    <Icon size={24} className={config.color} />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{fileToShare.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(fileToShare.size)}</p>
              </div>
            </div>

            {!createdShare ? (
              <>
                {/* Expiration Selection */}
                <div>
                  <label className="block text-gray-400 mb-2 text-sm font-medium">
                    <Clock size={14} className="inline mr-2" />
                    Durée de validité
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SHARE_EXPIRATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setShareExpiration(option.value)}
                        className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                          shareExpiration === option.value
                            ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400'
                            : 'border-gray-700 bg-dark-bg text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <p className="text-sm text-cyan-300">
                    <Share2 size={14} className="inline mr-2" />
                    Le lien généré sera signé par ADIIL et permettra un accès sécurisé au fichier sans authentification.
                  </p>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateShare}
                  disabled={isCreatingShare}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreatingShare ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Link size={18} />
                      Générer le lien de partage
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Share Created */}
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Check size={18} className="text-green-400" />
                    <span className="text-green-400 font-medium">Lien créé avec succès !</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={createdShare.shareUrl}
                      readOnly
                      className="flex-1 bg-darker-bg border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                    />
                    <button
                      onClick={handleCopyShareUrl}
                      className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Copy size={16} />
                      Copier
                    </button>
                  </div>
                </div>

                {/* Share Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Expire le:</span>
                    <span className="text-white font-medium">{formatExpirationDate(createdShare.expiresAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Accès:</span>
                    <span className="text-white font-medium">
                      {createdShare.maxAccess ? `${createdShare.maxAccess} max` : 'Illimité'}
                    </span>
                  </div>
                </div>

                {/* Create Another */}
                <button
                  onClick={() => setCreatedShare(null)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Link size={18} />
                  Créer un autre lien
                </button>
              </>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setFileToShare(null);
                  setCreatedShare(null);
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
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
