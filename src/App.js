import React, { useState, useEffect } from 'react';
import './App.css';
import LoginModal from './LoginModal';

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [showRocket, setShowRocket] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setShowRocket(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleStartJourney = () => {
    if (isLoggedIn) {
      scrollToSection('features');
    } else {
      setShowLoginModal(true);
    }
  };


  return (
    <div className="App">
      {/* Space Background */}
      <div className="space-background">
        <div className="stars"></div>
        <div className="shooting-stars"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">🚀 Space Explorer</div>
          <ul className="nav-links">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          </ul>
          <div className="auth-buttons">
            {isLoggedIn ? (
              <>
                <span style={{ color: '#00d4ff', marginRight: '1rem' }}>
                  Welcome, {user?.name}!
                </span>
                <button className="btn btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setAuthMode('login'); setShowLoginModal(true); }}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => { setAuthMode('signup'); setShowLoginModal(true); }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Scroll Progress Bar */}
      <div className="scroll-progress">
        <div 
          className="scroll-progress-bar" 
          style={{ width: `${(scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%` }}
        ></div>
      </div>

      {/* Rocket Scroll Button */}
      {showRocket && (
        <button className="rocket-scroll-btn" onClick={scrollToTop}>
          <div className="rocket">🚀</div>
          <div className="rocket-trail"></div>
        </button>
      )}

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Explore the Universe</h1>
          <p className="hero-subtitle">
            Journey through the cosmos with our interactive space exploration platform
          </p>
          <button 
            className="cta-button" 
            onClick={handleStartJourney}
          >
            {isLoggedIn ? 'Continue Journey' : 'Start Your Journey'}
          </button>
        </div>
        <div className="floating-elements">
          <div className="planet planet-1"></div>
          <div className="planet planet-2"></div>
          <div className="planet planet-3"></div>
          <div className="asteroid"></div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2 className="section-title">About Space Explorer</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Space Explorer is your gateway to the universe. Experience the wonders of space 
                through interactive simulations, real-time planet tracking, and immersive cosmic journeys.
              </p>
              <p>
                Our platform combines cutting-edge technology with educational content to bring 
                the mysteries of space directly to your screen.
              </p>
            </div>
            <div className="about-visual">
              <div className="space-station"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Planet Tracking</h3>
              <p>Real-time tracking of planets and celestial bodies in our solar system.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Star Mapping</h3>
              <p>Interactive star maps with detailed information about constellations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛸</div>
              <h3>Space Missions</h3>
              <p>Follow current and historical space missions with live updates.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔭</div>
              <h3>Telescope View</h3>
              <p>Simulate telescope observations of distant galaxies and nebulae.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>Ready to explore the universe? Contact us for more information about Space Explorer.</p>
              <div className="contact-details">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <span>praneetsingh081105@gmail.com</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <span>+91 8851271943</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span>BIAS, Bhimtal, India</span>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Your Name" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" required />
                </div>
                <div className="form-group">
                  <textarea placeholder="Your Message" rows="5" required></textarea>
                </div>
                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Space Explorer. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        initialMode={authMode}
      />
    </div>
  );
}

export default App;
