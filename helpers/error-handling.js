export const handleRouteError = (error, res) => {
  console.error("Error happened: ", error);
  res.status(500).json({
    success: false,
    message: error.message,
  });
};
