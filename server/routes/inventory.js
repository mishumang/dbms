import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  const product = new Product({
    name: req.body.name,
    sku: req.body.sku,
    category: req.body.category,
    quantity: req.body.quantity,
    price: req.body.price,
    reorderPoint: req.body.reorderPoint,
    supplier: req.body.supplier,
    salesHistory: [] // Initialize empty sales history
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if quantity has decreased (indicating a sale)
    if (req.body.quantity < product.quantity) {
      const quantitySold = product.quantity - req.body.quantity;
      const revenue = quantitySold * product.price;
      
      // Add to sales history
      product.salesHistory.push({
        date: new Date(),
        quantity: quantitySold,
        revenue: revenue
      });
    }

    // Update product fields
    Object.assign(product, req.body);

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;