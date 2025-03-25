/**
 * Formats a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format time
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Check if date is today, yesterday, or earlier
  if (date.toDateString() === now.toDateString()) {
    return `Today ${timeString}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${timeString}`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Gets the appropriate icon class and color for a file type
 */
export function getFileIcon(fileType: string): { icon: string; color: string } {
  // Default icon
  let icon = "ri-file-fill";
  let color = "text-neutral-400";
  
  // Check file type
  if (fileType.startsWith('image/')) {
    icon = "ri-image-fill";
    color = "text-blue-500";
  } else if (fileType.includes('word') || fileType.includes('document')) {
    icon = "ri-file-word-fill";
    color = "text-blue-500";
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    icon = "ri-file-excel-fill";
    color = "text-green-500";
  } else if (fileType.includes('pdf')) {
    icon = "ri-file-pdf-fill";
    color = "text-red-500";
  } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
    icon = "ri-file-ppt-fill";
    color = "text-orange-500";
  } else if (fileType.includes('video')) {
    icon = "ri-video-fill";
    color = "text-purple-500";
  } else if (fileType.includes('audio')) {
    icon = "ri-music-fill";
    color = "text-yellow-500";
  } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) {
    icon = "ri-file-zip-fill";
    color = "text-orange-400";
  } else if (fileType.includes('text')) {
    icon = "ri-file-text-fill";
    color = "text-gray-500";
  } else if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('html') || fileType.includes('css')) {
    icon = "ri-code-fill";
    color = "text-indigo-500";
  }
  
  return { icon, color };
}

/**
 * Converts a file extension to a MIME type
 */
export function extensionToMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'gz': 'application/gzip',
  };
  
  const ext = extension.toLowerCase().replace('.', '');
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Extracts the file extension from a filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Generates a unique filename to prevent collisions
 */
export function generateUniqueFilename(filename: string): string {
  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const timestamp = Date.now();
  
  return `${nameWithoutExt}_${timestamp}.${extension}`;
}

/**
 * Checks if a file is an image
 */
export function isImage(fileType: string): boolean {
  return fileType.startsWith('image/');
}

/**
 * Checks if a file is a video
 */
export function isVideo(fileType: string): boolean {
  return fileType.startsWith('video/');
}

/**
 * Checks if a file is audio
 */
export function isAudio(fileType: string): boolean {
  return fileType.startsWith('audio/');
}

/**
 * Checks if a file is a document (PDF, Word, Excel, etc.)
 */
export function isDocument(fileType: string): boolean {
  return (
    fileType.includes('pdf') ||
    fileType.includes('word') ||
    fileType.includes('excel') ||
    fileType.includes('powerpoint') ||
    fileType.includes('document') ||
    fileType.includes('sheet') ||
    fileType.includes('presentation') ||
    fileType.includes('text/plain') ||
    fileType.includes('text/csv')
  );
}
