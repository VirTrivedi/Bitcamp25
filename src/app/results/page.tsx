"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Results() {
  const searchParams = useSearchParams();
  const jobTitle = searchParams.get('jobTitle') || '';
  const location = searchParams.get('location') || '';
  const yearsOfExperience = searchParams.get('yearsOfExperience') || '';

  const [salaryData, setSalaryData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure client-only logic runs after hydration
  }, []);

  const [suggestedJobTitles, setSuggestedJobTitles] = useState<string[]>([]);
  const [jobTitleReasons, setJobTitleReasons] = useState<string[]>([]);

  useEffect(() => {
    try {
      setSuggestedJobTitles(JSON.parse(Cookies.get('suggestedJobTitles') || '[]'));
      setJobTitleReasons(JSON.parse(Cookies.get('jobTitleReasons') || '[]'));
    } catch {
      setSuggestedJobTitles([]);
      setJobTitleReasons([]);
    }
  }, []);

  const [minSalary, setMinSalary] = useState<string | null>(null);
  const [maxSalary, setMaxSalary] = useState<string | null>(null);
  const [salaryCurrency, setSalaryCurrency] = useState<string | null>(null);
  const [jobResults, setJobResults] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // State to track loading status

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
        interface SalaryResponse {
          median_salary: string;
          min_salary: string;
          max_salary: string;
          salary_currency: string;
        }

        const response = await axios.get<SalaryResponse>(endpoint);
        console.log('API Response:', response.data); // Log the API response for debugging

        // Check if the response data is empty
        if (!response.data) {
          setError('No salary data available for the given parameters.');
          setSalaryData(null);
        } else {
          const salaryResponse = response.data; // Use the response data directly
          setSalaryData(salaryResponse.median_salary || 'N/A'); // Set median salary
          setMinSalary(salaryResponse.min_salary || 'N/A'); // Set minimum salary
          setMaxSalary(salaryResponse.max_salary || 'N/A'); // Set maximum salary
          setSalaryCurrency(salaryResponse.salary_currency || 'N/A'); // Set salary currency
          setError(null);
        }
      } catch (err: any) {
        console.error('API Error:', err); // Log the full error for debugging
        setError(
          err.response?.data?.message ||
            `Failed to fetch salary data. Status: ${err.response?.status || 'Unknown'}`
        );
        setSalaryData(null);
      }
    };
    fetchSalaryData();
  }, [jobTitle, location, yearsOfExperience, suggestedJobTitles]);

  interface Job {
    job_id: string;
    job_title: string;
    employer_name?: string;
    employer_logo?: string;
    employer_website?: string;
    job_publisher?: string;
    job_employment_type?: string;
    job_apply_link?: string;
    job_description?: string;
    job_location?: string;
    job_city?: string;
    job_country?: string;
    job_min_salary?: string;
    job_max_salary?: string;
    salary_currency?: string;
    job_posted_at?: string;
    job_google_link?: string;
  }

  const fetchJobResults = async () => {
    setIsLoading(true); // Show loading bar
    const query = `${jobTitle} in ${location}`;
    interface JobResultsResponse {
      jobs: string; // Stringified JSON containing job data
    }

    try {
      const response = await axios.get<JobResultsResponse>(`http://127.0.0.1:5002/jobs?query=${encodeURIComponent(query)}`);
      console.log('Job Results Response:', response.data); // Log the response data

      // Parse the stringified `jobs` field to extract the `data` array
      const parsedJobs: Job[] = JSON.parse(response.data.jobs).data;
      setJobResults(JSON.stringify(parsedJobs)); // Store the parsed `data` array as a JSON string
    } catch (err) {
      console.error('Error fetching job results:', err);
      setJobResults('[]'); // Set to an empty array as a JSON string
    } finally {
      setIsLoading(false); // Hide loading bar
    }
  };
  
  const capitalize = (text: string) => {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatSalary = (salary: string | null) => {
    if (!salary || salary === 'N/A') return 'N/A';
    const roundedSalary = parseFloat(salary).toFixed(2); // Round to 2 decimal places
    return roundedSalary.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add commas
  };

  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NZD: 'NZ$',
    SGD: 'S$',
    HKD: 'HK$',
    KRW: '₩',
    ZAR: 'R',
    BRL: 'R$',
    MXN: 'MX$',
    RUB: '₽',
    AED: 'د.إ',
    SAR: '﷼',
    // Add more currencies as needed
  };

  const formatSalaryWithCurrency = (salary: string | null, currency: string | null) => {
    if (salary === null) return 'Loading...'; // Show "Loading..." while salary is null
    if (salary === 'N/A') return 'N/A';
    const roundedSalary = parseFloat(salary).toFixed(2); // Round to 2 decimal places
    const formattedSalary = roundedSalary.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add commas
    const symbol = currencySymbols[currency || ''] || currency || ''; // Get the currency symbol or fallback to currency code
    return `${symbol}${formattedSalary}`;
  };

  const updateMedianSalaryInDatabase = async (medianSalary: string) => {
    const userCookie = Cookies.get('user');
    if (!userCookie) {
      console.error('User not logged in. No cookie found.');
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(userCookie);
      console.log('Parsed user from cookie:', parsedUser); // Log parsed user
    } catch (err) {
      console.error('Failed to parse user from cookies:', err);
      return;
    }

    if (!parsedUser || !parsedUser.id) {
      console.error('Invalid user object:', parsedUser);
      return;
    }

    if (!medianSalary || medianSalary === 'N/A') {
      console.error('Invalid median salary:', medianSalary);
      return;
    }

    try {
      const formattedSalary = formatSalaryWithCurrency(medianSalary, salaryCurrency || 'USD'); // Add fallback for currency
      console.log('Formatted median salary:', formattedSalary); // Log the formatted salary

      const payload = { med_salary: formattedSalary };
      console.log('Payload being sent to API:', payload); // Log the payload

      const response = await axios.put(
        `http://127.0.0.1:5003/users/${parsedUser.id}/recent/med_salary`,
        payload
      );
      console.log('Median salary updated in database:', response.data);
    } catch (err) {
      console.error('Error updating median salary in database:', err || err); // Log full error
    }
  };

  const updateUrlInDatabase = async (url: string) => {
    const userCookie = Cookies.get('user');
    if (!userCookie) {
      console.error('User not logged in. No cookie found.');
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(userCookie);
      console.log('Parsed user from cookie:', parsedUser); // Log parsed user
    } catch (err) {
      console.error('Failed to parse user from cookies:', err);
      return;
    }

    if (!parsedUser || !parsedUser.id) {
      console.error('Invalid user object:', parsedUser);
      return;
    }

    try {
      console.log('Updating URL in database:', url); // Log the URL being updated
      const response = await axios.put(
        `http://127.0.0.1:5003/users/${parsedUser.id}/recent/url`,
        { url }
      );
      console.log('URL updated in database:', response.data);
    } catch (err) {
      console.error('Error updating URL in database:', err || err); // Log full error
    }
  };

  const handleGoBack = () => {
    if (!isClient) return; // Ensure this runs only on the client
    const medianSalary = salaryData || '';
    const currentUrl = window.location.href; // Get the current website's URL
    updateMedianSalaryInDatabase(medianSalary); // Update the database with the median salary
    updateUrlInDatabase(currentUrl); // Update the database with the current URL
    router.push('/'); // Navigate back to the home page
  };

  const fetchJobTitleReasons = async () => {
    if (suggestedJobTitles.length === 0) {
      console.error('No suggested job titles available to fetch reasons.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('job_titles', suggestedJobTitles.join(',')); // Ensure job_titles is a comma-separated string
  
      console.log('Sending job titles to server:', suggestedJobTitles); // Log the job titles being sent
  
      const response = await axios.post('http://127.0.0.1:5001/reasons-for-job-titles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      console.log('Job Title Reasons Response:', response.data); // Log the response data
      const data = response.data as { reasons: string[] }; // Explicitly type response.data
      setJobTitleReasons(data.reasons || []);
    } catch (err: any) {
      console.error('Error fetching job title reasons:', err.response?.data || err.message);
      setJobTitleReasons([]);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300; // Adjust scroll amount as needed
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Salary Range Results</h1>
      <div className="bg-black shadow-md rounded p-6 w-full">
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
          <div className="mt-4">
            <p>
              <strong>Median Salary:</strong> {formatSalaryWithCurrency(salaryData, salaryCurrency)}
            </p>
            <p>
              <strong>Minimum Salary:</strong> {formatSalaryWithCurrency(minSalary, salaryCurrency)}
            </p>
            <p>
              <strong>Maximum Salary:</strong> {formatSalaryWithCurrency(maxSalary, salaryCurrency)}
            </p>
          </div>
        )}
        <div className="mt-4">
          <strong>Suggested Job Titles:</strong>
          {isClient && suggestedJobTitles.length > 0 ? (
            <ul className="list-none pl-0">
              {suggestedJobTitles.map((title, index) => (
                <li key={index}>
                  <a
                    href={`/results?jobTitle=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}&yearsOfExperience=${encodeURIComponent(yearsOfExperience)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {capitalize(title)}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No suggested job titles available.</p>
          )}
          {jobTitleReasons.length > 0 && (
            <div className="mt-4">
              <strong>Reasons for Suggested Job Titles:</strong>
              <ul className="list-disc list-inside">
                {jobTitleReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          onClick={handleGoBack}
          className="mt-6 rounded-full bg-blue-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-blue-700"
        >
          Go Back to Home
        </button>
        <button
          onClick={fetchJobResults}
          className="mt-4 rounded-full bg-green-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-green-700"
        >
          Fetch Job Results
        </button>
        {isLoading && (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        )}
        {jobResults && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => scrollCarousel('left')}
                className="rounded-full bg-gray-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-gray-700"
              >
                ◀
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="rounded-full bg-gray-600 text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 hover:bg-gray-700"
              >
                ▶
              </button>
            </div>
            <div
              ref={carouselRef}
              className="flex overflow-x-auto space-x-4 scrollbar-hide"
            >
              {(() => {
                try {
                  const jobs: Job[] = JSON.parse(jobResults); // Parse the `jobResults` JSON string
                  if (Array.isArray(jobs) && jobs.length > 0) {
                    return jobs.map((job, index) => (
                      <div
                        key={index}
                        className="text-white shadow-md rounded p-4 flex flex-col justify-between h-64 w-64 border border-white flex-shrink-0"
                      >
                        <p><strong>Job Title:</strong> {job.job_title || 'N/A'}</p>
                        <p><strong>Employer:</strong> {job.employer_name || 'N/A'}</p>
                        <p><strong>Location:</strong> {job.job_location || 'N/A'}</p>
                        <p><strong>Posted:</strong> {job.job_posted_at || 'N/A'}</p>
                        <p><strong>Job Link:</strong> {job.job_google_link ? (
                          <a href={job.job_google_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Job
                          </a>
                        ) : 'N/A'}</p>
                      </div>
                    ));
                  } else {
                    return <p>No job results found.</p>;
                  }
                } catch (err) {
                  console.error('Error parsing job results:', err);
                  return <p>Failed to parse job results.</p>;
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}