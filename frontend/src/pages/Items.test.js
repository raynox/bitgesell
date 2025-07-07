import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Items from './Items';
import { DataProvider } from '../state/DataContext';

// Mock the DataContext
const mockUseData = {
  items: [
    { id: 1, name: 'Test Item 1', category: 'Electronics', price: 99.99 },
    { id: 2, name: 'Test Item 2', category: 'Books', price: 19.99 }
  ],
  pagination: {
    currentPage: 1,
    totalPages: 3,
    totalItems: 25,
    hasNextPage: true,
    hasPrevPage: false
  },
  isLoading: false,
  setIsLoading: jest.fn(),
  fetchItems: jest.fn()
};

// Mock the DataContext hook
jest.mock('../state/DataContext', () => ({
  ...jest.requireActual('../state/DataContext'),
  useData: () => mockUseData
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <DataProvider>
        {component}
      </DataProvider>
    </BrowserRouter>
  );
};

describe('Items Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input', () => {
    renderWithRouter(<Items />);
    
    const searchInput = screen.getByPlaceholderText('Search items...');
    expect(searchInput).toBeInTheDocument();
  });

  test('displays items list', () => {
    renderWithRouter(<Items />);
    
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('Electronics - $99.99')).toBeInTheDocument();
    expect(screen.getByText('Books - $19.99')).toBeInTheDocument();
  });

  test('shows pagination when there are multiple pages', () => {
    renderWithRouter(<Items />);
    
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('(25 items)')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
}); 