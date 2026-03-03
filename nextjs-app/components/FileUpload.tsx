'use client'

import { useState, useRef } from 'react'

interface UploadedFile {
  id?: string
  name: string
  path: string
  size: number
  type: string
  url: string
}

interface FileUploadProps {
  courseId?: string
  folder?: string
  accept?: string
  multiple?: boolean
  maxSize?: number
  onUpload?: (file: UploadedFile) => void
  onError?: (error: string) => void
}

export default function FileUpload({
  courseId,
  folder = 'general',
  accept = 'image/*,.pdf,.doc,.docx,.txt,.md',
  multiple = false,
  maxSize = 52428800, // 50MB
  onUpload,
  onError
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      if (file.size > maxSize) {
        onError?.(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}`)
        continue
      }

      setUploading(true)
      setProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        if (courseId) {
          formData.append('courseId', courseId)
        }

        // Simulate progress (actual progress tracking requires XHR)
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90))
        }, 100)

        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData
        })

        clearInterval(progressInterval)
        setProgress(100)

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        onUpload?.(result.file)
      } catch (error) {
        console.error('Upload error:', error)
        onError?.(error instanceof Error ? error.message : 'Upload failed')
      } finally {
        setUploading(false)
        setProgress(0)
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-dropzone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleUpload(e.target.files)}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>Uploading... {progress}%</span>
          </div>
        ) : (
          <>
            <svg
              className="upload-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="upload-hint">
              Images, PDFs, Documents up to {formatFileSize(maxSize)}
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        .file-upload-container {
          width: 100%;
        }

        .file-upload-dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .file-upload-dropzone:hover {
          border-color: #3b82f6;
          background: #f0f7ff;
        }

        .file-upload-dropzone.active {
          border-color: #3b82f6;
          background: #e0f2fe;
        }

        .file-upload-dropzone.uploading {
          pointer-events: none;
          opacity: 0.8;
        }

        .upload-icon {
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .file-upload-dropzone:hover .upload-icon {
          color: #3b82f6;
        }

        .upload-text {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .upload-hint {
          margin: 0;
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .upload-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .progress-bar {
          width: 200px;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.2s ease;
        }
      `}</style>
    </div>
  )
}
