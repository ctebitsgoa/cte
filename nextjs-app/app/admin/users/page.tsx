'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import Link from 'next/link'
import Loading from '@/components/Loading'

const USERS_PER_PAGE = 10

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (dbUser) {
        setCurrentUser(dbUser)
      }

      // Load all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setAllUsers(usersData || [])
      setLoading(false)
    }

    loadData()
  }, [supabase])

  // Filter users based on search
  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination calculations
  const totalUsers = filteredUsers.length
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)
  const startIndex = (currentPage - 1) * USERS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  if (loading) return <Loading />

  return (
    <>
      <div className="pagination-controls">
        <div className="pagination-info">
          <p>Total: {totalUsers} entries</p>
          <p>Showing: Page {currentPage} of {totalPages || 1}</p>
          <input
            type="text"
            placeholder="Search by Name"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginTop: '10px' }}
          />
        </div>
        <div className="pagination-buttons">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Access Level</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Link href={`/admin/users/${user.id}`}>
                  <button>View</button>
                </Link>
              </td>
            </tr>
          ))}
          {paginatedUsers.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
