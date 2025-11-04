'use client'

import { useState, useEffect } from 'react'

export default function ComingSoonPage() {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const toggleNotify = () => {
    setShowEmailForm(!showEmailForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Here you would normally send to your backend
    console.log('Email submitted:', email)
    
    // Store in localStorage for now
    const emails = JSON.parse(localStorage.getItem('sltr_notify') || '[]')
    emails.push({
      email: email,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('sltr_notify', JSON.stringify(emails))
    
    // Show success
    setShowEmailForm(false)
    setShowSuccess(true)
    
    // Hide success after 5 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 5000)
    
    // Reset form
    setEmail('')
  }

  useEffect(() => {
    // Add some magic sparkles randomly
    const sparkleInterval = setInterval(() => {
      const sparkle = document.createElement('div')
      sparkle.innerHTML = '✨'
      sparkle.style.position = 'absolute'
      sparkle.style.left = Math.random() * 100 + '%'
      sparkle.style.top = Math.random() * 100 + '%'
      sparkle.style.fontSize = Math.random() * 20 + 10 + 'px'
      sparkle.style.opacity = '0'
      sparkle.style.animation = 'sparkle 2s ease-out forwards'
      sparkle.style.pointerEvents = 'none'
      sparkle.style.zIndex = '1'
      
      if (document.body) {
        document.body.appendChild(sparkle)
        
        setTimeout(() => sparkle.remove(), 2000)
      }
    }, 3000)

    return () => clearInterval(sparkleInterval)
  }, [])

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #000;
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        /* Subtle animated background */
        body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(255,0,255,0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(0,255,255,0.03) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255,255,0,0.02) 0%, transparent 50%);
          animation: breathe 10s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        .container {
          text-align: center;
          z-index: 1;
          padding: 40px;
          animation: fadeIn 2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .heart {
          font-size: 60px;
          margin-bottom: 40px;
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .quote {
          font-size: 24px;
          font-style: italic;
          color: #fff;
          margin-bottom: 30px;
          letter-spacing: 2px;
          font-weight: 300;
          opacity: 0.9;
        }

        .message {
          font-size: 20px;
          color: #ccc;
          margin-bottom: 30px;
          letter-spacing: 1px;
          line-height: 1.6;
        }

        .date-time {
          font-size: 36px;
          color: #fff;
          margin-bottom: 30px;
          letter-spacing: 5px;
          font-weight: 200;
          background: linear-gradient(90deg, 
            rgba(255,255,255,0.5),
            rgba(255,255,255,1),
            rgba(255,255,255,0.5)
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }

        .soon {
          font-size: 18px;
          color: #888;
          margin-bottom: 30px;
          letter-spacing: 3px;
        }

        /* Notify button */
        .notify-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 15px 40px;
          font-size: 14px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
          position: relative;
          overflow: hidden;
        }

        .notify-btn:hover {
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }

        .notify-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .notify-btn:hover::before {
          left: 100%;
        }

        /* Email input */
        .email-form {
          display: ${showEmailForm ? 'block' : 'none'};
          margin-top: 20px;
          animation: ${showEmailForm ? 'slideDown 0.3s ease' : 'none'};
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .email-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 10px;
          font-size: 16px;
          width: 250px;
          margin-right: 10px;
          outline: none;
        }

        .email-input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .email-submit {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 10px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .email-submit:hover {
          background: rgba(255,255,255,0.1);
        }

        /* Success message */
        .success-msg {
          display: ${showSuccess ? 'block' : 'none'};
          color: #00ff00;
          margin-top: 20px;
          font-size: 14px;
          animation: fadeIn 0.5s ease;
        }

        /* Three swords Easter egg */
        .swords {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 24px;
          opacity: 0.1;
          letter-spacing: 10px;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }

        @keyframes sparkle {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          50% { opacity: 1; transform: translateY(-20px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0); }
        }

        /* Mobile responsive */
        @media (max-width: 600px) {
          .quote { font-size: 20px; }
          .message { font-size: 18px; }
          .date-time { font-size: 28px; }
          .container { padding: 20px; }
        }
      `}</style>

      <div className="container">
        <div className="heart">🖤</div>
        
        <div className="quote">"All for one, one for all"</div>
        
        <div className="message">
          The 3 Musketeers are creating magic.
        </div>
        
        <div className="date-time">11.11</div>
        
        <div className="soon">See you soon.</div>
        
        <div className="heart">🖤</div>
        
        <button 
          className="notify-btn" 
          onClick={toggleNotify}
          style={{ display: showEmailForm ? 'none' : 'block' }}
        >
          Notify Me
        </button>
        
        <form 
          className="email-form" 
          onSubmit={handleSubmit}
        >
          <input 
            type="email" 
            className="email-input" 
            placeholder="your@email.com" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="email-submit">→</button>
        </form>
        
        <div className="success-msg">
          ✓ We'll notify you when the magic is ready.
        </div>
      </div>
      
      {/* Easter egg: Three swords */}
      <div className="swords">⚔️⚔️⚔️</div>
    </>
  )
}


