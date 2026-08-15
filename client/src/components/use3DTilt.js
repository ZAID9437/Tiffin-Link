import { useEffect, useRef } from 'react';

export default function use3DTilt(maxAngle = 10, scale = 1.02) {
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Check if mobile (disable 3D tilt on mobile for performance/accessibility)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) return;

    // Look for a glare element
    const glare = el.querySelector('.tilt-glare');

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // x coordinate
      const y = e.clientY - rect.top;  // y coordinate

      const width = rect.width;
      const height = rect.height;

      // Normalize positions to range -0.5 to 0.5
      const xc = (x / width) - 0.5;
      const yc = (y / height) - 0.5;

      // Calculate tilt angles
      const rotateX = -yc * maxAngle;
      const rotateY = xc * maxAngle;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
      el.style.transition = 'transform 0.1s ease-out';

      if (glare) {
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 80%)`;
      }
    };

    const handleMouseLeave = () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
      el.style.transition = 'transform 0.5s ease-out';
      if (glare) {
        glare.style.background = 'transparent';
      }
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxAngle, scale]);

  return elementRef;
}
