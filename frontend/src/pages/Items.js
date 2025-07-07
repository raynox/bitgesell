import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const { items, fetchItems } = useData();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    const loadItems = async () => {
      try {
        setIsLoading(true);
        await fetchItems(abortController.signal);
        setIsLoading(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching items:', error);
          setIsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      abortController.abort();
    };
  }, [fetchItems]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          <Link to={'/items/' + item.id}>{item.name}</Link>
        </li>
      ))}
    </ul>
  );
}

export default Items;