import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Users,
  KeyRound,
  LogOut,
  Search,
  Plus,
  ArrowUpRight,
  Store,
  Menu,
  X,
  UserRound,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Trash2,
  Pencil,
} from "lucide-react";
import { api, money, date } from "./api";
import "./style.css";

const categories = [
  "Bakery",
  "Beverages",
  "Canned Goods",
  "Dairy",
  "Frozen Foods",
  "Meat & Seafood",
  "Farm Produce",
  "Snacks",
  "Household",
  "Personal Care",
  "Other",
];
const units = ["pcs", "kg", "g", "liter", "ml", "pack", "box", "can", "bottle"];
const admin = (user) => ["Admin", "Super_Admin"].includes(user.role);
const stock = (user) => admin(user) || user.role === "Store_Keeper";
const productFields = [
  ["name", "Product name"],
  ["barcode", "Barcode"],
  ["sku", "SKU", "text", false],
  ["category", "Category", "select", true, categories],
  ["supplierId", "Supplier", "supplier"],
  ["costPrice", "Cost price", "number"],
  ["sellingPrice", "Selling price", "number"],
  ["quantity", "Opening stock", "number"],
  ["unit", "Unit", "select", true, units],
  ["size", "Size", "text", false],
  ["reorderLevel", "Reorder level", "number", false],
  ["isPerishable", "Perishable", "checkbox", false],
  ["expiryDate", "Expiry date", "date", false],
  ["description", "Description", "textarea", false],
  ["image", "Product image", "file", false],
];
const supplierFields = [
  ["companyName", "Company name"],
  ["contactPerson", "Contact person"],
  ["email", "Email", "email"],
  ["phone_number", "Phone number", "tel"],
  ["address", "Address"],
  ["leadTimeDays", "Lead time (days)", "number", false],
];
const staffFields = [
  ["name", "Full name"],
  ["email", "Email", "email"],
  ["password", "Password", "password"],
  ["phone_number", "Phone number", "tel"],
  ["age", "Age", "number"],
  [
    "gender",
    "Gender",
    "select",
    true,
    ["Male", "Female", "Transgender", "Non-binary", "Other"],
  ],
  ["role", "Role", "select", true, ["User", "Store_Keeper", "Admin"]],
  ["avatar", "Avatar", "file", false],
];

function Notice({ error, children }) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={"notice " + (error ? "bad" : "good")}
    >
      {error ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
      <span>{children}</span>
    </div>
  );
}
function Empty({ children }) {
  return (
    <div className="empty">
      <Package size={30} />
      <p>{children}</p>
    </div>
  );
}
function Dialog({ title, onClose, children }) {
  const ref = React.useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    el.showModal();
    el.querySelector("input,select,button")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose}>
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Form({
  fields,
  initial = {},
  suppliers = [],
  submit,
  onDone,
  button = "Save",
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    for (const [key, , type] of fields)
      if (type === "checkbox")
        form.set(key, String(event.currentTarget.elements[key].checked));
    for (const [key, value] of [...form])
      if (value instanceof File && !value.size) form.delete(key);
    try {
      await submit(form);
      onDone?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="form-grid">
      {fields.map(([key, label, type = "text", required = true, options]) => (
        <label key={key} className={type === "textarea" ? "wide" : ""}>
          <span>
            {label}
            {required ? " *" : ""}
          </span>
          {type === "select" || type === "supplier" ? (
            <select
              name={key}
              required={required}
              defaultValue={
                typeof initial[key] === "object"
                  ? initial[key]?._id
                  : initial[key] || ""
              }
            >
              <option value="">Choose {label.toLowerCase()}</option>
              {(type === "supplier"
                ? suppliers
                    .filter((s) => s.isActive)
                    .map((s) => [s._id, s.companyName])
                : options.map((s) => [s, s])
              ).map(([value, name]) => (
                <option key={value} value={value}>
                  {name.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea name={key} defaultValue={initial[key] || ""} />
          ) : (
            <input
              name={key}
              type={type}
              required={required}
              accept={
                type === "file"
                  ? "image/jpeg,image/png,image/webp,image/gif"
                  : undefined
              }
              min={type === "number" ? (key === "age" ? 16 : 0) : undefined}
              step={
                type === "number"
                  ? ["costPrice", "sellingPrice", "unitCost"].includes(key)
                    ? "0.01"
                    : "1"
                  : undefined
              }
              minLength={type === "password" ? 8 : undefined}
              defaultChecked={
                type === "checkbox" ? Boolean(initial[key]) : undefined
              }
              defaultValue={
                ["file", "checkbox"].includes(type)
                  ? undefined
                  : type === "date"
                    ? initial[key]?.slice(0, 10) || ""
                    : (initial[key] ?? "")
              }
            />
          )}
        </label>
      ))}
      {error && (
        <div className="wide">
          <Notice error>{error}</Notice>
        </div>
      )}
      <div className="wide form-actions">
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : button}
        </button>
      </div>
    </form>
  );
}
function Pager({ pagination, onPage }) {
  return (
    pagination && (
      <div className="pager">
        <span>
          {pagination.totalRecords ??
            pagination.totalProducts ??
            pagination.totalSales}{" "}
          records · Page {pagination.currentPage} of{" "}
          {Math.max(1, pagination.totalPages)}
        </span>
        <button
          disabled={pagination.currentPage <= 1}
          onClick={() => onPage(pagination.currentPage - 1)}
        >
          Previous
        </button>
        <button
          disabled={pagination.currentPage >= pagination.totalPages}
          onClick={() => onPage(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    )
  );
}

function App() {
  const [session, setSession] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem("ssm-session"));
      } catch {
        return null;
      }
    }),
    [view, setView] = useState("overview"),
    [mobile, setMobile] = useState(false);
  const logout = useCallback(() => {
    sessionStorage.removeItem("ssm-session");
    setSession(null);
    setView("overview");
  }, []);
  const request = useCallback(
    async (path, options = {}) => {
      try {
        return await api(path, { ...options, token: session?.token });
      } catch (e) {
        if (e.status === 401) logout();
        throw e;
      }
    },
    [session?.token, logout],
  );
  useEffect(() => {
    if (!session) return;
    let live = true;
    request("/profile")
      .then((r) => {
        if (live) setSession((s) => (s ? { ...s, user: r.user } : null));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [session?.token]);
  if (!session)
    return (
      <Login
        onLogin={(data) => {
          sessionStorage.setItem("ssm-session", JSON.stringify(data));
          setSession(data);
          setView(admin(data.user) ? "overview" : "pos");
        }}
      />
    );
  const user = session.user;
  const nav = [
    ["overview", "Overview", LayoutDashboard, true],
    ["products", "Inventory", Package, true],
    ["pos", "Point of sale", ShoppingCart, true],
    ["suppliers", "Suppliers", Truck, stock(user)],
    ["restock", "Restocking", RefreshCw, stock(user)],
    ["reports", "Sales & reports", BarChart3, stock(user)],
    ["staff", "Team", Users, admin(user)],
    ["access", "Access PINs", KeyRound, stock(user)],
    ["profile", "My profile", UserRound, true],
  ].filter((x) => x[3]);
  const current = nav.find((x) => x[0] === view) || nav[0];
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-icon">
            <Store size={23} />
          </span>
          <span>
            Super-store<small>MANAGEMENT</small>
          </span>
        </a>
        <div className="workspace">
          <span className="status-dot" /> Store workspace <span>LIVE</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              className={key === view ? "active" : ""}
              onClick={() => {
                setView(key);
                setMobile(false);
              }}
            >
              <Icon size={19} />
              {label}
              {key === view && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{user.name.slice(0, 1)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role.replaceAll("_", " ")}</small>
          </div>
          <button className="icon" aria-label="Log out" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="main">
        <header>
          <div className="breadcrumb">
            <button
              className="icon mobile-menu"
              aria-label="Open menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            <Store size={16} />
            <span>Workspace</span>
            <span>/</span>
            <strong>{current[1]}</strong>
          </div>
          <div className="header-right">
            <span className="desktop">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="avatar small">{user.name[0]}</span>
          </div>
        </header>
        <main key={view}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR STORE, CONNECTED</div>
              <h1>{current[1]}</h1>
              <p>
                {
                  {
                    overview: "A clear view of your store’s performance.",
                    products: "Keep every product and stock level in sync.",
                    pos: "Scan, sell, and keep your queue moving.",
                    suppliers: "The people who keep your shelves stocked.",
                    restock: "Receive deliveries and update inventory safely.",
                    reports: "Understand your sales and inventory trends.",
                    staff: "Manage the people behind your store.",
                    access: "Secure, temporary access to store reports.",
                    profile: "Your account and profile information.",
                  }[view]
                }
              </p>
            </div>
            <span className="workspace-chip">
              <span className="status-dot" /> Connected workspace
            </span>
          </div>
          {view === "overview" ? (
            <Overview request={request} user={user} go={setView} />
          ) : view === "products" ? (
            <Products request={request} user={user} />
          ) : view === "pos" ? (
            <POS request={request} />
          ) : view === "suppliers" ? (
            <Suppliers request={request} user={user} />
          ) : view === "restock" ? (
            <Restocks request={request} user={user} />
          ) : view === "reports" ? (
            <Reports request={request} />
          ) : view === "staff" ? (
            <Team request={request} user={user} />
          ) : view === "access" ? (
            <Access request={request} user={user} />
          ) : (
            <Profile
              request={request}
              user={user}
              update={(u) => setSession((s) => ({ ...s, user: u }))}
            />
          )}
        </main>
        <footer>
          Super-store Management <span>Inventory · Sales · People</span>
        </footer>
      </div>
    </div>
  );
}
function Login({ onLogin }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      onLogin(await api("/users/LoginUser", { method: "POST", body }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <section className="login-art">
        <div className="brand">
          <span className="brand-icon">
            <Store />
          </span>
          <span>
            Super-store<small>MANAGEMENT</small>
          </span>
        </div>
        <div className="login-copy">
          <span className="eyebrow">LESS FRICTION. MORE BUSINESS.</span>
          <h1>
            Everything your
            <br />
            store needs.
            <br />
            <em>In one place.</em>
          </h1>
          <p>
            From the first delivery to the last sale.
            <br />
            Keep your team, inventory, and numbers connected.
          </p>
          <div className="login-features">
            <span>
              <Package size={18} /> Inventory that stays in sync
            </span>
            <span>
              <ShoppingCart size={18} /> A smoother checkout
            </span>
            <span>
              <BarChart3 size={18} /> Numbers you can trust
            </span>
          </div>
        </div>
        <small>Built for the everyday work of running a store.</small>
      </section>
      <section className="login-form">
        <div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Let’s get to work.</h2>
          <p>Sign in with your staff account.</p>
          <form onSubmit={login}>
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                placeholder="you@yourstore.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
              />
            </label>
            {error && <Notice error>{error}</Notice>}
            <button className="primary" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to your workspace"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="muted">
            Need an account? Ask your store administrator.
          </p>
        </div>
      </section>
    </div>
  );
}
function Overview({ request, user, go }) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    request(admin(user) ? "/reports/dashboard-summary" : "/products?limit=5")
      .then((r) => {
        if (live) setData(r);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  if (error) return <Notice error>{error}</Notice>;
  if (!data) return <div className="loading">Loading your workspace…</div>;
  const summary = data.summary;
  return (
    <>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">MAKE TODAY A GOOD DAY</span>
          <h2>Welcome back, {user.name.split(" ")[0]}.</h2>
          <p>Your next sale starts with a well-run store.</p>
          <button onClick={() => go("pos")}>
            Open point of sale <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="banner-icon">
          <Store size={94} strokeWidth={1} />
          <span>READY FOR BUSINESS</span>
        </div>
      </div>
      {summary && (
        <div className="stats">
          {[
            ["Today’s revenue", money(summary.todayRevenue), ShoppingCart],
            ["Sales today", summary.todayTransactionsCount, BarChart3],
            ["Active products", summary.totalActiveProducts, Package],
            ["Low-stock alerts", summary.lowStockAlertsCount, AlertTriangle],
          ].map(([label, value, Icon]) => (
            <div className="stat" key={label}>
              <div>
                {label}
                <Icon size={18} />
              </div>
              <strong>{value}</strong>
              <small>
                {label === "Low-stock alerts"
                  ? "Time to check your shelves"
                  : "From your store records"}
              </small>
            </div>
          ))}
        </div>
      )}
      <div className="two-col">
        <section className="panel">
          <div className="panel-heading">
            <h2>Quick actions</h2>
            <span>KEEP THINGS MOVING</span>
          </div>
          <div className="quick-actions">
            {[
              [
                "products",
                "Manage inventory",
                "Products, pricing and stock",
                Package,
              ],
              ["pos", "Start a sale", "Create your next receipt", ShoppingCart],
              ...(stock(user)
                ? [
                    [
                      "restock",
                      "Receive a delivery",
                      "Keep shelves stocked",
                      Truck,
                    ],
                    [
                      "reports",
                      "Explore reports",
                      "Find your next opportunity",
                      BarChart3,
                    ],
                  ]
                : []),
            ].map(([key, title, desc, Icon]) => (
              <button key={key} onClick={() => go(key)}>
                <span className="action-icon">
                  <Icon size={21} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>{summary ? "Store snapshot" : "Inventory snapshot"}</h2>
            <span>AT A GLANCE</span>
          </div>
          {summary ? (
            <div className="snapshot">
              <div>
                <span>All-time revenue</span>
                <strong>{money(summary.allTimeRevenue)}</strong>
              </div>
              <div>
                <span>Total receipts</span>
                <strong>{summary.allTimeSalesCount}</strong>
              </div>
              <div>
                <span>Perishables expiring soon</span>
                <strong>{summary.expiringPerishablesCount}</strong>
              </div>
            </div>
          ) : (
            <div className="snapshot">
              {data.data.map((p) => (
                <div key={p._id}>
                  <span>{p.name}</span>
                  <strong>
                    {p.quantity} {p.unit}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function Products({ request, user }) {
  const [result, setResult] = useState(null),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [page, setPage] = useState(1),
    [dialog, setDialog] = useState(null),
    [suppliers, setSuppliers] = useState([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(() => {
    setError("");
    return request(
      "/products?" + new URLSearchParams({ search, category, page, limit: 20 }),
    )
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [search, category, page, request]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    if (stock(user))
      request("/suppliers")
        .then((r) => setSuppliers(r.data))
        .catch((e) => setError(e.message));
  }, []);
  const done = () => {
    setDialog(null);
    setNotice("Inventory updated successfully");
    load();
  };
  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Search products"
            placeholder="Search products, barcodes or SKU…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filter category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {stock(user) && (
          <button className="primary" onClick={() => setDialog({})}>
            <Plus size={17} /> Add product
          </button>
        )}
      </div>
      {error && <Notice error>{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}
      <section className="panel table-panel">
        <div className="panel-heading">
          <h2>Product catalogue</h2>
          <span>{result?.pagination.totalProducts ?? "…"} PRODUCTS</span>
        </div>
        {!result ? (
          <div className="loading">Loading inventory…</div>
        ) : !result.data.length ? (
          <Empty>No products found. Add a product or change your search.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Selling price</th>
                  <th>Status</th>
                  {stock(user) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {result.data.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="product-name">
                        <span className="product-thumb">
                          {p.image?.endsWith(".webp") ? (
                            <img src={"/" + p.image} alt="" />
                          ) : (
                            <Package size={19} />
                          )}
                        </span>
                        <span>
                          <strong>{p.name}</strong>
                          <small>{p.barcode}</small>
                        </span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      {p.quantity} <span className="muted">{p.unit}</span>
                    </td>
                    <td>{money(p.sellingPrice)}</td>
                    <td>
                      <span
                        className={
                          "badge " +
                          (p.quantity <= p.reorderLevel ? "warning" : "")
                        }
                      >
                        {p.quantity <= p.reorderLevel
                          ? "Low stock"
                          : "In stock"}
                      </span>
                    </td>
                    {stock(user) && (
                      <td>
                        <button
                          className="icon"
                          aria-label={"Edit " + p.name}
                          onClick={() => setDialog(p)}
                        >
                          <Pencil size={16} />
                        </button>
                        {admin(user) && (
                          <button
                            className="icon danger"
                            aria-label={"Archive " + p.name}
                            onClick={() => setDialog({ archive: p })}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={result?.pagination} onPage={setPage} />
      </section>
      {dialog && (
        <Dialog
          title={
            dialog.archive
              ? "Archive product"
              : dialog._id
                ? "Edit product"
                : "Add product"
          }
          onClose={() => setDialog(null)}
        >
          {dialog.archive ? (
            <>
              <p>
                Archive {dialog.archive.name}? Sales history will be preserved.
              </p>
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await request("/products/" + dialog.archive._id, {
                      method: "DELETE",
                    });
                    done();
                  } catch (e) {
                    setError(e.message);
                    setDialog(null);
                  }
                }}
              >
                Archive product
              </button>
            </>
          ) : (
            <Form
              fields={productFields}
              initial={dialog}
              suppliers={suppliers}
              submit={(body) =>
                request("/products/" + (dialog._id || "CreateProduct"), {
                  method: dialog._id ? "PUT" : "POST",
                  body,
                })
              }
              onDone={done}
            />
          )}
        </Dialog>
      )}
    </>
  );
}
function POS({ request }) {
  const [search, setSearch] = useState(""),
    [products, setProducts] = useState([]),
    [cart, setCart] = useState([]),
    [payment, setPayment] = useState("Cash"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState(null);
  useEffect(() => {
    const t = setTimeout(
      () =>
        request("/products?" + new URLSearchParams({ search, limit: 50 }))
          .then((r) => setProducts(r.data))
          .catch((e) => setError(e.message)),
      200,
    );
    return () => clearTimeout(t);
  }, [search]);
  const add = (p) => {
    setError("");
    setCart((items) => {
      const existing = items.find((i) => i._id === p._id);
      if ((existing?.count || 0) >= p.quantity) {
        setError("No more stock available for " + p.name);
        return items;
      }
      return existing
        ? items.map((i) => (i._id === p._id ? { ...i, count: i.count + 1 } : i))
        : [...items, { ...p, count: 1 }];
    });
  };
  const total = cart.reduce((sum, p) => sum + p.sellingPrice * p.count, 0);
  async function checkout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await request("/sales/checkout", {
        method: "POST",
        body: {
          items: cart.map((p) => ({ productId: p._id, quantity: p.count })),
          paymentMethod: payment,
        },
      });
      setReceipt(r.receipt);
      setCart([]);
      const r2 = await request("/products?limit=50");
      setProducts(r2.data);
      setSearch("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="pos-layout">
        <section>
          <div className="search">
            <Search size={18} />
            <input
              aria-label="Search or scan barcode"
              placeholder="Search a product or scan a barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  try {
                    add(
                      (
                        await request(
                          "/products/barcode/" + encodeURIComponent(search),
                        )
                      ).product,
                    );
                    setSearch("");
                  } catch (e) {
                    setError(e.message);
                  }
                }
              }}
            />
          </div>
          <div className="product-grid">
            {products.map((p) => (
              <button
                className="product-card"
                disabled={!p.quantity}
                key={p._id}
                onClick={() => add(p)}
              >
                <div className="card-picture">
                  {p.image?.endsWith(".webp") ? (
                    <img src={"/" + p.image} alt="" />
                  ) : (
                    <Package size={40} strokeWidth={1.3} />
                  )}
                  <span className="category">{p.category}</span>
                </div>
                <strong>{p.name}</strong>
                <small>
                  {p.quantity} {p.unit} available
                </small>
                <div>
                  {money(p.sellingPrice)}
                  <Plus size={18} />
                </div>
              </button>
            ))}
          </div>
          {!products.length && <Empty>No matching products.</Empty>}
        </section>
        <section className="panel cart">
          <div className="panel-heading">
            <h2>Current sale</h2>
            <span>{cart.length} ITEMS</span>
          </div>
          {!cart.length ? (
            <Empty>Your cart is ready for its first item.</Empty>
          ) : (
            cart.map((p) => (
              <div className="cart-item" key={p._id}>
                <div>
                  <strong>{p.name}</strong>
                  <small>{money(p.sellingPrice)} each</small>
                </div>
                <input
                  aria-label={"Quantity for " + p.name}
                  type="number"
                  min="1"
                  max={p.quantity}
                  value={p.count}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    if (
                      Number.isInteger(count) &&
                      count > 0 &&
                      count <= p.quantity
                    )
                      setCart(
                        cart.map((i) =>
                          i._id === p._id ? { ...i, count } : i,
                        ),
                      );
                  }}
                />
                <button
                  className="icon danger"
                  aria-label={"Remove " + p.name}
                  onClick={() => setCart(cart.filter((i) => i._id !== p._id))}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
          <div className="cart-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <label>
            Payment method
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            >
              {["Cash", "Card", "Mobile Transfer", "POS"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          {error && <Notice error>{error}</Notice>}
          <button
            className="primary"
            disabled={!cart.length || busy}
            onClick={checkout}
          >
            {busy ? "Processing…" : "Complete sale"}
            <ArrowUpRight size={17} />
          </button>
          <small className="muted">
            Prices and stock are confirmed at checkout.
          </small>
        </section>
      </div>
      {receipt && (
        <Dialog title="Sale completed" onClose={() => setReceipt(null)}>
          <Receipt receipt={receipt} />
        </Dialog>
      )}
    </>
  );
}
function Receipt({ receipt }) {
  return (
    <div className="receipt">
      <h3>Super-store Management</h3>
      <p>{receipt.receiptNumber}</p>
      <small>{date(receipt.createdAt)}</small>
      {receipt.items.map((p, i) => (
        <div key={i}>
          <span>
            {p.name} × {p.quantity}
          </span>
          <strong>{money(p.subTotal)}</strong>
        </div>
      ))}
      <div className="receipt-total">
        <span>Total · {receipt.paymentMethod}</span>
        <strong>{money(receipt.totalAmount)}</strong>
      </div>
      <button className="primary no-print" onClick={() => window.print()}>
        <Printer size={17} /> Print receipt
      </button>
    </div>
  );
}
function Suppliers({ request, user }) {
  const [data, setData] = useState(null),
    [dialog, setDialog] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    request("/suppliers")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <div className="toolbar">
        <span className="muted">{data?.length || 0} supplier records</span>
        <button className="primary" onClick={() => setDialog({})}>
          <Plus size={17} /> Add supplier
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      <section className="panel table-panel">
        {!data ? (
          <div className="loading">Loading suppliers…</div>
        ) : !data.length ? (
          <Empty>Add your first supplier to start receiving deliveries.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Lead time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong>{s.companyName}</strong>
                      <small>{s.address}</small>
                    </td>
                    <td>
                      {s.contactPerson}
                      <small>{s.email}</small>
                    </td>
                    <td>{s.phone_number}</td>
                    <td>{s.leadTimeDays} days</td>
                    <td>
                      <span
                        className={"badge " + (!s.isActive ? "warning" : "")}
                      >
                        {s.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon"
                        aria-label={"Edit " + s.companyName}
                        onClick={() => setDialog(s)}
                      >
                        <Pencil size={16} />
                      </button>
                      {admin(user) && s.isActive && (
                        <button
                          className="icon danger"
                          aria-label={"Archive " + s.companyName}
                          onClick={() => setDialog({ archive: s })}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {dialog && (
        <Dialog
          title={
            dialog.archive
              ? "Archive supplier"
              : dialog._id
                ? "Edit supplier"
                : "Add supplier"
          }
          onClose={() => setDialog(null)}
        >
          {dialog.archive ? (
            <>
              <p>Archive {dialog.archive.companyName}?</p>
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await request("/suppliers/" + dialog.archive._id, {
                      method: "DELETE",
                    });
                    setDialog(null);
                    load();
                  } catch (e) {
                    setError(e.message);
                    setDialog(null);
                  }
                }}
              >
                Archive supplier
              </button>
            </>
          ) : (
            <Form
              fields={supplierFields}
              initial={dialog}
              submit={(body) =>
                request("/suppliers" + (dialog._id ? "/" + dialog._id : ""), {
                  method: dialog._id ? "PUT" : "POST",
                  body: Object.fromEntries(body),
                })
              }
              onDone={() => {
                setDialog(null);
                load();
              }}
            />
          )}
        </Dialog>
      )}
    </>
  );
}
function Restocks({ request, user }) {
  const [suppliers, setSuppliers] = useState([]),
    [products, setProducts] = useState([]),
    [history, setHistory] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [page, setPage] = useState(1),
    [dialog, setDialog] = useState(false);
  const load = () => {
    if (admin(user))
      request("/restock?page=" + page)
        .then(setHistory)
        .catch((e) => setError(e.message));
  };
  useEffect(() => {
    Promise.all([request("/suppliers"), request("/products?limit=100")])
      .then(([s, p]) => {
        setSuppliers(s.data);
        setProducts(p.data);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [page]);
  const fields = [
    ["productId", "Product", "select", true, products.map((p) => p._id)],
    ["supplierId", "Supplier", "supplier"],
    ["quantityAdded", "Quantity received", "number"],
    ["unitCost", "Unit cost", "number"],
    ["batchNumber", "Batch number", "text", false],
    ["expiryDate", "Expiry date", "date", false],
    ["notes", "Notes", "textarea", false],
  ];
  return (
    <>
      <div className="toolbar">
        <span className="muted">
          Receive a delivery and update stock in one transaction.
        </span>
        <button className="primary" onClick={() => setDialog(true)}>
          <Plus size={17} /> Receive delivery
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}
      {admin(user) ? (
        <section className="panel table-panel">
          <div className="panel-heading">
            <h2>Delivery history</h2>
          </div>
          {!history ? (
            <div className="loading">Loading deliveries…</div>
          ) : !history.data.length ? (
            <Empty>No deliveries recorded yet.</Empty>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Unit cost</th>
                    <th>Received by</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.map((r) => (
                    <tr key={r._id}>
                      <td>{date(r.createdAt)}</td>
                      <td>{r.productId?.name || "Unavailable"}</td>
                      <td>{r.supplierId?.companyName || "Unavailable"}</td>
                      <td>+{r.quantityAdded}</td>
                      <td>{money(r.unitCost)}</td>
                      <td>{r.storeKeeperId?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager pagination={history?.pagination} onPage={setPage} />
        </section>
      ) : (
        <section className="panel">
          <h2>Ready to receive stock?</h2>
          <p>
            Choose Receive delivery to record incoming inventory. Historical
            delivery records are available to management.
          </p>
        </section>
      )}
      {dialog && (
        <Dialog title="Receive a delivery" onClose={() => setDialog(false)}>
          <RestockForm
            products={products}
            suppliers={suppliers}
            request={request}
            done={() => {
              setDialog(false);
              setNotice("Delivery recorded and inventory updated");
              load();
            }}
          />
        </Dialog>
      )}
    </>
  );
}
function RestockForm({ products, suppliers, request, done }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.currentTarget));
        setBusy(true);
        try {
          await request("/restock", { method: "POST", body });
          done();
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Product
        <select name="productId" required>
          <option value="">Choose product</option>
          {products.map((p) => (
            <option value={p._id} key={p._id}>
              {p.name} · {p.quantity} in stock
            </option>
          ))}
        </select>
      </label>
      <label>
        Supplier
        <select name="supplierId" required>
          <option value="">Choose supplier</option>
          {suppliers
            .filter((s) => s.isActive)
            .map((s) => (
              <option key={s._id} value={s._id}>
                {s.companyName}
              </option>
            ))}
        </select>
      </label>
      <label>
        Quantity received
        <input name="quantityAdded" type="number" min="1" step="1" required />
      </label>
      <label>
        Unit cost
        <input name="unitCost" type="number" min="0" step="0.01" required />
      </label>
      <label>
        Batch number
        <input name="batchNumber" />
      </label>
      <label>
        Expiry date
        <input name="expiryDate" type="date" />
      </label>
      <label className="wide">
        Notes
        <textarea name="notes" />
      </label>
      {error && (
        <div className="wide">
          <Notice error>{error}</Notice>
        </div>
      )}
      <button className="primary wide" disabled={busy}>
        {busy ? "Recording…" : "Record delivery"}
      </button>
    </form>
  );
}
function Reports({ request }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [sales, setSales] = useState(null),
    [receipt, setReceipt] = useState(null);
  useEffect(() => {
    Promise.all([
      request("/reports/revenue-trend"),
      request("/reports/top-sellers"),
      request("/reports/alerts"),
    ])
      .then(([trend, top, alerts]) =>
        setData({ trend: trend.data, top: top.data, alerts: alerts.alerts }),
      )
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    request("/sales?page=" + page)
      .then(setSales)
      .catch((e) => setError(e.message));
  }, [page]);
  if (error)
    return (
      <Notice error>
        {error} If you are a Store Keeper, verify your assigned PIN on the
        Access PINs page.
      </Notice>
    );
  if (!data || !sales) return <div className="loading">Loading reports…</div>;
  const max = Math.max(1, ...data.trend.map((d) => d.dailyRevenue));
  return (
    <>
      <div className="two-col">
        <section className="panel">
          <div className="panel-heading">
            <h2>Revenue trend</h2>
            <span>LAST 30 DAYS</span>
          </div>
          {!data.trend.length ? (
            <Empty>No sales yet.</Empty>
          ) : (
            <div className="chart" role="img" aria-label="Daily sales revenue">
              {data.trend.map((d) => (
                <div
                  className="bar-column"
                  key={d._id}
                  title={d._id + ": " + money(d.dailyRevenue)}
                >
                  <span>{money(d.dailyRevenue)}</span>
                  <div
                    style={{
                      height: Math.max(3, (d.dailyRevenue / max) * 140),
                    }}
                  />
                  <small>{d._id.slice(5)}</small>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Top sellers</h2>
            <span>BY UNITS SOLD</span>
          </div>
          {!data.top.length ? (
            <Empty>No products sold yet.</Empty>
          ) : (
            data.top.map((p, i) => (
              <div className="rank-row" key={p._id}>
                <span className="rank">{i + 1}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.totalUnitsSold} units sold</small>
                </div>
                <strong>{money(p.totalRevenueGenerated)}</strong>
              </div>
            ))
          )}
        </section>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2>Low stock · {data.alerts.lowStockList.length}</h2>
          {data.alerts.lowStockList.map((p) => (
            <div className="snapshot-row" key={p._id}>
              <span>{p.name}</span>
              <span className="badge warning">{p.quantity} left</span>
            </div>
          ))}
          {!data.alerts.lowStockList.length && (
            <p className="muted">Stock levels look healthy.</p>
          )}
        </section>
        <section className="panel">
          <h2>Expiry alerts · {data.alerts.expiringList.length}</h2>
          {data.alerts.expiringList.map((p) => (
            <div className="snapshot-row" key={p._id}>
              <span>{p.name}</span>
              <span className="badge warning">
                {new Date(p.expiryDate).toLocaleDateString()}
              </span>
            </div>
          ))}
          {!data.alerts.expiringList.length && (
            <p className="muted">No upcoming expiry alerts.</p>
          )}
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <h2>Sales history</h2>
          <span>YOUR RECEIPTS</span>
        </div>
        {!sales.data.length ? (
          <Empty>No sales recorded yet.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receipt</th>
                  <th>Cashier</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {sales.data.map((s) => (
                  <tr key={s._id}>
                    <td>{date(s.createdAt)}</td>
                    <td>{s.receiptNumber.slice(0, 22)}…</td>
                    <td>{s.cashierId?.name || "Unavailable"}</td>
                    <td>{s.paymentMethod}</td>
                    <td>{money(s.totalAmount)}</td>
                    <td>
                      <button onClick={() => setReceipt(s)}>Receipt</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={sales.pagination} onPage={setPage} />
      </section>
      {receipt && (
        <Dialog title="Sales receipt" onClose={() => setReceipt(null)}>
          <Receipt receipt={receipt} />
        </Dialog>
      )}
    </>
  );
}
function Team({ request, user }) {
  const [data, setData] = useState(null),
    [dialog, setDialog] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    request("/staff")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <div className="toolbar">
        <span className="muted">Manage staff roles and account access.</span>
        <button className="primary" onClick={() => setDialog({})}>
          <Plus size={17} /> Add staff member
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      <section className="panel table-panel">
        {!data ? (
          <div className="loading">Loading team…</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.role.replaceAll("_", " ")}</td>
                    <td>
                      <span
                        className={"badge " + (!u.isActive ? "warning" : "")}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {u._id !== user.id &&
                      u._id !== user._id &&
                      u.role !== "Super_Admin" &&
                      (user.role === "Super_Admin" || u.role !== "Admin") ? (
                        <button onClick={() => setDialog({ edit: u })}>
                          Manage access
                        </button>
                      ) : (
                        <span className="muted">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {dialog && (
        <Dialog
          title={dialog.edit ? "Manage staff access" : "Add staff member"}
          onClose={() => setDialog(null)}
        >
          <Form
            fields={
              dialog.edit
                ? [
                    [
                      "role",
                      "Role",
                      "select",
                      true,
                      user.role === "Super_Admin"
                        ? ["User", "Store_Keeper", "Admin"]
                        : ["User", "Store_Keeper"],
                    ],
                    ["isActive", "Account active", "checkbox", false],
                  ]
                : staffFields.map((f) =>
                    f[0] === "role" && user.role !== "Super_Admin"
                      ? [...f.slice(0, 4), ["User", "Store_Keeper"]]
                      : f,
                  )
            }
            initial={dialog.edit || {}}
            submit={(body) =>
              request("/staff" + (dialog.edit ? "/" + dialog.edit._id : ""), {
                method: dialog.edit ? "PATCH" : "POST",
                body: dialog.edit
                  ? {
                      role: body.get("role"),
                      isActive: body.get("isActive") === "true",
                    }
                  : body,
              })
            }
            onDone={() => {
              setDialog(null);
              load();
            }}
          />
        </Dialog>
      )}
    </>
  );
}
function Access({ request, user }) {
  const [staff, setStaff] = useState([]),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (admin(user))
      request("/staff")
        .then((r) =>
          setStaff(
            r.data.filter((u) => u.role === "Store_Keeper" && u.isActive),
          ),
        )
        .catch((e) => setError(e.message));
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    if (admin(user)) body.durationSeconds = Number(body.durationSeconds) * 3600;
    try {
      setResult(
        await request("/access/" + (admin(user) ? "generate" : "verify"), {
          method: "POST",
          body,
        }),
      );
      e.target.reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel narrow">
      <div className="action-icon">
        <KeyRound size={25} />
      </div>
      <h2>
        {admin(user) ? "Authorize report access" : "Unlock your report access"}
      </h2>
      <p className="muted">
        {admin(user)
          ? "Issue a temporary PIN to a Store Keeper. The working-time allowance pauses overnight and on weekends."
          : "Enter the six-digit PIN your administrator assigned to your account."}
      </p>
      <form onSubmit={submit}>
        {admin(user) ? (
          <>
            <label>
              Store Keeper
              <select name="assignedTo" required>
                <option value="">Choose staff member</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Working hours of access
              <input
                name="durationSeconds"
                type="number"
                min="1"
                max="8"
                defaultValue="4"
                required
              />
            </label>
          </>
        ) : (
          <label>
            Access PIN
            <input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength="6"
              required
              autoComplete="off"
              placeholder="000000"
            />
          </label>
        )}
        {error && <Notice error>{error}</Notice>}
        <button className="primary" disabled={busy}>
          {busy ? "Please wait…" : admin(user) ? "Generate PIN" : "Verify PIN"}
        </button>
      </form>
      {result && (
        <div className="pin-result">
          {result.pin ? (
            <>
              <span>Share this PIN with the assigned staff member</span>
              <strong>{result.pin}</strong>
              <small>Expires {date(result.expiresAt)}</small>
            </>
          ) : (
            <Notice>
              Report access granted until {date(result.auth.expiresAt)}. Open
              Sales & reports to continue.
            </Notice>
          )}
        </div>
      )}
    </section>
  );
}
function Profile({ request, user, update }) {
  const [notice, setNotice] = useState("");
  return (
    <section className="panel narrow">
      <div className="profile-top">
        {user.avatar?.endsWith(".webp") ? (
          <img src={"/" + user.avatar} alt="Your avatar" />
        ) : (
          <span className="avatar large">{user.name[0]}</span>
        )}
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="badge">{user.role.replaceAll("_", " ")}</span>
        </div>
      </div>
      {notice && <Notice>{notice}</Notice>}
      <Form
        fields={[
          ["name", "Full name"],
          ["avatar", "Profile image", "file", false],
        ]}
        initial={user}
        submit={async (body) => {
          const r = await request("/profile", { method: "PUT", body });
          update(r.user);
          setNotice("Profile updated");
        }}
      />
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
