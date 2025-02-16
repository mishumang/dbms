import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderPoint: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      name: {
        type: String,
        required: true,
      },
      contact: {
        phone: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
      },
      address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
      },
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
    salesHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        quantity: {
          type: Number,
          min: 0,
        },
        revenue: {
          type: Number,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', productSchema);
