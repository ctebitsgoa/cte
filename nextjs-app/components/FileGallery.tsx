'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FileItem {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  public_url: string
  created_at: string
}

interface FileGalleryProps {
  files: FileItem[]
  onDelete?: (filePath: string) => void
  showDelete?: boolean
}

export default function FileGallery({ files, onDelete, showDelete = false }: FileGalleryProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/')
  }

  const isPDF = (mimeType: string) => {
    return mimeType === 'application/pdf'
  }

  const getFileIcon = (mimeType: string) => {
    if (isPDF(mimeType)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12h4" />
          <path d="M10 16h4" />
        </svg>
      )
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    )
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete "${file.file_name}"?`)) return

    setDeleting(file.id)
    try {
      const response = await fetch('/api/uploads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.file_path })
      })

      if (response.ok) {
        onDelete?.(file.file_path)
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    } finally {
      setDeleting(null)
    }
  }

  if (files.length === 0) {
    return (
      <div className="empty-gallery">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p>No files uploaded yet</p>
        <style jsx>{`
          .empty-gallery {
            text-align: center;
            padding: 3rem;
            color: #9ca3af;
          }
          .empty-gallery svg {
            margin-bottom: 1rem;
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <div className="file-gallery">
        {files.map((file) => (
          <div key={file.id} className="file-card">
            <a
              href={file.public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="file-preview"
              onClick={(e) => {
                if (isImage(file.mime_type)) {
                  e.preventDefault()
                  setSelectedFile(file)
                }
              }}
            >
              {isImage(file.mime_type) ? (
                <Image src={file.public_url} alt={file.file_name} width={400} height={280} sizes="200px" />
              ) : (
                <div className="file-icon">{getFileIcon(file.mime_type)}</div>
              )}
            </a>
            <div className="file-info">
              <p className="file-name" title={file.file_name}>
                {file.file_name}
              </p>
              <p className="file-meta">
                {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
              </p>
            </div>
            {showDelete && (
              <button
                className="delete-btn"
                onClick={() => handleDelete(file)}
                disabled={deleting === file.id}
              >
                {deleting === file.id ? '...' : '×'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Image Lightbox */}
      {selectedFile && (
        <div className="lightbox" onClick={() => setSelectedFile(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedFile(null)}>
              ×
            </button>
            <Image
              src={selectedFile.public_url}
              alt={selectedFile.file_name}
              width={1600}
              height={1200}
              sizes="100vw"
            />
            <p className="lightbox-caption">{selectedFile.file_name}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .file-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .file-card {
          position: relative;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .file-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .file-preview {
          display: block;
          height: 140px;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .file-preview :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-icon {
          color: #9ca3af;
        }

        .file-info {
          padding: 0.75rem;
        }

        .file-name {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #374151;
        }

        .file-meta {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .file-card:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          background: #dc2626;
        }

        .lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }

        .lightbox-content :global(img) {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
        }

        .lightbox-close {
          position: absolute;
          top: -2rem;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
        }

        .lightbox-caption {
          color: white;
          text-align: center;
          margin-top: 1rem;
        }
      `}</style>
    </>
  )
}
