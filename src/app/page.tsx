"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { LocationSearchBox } from './components/LocationSearchBox';

export default function Home() {
  const searchParams = useSearchParams();
  const medianSalary = searchParams.get('medianSalary') || ''; // Get median salary from query params
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: string;
    lon: string;
  } | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [recentSearches, setRecentSearches] = useState<
    { jobTitle: string; location: string; lat: string; lon: string; medianSalary: string }[]
  >([]);

  // Load saved resume and recent searches on the client
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const savedResume = localStorage.getItem('savedResume');
    if (savedResume) {
      const byteString = atob(savedResume.split(',')[1]);
      const mimeString = savedResume.split(',')[0].split(':')[1].split(';')[0];
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uintArray = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i);
      }
      setResume(new File([arrayBuffer], 'resume.pdf', { type: mimeString }));
    }

    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    const storedMedianSalary = localStorage.getItem('medianSalary'); // Retrieve median salary
    if (storedMedianSalary) {
      localStorage.removeItem('medianSalary'); // Clear it after retrieval
    }
  }, [router]);

  const saveSearch = (jobTitle: string, location: string) => {
    const newSearch = {
      jobTitle,
      location,
      lat: selectedLocation?.lat || '',
      lon: selectedLocation?.lon || '',
      medianSalary: medianSalary || '',
    };
    const updatedSearches = [newSearch, ...recentSearches].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const saveResume = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        localStorage.setItem('savedResume', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let estimatedYearsOfExperience = '';
    let suggestedJobTitles: string[] = [];

    if (resume) {
      const formData = new FormData();
      formData.append('file', resume);
      formData.append('job_title', jobTitle);

      try {
        // Call the API to estimate experience
        const experienceResponse = await axios.post(
          'http://127.0.0.1:5001/estimate-experience',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Experience Response:', experienceResponse.data);
        const experienceData = experienceResponse.data as { estimated_years: number };
        estimatedYearsOfExperience = experienceData.estimated_years.toString();

        // Call the API to get suggested job titles
        const titlesResponse = await axios.post(
          'http://127.0.0.1:5001/suggest-job-titles',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Suggested Job Titles Response:', titlesResponse.data);
        const titlesData = titlesResponse.data as { suggested_job_titles: string[] };
        suggestedJobTitles = titlesData.suggested_job_titles || [];
      } catch (err: any) {
        console.error('Error processing resume:', err);
        setError(
          err.response?.data?.message ||
            `Failed to process resume. Status: ${err.response?.status || 'Unknown'}`
        );
        return;
      }
    }

    // Save the search
    saveSearch(jobTitle, selectedLocation?.name || '');

    // Navigate to the results page with query parameters
    router.push(
      `/results?jobTitle=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(
        selectedLocation?.name || ''
      )}&yearsOfExperience=${encodeURIComponent(
        estimatedYearsOfExperience
      )}&suggestedJobTitles=${encodeURIComponent(JSON.stringify(suggestedJobTitles))}`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
      saveResume(file);
      setError(null);
    } else {
      alert('Please upload a valid PDF file.');
      setResume(null);
    }
  };

  const capitalize = (text: string) => {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSignOut = () => {
    localStorage.removeItem('user'); // Clear user data
    router.push('/login'); // Redirect to login page
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
        <div className="mt-8 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Recent Searches</h2>
          {recentSearches.length > 0 ? (
            <ul className="list-disc list-inside">
              {recentSearches.map((search, index) => (
                <li
                  key={index}
                  className="cursor-pointer text-blue-600 hover:underline"
                  onClick={() => {
                    setJobTitle(capitalize(search.jobTitle)); // Capitalize job title when setting it
                    setSelectedLocation({
                      name: search.location,
                      lat: search.lat,
                      lon: search.lon,
                    });
                  }}
                >
                  <strong>Job Title:</strong> {capitalize(search.jobTitle)}, <strong>Location:</strong>{' '}
                  {search.location}, <strong>Median Salary:</strong> {search.medianSalary || 'N/A'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent searches.</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="mt-6 rounded-full bg-red-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-red-700"
        >
          Sign Out
        </button>
      </main>
    </div>
  );
}