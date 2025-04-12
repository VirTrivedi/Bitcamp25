"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/'); // Redirect to home if already logged in
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const userId = generateHashCode(email);
      const usernameResponse = await fetch(`http://localhost:5003/users/${userId}/username`);
      const passwordResponse = await fetch(`http://localhost:5003/users/${userId}/password`);
      
      if (usernameResponse.ok && passwordResponse.ok) {
        const username = await usernameResponse.text();
        const storedPassword = await passwordResponse.text();

        if (username === email && storedPassword === password) {
          localStorage.setItem('user', JSON.stringify({ email: username }));
          router.push('/');
        } else {
          setError('Invalid email or password.');
        }
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      setError('An error occurred during login.');
    }
  };

  // Utility function to generate a hash code for a string
  function generateHashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash); // Ensure positive value
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="bg-black shadow-md rounded p-6 max-w-md w-full">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-blue-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-blue-700"
        >
          Login
        </button>
        <p className="mt-4 text-sm text-center">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
}
