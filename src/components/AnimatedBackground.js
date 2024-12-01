import React from 'react';
import * as d3 from 'd3';

const AnimatedBackground = () => {
  const colors = d3.scaleOrdinal(d3.schemeSet3);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="shape shape-1" style={{ backgroundColor: colors(0) }} />
      <div className="shape shape-2" style={{ backgroundColor: colors(1) }} />
      <div className="shape shape-3" style={{ backgroundColor: colors(2) }} />
      <div className="shape shape-4" style={{ backgroundColor: colors(3) }} />
      <div className="shape shape-5" style={{ backgroundColor: colors(4) }} />

      <style>
        {`
          .shape {
            position: absolute;
            background-color: rgba(255, 255, 255, 0.1);
            filter: blur(50px);
            opacity: 0.15;
            border-radius: 50%;
          }

          .shape-1 {
            width: 500px;
            height: 500px;
            top: -100px;
            left: -100px;
            animation: move1 25s infinite;
          }

          .shape-2 {
            width: 600px;
            height: 600px;
            top: 50%;
            right: -200px;
            animation: move2 30s infinite;
          }

          .shape-3 {
            width: 400px;
            height: 400px;
            bottom: -150px;
            left: 30%;
            animation: move3 35s infinite;
          }

          .shape-4 {
            width: 450px;
            height: 450px;
            top: 20%;
            left: 20%;
            animation: move4 40s infinite;
          }

          .shape-5 {
            width: 550px;
            height: 550px;
            bottom: 20%;
            right: 20%;
            animation: move5 45s infinite;
          }

          @keyframes move1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(100px, 100px) rotate(90deg); }
            50% { transform: translate(0, 200px) rotate(180deg); }
            75% { transform: translate(-100px, 100px) rotate(270deg); }
          }

          @keyframes move2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-100px, -100px) rotate(-90deg); }
            50% { transform: translate(-200px, 0) rotate(-180deg); }
            75% { transform: translate(-100px, 100px) rotate(-270deg); }
          }

          @keyframes move3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(100px, -100px) rotate(120deg); }
            66% { transform: translate(-100px, -100px) rotate(240deg); }
          }

          @keyframes move4 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(-150px, 150px) rotate(-120deg); }
            66% { transform: translate(150px, 150px) rotate(-240deg); }
          }

          @keyframes move5 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(150px, -150px) rotate(90deg); }
            50% { transform: translate(0, -300px) rotate(180deg); }
            75% { transform: translate(-150px, -150px) rotate(270deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AnimatedBackground;
