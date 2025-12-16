import { healthCheck } from '@/services/api';
import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    healthCheck()
      .then((res: { status: string }) => setStatus(res.status))
      .catch((err: Error) => setStatus(`Error: ${err.message}`));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>SecondSense - Phase 1</h1>
      <p>Backend Status: <strong>{status}</strong></p>
      <p>Frontend infrastructure is working correctly.</p>
    </div>
  );
}

export default App;
