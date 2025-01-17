import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createStripeCustomer({ name, email, phone }) {
  return new Promise(async (resolve, reject) => {
    try {
      const Customer = await stripe.customers.create({
        name: name,
        email: email,
        phone: phone,
      });

      resolve(Customer);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}


export async function listCustomerPayMethods(customerId) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentMethods = await stripe.customers.listPaymentMethods(customerId, {
        type: "card",
      });
      resolve(paymentMethods);
    } catch (err) {
      reject(err);
    }
  });
}

export function attachMethod({ paymentMethod, customerId }) {
  return new Promise(async (resolve, reject) => {
    try {
      const paymentMethodAttach = await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });
      resolve(paymentMethodAttach);
    } catch (err) {
      reject(err);
    }
  });
}