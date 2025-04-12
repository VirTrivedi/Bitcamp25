"use client";

import React, { useState } from 'react';
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
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let estimatedYearsOfExperience = '';

    if (resume) {
      const formData = new FormData();
      formData.append('file', resume);
      formData.append('job_title', jobTitle);

      try {
        const response = await axios.post(
          'http://127.0.0.1:5001/estimate-experience',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Experience Response:', response.data);
        estimatedYearsOfExperience = response.data.estimated_years.toString();
      } catch (err: any) {
        console.error('Error estimating experience:', err);
        setError(
          err.response?.data?.message ||
            `Failed to estimate experience. Status: ${err.response?.status || 'Unknown'}`
        );
        return;
      }
    }

    // Navigate to the results page with query parameters
    router.push(
      `/results?jobTitle=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(
        selectedLocation?.name || ''
      )}&yearsOfExperience=${encodeURIComponent(estimatedYearsOfExperience)}`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
      setError(null);
    } else {
      alert('Please upload a valid PDF file.');
      setResume(null);
    }
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
            <span className="font-medium">Upload Resume (PDF)</span>
            <input
              type="file"
              accept="application/pdf"
              className="border border-gray-300 rounded px-3 py-2"
              onChange={handleFileChange}
            />
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
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