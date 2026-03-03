'use client'

export default function FAQPage() {
  return (
    <div className="container">
      <h1 style={{ marginTop: '40px', marginBottom: '30px' }}>Frequently Asked Questions</h1>
      
      <div style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h3>How do I register for a course?</h3>
          <p>
            Sign in with your BITS Pilani email, browse the course catalog, and click on the course you want to register for. 
            Click the "Register" button on the course page.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Can I access courses without signing in?</h3>
          <p>
            You can browse the course catalog without signing in, but you need to be signed in to access course content, 
            register for courses, and take quizzes.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>What email should I use to sign in?</h3>
          <p>
            You must use your official BITS Pilani email address (@bits-pilani.ac.in) to sign in to the platform.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>How do quizzes work?</h3>
          <p>
            Each course may have quizzes with different types of questions including multiple choice, numeric answers, 
            and text responses. Your quiz attempts are saved and you can review your answers.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Who can I contact for help?</h3>
          <p>
            For technical support or course-related questions, please contact the Center for Technical Education at BITS Pilani Goa Campus.
          </p>
        </div>
      </div>
    </div>
  )
}
