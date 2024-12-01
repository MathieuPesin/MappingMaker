import React, { useEffect, useRef, useState } from 'react';

const Logo = ({ size, className = "" }) => {
  const svgRef = useRef(null);
  const requestRef = useRef(null);
  const angleRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const getCirclePoints = (angle) => ({
    x: 50 + Math.cos(angle) * 20,
    y: 50 + Math.sin(angle) * 20
  });

  const calculateIntersections = (radius, angle1, angle2, angle3) => {
    const c1 = getCirclePoints(angle1);
    const c2 = getCirclePoints(angle2);
    const c3 = getCirclePoints(angle3);

    return [
      { x: c1.x, y: c1.y },
      { x: c2.x, y: c2.y },
      { x: c3.x, y: c3.y },
      { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 },
      { x: (c2.x + c3.x) / 2, y: (c2.y + c3.y) / 2 },
      { x: (c3.x + c1.x) / 2, y: (c3.y + c1.y) / 2 }
    ];
  };

  const animate = () => {
    if (!svgRef.current) return;
    
    angleRef.current += 0.003;
    const points = calculateIntersections(
      30,
      angleRef.current,
      angleRef.current + (2 * Math.PI / 3),
      angleRef.current + (4 * Math.PI / 3)
    );

    const circles = svgRef.current.querySelectorAll('.rotating-circle');
    circles.forEach((circle, i) => {
      if (i < 3) {
        circle.setAttribute('cx', points[i].x);
        circle.setAttribute('cy', points[i].y);
      }
    });

    const intersections = svgRef.current.querySelectorAll('.intersection-point');
    intersections.forEach((point, i) => {
      point.setAttribute('cx', points[i + 3].x);
      point.setAttribute('cy', points[i + 3].y);
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const finalClassName = `${size ? `h-${size} w-${size}` : 'h-8 w-8'} ${className}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={finalClassName}
      ref={svgRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#logoGradient)"
        strokeWidth="1.5"
        opacity="0.4"
        className="transition-all duration-1000"
        fill="none"
      />

      {[0, 1, 2].map((i) => (
        <circle
          key={`circle-${i}`}
          className="rotating-circle transition-all duration-1000"
          cx="50"
          cy="50"
          r="18"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          opacity="0.8"
          fill="none"
          filter="url(#glow)"
        />
      ))}

      {[0, 1, 2].map((i) => (
        <circle
          key={`point-${i}`}
          className="intersection-point transition-all duration-1000"
          cx="50"
          cy="50"
          r="4"
          fill="url(#logoGradient)"
          filter="url(#glow)"
        >
          <animate
            attributeName="r"
            values="3;4.5;3"
            dur="2s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
          />
          <animate
            attributeName="opacity"
            values="0.6;1;0.6"
            dur="2s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
          />
        </circle>
      ))}
    </svg>
  );
};

export default Logo;
