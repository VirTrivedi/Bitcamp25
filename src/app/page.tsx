"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LocationSearchBox } from './components/LocationSearchBox';

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: string;
    lon: string;
  } | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to the results page with query parameters
    router.push(
      `/results?jobTitle=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(
        selectedLocation?.name || ''
      )}&yearsOfExperience=${encodeURIComponent(yearsOfExperience || '')}`
    );
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-bold text-center sm:text-left">
          Find Your Salary Range
        </h1>
        <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleSubmit}>
          <label className="flex flex-col">
            <span className="font-medium">Job Title</span>
            <input
              type="text"
              placeholder="e.g., Software Engineer"
              className="border border-gray-300 rounded px-3 py-2"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </label>
          <label className="flex flex-col">
            <span className="font-medium">Location</span>
            <LocationSearchBox
              onSelect={(loc) =>
                setSelectedLocation({
                  name: loc.name || 'Unknown',
                  lat: loc.lat,
                  lon: loc.lon,
                })
              }
            />
          </label>
          <label className="flex flex-col">
            <span className="font-medium">Years of Experience</span>
            <input
              type="number"
              placeholder="e.g., 5"
              className="border border-gray-300 rounded px-3 py-2"
              min="0"
              value={yearsOfExperience || ''}
              onChange={(e) => setYearsOfExperience(Number(e.target.value))}
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-blue-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-blue-700"
          >
            Find Salary Range
          </button>
        </form>
      </main>
    </div>
  );
}