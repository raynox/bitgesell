import React, { useEffect, useState, useCallback } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const { items, pagination, isLoading, setIsLoading, fetchItems } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadItems = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      await fetchItems({
        page: currentPage,
        limit: 10,
        q: debouncedSearchTerm
      }, signal);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching items:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, currentPage, debouncedSearchTerm, setIsLoading]);

  useEffect(() => {
    const abortController = new AbortController();
    loadItems(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadItems]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading && items.length === 0) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '300px'
          }}
        />
      </div>

      {/* Items List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ 
            padding: '10px', 
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Link to={'/items/' + item.id} style={{ textDecoration: 'none', color: '#333' }}>
              {item.name}
            </Link>
            <span style={{ color: '#666', fontSize: '14px' }}>
              {item.category} - ${item.price}
            </span>
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '10px'
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: pagination.hasPrevPage ? '#fff' : '#f5f5f5',
              cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed'
            }}
          >
            Previous
          </button>

          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
            {pagination.totalItems > 0 && (
              <span style={{ color: '#666', marginLeft: '10px' }}>
                ({pagination.totalItems} items)
              </span>
            )}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNextPage || isLoading}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: pagination.hasNextPage ? '#fff' : '#f5f5f5',
              cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {isLoading && items.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
          Loading...
        </div>
      )}
    </div>
  );
}

export default Items;