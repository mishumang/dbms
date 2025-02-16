import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import Sidebar from './Sidebar';

interface Supplier {
  name: string;
  contact: {
    phone: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  reorderPoint: number;
  supplier: Supplier;
}

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory');
      setProducts(response.data);
      checkLowStock(response.data); // Check for low stock after fetching products
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const checkLowStock = (products: Product[]) => {
    products.forEach((product) => {
      if (product.quantity <= product.reorderPoint) {
        sendQuotationEmail(product);
      }
    });
  };

  const sendQuotationEmail = async (product: Product) => {
    const emailContent = {
      to: product.supplier.contact.email,
      subject: `Quotation Request for ${product.name} (SKU: ${product.sku})`,
      text: `Dear ${product.supplier.name},

We are reaching out to request a quotation for the following product:

- Product Name: ${product.name}
- SKU: ${product.sku}
- Current Stock: ${product.quantity}
- Reorder Point: ${product.reorderPoint}

We would appreciate it if you could provide us with a quotation for the above product, including the price and the maximum quantity you can supply. Please also let us know the estimated delivery time.

Thank you for your prompt attention to this matter. We look forward to your response.

Best regards,
[Your Company Name]`,
    };

    try {
      await axios.post('http://localhost:5000/api/mail/send-email', emailContent);
      console.log('Quotation email sent to:', product.supplier.contact.email);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const productData = {
      name: formData.get('name'),
      sku: formData.get('sku'),
      category: formData.get('category'),
      quantity: Number(formData.get('quantity')),
      price: Number(formData.get('price')),
      reorderPoint: Number(formData.get('reorderPoint')), // Add reorderPoint
      supplier: {
        name: formData.get('supplierName'),
        contact: {
          phone: formData.get('supplierPhone'),
          email: formData.get('supplierEmail'),
        },
        address: {
          street: formData.get('supplierStreet'),
          city: formData.get('supplierCity'),
          state: formData.get('supplierState'),
          zip: formData.get('supplierZip'),
          country: formData.get('supplierCountry'),
        },
      },
    };

    try {
      if (currentProduct) {
        await axios.put(`http://localhost:5000/api/inventory/${currentProduct._id}`, productData);
      } else {
        await axios.post('http://localhost:5000/api/inventory', productData);
      }
      fetchProducts();
      setIsModalOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.supplier.name}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${product.quantity <= product.reorderPoint ? 'text-red-600 font-semibold' : ''}`}>
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setCurrentProduct(product);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this product?')) {
                          await axios.delete(`http://localhost:5000/api/inventory/${product._id}`);
                          fetchProducts();
                        }
                      }}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setCurrentProduct(null);
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-6">{currentProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    defaultValue={currentProduct?.name}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="text"
                    name="sku"
                    placeholder="SKU"
                    defaultValue={currentProduct?.sku}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    defaultValue={currentProduct?.category}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    defaultValue={currentProduct?.quantity}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    placeholder="Price"
                    defaultValue={currentProduct?.price}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="number"
                    name="reorderPoint"
                    placeholder="Reorder Point"
                    defaultValue={currentProduct?.reorderPoint}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="text"
                    name="supplierName"
                    placeholder="Supplier Name"
                    defaultValue={currentProduct?.supplier.name}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="text"
                    name="supplierPhone"
                    placeholder="Supplier Phone"
                    defaultValue={currentProduct?.supplier.contact.phone}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <input
                    type="email"
                    name="supplierEmail"
                    placeholder="Supplier Email"
                    defaultValue={currentProduct?.supplier.contact.email}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;