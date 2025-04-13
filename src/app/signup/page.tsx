"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userCookie = Cookies.get('user'); // Check for user in cookies
    if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie);
        if (parsedUser && parsedUser.id) {
          router.push('/'); // Redirect to home if valid user exists
        }
      } catch (err) {
        console.error('Failed to parse user from cookies:', err);
      }
    }
  }, [router]);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:5003/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: generateHashCode(email),
          username: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Cookies.set('user', JSON.stringify({ id: data.user.id, username: data.user.username }));
        router.push('/login');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'An error occurred during signup.');
      }
    } catch (err) {
      setError('An error occurred during signup.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        backgroundImage: "url('/Signup Page Background.png')",
        backgroundSize: 'contain',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex justify-end w-full max-w-7xl">
        <form onSubmit={handleSignup}
              className="bg-black shadow-md rounded p-6 max-w-md w-full"
              style={{ marginLeft: '53%' }}
        >
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
            className="w-full rounded-full bg-black-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-blue-700"
          >
            Sign Up
          </button>
          <p className="mt-4 text-sm text-center">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline hover:text-blue-800">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
