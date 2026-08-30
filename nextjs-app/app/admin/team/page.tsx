'use client'

import { useEffect, useState, useRef } from 'react'
import Loading from '@/components/Loading'
import { downscaleImage } from '@/lib/image'

interface TeamMember {
  id: string
  name: string
  designation: string
  photo_url: string | null
  email: string | null
  instagram: string | null
  linkedin: string | null
}

export default function AdminTeamPage() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [teamPhotoUrl, setTeamPhotoUrl] = useState('')
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingTeamPhoto, setUploadingTeamPhoto] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const teamPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadTeam() }, [])

  const loadTeam = async () => {
    const res = await fetch('/api/admin/team')
    if (res.ok) {
      const data = await res.json()
      setMembers(data.members || [])
      setTeamPhotoUrl(data.teamPhotoUrl || '')
    }
    setLoading(false)
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', await downscaleImage(file))
    fd.append('folder', 'team')
    const res = await fetch('/api/uploads', { method: 'POST', body: fd })
    if (res.ok) { const d = await res.json(); return d.file.url }
    return null
  }

  const handleTeamPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingTeamPhoto(true)
    const url = await uploadFile(file)
    if (url) {
      await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamPhotoUrl: url }),
      })
      setTeamPhotoUrl(url)
    }
    setUploadingTeamPhoto(false)
    if (teamPhotoRef.current) teamPhotoRef.current.value = ''
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setName(''); setDesignation(''); setEmail(''); setInstagram(''); setLinkedin('')
    setPhotoFile(null); setPhotoPreview('')
    if (photoRef.current) photoRef.current.value = ''
  }

  const handleAdd = async () => {
    if (!name.trim() || !designation.trim()) { alert('Name and designation are required'); return }
    setSaving(true)
    let photo_url: string | null = null
    if (photoFile) photo_url = await uploadFile(photoFile)

    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), designation: designation.trim(), photo_url,
        email: email.trim() || null, instagram: instagram.trim() || null, linkedin: linkedin.trim() || null,
      }),
    })
    if (res.ok) {
      const member = await res.json()
      setMembers(prev => [...prev, member])
      resetForm()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this member?')) return
    const res = await fetch(`/api/admin/team?id=${id}`, { method: 'DELETE' })
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== id))
  }

  if (loading) return <Loading />

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box' as const }
  const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Manage Team</h2>
      <p style={{ color: '#6b7280', margin: '4px 0 24px' }}>
        Upload photos of coordinators and team members for the &quot;Meet the Team&quot; page.
      </p>

      {/* Team Group Photo */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>Team Group Photo</h3>
        {teamPhotoUrl ? (
          <div>
            <img src={teamPhotoUrl} alt="Team" style={{ maxWidth: '100%', maxHeight: 350, borderRadius: 10, objectFit: 'cover' }} />
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <button className="secondary" onClick={() => teamPhotoRef.current?.click()} disabled={uploadingTeamPhoto}>
                {uploadingTeamPhoto ? 'Uploading...' : 'Change'}
              </button>
              <button style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                onClick={async () => {
                  await fetch('/api/admin/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamPhotoUrl: '' }) })
                  setTeamPhotoUrl('')
                }}>Remove</button>
            </div>
          </div>
        ) : (
          <div onClick={() => teamPhotoRef.current?.click()}
            style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', color: '#9ca3af' }}>
            {uploadingTeamPhoto ? 'Uploading...' : 'Click to upload team group photo'}
          </div>
        )}
        <input ref={teamPhotoRef} type="file" accept="image/*" onChange={handleTeamPhotoUpload} style={{ display: 'none' }} />
      </div>

      {/* Add Member */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem' }}>Add Team Member</h3>

        {/* Row 1: Name, Designation, Photo */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Designation *</label>
            <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. President" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {photoPreview && <img src={photoPreview} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />}
              <button className="secondary" onClick={() => photoRef.current?.click()} style={{ fontSize: '0.85rem' }}>
                {photoPreview ? 'Change' : 'Upload'}
              </button>
            </div>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Row 2: Social links (optional) */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Email <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Instagram <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>LinkedIn <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
            <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." style={inputStyle} />
          </div>
        </div>

        <button className="primary" onClick={handleAdd} disabled={saving} style={{ height: 38 }}>
          {saving ? 'Adding...' : '+ Add Member'}
        </button>
      </div>

      {/* Members List */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem' }}>Current Members ({members.length})</h3>
        {members.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No members yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0, fontSize: 20 }}>?</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{m.name}</div>
                  <div style={{ color: '#5f9ea0', fontSize: '0.85rem' }}>{m.designation}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    {m.email && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>&#9993; Email</span>}
                    {m.instagram && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>IG</span>}
                    {m.linkedin && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>in</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(m.id)}
                  style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
