"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const router = useRouter();
  const pathname = usePathname(); // Get the current path

  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie && pathname === '/login') { // Only redirect if on the login page
      try {
        const parsedUser = JSON.parse(userCookie);
        if (parsedUser && parsedUser.id) {
          router.push('/'); // Redirect to home if valid user exists
          return;
        }
      } catch (err) {
        console.error('Failed to parse user from cookies:', err);
      }
    }
    setIsLoading(false); // Set loading to false if no valid user
  }, [router, pathname]);

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
          Cookies.set('user', JSON.stringify({ id: userId, username }));
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
  
  if (isLoading) {
    return <div>Loading...</div>; // Show a loading indicator while validating
  }

  return (
    <div
      className="min-h-screen flex items-center justify-start p-8"
      style={{
        backgroundImage: "url('/Login Page Background.png')",
        backgroundSize: 'contain',
        backgroundPosition: 'center',
      }}
    >
      <form
        onSubmit={handleLogin}
        className="bg-black rounded p-6 max-w-md w-full"
        style={{ marginLeft: '53%' }}
      >
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-2 !text-black">
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
          <label htmlFor="password" className="block text-sm font-medium mb-2 text-black">
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
            Log In
          </button>
        <p className="mt-4 text-sm text-center text-black">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline hover:text-blue-800">
            Sign Up
          </a>
        </p>
      </form>
    </div>
  );
}
