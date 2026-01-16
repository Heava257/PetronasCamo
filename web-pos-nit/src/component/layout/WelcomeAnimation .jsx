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










