const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const sharp = require("sharp");
const fs = require("node:fs/promises");
const path = require("node:path");
process.env.JWT_SECRET = "integration-test-secret-with-at-least-32-characters";
process.env.NODE_ENV = "test";
process.env.ALLOW_PUBLIC_SIGNUP = "true";
const app = require("../app");
const User = require("../Models/Users");
const Product = require("../Models/Products");
const Supplier = require("../Models/Suppliers");
const Sales = require("../Models/Sales");
const Restock = require("../Models/Restocks");
const AccessCode = require("../Models/AccessCodes");
const AuditLog = require("../Models/AuditLogs");
const jwt = require("jsonwebtoken");
let db, owner, keeper, cashier, supplier;
const auth = (user) =>
  "Bearer " +
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
const userFields = {
  name: "Test Person",
  age: 25,
  gender: "Other",
  password: "Test-password-123",
};
async function product(overrides = {}) {
  return Product.create({
    name: "Test milk",
    barcode: new mongoose.Types.ObjectId().toString(),
    category: "Dairy",
    costPrice: 20,
    sellingPrice: 30,
    quantity: 10,
    supplierId: supplier.id,
    ...overrides,
  });
}
before(async () => {
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri());
  [owner, keeper, cashier] = await User.create([
    {
      ...userFields,
      name: "Owner",
      email: "owner@test.test",
      phone_number: "+2348000000011",
      role: "Super_Admin",
    },
    {
      ...userFields,
      name: "Keeper",
      email: "keeper@test.test",
      phone_number: "+2348000000012",
      role: "Store_Keeper",
    },
    {
      ...userFields,
      name: "Cashier",
      email: "cashier@test.test",
      phone_number: "+2348000000013",
      role: "User",
    },
  ]);
  supplier = await Supplier.create({
    companyName: "Test Supplies",
    contactPerson: "Sam",
    email: "supplier@test.test",
    phone_number: "+2348000000014",
    address: "Warehouse",
  });
  await Promise.all([
    User.init(),
    Product.init(),
    Supplier.init(),
    Sales.init(),
    Restock.init(),
    AccessCode.init(),
  ]);
});
after(async () => {
  await mongoose.disconnect();
  if (db) await db.stop();
});

test("reports and PIN generation require authentication and staff permissions", async () => {
  for (const route of [
    "dashboard-summary",
    "revenue-trend",
    "alerts",
    "top-sellers",
  ])
    await request(app)
      .get("/api/reports/" + route)
      .expect(401);
  await request(app)
    .post("/api/access/generate")
    .send({ assignedTo: keeper.id })
    .expect(401);
  await request(app)
    .post("/api/access/generate")
    .set("Authorization", auth(cashier))
    .send({ assignedTo: keeper.id })
    .expect(403);
  await request(app)
    .get("/api/reports/dashboard-summary")
    .set("Authorization", auth(cashier))
    .expect(403);
});
test("public signup cannot assign staff privileges and saves converted avatars", async () => {
  const image = await sharp({
    create: { width: 5, height: 5, channels: 3, background: "green" },
  })
    .png()
    .toBuffer();
  const result = await request(app)
    .post("/api/users/CreateUser")
    .field("name", "Public")
    .field("email", "public@test.test")
    .field("password", "Test-password-123")
    .field("gender", "Other")
    .field("age", "25")
    .field("phone_number", "+2348000000020")
    .field("role", "Store_Keeper")
    .attach("avatar", image, "avatar.png")
    .expect(201);
  assert.equal(result.body.user.role, "User");
  assert.match(result.body.user.avatar, /^uploads\/.*\.webp$/);
  await fs.access(path.join(__dirname, "..", result.body.user.avatar));
  await fs.unlink(path.join(__dirname, "..", result.body.user.avatar));
  const login = await request(app)
    .post("/api/users/LoginUser")
    .send({ email: "public@test.test", password: "Test-password-123" })
    .expect(200);
  await request(app)
    .post("/api/products/CreateProduct")
    .set("Authorization", "Bearer " + login.body.token)
    .send({})
    .expect(403);
});
test("rejected registration cleans up the processed image", async () => {
  const folder = path.join(__dirname, "../uploads");
  const beforeFiles = await fs.readdir(folder);
  const image = await sharp({
    create: { width: 5, height: 5, channels: 3, background: "blue" },
  })
    .png()
    .toBuffer();
  await request(app)
    .post("/api/users/CreateUser")
    .field("email", "missing-fields@test.test")
    .attach("avatar", image, "avatar.png")
    .expect(400);
  // Cleanup runs on the response finish event.
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.deepEqual(await fs.readdir(folder), beforeFiles);
});
test("restock adds inventory and ledger together; invalid input opens no session", async () => {
  const p = await product();
  const body = {
    productId: p.id,
    supplierId: supplier.id,
    quantityAdded: 4,
    unitCost: 25,
  };
  const result = await request(app)
    .post("/api/restock")
    .set("Authorization", auth(keeper))
    .send(body)
    .expect(201);
  assert.match(result.body.restockRecord.deliveryNumber, /^DEL-\d{8}-/);
  assert.equal((await Product.findById(p.id)).quantity, 14);
  assert.equal(await Restock.countDocuments({ productId: p.id }), 1);
  const original = mongoose.startSession;
  let called = false;
  mongoose.startSession = async () => {
    called = true;
    throw Error("Unexpected session");
  };
  try {
    await request(app)
      .post("/api/restock")
      .set("Authorization", auth(keeper))
      .send({})
      .expect(400);
    assert.equal(called, false);
  } finally {
    mongoose.startSession = original;
  }
  await request(app)
    .post("/api/restock")
    .set("Authorization", auth(keeper))
    .send({ ...body, quantityAdded: -2 })
    .expect(400);
  assert.equal((await Product.findById(p.id)).quantity, 14);
});
test("restock ledger failure rolls back the product update", async () => {
  const p = await product();
  const original = Restock.create;
  Restock.create = async () => {
    throw Object.assign(new Error("Rejected ledger"), { status: 400 });
  };
  try {
    await request(app)
      .post("/api/restock")
      .set("Authorization", auth(keeper))
      .send({
        productId: p.id,
        supplierId: supplier.id,
        quantityAdded: 3,
        unitCost: 5,
      })
      .expect(400);
  } finally {
    Restock.create = original;
  }
  assert.equal((await Product.findById(p.id)).quantity, 10);
});
test("checkout commits one receipt and rolls back a failed cart", async () => {
  const p = await product();
  await request(app)
    .post("/api/sales/checkout")
    .set("Authorization", auth(cashier))
    .send({ items: [{ productId: p.id, quantity: 2 }], paymentMethod: "Cash" })
    .expect(201);
  assert.equal((await Product.findById(p.id)).quantity, 8);
  assert.equal(await Sales.countDocuments({ "items.productId": p.id }), 1);
  await request(app)
    .post("/api/sales/checkout")
    .set("Authorization", auth(cashier))
    .send({
      items: [
        { productId: p.id, quantity: 2 },
        { productId: p.id, quantity: 100 },
      ],
      paymentMethod: "Cash",
    })
    .expect(400);
  assert.equal((await Product.findById(p.id)).quantity, 8);
  assert.equal(await Sales.countDocuments({ "items.productId": p.id }), 1);
  await request(app)
    .post("/api/sales/checkout")
    .set("Authorization", auth(cashier))
    .send({ items: [null], paymentMethod: "Cash" })
    .expect(400);
  const expired = await product({
    isPerishable: true,
    expiryDate: new Date(Date.now() - 1000),
  });
  await request(app)
    .post("/api/sales/checkout")
    .set("Authorization", auth(cashier))
    .send({
      items: [{ productId: expired.id, quantity: 1 }],
      paymentMethod: "Cash",
    })
    .expect(400);
});
test("concurrent checkouts do not oversell", async () => {
  const p = await product({ quantity: 1 });
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(app)
        .post("/api/sales/checkout")
        .set("Authorization", auth(cashier))
        .send({
          items: [{ productId: p.id, quantity: 1 }],
          paymentMethod: "Cash",
        }),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 400]);
  assert.equal((await Product.findById(p.id)).quantity, 0);
});
test("current account state overrides existing token roles", async () => {
  const u = await User.create({
      ...userFields,
      email: "inactive@test.test",
      phone_number: "+2348000000031",
      role: "Admin",
    }),
    token = auth(u);
  u.isActive = false;
  await u.save();
  await request(app)
    .get("/api/products")
    .set("Authorization", token)
    .expect(401);
  await request(app)
    .post("/api/users/LoginUser")
    .send({ email: u.email, password: userFields.password })
    .expect(401);
  u.isActive = true;
  u.role = "User";
  await u.save();
  await request(app).get("/api/staff").set("Authorization", token).expect(403);
});
test("PINs are hashed, user-bound, expire and unlock reports on the server", async () => {
  await request(app)
    .post("/api/access/generate")
    .set("Authorization", auth(owner))
    .send({ assignedTo: keeper.id, durationSeconds: "Infinity" })
    .expect(400);
  const result = await request(app)
    .post("/api/access/generate")
    .set("Authorization", auth(owner))
    .send({ assignedTo: keeper.id, durationSeconds: 3600 })
    .expect(201);
  const record = await AccessCode.findById(result.body.id);
  assert.notEqual(record.code, result.body.pin);
  await request(app)
    .get("/api/reports/dashboard-summary")
    .set("Authorization", auth(keeper))
    .expect(403);
  const other = await User.create({
    ...userFields,
    email: "other@test.test",
    phone_number: "+2348000000032",
    role: "Store_Keeper",
  });
  await request(app)
    .post("/api/access/verify")
    .set("Authorization", auth(other))
    .send({ code: result.body.pin })
    .expect(403);
  await request(app)
    .post("/api/access/verify")
    .set("Authorization", auth(keeper))
    .send({ code: result.body.pin })
    .expect(200);
  await request(app)
    .get("/api/reports/dashboard-summary")
    .set("Authorization", auth(keeper))
    .expect(200);
  await request(app)
    .get("/api/sales")
    .set("Authorization", auth(keeper))
    .expect(200);
  record.expiresAt = new Date(Date.now() - 1000);
  await record.save();
  await request(app)
    .get("/api/reports/dashboard-summary")
    .set("Authorization", auth(keeper))
    .expect(403);
  const logs = await AuditLog.find({ endpoint: "/api/access/verify" });
  assert.ok(logs.every((l) => !l.payload.includes(result.body.pin)));
});
test("product image path injection is rejected and failed updates preserve the old image", async () => {
  const p = await product();
  await request(app)
    .put("/api/products/" + p.id)
    .set("Authorization", auth(keeper))
    .send({ image: "app.js" })
    .expect(400);
  const original = await fs.readFile(path.join(__dirname, "../app.js"), "utf8");
  const buffer = await sharp({
    create: { width: 5, height: 5, channels: 3, background: "red" },
  })
    .webp()
    .toBuffer();
  const imagePath = "uploads/test-preserve.webp";
  await fs.writeFile(path.join(__dirname, "..", imagePath), buffer);
  p.image = imagePath;
  await p.save();
  const duplicate = await product();
  await request(app)
    .put("/api/products/" + p.id)
    .set("Authorization", auth(keeper))
    .field("barcode", duplicate.barcode)
    .attach("image", buffer, "image.webp")
    .expect(409);
  await fs.access(path.join(__dirname, "..", imagePath));
  assert.equal(
    await fs.readFile(path.join(__dirname, "../app.js"), "utf8"),
    original,
  );
  await fs.unlink(path.join(__dirname, "..", imagePath));
});
test("staff management and supplier creation are restricted", async () => {
  await request(app)
    .get("/api/staff")
    .set("Authorization", auth(keeper))
    .expect(403);
  await request(app)
    .post("/api/suppliers")
    .set("Authorization", auth(cashier))
    .send({})
    .expect(403);
  const result = await request(app)
    .post("/api/staff")
    .set("Authorization", auth(owner))
    .send({
      ...userFields,
      email: "newstaff@test.test",
      phone_number: "+2348000000033",
      role: "Store_Keeper",
    })
    .expect(201);
  assert.equal(result.body.user.role, "Store_Keeper");
  await request(app)
    .patch("/api/staff/" + owner.id)
    .set("Authorization", auth(owner))
    .send({ isActive: false })
    .expect(403);
});
