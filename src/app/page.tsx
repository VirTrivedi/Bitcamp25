"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LocationSearchBox } from './components/LocationSearchBox';

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: string;
    lon: string;
  } | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (jobTitle.length > 2) {
      // Fetch job title suggestions from an API
      axios
        .get(`/api/job-titles?query=${jobTitle}`)
        .then((response) => {
          setSuggestions(response.data || []);
        })
        .catch((error) => {
          console.error('Error fetching job title suggestions:', error);
        });
    } else {
      setSuggestions([]);
    }
  }, [jobTitle]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-bold text-center sm:text-left">
          Find Your Salary Range
        </h1>
        <form className="flex flex-col gap-4 w-full max-w-md">
          <label className="flex flex-col">
            <span className="font-medium">Job Title</span>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="border border-gray-300 rounded px-3 py-2"
            />
            {suggestions.length > 0 && (
              <ul className="border border-gray-300 rounded mt-2 bg-white max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setJobTitle(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </label>
          <label className="flex flex-col">
            <h1 className="text-2xl font-semibold mb-6">Search for a Location</h1>
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