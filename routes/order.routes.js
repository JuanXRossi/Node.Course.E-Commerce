import express from "express";
import { OrderModel } from "../models/order.model.js";
import { handleRouteError } from "../helpers/error-handling.js";
import { userAndAdmin } from "../middleware/roles.middleware.js";
import mongoose from "mongoose";
import { ProductModel } from "../models/product.model.js";

const router = express.Router();

router.post("/", userAndAdmin, async (req, res) => {
  try {
    const { orderItems } = req.body;
    const { auth: currentUser } = req;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        message: req.t("orderItemsRequired"),
      });
    }

    for (const item of orderItems) {
      if (!item.product || !item.quantity) {
        return res.status(400).send({
          message: req.t("orderItemValidation"),
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).send({
          message: req.t("invalidProductId"),
          invalidId: item.product,
        });
      }

      if (typeof item.quantity !== "number" || item.quantity < 1) {
        return res.status(400).send({
          message: req.t("quantityMustBeAtLeast1"),
        });
      }

      if (!Number.isInteger(item.quantity)) {
        return res.status(400).send({
          message: req.t("quantityMustBeWholeNumber"),
          invalidQuantity: item.quantity,
        });
      }
    }

    const productIds = orderItems.map((item) => item.product);
    const products = await ProductModel.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(404).send({
        message: req.t("productsNotFound"),
      });
    }

    const orderItemsWithPrices = [];

    for (const item of orderItems) {
      const product = products.find((p) => p._id.toString() === item.product);

      if (product.countInStock < item.quantity) {
        return res.status(400).send({
          message: req.t("insufficientStock"),
          productName: product.title,
          availableStock: product.countInStock,
          requestedQuantity: item.quantity,
        });
      }

      orderItemsWithPrices.push({
        product: item.poduct,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const totalPrice = orderItemsWithPrices.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    const newOrder = new OrderModel({
      orderItems: orderItemsWithPrices,
      user: currentUser.id,
      totalPrice,
    });

    const savedOrder = await newOrder.save();

    for (const item of orderItemsWithPrices) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.quantity },
      });
    }

    const populatedOrder = await OrderModel.findById(savedOrder._id)
      .populate(
        "user",
        "userName, email phonenumber city postalCode addressLine1 addressLine2",
      )
      .populate(
        "orderItems.product",
        "title price images countInStock rating views",
      );

    res.status(201).send({
      message: req.t("orderCreatedSuccessfully"),
      data: populatedOrder,
    });
  } catch (error) {
    handleRouteError(error, res);
  }
});

export default router;
