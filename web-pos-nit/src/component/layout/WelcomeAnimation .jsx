import React, { useEffect, useState } from 'react';
import logo from "../../assets/PETRONAS_CAMBODIA_LOGO-2.png";

const WelcomeAnimation = () => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 25);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="welcome-wrapper">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');

          .welcome-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #020405;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            overflow: hidden;
            font-family: 'Outfit', sans-serif;
          }

          /* Animated Gradient Background */
          .bg-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 150%;
            height: 150%;
            background: radial-gradient(circle at center, rgba(0, 161, 156, 0.15) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            animation: pulseBg 10s infinite ease-in-out;
          }

          @keyframes pulseBg {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
          }

          /* Grid Layer */
          .grid-layer {
            position: absolute;
            inset: 0;
            background-image: 
              linear-gradient(rgba(0, 161, 156, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 161, 156, 0.05) 1px, transparent 1px);
            background-size: 50px 50px;
            mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
            opacity: 0.3;
          }

          /* Tank Container */
          .tank-container {
            position: relative;
            width: 240px;
            height: 240px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
          }

          .outer-ring {
            position: absolute;
            inset: -20px;
            border-radius: 50%;
            border: 2px dashed rgba(0, 161, 156, 0.3);
            animation: rotateFull 20s infinite linear;
          }

          @keyframes rotateFull {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .glass-tank {
            position: relative;
            width: 220px;
            height: 220px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.03);
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              inset 0 0 20px rgba(0, 161, 156, 0.1),
              0 0 15px rgba(0, 161, 156, 0.2);
            backdrop-filter: blur(12px);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          }

          /* Liquid Filling */
          .fill {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: ${percent}%;
            background: linear-gradient(180deg, #00A19C 0%, #005a57 100%);
            transition: height 0.1s linear;
          }

          .wave {
            position: absolute;
            top: -25px;
            left: -50%;
            width: 200%;
            height: 40px;
            background: #00A19C;
            border-radius: 40%;
            animation: moveWave 5s infinite linear;
            opacity: 0.8;
          }

          @keyframes moveWave {
            to { transform: translateX(50%); }
          }

          .logo-img {
            position: relative;
            z-index: 10;
            width: 140px;
            filter: drop-shadow(0 0 15px rgba(255,255,255,0.4));
            animation: floating 3s infinite ease-in-out;
          }

          @keyframes floating {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          /* Text Info */
          .info-panel {
            text-align: center;
            z-index: 10;
          }

          .main-brand {
            font-size: 3rem;
            font-weight: 800;
            letter-spacing: 8px;
            color: #fff;
            margin: 0;
            line-height: 1;
            text-shadow: 0 0 30px rgba(0, 161, 156, 0.6);
          }

          .sub-brand {
            font-size: 1.2rem;
            font-weight: 300;
            letter-spacing: 15px;
            color: #00A19C;
            margin-top: 5px;
            text-transform: uppercase;
          }

          .loading-status {
            margin-top: 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
          }

          .status-label {
            font-size: 0.85rem;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.4);
            letter-spacing: 3px;
            text-transform: uppercase;
          }

          .progress-container {
            width: 320px;
            height: 6px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            overflow: hidden;
            position: relative;
          }

          .progress-fill {
            height: 100%;
            width: ${percent}%;
            background: linear-gradient(90deg, #00A19C, #00FFCC);
            box-shadow: 0 0 15px rgba(0, 255, 204, 0.4);
            transition: width 0.1s linear;
          }

          .percent-text {
            font-size: 1.5rem;
            font-weight: 700;
            color: #00FFCC;
            margin-top: 10px;
            font-variant-numeric: tabular-nums;
          }

          /* Oil Drops */
          .drops {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }

          .drop {
            position: absolute;
            background: rgba(0, 161, 156, 0.15);
            border-radius: 50%;
            filter: blur(4px);
            animation: fall linear infinite;
          }

          @keyframes fall {
            from { transform: translateY(-100px) scale(0); opacity: 0; }
            50% { opacity: 0.5; }
            to { transform: translateY(110vh) scale(1.5); opacity: 0; }
          }
        `}
      </style>

      <div className="bg-glow" />
      <div className="grid-layer" />

      {/* Falling Drops Decorative */}
      <div className="drops">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="drop" 
            style={{
              width: Math.random() * 40 + 10 + 'px',
              height: Math.random() * 40 + 10 + 'px',
              left: Math.random() * 100 + '%',
              top: '-10%',
              animationDuration: Math.random() * 5 + 5 + 's',
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <div className="tank-container">
        <div className="outer-ring" />
        <div className="glass-tank">
          <div className="fill">
            <div className="wave" />
          </div>
          <img src={logo} alt="Petronas" className="logo-img" />
        </div>
      </div>

      <div className="info-panel">
        <h1 className="main-brand">PETRONAS</h1>
        <div className="sub-brand">CAMBODIA</div>
      </div>

      <div className="loading-status">
        <span className="status-label">Initializing Camo System</span>
        <div className="progress-container">
          <div className="progress-fill" />
        </div>
        <div className="percent-text">{percent}%</div>
      </div>
    </div>
  );
};

export default WelcomeAnimation;
