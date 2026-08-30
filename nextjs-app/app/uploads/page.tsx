'use client'

import { useState, useEffect } from 'react'
import FileUpload from '@/components/FileUpload'
import FileGallery from '@/components/FileGallery'
import NavBar from '@/components/NavBar'

interface FileItem {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  public_url: string
  created_at: string
}

export default function UploadsPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Loaded a page at a time — an admin's list covers every upload in the project.
  const loadFiles = async (offset = 0) => {
    try {
      const response = await fetch(`/api/uploads?offset=${offset}`)
      const data = await response.json()

      if (response.ok) {
        const page: FileItem[] = data.uploads || []
        setFiles(prev => (offset === 0 ? page : [...prev, ...page]))
        setHasMore(Boolean(data.hasMore))
      } else {
        setError(data.error || 'Failed to load files')
      }
    } catch (err) {
      setError('Failed to load files')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // files.length rather than a page counter, so a delete doesn't skip an item
  const loadMore = () => {
    setLoadingMore(true)
    loadFiles(files.length)
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleUpload = (file: { name: string; url: string }) => {
    showNotification('success', `"${file.name}" uploaded successfully!`)
    loadFiles() // Refresh the file list
  }

  const handleDelete = (filePath: string) => {
    setFiles(files.filter(f => f.file_path !== filePath))
    showNotification('success', 'File deleted successfully')
  }

  const handleError = (error: string) => {
    showNotification('error', error)
  }

  return (
    <>
      <NavBar />
      <main className="uploads-page">
        <div className="container">
          <h1>File Uploads</h1>
          <p className="subtitle">Upload and manage your images and documents</p>

          {notification && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          <section className="upload-section">
            <h2>Upload New File</h2>
            <FileUpload
              folder="uploads"
              onUpload={handleUpload}
              onError={handleError}
              multiple={true}
            />
          </section>

          <section className="gallery-section">
            <h2>Your Files</h2>
            {loading ? (
              <div className="loading">Loading files...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <FileGallery
                  files={files}
                  onDelete={handleDelete}
                  showDelete={true}
                />
                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button className="secondary" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <style jsx>{`
          .uploads-page {
            min-height: 100vh;
            background: #f9fafb;
            padding: 2rem 0;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }

          h1 {
            margin: 0;
            font-size: 2rem;
            color: #111827;
          }

          .subtitle {
            color: #6b7280;
            margin: 0.5rem 0 2rem;
          }

          h2 {
            font-size: 1.25rem;
            color: #374151;
            margin: 0 0 1rem;
          }

          .upload-section {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
          }

          .gallery-section {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .loading {
            text-align: center;
            padding: 3rem;
            color: #6b7280;
          }

          .error-message {
            text-align: center;
            padding: 2rem;
            color: #dc2626;
            background: #fef2f2;
            border-radius: 8px;
          }

          .notification {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-weight: 500;
          }

          .notification.success {
            background: #d1fae5;
            color: #065f46;
          }

          .notification.error {
            background: #fee2e2;
            color: #991b1b;
          }
        `}</style>
      </main>
    </>
  )
}
