import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = useCallback(async (params = {}, signal) => {
    const { page = 1, limit = 10, q = '' } = params;
    
    const searchParams = new URLSearchParams();
    if (page) searchParams.append('page', page);
    if (limit) searchParams.append('limit', limit);
    if (q) searchParams.append('q', q);

    const url = `http://localhost:3001/api/items?${searchParams.toString()}`;
    
    const res = await fetch(url, { signal });
    const data = await res.json();
    
    setItems(data.items || data); // Handle both new and old response format
    if (data.pagination) {
      setPagination(data.pagination);
    }
  }, []);

  return (
    <DataContext.Provider value={{ 
      items, 
      pagination, 
      isLoading, 
      setIsLoading, 
      fetchItems 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);