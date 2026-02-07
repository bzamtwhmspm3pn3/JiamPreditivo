// src/theme/QuantumTheme.jsx
import React, { useEffect, useRef } from 'react';
import './QuantumTheme.css';

const ParticleNetwork = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }
      
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    
    const connectParticles = () => {
      const maxDistance = 150;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            ctx.strokeStyle = `rgba(0, 207, 255, ${0.15 * (1 - distance / maxDistance)})`;
            ctx.lineWidth = 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      connectParticles();
      animationId = requestAnimationFrame(animate);
    };
    
    initParticles();
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="particle-network"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 0 
      }}
    />
  );
};

export const QuantumBackground = () => {
  return (
    <div className="quantum-background">
      <div className="nebula-effect"></div>
      <div className="quantum-strings"></div>
      <ParticleNetwork />
    </div>
  );
};

export const HolographicCard = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`holographic-card ${className}`} 
      onClick={onClick}
      style={{ pointerEvents: onClick ? 'auto' : 'inherit' }}
    >
      <div className="holographic-glow"></div>
      <div className="holographic-content">{children}</div>
    </div>
  );
};

export const QuantumTab = ({ 
  children, 
  active = false, 
  icon: Icon, 
  onClick,
  className = '' 
}) => {
  return (
    <button 
      className={`quantum-tab ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      {Icon && <span className="tab-icon"><Icon /></span>}
      <span>{children}</span>
      <div className="tab-glow"></div>
    </button>
  );
};

export const QuantumNavItem = ({ 
  children, 
  active = false, 
  icon: Icon, 
  onClick,
  badge 
}) => {
  return (
    <button 
      className={`quantum-nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {Icon && <span className="quantum-nav-icon"><Icon /></span>}
      <span className="quantum-nav-label">{children}</span>
      {badge && (
        <span className="quantum-nav-badge">{badge}</span>
      )}
    </button>
  );
};

export const QuantumStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'quantum',
  progress,
  onClick 
}) => {
  return (
    <HolographicCard onClick={onClick}>
      <div className={`stat-card ${color}`}>
        <div className="stat-icon">
          {Icon && <Icon />}
          <div className="pulse-effect"></div>
        </div>
        <div className="stat-content">
          <div className="stat-value">{value}</div>
          <div className="stat-label">{title}</div>
          {progress !== undefined && (
            <div className="stat-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </HolographicCard>
  );
};