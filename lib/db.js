import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const TABLES = ["users", "products", "bids", "orders", "comments", "requests"];

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: [],
      products: [],
      bids: [],
      orders: [],
      comments: [],
      requests: [],
      nextId: { users: 1, products: 1, bids: 1, orders: 1, comments: 1, requests: 1 },
    };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

/**
 * Fills in tables a db.json written by an older version of the app is missing,
 * so adding a table never means having to re-seed and lose existing data.
 */
function normalize(db) {
  db.nextId = db.nextId || {};
  for (const table of TABLES) {
    if (!Array.isArray(db[table])) db[table] = [];
    if (typeof db.nextId[table] !== "number") {
      const maxId = db[table].reduce((max, row) => Math.max(max, row.id || 0), 0);
      db.nextId[table] = maxId + 1;
    }
  }
  return db;
}

export function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return normalize(JSON.parse(raw));
}

export function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function nextId(db, table) {
  const id = db.nextId[table];
  db.nextId[table] += 1;
  return id;
}

/**
 * Computes the minimum (starting) price from cost + margin.
 * This is the one calculation the whole bidding system hangs on.
 */
export function computeMinPrice(costPrice, marginPercent) {
  const cost = Number(costPrice);
  const margin = Number(marginPercent);
  const min = cost + cost * (margin / 100);
  return Math.round(min * 100) / 100;
}

/**
 * Closes any auctions whose end_time has passed:
 * - marks status "ended"
 * - if there's a highest bidder, creates an order awaiting payment
 * - if there's no bid at all, marks it "unsold"
 * Called lazily whenever product lists/detail are read, so no real
 * cron/server process is required for this prototype.
 */
export function closeExpiredAuctions() {
  const db = readDb();
  const now = Date.now();
  let changed = false;

  for (const p of db.products) {
    if (p.status === "active" && new Date(p.end_time).getTime() <= now) {
      changed = true;
      if (p.current_highest_bid && p.highest_bidder_id) {
        p.status = "ended_sold";
        const order = {
          id: nextId(db, "orders"),
          product_id: p.id,
          user_id: p.highest_bidder_id,
          final_price: p.current_highest_bid,
          payment_status: "awaiting_payment",
          order_status: "pending",
          created_at: new Date().toISOString(),
        };
        db.orders.push(order);
      } else {
        p.status = "ended_unsold";
      }
    }
  }

  if (changed) writeDb(db);
  return db;
}
