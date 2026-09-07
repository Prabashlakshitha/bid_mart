const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function computeMinPrice(cost, marginPercent) {
  const min = cost + cost * (marginPercent / 100);
  return Math.round(min * 100) / 100;
}

async function seed() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const buyerPasswordHash = await bcrypt.hash("buyer123", 10);

  const now = Date.now();
  const hours = (h) => new Date(now + h * 60 * 60 * 1000).toISOString();

  const db = {
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@bidmart.test",
        password_hash: adminPasswordHash,
        role: "admin",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Demo Buyer",
        email: "buyer@bidmart.test",
        password_hash: buyerPasswordHash,
        role: "user",
        created_at: new Date().toISOString(),
      },
    ],
    products: [
      {
        id: 1,
        title: "Vintage Leica M3 Camera",
        description:
          "Classic 1958 rangefinder camera, fully serviced. Body shows honest brassing, glass is clean with no fungus.",
        image_url:
          "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800&q=80",
        cost_price: 45000,
        margin_percent: 20,
        min_price: computeMinPrice(45000, 20),
        current_highest_bid: null,
        highest_bidder_id: null,
        bid_increment: 500,
        start_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
        end_time: hours(48),
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Handwoven Kandyan Silk Saree",
        description:
          "Traditional handloom silk saree with gold-thread border, made by a heritage weaving cooperative.",
        image_url:
          "https://images.unsplash.com/photo-1610030181087-540f829eb849?w=800&q=80",
        cost_price: 18000,
        margin_percent: 25,
        min_price: computeMinPrice(18000, 25),
        current_highest_bid: null,
        highest_bidder_id: null,
        bid_increment: 250,
        start_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
        end_time: hours(6),
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        title: "Mid-Century Teak Armchair",
        description:
          "Solid teak frame armchair restored with new cushioning. Minor patina consistent with age.",
        image_url:
          "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
        cost_price: 22000,
        margin_percent: 18,
        min_price: computeMinPrice(22000, 18),
        current_highest_bid: null,
        highest_bidder_id: null,
        bid_increment: 300,
        start_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
        end_time: hours(72),
        status: "active",
        created_at: new Date().toISOString(),
      },
    ],
    bids: [],
    orders: [],
    comments: [
      {
        id: 1,
        product_id: 2,
        user_id: 2,
        author_name: "Demo Buyer",
        body:
          "I've seen this weaver's work before — the gold thread is real zari, not synthetic. The border pattern is a traditional Kandyan motif.",
        image_url: "",
        image_path: "",
        created_at: new Date(now - 30 * 60 * 1000).toISOString(),
      },
    ],
    requests: [],
    nextId: { users: 3, products: 4, bids: 1, orders: 1, comments: 2, requests: 1 },
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log("Seeded database at", DB_PATH);
  console.log("Admin login:  admin@bidmart.test / admin123");
  console.log("Buyer login:  buyer@bidmart.test / buyer123");
}

seed();
