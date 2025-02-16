import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Loader } from 'lucide-react';
import Sidebar from './Sidebar';

interface Product {
  _id: string;
  name: string;
  sku: string;
}

interface Prediction {
  date: string;
  predicted: number;
  actual: number;
}

const Predictions = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const generatePredictions = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/predictions/forecast/${selectedProduct}`);
      setPredictions(response.data.predictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get only the last prediction (next day)
  const lastPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center mb-8">
          <Brain className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">AI Predictions</h1>
        </div>

        {/* Product Selection Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="max-w-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            <button
              onClick={generatePredictions}
              disabled={!selectedProduct || loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Generating Predictions...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate Predictions
                </>
              )}
            </button>
          </div>
        </div>

        {/* Next Day Forecast Card */}
        {lastPrediction && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Next Day Sales Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800">Predicted Sales</h3>
                <p className="text-2xl font-bold text-blue-600">{lastPrediction.predicted}</p>
                <p className="text-sm text-gray-600">for {lastPrediction.date}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-800">Actual Sales</h3>
                <p className="text-2xl font-bold text-green-600">
                  {lastPrediction.actual || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">for {lastPrediction.date}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Chart */}
        {predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Sales Forecast Trend</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#8884d8"
                  name="Actual Sales"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#82ca9d"
                  name="Predicted Sales"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictions;