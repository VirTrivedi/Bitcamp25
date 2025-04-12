"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { LocationSearchBox } from './components/LocationSearchBox';
import Cookies from 'js-cookie';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true); // Add loading state
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
    { jobTitle: string; location: string; lat: string; lon: string; medianSalary: string; url: string }[]
  >([]);

  // Load saved resume and recent searches on the client
  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (!userCookie) {
      router.push('/login');
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(userCookie);
    } catch (err) {
      console.error('Failed to parse user from cookies:', err);
      router.push('/login');
      return;
    }

    if (!parsedUser || !parsedUser.id) {
      console.error('Invalid user object:', parsedUser);
      router.push('/login');
      return;
    }

    const savedResume = Cookies.get('savedResume');
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

    const fetchRecentSearches = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5003/users/${parsedUser.id}/recent`
        );
        console.log('Fetched recent searches:', response.data);
        setRecentSearches(
          (response.data as { jobTitle: string; location: string; med_salary: string; url: string }[]).map((search) => ({
            jobTitle: search.jobTitle,
            location: search.location,
            lat: '', // Placeholder as lat/lon are not stored in the database
            lon: '',
            medianSalary: search.med_salary,
            url: search.url || '', // Include the URL field
          }))
        );
      } catch (err) {
        console.error('Error fetching recent searches:', err);
      }
    };

    fetchRecentSearches();

    const storedMedianSalary = Cookies.get('medianSalary'); // Retrieve median salary
    if (storedMedianSalary) {
      Cookies.remove('medianSalary'); // Clear it after retrieval
    }

    setIsLoading(false); // Set loading to false after validation
  }, [router]);

  const saveSearch = async (jobTitle: string, location: string) => {
    const user = JSON.parse(Cookies.get('user') || '{}');
    if (!user || !user.id) {
      console.error('User not logged in');
      return;
    }

    const newSearch = {
      jobTitle,
      location,
      med_salary: medianSalary || '', // Use `med_salary` to match the database structure
    };

    try {
      const response = await axios.post(
        `http://127.0.0.1:5003/users/${user.id}/recent`,
        newSearch
      );
      console.log('Recent search updated:', response.data);
      const responseData = response.data as { recent_searches: { jobTitle: string; location: string; med_salary: string }[] };
      setRecentSearches(
        responseData.recent_searches.map((search) => ({
          jobTitle: search.jobTitle,
          location: search.location,
          lat: '', // Default value for lat
          lon: '', // Default value for lon
          medianSalary: search.med_salary,
          url: '', // Default value for url
        }))
      );
    } catch (err) {
      console.error('Error updating recent searches:', err);
    }
  };

  const saveResume = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        Cookies.set('savedResume', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveResumePath = async (filePath: string) => {
    const user = JSON.parse(Cookies.get('user') || '{}');
    if (!user || !user.id) {
      console.error('User not logged in');
      return;
    }

    try {
      const response = await axios.put(
        `http://127.0.0.1:5003/users/${user.id}/resume`,
        { resume_path: filePath }
      );
      console.log('Resume path saved:', response.data);
    } catch (err) {
      console.error('Error saving resume path:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let estimatedYearsOfExperience = '';
    let suggestedJobTitles: string[] = [];
    let jobTitleReasons: string[] = [];

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

        // Call the API to get suggested job titles with reasons
        const titlesWithReasonsResponse = await axios.post(
          'http://127.0.0.1:5001/suggest-job-titles-with-reasons',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Suggested Job Titles with Reasons Response:', titlesWithReasonsResponse.data);
        const titlesWithReasonsData = titlesWithReasonsResponse.data as { suggestions_with_reasons: string[] };

        // Parse the response into titles and reasons
        titlesWithReasonsData.suggestions_with_reasons.forEach((line) => {
          const [title, explanation] = line.split(':').map((part) => part.trim());
          if (title && explanation) {
            suggestedJobTitles.push(title);
            jobTitleReasons.push(explanation);
          }
        });

        // Store suggested job titles and reasons in cookies
        Cookies.set('suggestedJobTitles', JSON.stringify(suggestedJobTitles));
        Cookies.set('jobTitleReasons', JSON.stringify(jobTitleReasons));
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
      )}&yearsOfExperience=${encodeURIComponent(estimatedYearsOfExperience)}`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
      saveResume(file);

      // Save the file path to the backend
      const filePath = `/uploads/${file.name}`; // Example file path
      saveResumePath(filePath);

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
    Cookies.remove('user'); // Clear user data
    router.push('/login'); // Redirect to login page
  };

  if (isLoading) {
    return <div>Loading...</div>; // Show a loading indicator while validating
  }

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
              onSelect={(loc) => {
                setSelectedLocation({
                  name: loc.name || 'Unknown',
                  lat: loc.lat,
                  lon: loc.lon,
                });
              }}
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
                    if (search.url) {
                      window.location.href = search.url; // Navigate to the stored URL
                    } else {
                      setJobTitle(capitalize(search.jobTitle)); // Fallback: Set job title
                      setSelectedLocation({
                        name: search.location,
                        lat: search.lat,
                        lon: search.lon,
                      });
                    }
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