import express from "express";

import {
  signUp,
  login,

} from "../controller/auth.js";
import { createPayment, executePayment} from "../controller/paypal.js";
const router = express.Router();

router.post("/users/signup", signUp);
router.post("/users/login", login);
router.post('/api/create-payment',createPayment)
router.post('/api/execute-payment',executePayment)
export default router;
