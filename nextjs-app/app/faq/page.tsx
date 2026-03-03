'use client'

export default function FAQPage() {
  return (
    <div className="container">
      <h1 style={{ marginTop: '48px', marginBottom: '32px' }}>Frequently Asked Questions</h1>
      
      <div style={{ maxWidth: '800px' }}>
        <div style={{
          marginBottom: '16px',
          padding: '28px 32px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          border: '1px solid #e7e5e4',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>How do I register for a course?</h3>
          <p style={{ margin: 0 }}>
            Sign in with your BITS Pilani email, browse the course catalog, and click on the course you want to register for. 
            Click the "Register" button on the course page.
          </p>
        </div>

        <div style={{
          marginBottom: '16px',
          padding: '28px 32px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          border: '1px solid #e7e5e4',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Can I access courses without signing in?</h3>
          <p style={{ margin: 0 }}>
            You can browse the course catalog without signing in, but you need to be signed in to access course content, 
            register for courses, and take quizzes.
          </p>
        </div>

        <div style={{
          marginBottom: '16px',
          padding: '28px 32px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          border: '1px solid #e7e5e4',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>What email should I use to sign in?</h3>
          <p style={{ margin: 0 }}>
            You must use your official BITS Pilani email address (@bits-pilani.ac.in) to sign in to the platform.
          </p>
        </div>

        <div style={{
          marginBottom: '16px',
          padding: '28px 32px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          border: '1px solid #e7e5e4',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>How do quizzes work?</h3>
          <p style={{ margin: 0 }}>
            Each course may have quizzes with different types of questions including multiple choice, numeric answers, 
            and text responses. Your quiz attempts are saved and you can review your answers.
          </p>
        </div>

        <div style={{
          marginBottom: '16px',
          padding: '28px 32px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          border: '1px solid #e7e5e4',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Who can I contact for help?</h3>
          <p style={{ margin: 0 }}>
            For technical support or course-related questions, please contact the Center for Technical Education at BITS Pilani Goa Campus.
          </p>
        </div>
      </div>
    </div>
  )
}
