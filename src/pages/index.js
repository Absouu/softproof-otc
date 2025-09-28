import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/landing');
  }, [router]);

  return (
    <div className="softproof-container">
      <h2>SoftProof OTC</h2>
      <p>Redirecting...</p>
    </div>
  );
}
