import { body, validationResult } from "express-validator";

export const createProductValidation = [
  body("title")
    .notEmpty()
    .withMessage(
      (value, { req }) =>
        req.t("productTitleRequired"),
    )
    .isLength({ min: 2, max: 10 })
    .withMessage(
      (value, { req }) =>
        req.t("productTitleLength"),
    )
    .trim(),
  body("category")
    .notEmpty()
    .withMessage(
      (value, { req }) => req.t("categoryRequired"),
    )
    .isMongoId()
    .withMessage(
      (value, { req }) => req.t("invalidCategoryId"),
    ),
  body("price")
    .notEmpty()
    .withMessage(
      (value, { req }) => req.t("priceRequired"),
    )
    .isFloat({ min: 0 })
    .withMessage(
      (value, { req }) =>
        req.t("pricePositive"),
    ),
  body("description")
    .notEmpty()
    .withMessage(
      (value, { req }) =>
        req.t("descriptionRequired"),
    )
    .isLength({ min: 5, max: 1000 })
    .withMessage(
      (value, { req }) =>
        req.t("descriptionLength"),
    )
    .trim(),
  body("countInStock")
    .notEmpty()
    .withMessage(
      (value, { req }) =>
        req.t("stockCountRequired"),
    )
    .isInt({ min: 0, max: 99999 })
    .withMessage(
      (value, { req }) =>
        req.t("stockCountRange"),
    ),
  body("rating.count")
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      (value, { req }) =>
        req.t("ratingCountPositive"),
    ),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
};
