const request = require('supertest');
const express = require('express');
const itemsRouter = require('./items');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

const mockData = [
  { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
  { id: 2, name: 'Noise Cancelling Headphones', category: 'Electronics', price: 399 },
];

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/items', itemsRouter);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return app;
}

describe('Items Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    require('fs').promises.readFile.mockResolvedValue(JSON.stringify(mockData));
    require('fs').promises.writeFile.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/items', () => {
    it('should return all items with pagination metadata', async () => {
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.items).toEqual(mockData);
      expect(res.body.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    it('should filter items by query', async () => {
      const res = await request(app).get('/api/items?q=laptop');
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([mockData[0]]);
      expect(res.body.pagination.totalItems).toBe(1);
    });

    it('should limit the number of items', async () => {
      const res = await request(app).get('/api/items?limit=1');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.pagination.itemsPerPage).toBe(1);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it('should handle file read errors', async () => {
      require('fs').promises.readFile.mockRejectedValueOnce(new Error('fail'));
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('fail');
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return the item by id', async () => {
      const res = await request(app).get('/api/items/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData[0]);
    });

    it('should return 404 if item not found', async () => {
      const res = await request(app).get('/api/items/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Item not found');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item with valid data', async () => {
      const newItem = { name: 'Desk Lamp', category: 'Electronics', price: 49 };
      const res = await request(app).post('/api/items').send(newItem);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject(newItem);
      expect(res.body).toHaveProperty('id');
      expect(require('fs').promises.writeFile).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app).post('/api/items').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeInstanceOf(Array);
    });

    it('should return 400 for invalid price', async () => {
      const res = await request(app).post('/api/items').send({ name: 'Lamp', category: 'Electronics', price: -10 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should handle file write errors', async () => {
      require('fs').promises.writeFile.mockRejectedValueOnce(new Error('write fail'));
      const newItem = { name: 'Desk Lamp', category: 'Electronics', price: 49 };
      const res = await request(app).post('/api/items').send(newItem);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('write fail');
    });
  });
}); 