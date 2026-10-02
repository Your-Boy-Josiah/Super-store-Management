exports.errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const validation = ["ValidationError", "CastError", "MulterError"].includes(
    err.name,
  );
  const status =
    err.code === 11000
      ? 409
      : validation
        ? 400
        : err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  if (status >= 500) console.error(err);
  res
    .status(status)
    .json({
      success: false,
      message:
        status >= 500 ? "An unexpected server error occurred" : err.message,
    });
};
