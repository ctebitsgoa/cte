'use client'

import { useState, useEffect, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'

interface CoursePage {
  id: string
  name: string
  type: 'Module' | 'Article' | 'PDF' | 'Link'
  course_id: string
  parent_id: string | null
  index: number
  doc: string | null
  url: string | null
  description: string | null
}

interface ModuleWithChildren extends CoursePage {
  children: CoursePage[]
  isOpen: boolean
}

export default function ContentManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [loading, setLoading] = useState(true)
  const [courseName, setCourseName] = useState('')
  const [modules, setModules] = useState<ModuleWithChildren[]>([])
  const [allPages, setAllPages] = useState<CoursePage[]>([])
  const [selectedPage, setSelectedPage] = useState<CoursePage | null>(null)
  const [editName, setEditName] = useState('')
  const [editDoc, setEditDoc] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingTo, setAddingTo] = useState<string | null>(null) // module id 
  const [newItemType, setNewItemType] = useState<string>('Article')
  const [newItemName, setNewItemName] = useState('')
  const [newModuleName, setNewModuleName] = useState('')
  const [showAddModule, setShowAddModule] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savedPageId, setSavedPageId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const loadPages = async () => {
    const { data: pages, error } = await supabase
      .from('course_pages')
      .select('*')
      .eq('course_id', courseId)
      .order('index', { ascending: true })

    if (error) {
      console.error('Error loading pages:', error)
      return
    }

    setAllPages(pages || [])
    organizePages(pages || [])
  }

  const organizePages = (pages: CoursePage[]) => {
    const mods = pages.filter(p => p.type === 'Module')
    const organized: ModuleWithChildren[] = mods.map(mod => ({
      ...mod,
      children: pages.filter(p => p.parent_id === mod.id).sort((a, b) => a.index - b.index),
      isOpen: modules.find(m => m.id === mod.id)?.isOpen ?? true,
    }))
    setModules(organized)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data: dbUser } = await supabase.from('users').select('role').eq('id', authUser.id).single()
      if (!dbUser || dbUser.role !== 'admin') { router.push('/admin'); return }

      const { data: course } = await supabase.from('courses').select('name').eq('id', courseId).single()
      if (course) setCourseName(course.name)

      await loadPages()
      setLoading(false)
    }
    init()
  }, [courseId])

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, isOpen: !m.isOpen } : m))
  }

  const selectPage = (page: CoursePage) => {
    setSelectedPage(page)
    setEditName(page.name)
    setEditDoc(page.doc || '')
    setEditUrl(page.url || '')
    setEditDescription(page.description || '')
  }

  const handleAddModule = async () => {
    if (!newModuleName.trim()) return
    const res = await fetch(`/api/admin/courses/${courseId}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Module',
        name: newModuleName.trim(),
        index: modules.length,
      }),
    })
    if (res.ok) {
      setNewModuleName('')
      setShowAddModule(false)
      await loadPages()
    }
  }

  const handleAddItem = async (moduleId: string) => {
    if (!newItemName.trim()) return
    const module = modules.find(m => m.id === moduleId)
    const body: any = {
      type: newItemType,
      name: newItemName.trim(),
      parent_id: moduleId,
      index: module ? module.children.length : 0,
    }

    if (newItemType === 'Link') {
      body.url = '' // will be edited after creation
    }

    const res = await fetch(`/api/admin/courses/${courseId}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const page = await res.json()
      setNewItemName('')
      setAddingTo(null)
      await loadPages()
      selectPage(page)
    }
  }

  const handleSave = async () => {
    if (!selectedPage) return
    setSaving(true)

    const body: any = { name: editName }
    if (selectedPage.type === 'Article') body.doc = editDoc
    if (selectedPage.type === 'PDF') body.url = editUrl
    if (selectedPage.type === 'Link') body.url = editUrl
    if (selectedPage.type === 'Module') body.name = editName

    const res = await fetch(`/api/admin/courses/${courseId}/pages/${selectedPage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      await loadPages()
      // Re-select with updated data
      const updated = { ...selectedPage, ...body }
      setSelectedPage(updated)
      // Show saved indicator
      setSavedPageId(selectedPage.id)
      setTimeout(() => setSavedPageId(null), 2500)
    }
    setSaving(false)
  }

  const handleDelete = async (pageId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm('Are you sure you want to delete this item?')) return

    const res = await fetch(`/api/admin/courses/${courseId}/pages/${pageId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      if (selectedPage?.id === pageId) setSelectedPage(null)
      await loadPages()
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 52428800) {
      alert('File too large. Maximum size is 50MB.')
      return
    }

    setUploading(true)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `course-materials/${courseId}/${Date.now()}-${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, { upsert: false })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
    setEditUrl(data.publicUrl)
    setUploading(false)

    // If we have a selected page, also set its name from the file name if name is empty
    if (selectedPage && !editName) {
      setEditName(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'Module': return '📁'
      case 'Article': return '📄'
      case 'PDF': return '📎'
      case 'Link': return '🔗'
      default: return '📄'
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Content Manager</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9em' }}>{courseName}</p>
        </div>
        <Link href={`/admin/courses/${courseId}`}>
          <button className="secondary">← Back to Course Settings</button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '20px', minHeight: '70vh' }}>
        {/* Left: Content Tree */}
        <div style={{ width: '340px', minWidth: '340px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
            <h3 style={{ margin: 0, fontSize: '1em' }}>Course Content</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {modules.map(module => (
              <div key={module.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {/* Module header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer',
                    background: selectedPage?.id === module.id ? 'rgba(22,163,74,0.08)' : 'transparent',
                    fontWeight: 600, fontSize: '0.9em',
                  }}
                >
                  <span onClick={() => toggleModule(module.id)} style={{ marginRight: '6px', transform: module.isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
                  <span onClick={() => selectPage(module)} style={{ flex: 1, cursor: 'pointer' }}>
                    📁 {module.name}
                  </span>
                  {savedPageId === module.id ? (
                    <span style={{ color: '#16a34a', padding: '2px 4px', fontSize: '14px', fontWeight: 700 }} title="Saved!">✓</span>
                  ) : (
                    <button onClick={(e) => handleDelete(module.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', fontSize: '14px' }} title="Delete folder">✕</button>
                  )}
                </div>

                {/* Children */}
                {module.isOpen && (
                  <div style={{ paddingLeft: '20px' }}>
                    {module.children.map(child => (
                      <div
                        key={child.id}
                        onClick={() => selectPage(child)}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer',
                          background: selectedPage?.id === child.id ? 'rgba(22,163,74,0.08)' : 'transparent',
                          fontSize: '0.85em', borderRadius: '4px', margin: '2px 4px',
                          transition: 'background 0.1s',
                        }}
                      >
                        <span style={{ marginRight: '6px' }}>{typeIcon(child.type)}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.name}</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.75em', marginRight: '8px' }}>{child.type}</span>
                        {savedPageId === child.id ? (
                          <span style={{ color: '#16a34a', padding: '2px 4px', fontSize: '12px', fontWeight: 700 }} title="Saved!">✓</span>
                        ) : (
                          <button onClick={(e) => handleDelete(child.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', fontSize: '12px' }} title="Delete">✕</button>
                        )}
                      </div>
                    ))}

                    {/* Add item to module */}
                    {addingTo === module.id ? (
                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <select value={newItemType} onChange={e => setNewItemType(e.target.value)} style={{ padding: '5px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                            <option value="Article">Article</option>
                            <option value="PDF">PDF</option>
                            <option value="Link">Link</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Name..."
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddItem(module.id)}
                            style={{ flex: 1, padding: '5px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            autoFocus
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleAddItem(module.id)} className="primary" style={{ fontSize: '12px', padding: '4px 10px' }}>Add</button>
                          <button onClick={() => setAddingTo(null)} style={{ fontSize: '12px', padding: '4px 10px', background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingTo(module.id); setNewItemName(''); setNewItemType('Article'); }}
                        style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '0.8em', textAlign: 'left' }}
                      >
                        + Add content
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Module */}
            {showAddModule ? (
              <div style={{ padding: '12px 14px', display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Folder name (e.g. Week 1)"
                  value={newModuleName}
                  onChange={e => setNewModuleName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddModule()}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  autoFocus
                />
                <button onClick={handleAddModule} className="primary" style={{ fontSize: '12px', padding: '4px 12px' }}>Add</button>
                <button onClick={() => setShowAddModule(false)} style={{ fontSize: '12px', padding: '4px 8px', background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAddModule(true); setNewModuleName(''); }}
                style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600, fontSize: '0.85em', textAlign: 'left' }}
              >
                + Add Folder
              </button>
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', overflow: 'auto' }}>
          {selectedPage ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '999px', fontSize: '0.8em', fontWeight: 600,
                  background: selectedPage.type === 'Module' ? '#dbeafe' : selectedPage.type === 'Article' ? '#d1fae5' : selectedPage.type === 'PDF' ? '#fef3c7' : '#ede9fe',
                  color: selectedPage.type === 'Module' ? '#1e40af' : selectedPage.type === 'Article' ? '#065f46' : selectedPage.type === 'PDF' ? '#92400e' : '#5b21b6',
                }}>
                  {typeIcon(selectedPage.type)} {selectedPage.type}
                </span>
                <button onClick={handleSave} className="primary" disabled={saving} style={{ fontSize: '13px' }}>
                  {saving ? 'Saving...' : savedPageId === selectedPage.id ? '✓ Saved' : 'Save Changes'}
                </button>
              </div>

              {/* Name */}
              <label style={{ fontWeight: 600, fontSize: '0.85em', color: '#374151', display: 'block', marginBottom: '4px' }}>Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', marginBottom: '20px' }}
              />

              {/* Article editor */}
              {selectedPage.type === 'Article' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '0.85em', color: '#374151', display: 'block', marginBottom: '4px' }}>Content (Markdown)</label>
                  <p style={{ fontSize: '0.8em', color: '#9ca3af', margin: '0 0 8px' }}>
                    Write using Markdown. Supports headings (#), bold (**), lists (-), code blocks (```), tables, and more.
                  </p>
                  <textarea
                    value={editDoc}
                    onChange={e => setEditDoc(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px', lineHeight: '1.6', minHeight: '400px', resize: 'vertical' }}
                  />
                </>
              )}

              {/* PDF editor */}
              {selectedPage.type === 'PDF' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '0.85em', color: '#374151', display: 'block', marginBottom: '8px' }}>PDF File</label>

                  {editUrl && (
                    <div style={{ padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>📎</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={editUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontWeight: 500, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {editUrl.split('/').pop()?.replace(/^\d+-/, '') || 'View PDF'}
                        </a>
                        <p style={{ margin: 0, fontSize: '0.8em', color: '#6b7280' }}>Uploaded file</p>
                      </div>
                      <button onClick={() => setEditUrl('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                    </div>
                  )}

                  <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', background: '#fafafa' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip"
                      onChange={handlePdfUpload}
                      style={{ display: 'none' }}
                    />
                    <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '0.9em' }}>
                      {uploading ? 'Uploading...' : 'Upload a PDF, document, or other file (max 50MB)'}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="secondary"
                      disabled={uploading}
                      style={{ fontSize: '13px' }}
                    >
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </button>
                  </div>

                  <label style={{ fontWeight: 600, fontSize: '0.85em', color: '#374151', display: 'block', marginTop: '16px', marginBottom: '4px' }}>Or paste a direct URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/file.pdf"
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                </>
              )}

              {/* Link editor */}
              {selectedPage.type === 'Link' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '0.85em', color: '#374151', display: 'block', marginBottom: '4px' }}>URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/resource"
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }}
                  />
                  {editUrl && (
                    <a href={editUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.85em' }}>
                      🔗 Open link in new tab →
                    </a>
                  )}
                </>
              )}

              {/* Module editor - just name (already shown above) */}
              {selectedPage.type === 'Module' && (
                <p style={{ fontSize: '0.85em', color: '#6b7280' }}>
                  This is a folder. Add content inside it using the &quot;+ Add content&quot; button in the sidebar.
                </p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>📚</p>
              <h3 style={{ color: '#6b7280' }}>Select an item to edit</h3>
              <p>Choose a folder or content item from the left panel, or create a new one.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="display: flex"][style*="gap: 20px"] {
            flex-direction: column !important;
          }
          div[style*="width: 340px"] {
            width: 100% !important;
            min-width: unset !important;
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  )
}
