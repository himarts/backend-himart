import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';
import { OrderModel } from '../models/order.js';
dotenv.config();

// PayPal environment setup
const environment = new paypal.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);
// const environment = new paypal.core.SandboxEnvironment(
//   process.env.PAYPAL_CLIENT_ID,
//   process.env.PAYPAL_CLIENT_SECRET
// );
// const client = new paypal.core.PayPalHttpClient(environment);

// Create Payment
export const createPayment = async (req, res) => {
    const { items } = req.body;
  
    const itemTotal = items.reduce((sum, item) => {
      const unitAmount = parseFloat(item.price);
      const quantity = parseInt(item.quantity, 10);
      return sum + unitAmount * quantity;
    }, 0);
  
    if (isNaN(itemTotal) || itemTotal <= 0) {
      return res.status(400).json({ error: "Invalid items or total amount" });
    }
  
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: itemTotal.toFixed(2),
            breakdown: {
              item_total: { currency_code: 'USD', value: itemTotal.toFixed(2) },
            },
          },
          items: items.map((item) => ({
            name: item.name,
            unit_amount: { currency_code: 'USD', value: parseFloat(item.price).toFixed(2) },
            quantity: parseInt(item.quantity, 10),
          })),
        },
      ],
      application_context: {
        return_url: 'http://localhost:3000/checkout-success',
        cancel_url: 'http://localhost:3000/cancel',
        user_action: 'PAY_NOW',
      
      },
    });
  
    try {
      const order = await client.execute(request);
      const approvalUrl = order.result.links.find(
        (link) => link.rel === 'approve'
      ).href;
      res.json({ approvalUrl });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: error.message });
    }
  };
  

// Execute Payment
export const executePayment = async (req, res) => {
    const { orderId } = req.body;
  
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
  
    try {
      const capture = await client.execute(request);
  
      if (capture.result.status === "COMPLETED") {
        // Extract payment details
        const orderDetails = {
          orderId: capture.result.id,
          payer: {
            name: `${capture.result.payer.name.given_name} ${capture.result.payer.name.surname}`,
            email: capture.result.payer.email_address,
          },
          purchaseUnits: capture.result.purchase_units.map((unit) => ({
            items: unit.items,
            amount: unit.amount,
          })),
          status: capture.result.status,
          createTime: capture.result.create_time,
          updateTime: capture.result.update_time,
        };
  
        // Save to the database
        try {
          const savedOrder = await OrderModel.create(orderDetails);
          console.log('Order saved:', savedOrder);
        } catch (dbError) {
          console.error('Database error:', dbError);
          return res.status(500).send({ success: false, error: dbError.message });
        }
  
        // Respond to the client
        res.send({ success: true, order: savedOrder });
      } else {
        // Handle unsuccessful payment status
        console.error("Payment not completed:", capture.result);
        res.status(400).send({
          success: false,
          message: "Payment was not successful.",
          details: capture.result,
        });
      }
    } catch (error) {
      console.error("Error capturing payment:", error);
  
      // Handle specific PayPal error responses
      if (error.statusCode === 402) {
        // Insufficient funds or card declined
        res.status(402).send({
          success: false,
          message: "Payment failed due to insufficient funds or card issues.",
          error: error.message,
        });
      } else {
        // General server error
        res.status(500).send({
          success: false,
          message: "An error occurred while processing the payment.",
          error: error.message,
        });
      }
    }
  };
  