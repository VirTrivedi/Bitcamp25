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

  const [minSalary, setMinSalary] = useState<string | null>(null);
  const [maxSalary, setMaxSalary] = useState<string | null>(null);
  const [salaryCurrency, setSalaryCurrency] = useState<string | null>(null);
  const [jobResults, setJobResults] = useState<string | null>(null);

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
  }, [jobTitle, location, yearsOfExperience]);

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
          onClick={() => {
            const medianSalary = salaryData || '';
            localStorage.setItem('medianSalary', medianSalary); // Store median salary in localStorage
            router.push('/'); // Navigate back to the home page
          }}
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
        {jobResults && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              try {
                const jobs: Job[] = JSON.parse(jobResults); // Parse the `jobResults` JSON string
                if (Array.isArray(jobs) && jobs.length > 0) {
                  return jobs.map((job, index) => (
                    <div
                      key={index}
                      className="text-white shadow-md rounded p-4 flex flex-col justify-between h-64 w-64 border border-white"
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
        )}
      </div>
    </div>
  );
}