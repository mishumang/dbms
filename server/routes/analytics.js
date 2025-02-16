import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Get sales analytics
router.get('/sales', async (req, res) => {
  try {
    const products = await Product.find();
    if (!products || products.length === 0) {
      return res.json([]);
    }

    const salesData = products.reduce((acc, product) => {
      if (!product.salesHistory) return acc;
      
      product.salesHistory.forEach(sale => {
        if (!sale.date || !sale.revenue) return;
        
        const date = sale.date.toISOString().split('T')[0];
        const existingDate = acc.find(item => item.date === date);
        if (existingDate) {
          existingDate.revenue += sale.revenue;
          existingDate.orders += 1;
        } else {
          acc.push({ date, revenue: sale.revenue, orders: 1 });
        }
      });
      return acc;
    }, []);

    res.json(salesData.sort((a, b) => new Date(a.date) - new Date(b.date)));
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ message: 'Error fetching sales data', error: error.message });
  }
});

// Get category distribution
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: 1 },
          totalRevenue: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$price', 0] }, 
                { $ifNull: ['$quantity', 0] }
              ] 
            } 
          }
        }
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          revenue: '$totalRevenue',
          _id: 0
        }
      }
    ]);

    if (!categories || categories.length === 0) {
      return res.json([]);
    }

    res.json(categories);
  } catch (error) {
    console.error('Categories analytics error:', error);
    res.status(500).json({ message: 'Error fetching category data', error: error.message });
  }
});

// Get top selling products
router.get('/top-products', async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $project: {
          name: 1,
          totalSales: { 
            $size: { 
              $ifNull: ['$salesHistory', []] 
            } 
          },
          totalRevenue: {
            $reduce: {
              input: { $ifNull: ['$salesHistory', []] },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.revenue', 0] }] }
            }
          }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    if (!products || products.length === 0) {
      return res.json([]);
    }

    res.json(products);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ message: 'Error fetching top products', error: error.message });
  }
});

export default router;