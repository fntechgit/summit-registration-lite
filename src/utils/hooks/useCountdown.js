import { useState, useEffect, useRef } from 'react';

const useCountdown = (initialTime) => {
  const [countdown, setCountdown] = useState(initialTime);
  const intervalRef = useRef(null);

  const resetCountdown = (newTime) => {
    const time = newTime !== undefined ? newTime : initialTime;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(time);

    if (time > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    // Initialize the countdown when the hook is first used
    resetCountdown(initialTime);
    return () => clearInterval(intervalRef.current);
  }, [initialTime]);

  return [countdown, resetCountdown];
};

export default useCountdown;