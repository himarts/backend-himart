import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: String,
  payer: {
    name: String,
    email: String,
  },
  purchaseUnits: [
    {
      items: [
        {
          name: String,
          unit_amount: { currency_code: String, value: String },
          quantity: Number,
        },
      ],
      amount: { currency_code: String, value: String },
    },
  ],
  status: String,
  createTime: String,
  updateTime: String,
});

export const OrderModel = mongoose.model('Order', OrderSchema);
