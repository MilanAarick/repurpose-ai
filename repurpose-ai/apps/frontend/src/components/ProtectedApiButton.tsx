"use client";
import { useState } from 'react';
import { useSupabaseAuth } from './SupabaseAuthProvider';

export function ProtectedApiButton() {
  const { session, loading } = useSupabaseAuth();
  const [result, setResult] = useState('');

  const callProtectedApi = async () => {
    try {
      const token = session?.access_token;
      if (!token) throw new Error('No access token');
      const res = await fetch('http://localhost:3001/api/protected', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(await res.text());
    } catch (err) {
      setResult('Error: ' + err);
    }
  };

  if (loading || !session) return null;

  return (
    <div>
      <button onClick={callProtectedApi}>Call Protected API</button>
      <div>{result}</div>
    </div>
  );
} 