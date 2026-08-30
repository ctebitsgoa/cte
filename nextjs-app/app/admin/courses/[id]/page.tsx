'use client'

import { useState, useEffect, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import { Course } from '@/types/database'
import { UPLOAD_CACHE_CONTROL } from '@/lib/utils'
import { downscaleImage } from '@/lib/image'

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [handoutFile, setHandoutFile] = useState<File | null>(null)
  const [existingHandout, setExistingHandout] = useState<string>('')
  const handoutInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    handout: '',
    is_archived: false,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (!dbUser || dbUser.role !== 'admin') {
        router.push('/admin')
        return
      }

      setIsAdmin(true)

      // Load course
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !courseData) {
        alert('Course not found')
        router.push('/admin')
        return
      }

      setCourse(courseData)
      setFormData({
        name: courseData.name,
        subtitle: courseData.subtitle,
        description: courseData.description,
        handout: courseData.handout || '',
        is_archived: courseData.is_archived,
      })
      setImagePreview(courseData.cover_image)
      setExistingHandout(courseData.handout || '')
      setLoading(false)
    }

    loadData()
  }, [id, router, supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${id}.${fileExt}`
    const filePath = `courses/${fileName}`
    const image = await downscaleImage(imageFile)

    const { error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(filePath, image, { cacheControl: UPLOAD_CACHE_CONTROL, upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('course-images')
      .getPublicUrl(filePath)

    // The cover always lives at the same path, so bust the long cache on replace
    return `${data.publicUrl}?v=${Date.now()}`
  }

  const uploadHandout = async (): Promise<string | null> => {
    if (!handoutFile) return null

    const sanitizedName = handoutFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `handouts/${id}/${Date.now()}-${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, handoutFile, { cacheControl: UPLOAD_CACHE_CONTROL, upsert: false })

    if (uploadError) {
      console.error('Handout upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleHandoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 52428800) {
        alert('File too large. Maximum size is 50MB')
        return
      }
      setHandoutFile(file)
    }
  }

  const removeHandout = () => {
    setHandoutFile(null)
    setExistingHandout('')
    setFormData({ ...formData, handout: '' })
    if (handoutInputRef.current) {
      handoutInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileNameFromUrl = (url: string) => {
    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    // Remove timestamp prefix if present (format: timestamp-filename)
    const match = fileName.match(/^\d+-(.+)$/)
    return match ? match[1] : fileName
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let imageUrl = course?.cover_image
      let handoutUrl = existingHandout || null

      // Upload new image if provided
      if (imageFile) {
        const newImageUrl = await uploadImage()
        if (newImageUrl) {
          imageUrl = newImageUrl
        }
      }

      // Upload new handout if provided
      if (handoutFile) {
        const newHandoutUrl = await uploadHandout()
        if (newHandoutUrl) {
          handoutUrl = newHandoutUrl
        }
      }

      const { error } = await supabase
        .from('courses')
        .update({
          name: formData.name,
          subtitle: formData.subtitle,
          description: formData.description,
          handout: handoutUrl,
          cover_image: imageUrl,
          is_archived: formData.is_archived,
        })
        .eq('id', id)

      if (error) throw error

      router.push('/admin/courses')
    } catch (err: any) {
      alert('Error updating course: ' + err.message)
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (!isAdmin || !course) return null

  return (
    <>
      <div className="heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{ fontSize: '24px', fontWeight: 'bold', border: '1px solid #ddd', padding: '8px 12px', flex: '1', minWidth: '250px' }}
        />
        <div className="buttons" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button 
            className={course.is_archived ? 'secondary' : 'outline'}
            type="button"
            onClick={() => setFormData({ ...formData, is_archived: !formData.is_archived })}
          >
            {formData.is_archived ? 'UnArchive' : 'Archive'}
          </button>
          <button className="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link href="/admin/courses">
            <button type="button">Back</button>
          </Link>
        </div>
      </div>

      <img
        src={imagePreview || '/placeholder.svg'}
        alt={course.name}
        className="courseImage"
        style={{ maxWidth: '400px', marginBottom: '20px', borderRadius: '8px' }}
      />
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleImageChange}
        />
      </div>

      <div className="info">
        <h4><b>Subtitle</b></h4>
        <textarea
          placeholder="Course subtitle in maximum 100 characters"
          maxLength={100}
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          rows={2}
        />

        <h4><b>Description</b></h4>
        <textarea
          placeholder="Detailed description in minimum 200 characters."
          minLength={200}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          rows={6}
        />

        <h4><b>Handout Document</b></h4>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
          Upload a PDF, Word document, or other file for students to download.
        </p>
        
        {/* Show existing handout */}
        {existingHandout && !handoutFile && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '10px 15px', 
            background: '#f0f9ff', 
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div style={{ flex: 1 }}>
              <a href={existingHandout} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, color: '#1e40af', textDecoration: 'none' }}>
                {getFileNameFromUrl(existingHandout)}
              </a>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Current handout</p>
            </div>
            <button 
              type="button" 
              onClick={removeHandout}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '5px',
                color: '#ef4444'
              }}
              title="Remove handout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Show new handout file to upload */}
        {handoutFile && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '10px 15px', 
            background: '#d1fae5', 
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 500, color: '#065f46' }}>{handoutFile.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{formatFileSize(handoutFile.size)} • Will be uploaded on save</p>
            </div>
            <button 
              type="button" 
              onClick={removeHandout}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '5px',
                color: '#ef4444'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        <input
          ref={handoutInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
          onChange={handleHandoutChange}
          style={{ marginBottom: '10px' }}
        />

        <div style={{ marginTop: '30px' }}>
          <h4><b>Course Content</b></h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
            Manage folders, articles, PDFs, links, and quizzes for this course.
          </p>
          <Link href={`/admin/courses/${id}/content`}>
            <button className="primary">Manage Content</button>
          </Link>
        </div>

        <div style={{ marginTop: '30px' }}>
          <h4><b>Registered Students</b></h4>
          <Link href={`/admin/courses/${id}/students`}>
            <button className="secondary">View All Students</button>
          </Link>
        </div>
      </div>
    </>
  )
}
