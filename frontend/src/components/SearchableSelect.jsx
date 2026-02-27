import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

export const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  label = '',
  optionLabelKey = 'name',
  optionValueKey = 'id',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const optionText = String(option[optionLabelKey]).toLowerCase();
    return optionText.includes(searchTerm.toLowerCase());
  });

  // Get selected option label
  const selectedOption = options.find((opt) => opt[optionValueKey] === value);
  const selectedLabel = selectedOption ? selectedOption[optionLabelKey] : placeholder;

  // Handle selection
  const handleSelect = (option) => {
    onChange(option[optionValueKey]);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear
  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block font-medium mb-3 text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Main button/input area */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition flex items-center justify-between ${
            disabled ? 'opacity-50 bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
          } ${isOpen ? 'ring-2 ring-primary' : ''}`}
        >
          <span className={`truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
            {selectedLabel}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {value && (
              <X
                size={16}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              size={18}
              className={`text-gray-400 flex-shrink-0 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${placeholder.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options list */}
            <ul className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-primary/10 transition flex items-center gap-3 ${
                        option[optionValueKey] === value ? 'bg-primary/20 text-primary font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {option[optionValueKey] === value && (
                        <span className="text-primary">✓</span>
                      )}
                      <span>{option[optionLabelKey]}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-gray-500 text-sm">
                  No options found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
