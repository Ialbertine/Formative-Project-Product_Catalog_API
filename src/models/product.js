const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    stock: { type: Number, required: true },
    variants: [{ size: String, color: String, stock: Number }],
  },
  { timestamps: true }
);

// this check if the model is already defined
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);