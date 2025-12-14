import React from 'react';

const WelcomeAnimation = () => {
  const texts = ['W', 'e', 'l', 'c', 'o', 'm', 'e', ': )'];
  const numberOfParticle = 12;
  const numberOfText = texts.length;
  const multNumText = 360 / numberOfText;
  const multNumParticle = 360 / numberOfParticle;
  const width = 40;
  const height = 40;

  // Generate random number (keeping the original function logic)
  const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Generate keyframes as strings for dynamic CSS
  const generateKeyframes = () => {
    let keyframes = '';
    
    // Background animation
    keyframes += `
      @keyframes background-animation {
        0% { width: 0; }
        50% { width: 12.5%; opacity: 1; }
        100% { opacity: 0; width: 25%; }
      }
    `;

    // Text animations
    for (let i = 0; i < numberOfText; i++) {
      keyframes += `
        @keyframes text-animation${i} {
          0% { transform: scale(0, 0); opacity: 0; }
          50% { transform: scale(3, 3); }
          100% { transform: scale(1, 1); opacity: 1; }
        }
        
        @keyframes text-after-animation${i} {
          0% { width: 0px; background-color: hsl(${i * multNumText}, 80%, 60%); opacity: 1; }
          50% { width: ${width}px; opacity: 1; }
          100% { left: ${width}px; opacity: 0; }
        }
      `;

      // Text2 animation with special case for last element
      if (i !== numberOfText - 1) {
        keyframes += `
          @keyframes text2-animation${i} {
            0% { left: ${-(numberOfText / 2 - i) * width + (width / 2)}px; opacity: 1; }
            50% { left: ${-(numberOfText / 2 - i - 1) * width + (width / 2)}px; opacity: 0; }
            100% { left: ${-(numberOfText / 2 - i - 1) * width + (width / 2)}px; opacity: 0; }
          }
        `;
      } else {
        keyframes += `
          @keyframes text2-animation${i} {
            0% { left: ${-(numberOfText / 2 - i) * width + (width / 2)}px; opacity: 1; top: 0; transform: scale(1, 1); }
            50% { left: ${-(numberOfText / 2 - i - 1) * width + (width / 2)}px; opacity: 1; transform: scale(1, 1); }
            65% { top: 0; transform: scale(1, 1); }
            70% { transform: scale(3, 3) rotate(90deg); top: -30px; }
            75% { left: ${-(numberOfText / 2 - i - 1) * width + (width / 2)}px; top: 0; opacity: 1; transform: scale(2, 2) rotate(90deg); }
            85% { left: ${-(numberOfText / 2 - i - 1) * width + (width / 2)}px; }
            100% { left: 1000px; opacity: 0; transform: scale(2, 2) rotate(90deg); }
          }
        `;
      }
    }

    // Frame animations
    for (let i = 0; i < numberOfText; i++) {
      keyframes += `
        @keyframes frame-animation${i} {
          0% { transform: translateY(-1000px); opacity: 1; }
          50% { opacity: 0.8; }
          100% { transform: translateY(0); opacity: 0; }
        }
      `;
    }

    // Particle animations
    for (let i = 0; i < numberOfText; i++) {
      for (let j = 0; j < numberOfParticle; j++) {
        const angle = j * multNumParticle * (Math.PI / 180);
        const finalX = -(numberOfText / 2 - i) * width + (width / 2) + Math.cos(angle) * 100;
        const finalY = Math.sin(angle) * 100;
        
        keyframes += `
          @keyframes particle-animation${i}${j} {
            0% { 
              left: ${-(numberOfText / 2 - i) * width + (width / 2)}px; 
              top: 0; 
              opacity: 0; 
              transform: scale(1, 1); 
            }
            100% { 
              left: ${finalX}px; 
              top: ${finalY}px; 
              opacity: 1; 
              transform: scale(0, 0); 
            }
          }
        `;
      }
    }

    return keyframes;
  };

  const styles = {
    container: {
      height: '100vh',
      width: '100vw',
      fontFamily: "'Montserrat', sans-serif",
      background: '#FFF',
      position: 'relative',
      overflow: 'hidden',
      fontSize: '100%',
      textAlign: 'center'
    },
    criterion: {
      fontSize: '1.6rem',
      position: 'absolute',
      top: '50%',
      left: '50%',
      height: 0,
      width: 0,
      transform: `translate(${-(width / 2)}px, ${-(height / 2)}px)`
    },
    background: {
      position: 'absolute',
      top: 0,
      height: '100vh',
      width: 0,
      animation: 'background-animation 2s ease-in-out 4s 1 normal forwards'
    },
    text: {
      position: 'absolute',
      width: `${width}px`,
      lineHeight: `${height}px`,
      opacity: 0,
      overflow: 'hidden'
    },
    textAfter: {
      zIndex: -1,
      content: "''",
      display: 'inline-block',
      position: 'absolute',
      top: 0,
      left: 0,
      width: 0,
      height: `${height}px`
    },
    frame: {
      position: 'absolute',
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: '50%',
      opacity: 0
    },
    particle: {
      position: 'absolute',
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: '50%'
    }
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500&display=swap');
          ${generateKeyframes()}
        `}
      </style>
      
      <div style={styles.container}>
        {/* Background elements */}
        {texts.map((_, i) => (
          <div
            key={`bg-${i}`}
            style={{
              ...styles.background,
              left: `${12.5 * i}%`,
              backgroundColor: `hsl(${i * multNumText}, 80%, 60%)`
            }}
          />
        ))}

        <div style={styles.criterion}>
          {/* Text elements */}
          {texts.map((text, i) => (
            <div
              key={`text-${i}`}
              style={{
                ...styles.text,
                left: `${-(numberOfText / 2 - i) * width + (width / 2)}px`,
                top: 0,
                animation: `text-animation${i} 1s ease-in-out ${1 + (i * 0.2)}s 1 normal forwards, text2-animation${i} 2s ease-in-out 5s 1 normal forwards`
              }}
            >
              {text}
              <div
                style={{
                  ...styles.textAfter,
                  animation: `text-after-animation${i} 2s ease-in-out 3s 1 normal forwards`
                }}
              />
            </div>
          ))}

          {/* Frame elements */}
          {texts.map((_, i) => (
            <div
              key={`frame-${i}`}
              style={{
                ...styles.frame,
                left: `${-(numberOfText / 2 - i) * width + (width / 2)}px`,
                top: 0,
                backgroundColor: `hsl(${i * multNumText}, 80%, 60%)`,
                animation: `frame-animation${i} 1s ease-in-out ${i * 0.2}s 1 normal forwards`
              }}
            />
          ))}

          {/* Particle elements */}
          {texts.map((_, i) =>
            Array.from({ length: numberOfParticle }, (_, j) => (
              <div
                key={`particle-${i}-${j}`}
                style={{
                  ...styles.particle,
                  left: `${-(numberOfText / 2 - i) * width + (width / 2)}px`,
                  opacity: 0,
                  backgroundColor: `hsl(${i * multNumText}, 80%, 60%)`,
                  animation: `particle-animation${i}${j} 1s ease-in-out ${1 + (i * 0.2)}s 1 normal forwards`
                }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default WelcomeAnimation;















// import React from 'react';

// const WelcomeAnimation3D = () => {

//   const numberOfRings = 21;
  
//   const styles = `
//     @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500&display=swap');

//     * {
//       transform-style: preserve-3d;
//       box-sizing: border-box;
//       margin: 0;
//       padding: 0;
//     }

//     html, body, #root {
//       width: 100vw;
//       height: 100vh;
//       overflow: hidden;
//       margin: 0;
//       padding: 0;
//     }

//     .container {
//       width: 100vw;
//       height: 100vh;
//       overflow: hidden;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       perspective: 1000vmin;
//       background: radial-gradient(circle at 50% 100%, #101010, #000);
//       font-family: 'Montserrat', sans-serif;
//       position: relative;
//     }

//     .sphere {
//       width: 50vmin;
//       height: 50vmin;
//       position: relative;
//       animation: spin 2s linear 0s 1 forwards;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     @keyframes spin {
//       0% { transform: rotateX(-210deg) rotateY(0deg) rotatez(185deg); }
//       100% { transform: rotateX(-210deg) rotateY(360deg) rotatez(185deg); }
//     }

//     .ring {
//       --sz: 23%;
//       --s: 2s;
//       --dv: calc(var(--s) / 40);
//       --dl: calc(var(--dv) * -1);
//       width: var(--sz);
//       height: var(--sz);
//       position: absolute;
//       border: 0.25vmin solid #ff6600;
//       border-radius: 100%;
//       transform: rotateX(90deg) translateZ(24.5vmin);
//       box-shadow: 
//         0 0 0.5vmin 0.5vmin #ff6600, 
//         0 0 0.5vmin 0.5vmin #ff6600 inset;
//       animation: shine var(--s) linear var(--dl) 1 forwards;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 1.2vmin;
//       color: #fff;
//       font-weight: bold;
//       text-shadow: 0 0 1vmin #ff6600;
//     }

//     .ring::before {
//       content: "";
//       width: 100%;
//       height: 100%;
//       position: absolute;
//       border: 0.25vmin solid #ff6600;
//       border-radius: 100%;
//       box-shadow: 0 0 0.5vmin 0.5vmin #ff6600, 0 0 0.5vmin 0.5vmin #ff6600 inset;
//       animation: shine var(--s) linear calc(var(--dl) * -1) 1 forwards;
//     }

//     @keyframes shine {
//       50%, 100% {
//         border-color: #10101000;
//         box-shadow: 0 0 1px 1px #10101000, 0 0 1px 1px #10101000 inset;
//         filter: hue-rotate(540deg);
//       }
//     }

//     .ring:nth-child(1) {
//       --sz: 23%;
//       --dl: calc(var(--dv) * -1);
//       transform: rotateX(90deg) translateZ(24.5vmin);
//     }
//     .ring:nth-child(2) {
//       --sz: 43%;
//       --dl: calc(var(--dv) * -2);
//       transform: rotateX(90deg) translateZ(22.5vmin);
//       filter: hue-rotate(-2deg);
//     }
//     .ring:nth-child(3) {
//       --sz: 60%;
//       --dl: calc(var(--dv) * -3);
//       transform: rotateX(90deg) translateZ(20vmin);
//       filter: hue-rotate(-4deg);
//     }
//     .ring:nth-child(4) {
//       --sz: 71%;
//       --dl: calc(var(--dv) * -4);
//       transform: rotateX(90deg) translateZ(17.5vmin);
//       filter: hue-rotate(-6deg);
//     }
//     .ring:nth-child(5) {
//       --sz: 80%;
//       --dl: calc(var(--dv) * -5);
//       transform: rotateX(90deg) translateZ(15vmin);
//       filter: hue-rotate(-8deg);
//     }
//     .ring:nth-child(6) {
//       --sz: 86%;
//       --dl: calc(var(--dv) * -6);
//       transform: rotateX(90deg) translateZ(12.5vmin);
//       filter: hue-rotate(-10deg);
//     }
//     .ring:nth-child(7) {
//       --sz: 91%;
//       --dl: calc(var(--dv) * -7);
//       transform: rotateX(90deg) translateZ(10vmin);
//       filter: hue-rotate(-12deg);
//     }
//     .ring:nth-child(8) {
//       --sz: 95%;
//       --dl: calc(var(--dv) * -8);
//       transform: rotateX(90deg) translateZ(7.5vmin);
//       filter: hue-rotate(-14deg);
//     }
//     .ring:nth-child(9) {
//       --sz: 97%;
//       --dl: calc(var(--dv) * -9);
//       transform: rotateX(90deg) translateZ(5vmin);
//       filter: hue-rotate(-16deg);
//     }
//     .ring:nth-child(10) {
//       --sz: 99%;
//       --dl: calc(var(--dv) * -10);
//       transform: rotateX(90deg) translateZ(2.5vmin);
//       filter: hue-rotate(-18deg);
//     }
//     .ring:nth-child(11) {
//       --sz: 100%;
//       --dl: calc(var(--dv) * -11);
//       transform: rotateX(90deg) translateZ(0);
//       filter: hue-rotate(-20deg);
//     }
//     .ring:nth-child(12) {
//       --sz: 99%;
//       --dl: calc(var(--dv) * -12);
//       transform: rotateX(90deg) translateZ(-2.5vmin);
//       filter: hue-rotate(-22deg);
//     }
//     .ring:nth-child(13) {
//       --sz: 97%;
//       --dl: calc(var(--dv) * -13);
//       transform: rotateX(90deg) translateZ(-5vmin);
//       filter: hue-rotate(-24deg);
//     }
//     .ring:nth-child(14) {
//       --sz: 95%;
//       --dl: calc(var(--dv) * -14);
//       transform: rotateX(90deg) translateZ(-7.5vmin);
//       filter: hue-rotate(-26deg);
//     }
//     .ring:nth-child(15) {
//       --sz: 91%;
//       --dl: calc(var(--dv) * -15);
//       transform: rotateX(90deg) translateZ(-10vmin);
//       filter: hue-rotate(-28deg);
//     }
//     .ring:nth-child(16) {
//       --sz: 86%;
//       --dl: calc(var(--dv) * -16);
//       transform: rotateX(90deg) translateZ(-12.5vmin);
//       filter: hue-rotate(-30deg);
//     }
//     .ring:nth-child(17) {
//       --sz: 80%;
//       --dl: calc(var(--dv) * -17);
//       transform: rotateX(90deg) translateZ(-15vmin);
//       filter: hue-rotate(-32deg);
//     }
//     .ring:nth-child(18) {
//       --sz: 71%;
//       --dl: calc(var(--dv) * -18);
//       transform: rotateX(90deg) translateZ(-17.5vmin);
//       filter: hue-rotate(-34deg);
//     }
//     .ring:nth-child(19) {
//       --sz: 60%;
//       --dl: calc(var(--dv) * -19);
//       transform: rotateX(90deg) translateZ(-20vmin);
//       filter: hue-rotate(-36deg);
//     }
//     .ring:nth-child(20) {
//       --sz: 43%;
//       --dl: calc(var(--dv) * -20);
//       transform: rotateX(90deg) translateZ(-22.5vmin);
//       filter: hue-rotate(-38deg);
//     }
//     .ring:nth-child(21) {
//       --sz: 23%;
//       --dl: calc(var(--dv) * -21);
//       transform: rotateX(90deg) translateZ(-24.5vmin);
//       filter: hue-rotate(-40deg);
//     }

//     .success-message {
//       position: absolute;
//       top: 20px;
//       right: 20px;
//       background: white;
//       color: #333;
//       padding: 12px 20px;
//       border-radius: 20px;
//       font-size: 14px;
//       font-weight: 600;
//       display: flex;
//       align-items: center;
//       gap: 8px;
//       box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//       animation: slideIn 0.5s ease-out forwards;
//     }

//     .success-icon {
//       width: 16px;
//       height: 16px;
//       background: #4caf50;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       color: white;
//       font-size: 12px;
//       font-weight: bold;
//     }

//     @keyframes slideIn {
//       from {
//         opacity: 0;
//         transform: translateX(20px);
//       }
//       to {
//         opacity: 1;
//         transform: translateX(0);
//       }
//     }
//   `;

//   return (
//     <>
//       <style>{`
//         ${styles}
        
//         body, html {
//           width: 100vw !important;
//           height: 100vh !important;
//           margin: 0 !important;
//           padding: 0 !important;
//           overflow: hidden !important;
//         }
//       `}</style>
//       <div className="container">
//         <div className="sphere">
//           {Array.from({ length: numberOfRings }).map((_, i) => (
//             <div key={i} className="ring" />
//           ))}
//         </div>
//       </div>
//     </>
//   );
// };

// export default WelcomeAnimation3D;