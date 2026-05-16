import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Prevent scrolling while splash screen is active
    document.body.style.overflow = 'hidden';

    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // Completely unmount after 2.8 seconds
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      document.body.style.overflow = 'unset';
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#FAFBFD] flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${isFadingOut ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
        }`}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Soft glowing background effect */}
        <div className="absolute inset-0 bg-[#C8A96E]/20 blur-[100px] rounded-full scale-150 animate-pulse"></div>

        {/* Main Logo with a smooth pop-in animation */}
        <img
          src="/NRI-logo.png"
          alt="NRI Institute of Technology"
          className="relative z-10 w-48 sm:w-64 md:w-80 h-auto object-contain drop-shadow-2xl logo-animate"
        />

        {/* Loading progress bar */}
        <div className="relative z-10 mt-12 w-48 h-1 bg-slate-200 rounded-full overflow-hidden opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]">
          <div className="h-full bg-[#1B2845] rounded-full animate-[progress_2s_ease-out_forwards]"></div>
        </div>

        <style>{`
          .logo-animate {
            animation: popIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes popIn {
            0% { 
              transform: scale(0.85) translateY(30px); 
              opacity: 0; 
              filter: blur(10px); 
            }
            100% { 
              transform: scale(1) translateY(0); 
              opacity: 1; 
              filter: blur(0px); 
            }
          }

          @keyframes fadeIn {
            to { opacity: 1; }
          }

          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SplashScreen;
