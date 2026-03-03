'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  designation: string
  photo_url: string | null
  email: string | null
  instagram: string | null
  linkedin: string | null
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [teamPhotoUrl, setTeamPhotoUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(data => {
        setMembers(data.members || [])
        setTeamPhotoUrl(data.teamPhotoUrl || '')
      })
      .finally(() => setLoading(false))
  }, [])

  const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
  )

  const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
    </svg>
  )

  const LinkedinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
      <rect width="4" height="12" x="2" y="9"></rect>
      <circle cx="4" cy="4" r="2"></circle>
    </svg>
  )

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <h1>Team</h1>
        <p>With A Technical Department this big, come big responsibilities, which our team is used to handle.</p>
      </div>

      {loading ? (
        <div className="team-loading">Loading...</div>
      ) : (
        <>
          {/* Individual Members */}
          {members.length > 0 && (
            <div className="team-grid">
              {members.map(m => (
                <div key={m.id} className="team-card">
                  <div className="team-card-img">
                    {m.photo_url ? (
                      <img src={m.photo_url} alt={m.name} />
                    ) : (
                      <div className="team-card-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="team-card-name">{m.name}</h3>
                  <p className="team-card-designation">{m.designation}</p>
                  {(m.email || m.instagram || m.linkedin) && (
                    <div className="team-card-socials">
                      {m.email && (
                        <a href={`mailto:${m.email}`} title="Email" className="social-icon">
                          <EmailIcon />
                        </a>
                      )}
                      {m.instagram && (
                        <a href={m.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="social-icon">
                          <InstagramIcon />
                        </a>
                      )}
                      {m.linkedin && (
                        <a href={m.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="social-icon">
                          <LinkedinIcon />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Team Group Photo at the bottom */}
          {teamPhotoUrl && (
            <div className="team-group-photo">
              <img src={teamPhotoUrl} alt="The CTE Team" />
            </div>
          )}

          {!teamPhotoUrl && members.length === 0 && (
            <div className="team-empty">
              <p>Team info coming soon!</p>
            </div>
          )}
        </>
      )}

      <div className="team-back">
        <Link href="/">
          <button className="primary">&larr; Back to Home</button>
        </Link>
      </div>

      <style jsx>{`
        .team-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 24px 60px;
        }
        .team-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .team-header h1 {
          font-size: 2.4rem;
          font-weight: 800;
          margin: 0 0 12px;
        }
        .team-header p {
          color: #6b7280;
          font-size: 1.05rem;
          margin: 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .team-loading {
          text-align: center;
          padding: 80px 0;
          color: #9ca3af;
        }

        /* Grid: 4 columns on desktop, staggered like the reference */
        .team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px 32px;
          justify-items: center;
          margin-bottom: 56px;
        }

        .team-card {
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .team-card-img {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 3px 16px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }
        .team-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .team-card-placeholder {
          width: 100%;
          height: 100%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }
        .team-card-name {
          margin: 0 0 2px;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .team-card-designation {
          margin: 0 0 10px;
          color: #6b7280;
          font-size: 0.92rem;
        }
        .team-card-socials {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .social-icon {
          color: #4b5563;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .social-icon:hover {
          color: var(--primary);
        }

        .team-group-photo {
          margin-top: 16px;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        .team-group-photo img {
          width: 100%;
          display: block;
          object-fit: cover;
          max-height: 400px;
        }

        .team-empty {
          text-align: center;
          padding: 80px 0;
          color: #9ca3af;
          font-size: 1.1rem;
        }
        .team-back {
          margin-top: 48px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .team-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px 24px;
          }
          .team-card-img {
            width: 130px;
            height: 130px;
          }
        }
        @media (max-width: 600px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px 16px;
          }
          .team-card-img {
            width: 110px;
            height: 110px;
          }
          .team-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  )
}
