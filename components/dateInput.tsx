import { useEffect, useState } from 'react';

export default function DateTimeInput() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); 

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="date-display">
      <label>Data/Hora:</label>
      <input
        type="text"
        value={currentTime.toLocaleString('pt-BR')}
        readOnly
        className="input large"
      />
    </div>
  );
}
