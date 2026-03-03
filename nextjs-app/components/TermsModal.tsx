'use client'

import { useEffect, useState } from 'react'

interface TermsModalProps {
  courseName: string
  onAgree: () => void
  onClose: () => void
}

export default function TermsModal({ courseName, onAgree, onClose }: TermsModalProps) {
  const [swdConsent, setSwdConsent] = useState(false)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="terms-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="terms-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="terms-header">
          <h3>Terms &amp; Conditions</h3>
          <button className="terms-close" onClick={onClose}>&times;</button>
        </div>
        <div className="terms-body">
          <p className="terms-intro">
            By registering for <b>{courseName || 'this course'}</b>, I agree to the following:
          </p>

          <div className="terms-item">
            <h4>Course Structure</h4>
            <p>I have thoroughly read the course handout and understand the structure of the course.</p>
          </div>

          <div className="terms-item">
            <h4>Registration &amp; Deregistration</h4>
            <p>I will complete my registration through the official CTE website using my BITS-ID. The first two classes will serve as demo classes. I understand that I can deregister from the course only until the official deregistration deadline, which CTE will communicate via my official BITS email ID. I will not be permitted to deregister once this period has ended.</p>
          </div>

          <div className="terms-item">
            <h4>Certification</h4>
            <p>I must fulfill all the minimum requirements outlined in the course to be eligible to receive the Certificate of Completion from CTE.</p>
          </div>

          <div className="terms-item">
            <h4>Course Fee</h4>
            <p>The fee for this course is &#8377;800, which will be automatically deducted from my SWD account after the deregistration period ends.</p>
          </div>

          <div className="terms-item">
            <h4>Dispute Resolution</h4>
            <p>Any issues regarding the course, registration, or withdrawals must be reported directly to the CTE Team (not the instructors) within the first 3 classes. In case of any disputes, the decision made by CTE will be final.</p>
          </div>

          <div className="terms-item">
            <h4>Amendments &amp; Cancellations</h4>
            <p>CTE reserves the right to make reasonable adjustments to the syllabus if necessary. CTE also reserves the right to cancel the course due to unforeseen circumstances or insufficient enrollment, in which case a full refund will be provided.</p>
          </div>

          <div className="terms-item">
            <h4>Queries &amp; Support</h4>
            <p>For any queries or concerns regarding the course, I can contact the CTE Team.</p>
          </div>

          <div className="consent-checkbox">
            <label>
              <input
                type="checkbox"
                checked={swdConsent}
                onChange={(e) => setSwdConsent(e.target.checked)}
              />
              <span>I give my consent to SWD to deduct the required amount for the above mentioned CTE courses after deregistration window closes.</span>
            </label>
          </div>
        </div>
        <div className="terms-footer">
          <button className="primary" onClick={onAgree} disabled={!swdConsent}>I Agree</button>
          <button className="secondary" onClick={onClose}>Discard</button>
        </div>

        <style jsx>{`
          .terms-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #e5e7eb;
            flex-shrink: 0;
          }
          .terms-header h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
          }
          .terms-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            line-height: 1;
          }
          .terms-close:hover {
            color: #111;
          }
          .terms-body {
            padding: 24px;
            overflow-y: auto;
            font-size: 0.95rem;
            line-height: 1.7;
            flex: 1;
          }
          .terms-intro {
            margin: 0 0 20px 0;
            font-size: 1rem;
          }
          .terms-item {
            margin-bottom: 16px;
          }
          .terms-item h4 {
            margin: 0 0 4px 0;
            font-size: 0.95rem;
            font-weight: 600;
            color: #1f2937;
          }
          .terms-item p {
            margin: 0;
            color: #4b5563;
          }
          .consent-checkbox {
            margin-top: 24px;
            padding: 16px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .consent-checkbox label {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            cursor: pointer;
            font-size: 0.93rem;
            line-height: 1.5;
            color: #1f2937;
            font-weight: 500;
          }
          .consent-checkbox input[type="checkbox"] {
            margin-top: 3px;
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            cursor: pointer;
            accent-color: #5f9ea0;
          }
          .terms-footer {
            display: flex;
            gap: 12px;
            padding: 16px 24px;
            border-top: 1px solid #e5e7eb;
            justify-content: flex-end;
            flex-shrink: 0;
          }
          .terms-footer button {
            min-width: 100px;
          }
          .terms-footer button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  )
}
