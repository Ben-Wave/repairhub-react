import React, { useState } from 'react';

const SearchComponent = ({ devices }) => {
    const [searchResults, setSearchResults] = useState([]);

    const searchByDeviceName = (deviceName) => {
        const regex = /\[A\d+\]/; // Matches codes like [A2628]
        return deviceName.match(regex);
    };

    const handleSearch = (query) => {
        const results = devices.filter(device => {
            const codeMatch = searchByDeviceName(device.name);
            return codeMatch && device.name.includes(query);
        });
        setSearchResults(results);
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Search devices"
                onChange={(e) => handleSearch(e.target.value)}
            />
            <ul>
                {searchResults.map((device, index) => (
                    <li key={index}>{device.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default SearchComponent;