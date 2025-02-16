import express from 'express';
import * as tf from '@tensorflow/tfjs';
import Product from '../models/Product.js';

const router = express.Router();

// Helper function to prepare data for LSTM
const prepareData = (data, lookback = 5) => {
  const X = [];
  const y = [];
  for (let i = 0; i < data.length - lookback; i++) {
    X.push(data.slice(i, i + lookback).map(val => [val])); // Shape [lookback, 1]
    y.push([data[i + lookback]]);
  }
  return [X, y];
};

// Function to create and train LSTM model
const trainModel = async (X, y) => {
  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 8,
    inputShape: [5, 1],  // 5 time steps, 1 feature per step
    returnSequences: false
  }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError'
  });

  const tensorX = tf.tensor3d(X, [X.length, 5, 1]);
  const tensorY = tf.tensor2d(y, [y.length, 1]);

  await model.fit(tensorX, tensorY, {
    epochs: 100,
    batchSize: 32,
    shuffle: true
  });

  tensorX.dispose();
  tensorY.dispose();

  return model;
};

router.get('/forecast/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get sales history data
    const salesData = product.salesHistory?.map(sale => sale.quantity) || [];
    if (salesData.length < 10) {
      return res.status(400).json({ message: 'Insufficient sales data for prediction. Need at least 10 data points.' });
    }

    // Prepare data
    const [X, y] = prepareData(salesData);
    if (X.length === 0 || y.length === 0) {
      return res.status(400).json({ message: 'Error preparing data for prediction' });
    }

    // Train the model
    const model = await trainModel(X, y);

    // Prepare last 5 data points for prediction
    const lastData = salesData.slice(-5).map(val => [val]); // Reshape to [5, 1]
    const input = tf.tensor3d([lastData], [1, 5, 1]);

    // Make predictions
    const prediction = model.predict(input);
    const predictedValue = Math.round(prediction.dataSync()[0]);

    console.log('Predicted Sales:', predictedValue);

    // Clean up tensors
    input.dispose();
    prediction.dispose();
    model.dispose();

    // Prepare response data
    const predictions = salesData.map((actual, index) => ({
      date: product.salesHistory[index]?.date,
      actual,
      predicted: null
    }));

    // Add predicted value for the next day
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    predictions.push({
      date: nextDay.toISOString(),
      actual: null,
      predicted: predictedValue
    });

    res.json({ productId: req.params.productId, predictions });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Error generating prediction', error: error.message });
  }
});

export default router;
