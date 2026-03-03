'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'

export default function NewCoursePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [handoutFile, setHandoutFile] = useState<File | null>(null)
  const [handoutUploading, setHandoutUploading] = useState(false)
  const handoutInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    handout: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
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
      setLoading(false)
    }

    checkAdmin()
  }, [router, supabase])

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

  const uploadImage = async (courseId: string): Promise<string> => {
    if (!imageFile) return '/placeholder.svg'

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${courseId}.${fileExt}`
    const filePath = `courses/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(filePath, imageFile, { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return '/placeholder.svg'
    }

    const { data } = supabase.storage
      .from('course-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const uploadHandout = async (courseId: string): Promise<string | null> => {
    if (!handoutFile) return null

    const fileExt = handoutFile.name.split('.').pop()
    const sanitizedName = handoutFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `handouts/${courseId}/${Date.now()}-${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, handoutFile, { upsert: false })

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
      // Validate file size (50MB max)
      if (file.size > 52428800) {
        alert('File too large. Maximum size is 50MB')
        return
      }
      setHandoutFile(file)
    }
  }

  const removeHandout = () => {
    setHandoutFile(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // First create the course with a placeholder image
      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          name: formData.name,
          subtitle: formData.subtitle,
          description: formData.description,
          handout: null,
          cover_image: '/placeholder.svg',
          is_archived: false,
        })
        .select()
        .single()

      if (error) throw error

      // Upload image if provided
      if (imageFile && course) {
        const imageUrl = await uploadImage(course.id)
        
        // Update course with real image URL
        await supabase
          .from('courses')
          .update({ cover_image: imageUrl })
          .eq('id', course.id)
      }

      // Upload handout if provided
      if (handoutFile && course) {
        const handoutUrl = await uploadHandout(course.id)
        
        if (handoutUrl) {
          await supabase
            .from('courses')
            .update({ handout: handoutUrl })
            .eq('id', course.id)
        }
      }

      router.push('/admin/courses')
    } catch (err: any) {
      alert('Error creating course: ' + err.message)
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (!isAdmin) return null

  return (
    <>
      <div className="heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Add Course</h2>
        <div className="buttons" style={{ display: 'flex', gap: '5px' }}>
          <button className="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding...' : 'Add'}
          </button>
          <Link href="/admin/courses">
            <button type="button">Back</button>
          </Link>
        </div>
      </div>

      <div className="form" style={{ maxWidth: '700px' }}>
        <h4>Name</h4>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Course name"
          style={{ width: '100%', marginBottom: '15px' }}
        />

        <h4>Subtitle</h4>
        <textarea
          rows={3}
          placeholder="Course subtitle in maximum 100 characters"
          maxLength={100}
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          style={{ width: '100%', marginBottom: '15px' }}
        />

        <h4>Description</h4>
        <textarea
          rows={6}
          placeholder="Detailed description in minimum 200 characters."
          minLength={200}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{ width: '100%', marginBottom: '15px' }}
        />

        <h4 style={{ marginBottom: '5px' }}>Cover Image</h4>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleImageChange}
          style={{ marginBottom: '10px' }}
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Course Cover Image"
            className="courseImage"
            style={{ maxWidth: '300px', display: 'block', marginTop: '10px', borderRadius: '8px' }}
          />
        )}

        <h4 style={{ marginBottom: '5px', marginTop: '20px' }}>Handout Document (optional)</h4>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
          Upload a PDF, Word document, or other file for students to download.
        </p>
        <input
          ref={handoutInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
          onChange={handleHandoutChange}
          style={{ marginBottom: '10px' }}
        />
        {handoutFile && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '10px 15px', 
            background: '#f0f9ff', 
            borderRadius: '8px',
            marginTop: '10px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 500, color: '#1e40af' }}>{handoutFile.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{formatFileSize(handoutFile.size)}</p>
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
      </div>
    </>
  )
}
