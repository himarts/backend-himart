import User from "../models/model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import dotenv from "dotenv";
import {
  createStripeCustomer,
  listCustomerPayMethods,
  attachMethod,
} from "../helpers/index.js";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const signUp = async (req, res) => {
  try {
    const { email, password, firstname, lastname } = req.body;

    // Check if email already exists
    const isExist = await User.findOne({ email });
    if (isExist) {
      return res.status(400).json({
        message: "User email is already in use",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashPassword,
      firstname,
      lastname,
    });

    const savedData = await newUser.save();
    const token = jwt.sign({ userId: savedData._id }, process.env.SECRET, {
      expiresIn: "1 hour",
    });
    return res.status(200).json({
      success: true,
      message:
        "Successfully signed up. Please check your email to verify your account.",
      data: savedData,
      token: token,
    });
  } catch (error) {
    if (error) {
      console.log(error);
      return res.status(500).json({
        message: "error",
        error: error.msg,
      });
    }
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`User not found for email: ${email}`); // Debug log
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log(`Incorrect password for email: ${email}`); // Debug log
      return res.status(401).json({ message: "Incorrect password or email" });
    }

    const token = jwt.sign({ userId: user.token }, process.env.SECRET, {
      expiresIn: "1 hour",
    });

    return res.status(200).json({
      message: "successfully logged in",
      data: user,
      token: token,
      isProfileComplete: user.isProfileComplete,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      error: error.msg,
    });
  }
};
