'use client'

import { useEffect, useState } from 'react'

export default function TestPage() {
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/test')
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run tests')
    }
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusColor = (value: unknown): string => {
    if (typeof value === 'string') {
      if (value.startsWith('ERROR')) return 'red'
      if (value === 'OK' || value.startsWith('SUCCESS')) return 'green'
    }
    if (value && typeof value === 'object' && 'role' in value) {
      return (value as { role: string }).role === 'admin' ? 'green' : 'orange'
    }
    return 'inherit'
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🔧 Auth & Database Diagnostic</h1>
      
      <button 
        onClick={runTests} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          cursor: loading ? 'wait' : 'pointer'
        }}
      >
        {loading ? 'Running tests...' : 'Re-run Tests'}
      </button>

      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#fee', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {results && (
        <div>
          <p><strong>Timestamp:</strong> {results.timestamp as string}</p>
          
          <h2>Test Results:</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #333' }}>Test</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #333' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results.tests as Record<string, unknown>).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #ddd', verticalAlign: 'top' }}>
                    <strong>{key}</strong>
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #ddd',
                    color: getStatusColor(value)
                  }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: '40px' }}>Diagnosis:</h2>
          <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
            {(() => {
              const tests = results.tests as Record<string, unknown>
              
              if (tests.authUser === 'No user logged in') {
                return <p>❌ <strong>Not logged in.</strong> Please sign in first.</p>
              }
              
              if (typeof tests.dbUser === 'string' && tests.dbUser.startsWith('ERROR')) {
                if (tests.dbUser.includes('PGRST116')) {
                  return (
                    <div>
                      <p>❌ <strong>User not found in database.</strong></p>
                      <p>The auth user exists but has no record in the users table.</p>
                      {typeof tests.insertAttempt === 'string' && tests.insertAttempt.startsWith('ERROR') && (
                        <p>❌ <strong>Insert failed:</strong> {tests.insertAttempt}</p>
                      )}
                      {tests.insertAttempt === 'SUCCESS - User created' && (
                        <p>✅ <strong>User was created!</strong> Refresh the page.</p>
                      )}
                    </div>
                  )
                }
                return <p>❌ <strong>Database error:</strong> {tests.dbUser}</p>
              }
              
              if (tests.dbUser && typeof tests.dbUser === 'object') {
                const user = tests.dbUser as { role: string; email: string }
                return (
                  <div>
                    <p>✅ <strong>User found in database!</strong></p>
                    <p>Email: {user.email}</p>
                    <p>Role: <span style={{ color: user.role === 'admin' ? 'green' : 'orange' }}>{user.role}</span></p>
                    {user.role !== 'admin' && (
                      <p>⚠️ To make yourself admin, run in Supabase SQL Editor:<br/>
                        <code>UPDATE users SET role = &apos;admin&apos; WHERE email = &apos;{user.email}&apos;;</code>
                      </p>
                    )}
                  </div>
                )
              }
              
              return <p>⚠️ Unknown state</p>
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
