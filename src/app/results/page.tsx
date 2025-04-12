"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Results() {
  const searchParams = useSearchParams();
  const jobTitle = searchParams.get('jobTitle') || '';
  const location = searchParams.get('location') || '';
  const yearsOfExperience = searchParams.get('yearsOfExperience') || '';
  const suggestedJobTitlesParam = searchParams.get('suggestedJobTitles') || '[]';

  const [salaryData, setSalaryData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedJobTitles, setSuggestedJobTitles] = useState<string[]>(() => {
    try {
      return JSON.parse(suggestedJobTitlesParam);
    } catch {
      return [];
    }
  });

  const router = useRouter();

  useEffect(() => {
    const fetchSalaryData = async () => {
      // Validate and sanitize parameters
      const sanitizedJobTitle = jobTitle.trim() || 'nodejs developer';
      const sanitizedLocation = location.trim() || 'new york';
      const sanitizedYearsOfExperience = yearsOfExperience.trim() || 'ALL';

      const endpoint = `http://127.0.0.1:5000/get-estimated-salary?job_title=${encodeURIComponent(
        sanitizedJobTitle
      )}&location=${encodeURIComponent(
        sanitizedLocation
      )}&years_of_experience=${encodeURIComponent(sanitizedYearsOfExperience)}`;

      try {
        const response = await axios.get(endpoint);
        console.log('API Response:', response.data); // Log the API response for debugging

        // Check if the response data is empty
        if (!response.data || response.data === '') {
          setError('No salary data available for the given parameters.');
          setSalaryData(null);
        } else {
          setSalaryData(JSON.stringify(response.data)); // Convert response data to string
          setError(null);
        }
      } catch (err: any) {
        console.error('API Error:', err); // Log the full error for debugging
        if (err.response) {
          console.error('Error Response Data:', err.response.data); // Log error response data
          console.error('Error Response Status:', err.response.status); // Log error status
          console.error('Error Response Headers:', err.response.headers); // Log error headers
        }
        setError(
          err.response?.data?.message ||
            `Failed to fetch salary data. Status: ${err.response?.status || 'Unknown'}`
        );
        setSalaryData(null);
      }
    };

    fetchSalaryData();
  }, [jobTitle, location, yearsOfExperience]);

  const capitalize = (text: string) => {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Salary Range Results</h1>
      <div className="bg-black shadow-md rounded p-6 max-w-md w-full">
        <p className="mb-2">
          <strong>Job Title:</strong> {jobTitle || 'N/A'}
        </p>
        <p className="mb-2">
          <strong>Location:</strong> {location || 'N/A'}
        </p>
        <p className="mb-2">
          <strong>Years of Experience:</strong> {yearsOfExperience || 'N/A'}
        </p>
        {error ? (
          <p className="mt-4 text-red-600">
            <strong>Error:</strong> {error}
          </p>
        ) : (
          <p className="mt-4">
            <strong>Estimated Salary:</strong>{' '}
            {salaryData ? salaryData : 'Loading...'}
          </p>
        )}
        <div className="mt-4">
          <strong>Suggested Job Titles:</strong>
          {suggestedJobTitles.length > 0 ? (
            <ul className="list-disc list-inside">
              {suggestedJobTitles.map((title, index) => (
                <li key={index}>{capitalize(title)}</li>
              ))}
            </ul>
          ) : (
            <p>No suggested job titles available.</p>
          )}
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-full bg-blue-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-blue-700"
        >
          Go Back to Home
        </button>
      </div>
    </div>
  );
}