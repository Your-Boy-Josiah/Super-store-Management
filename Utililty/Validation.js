// Do not allow Number(null), Number(true), or Number([]) to turn malformed
// input into valid-looking prices or quantities.
exports.isNumericInput = (value) =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value));

exports.validateProductFields = (body) => {
  const textFields = [
    "name",
    "barcode",
    "sku",
    "category",
    "unit",
    "size",
    "description",
    "supplierId",
  ];
  for (const key of textFields) {
    if (body[key] !== undefined && typeof body[key] !== "string")
      return `${key} must be text`;
  }
  for (const key of ["costPrice", "sellingPrice", "quantity", "reorderLevel"]) {
    if (body[key] === undefined || (key === "reorderLevel" && body[key] === ""))
      continue;
    if (
      !exports.isNumericInput(body[key]) ||
      Number(body[key]) < 0 ||
      Number(body[key]) > Number.MAX_SAFE_INTEGER
    )
      return `${key} must be a finite nonnegative number`;
    if (
      ["quantity", "reorderLevel"].includes(key) &&
      !Number.isSafeInteger(Number(body[key]))
    )
      return `${key} must be a whole number`;
  }
  if (
    body.isPerishable !== undefined &&
    ![true, false, "true", "false"].includes(body.isPerishable)
  )
    return "isPerishable must be true or false";
  return null;
};
