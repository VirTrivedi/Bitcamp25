import React, { useState, useEffect } from 'react';
import axios from 'axios';

type LocationResult = {
  name: string;
  display_name: string;
  lat: string;
  lon: string;
};

type LocationSearchBoxProps = {
  onSelect: (location: LocationResult) => void;
  placeholder?: string;
};

export const LocationSearchBox: React.FC<LocationSearchBoxProps> = ({
  onSelect,
  placeholder = 'Search for a location...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 2) {
        fetchLocations(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchLocations = async (search: string) => {
    try {
      setIsLoading(true);
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: search,
          format: 'json',
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          'Accept-Language': 'en',
        },
      });
      setResults(res.data as LocationResult[]);
    } catch (error) {
      console.error('Error fetching location data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (location: LocationResult) => {
    onSelect(location);
    setQuery(location.display_name);
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isLoading && (
        <div className="absolute right-3 top-2 text-sm text-gray-400">Loading...</div>
      )}
      {results.length > 0 && (
        <ul className="absolute z-50 w-full bg-black border border-gray-200 mt-1 rounded-lg shadow-md max-h-60 overflow-auto">
          {results.map((loc, idx) => (
            <li
              key={idx}
              className="px-4 py-2 hover:bg-gray-50 hover:text-black cursor-pointer text-sm"
              onClick={() => handleSelect(loc)}
            >
              {loc.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};