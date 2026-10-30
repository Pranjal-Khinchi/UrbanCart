/**
 * Seeds the PRIMARY database with categories, products, and a demo admin.
 * Run with: npm run seed   (from /server, or `npm run seed` at the repo root)
 *
 * This script ONLY touches the primary application database. It never
 * writes to the teacher/audit database.
 */
require('dotenv').config();
const path = require('path');
const { connectDatabases } = require('../config/db');

const IMG = (seed) => `https://picsum.photos/seed/${seed}/800/800`;

async function run() {
  await connectDatabases();

  // Require models only after the primary connection is open.
  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const User = require('../models/User');
  const { makeSlug } = require('../utils/slug');

  console.log('🌱 Seeding UrbanCart primary database...');

  // ---------- Categories ----------
  const categoryDefs = [
    { name: 'Electronics', description: 'Phones, audio, and everyday tech.' },
    { name: 'Fashion', description: 'Apparel and accessories for everyone.' },
    { name: 'Home & Kitchen', description: 'Cookware, decor, and household essentials.' },
    { name: 'Beauty & Personal Care', description: 'Skincare, haircare, and grooming.' },
    { name: 'Sports & Fitness', description: 'Gear for an active lifestyle.' },
    { name: 'Books & Stationery', description: 'Reads and everyday stationery.' },
  ];

  const categories = {};
  for (const def of categoryDefs) {
    const slug = makeSlug(def.name);
    const doc = await Category.findOneAndUpdate(
      { slug },
      { name: def.name, slug, description: def.description, image: IMG(slug) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categories[def.name] = doc;
  }
  console.log(`  ✔ ${Object.keys(categories).length} categories ready`);

  // ---------- Products ----------
  const productDefs = [
    { name: 'Wireless Over-Ear Headphones', category: 'Electronics', brand: 'SoundWave', price: 2499, originalPrice: 3499, stock: 40, featured: true, tags: ['audio', 'wireless', 'headphones'] },
    { name: 'True Wireless Earbuds Pro', category: 'Electronics', brand: 'SoundWave', price: 1799, originalPrice: 2299, stock: 60, featured: true, tags: ['audio', 'earbuds'] },
    { name: '65W Fast Charging Power Bank 20000mAh', category: 'Electronics', brand: 'VoltEdge', price: 1299, originalPrice: 1799, stock: 80, featured: false, tags: ['charging', 'power bank'] },
    { name: 'Smart Fitness Watch Series 5', category: 'Electronics', brand: 'PulseFit', price: 3299, originalPrice: 4499, stock: 25, featured: true, tags: ['wearable', 'smartwatch'] },
    { name: 'Mechanical Gaming Keyboard RGB', category: 'Electronics', brand: 'KeyForge', price: 2899, originalPrice: 3599, stock: 35, featured: false, tags: ['gaming', 'keyboard'] },
    { name: 'Portable Bluetooth Speaker', category: 'Electronics', brand: 'SoundWave', price: 1499, originalPrice: 1999, stock: 50, featured: false, tags: ['audio', 'speaker'] },
    { name: 'Men\u2019s Slim Fit Cotton Shirt', category: 'Fashion', brand: 'UrbanThread', price: 899, originalPrice: 1299, stock: 100, featured: true, tags: ['men', 'shirt'] },
    { name: 'Women\u2019s Floral Summer Dress', category: 'Fashion', brand: 'Aurelia', price: 1199, originalPrice: 1699, stock: 70, featured: true, tags: ['women', 'dress'] },
    { name: 'Unisex Denim Jacket', category: 'Fashion', brand: 'UrbanThread', price: 1999, originalPrice: 2799, stock: 45, featured: false, tags: ['jacket', 'denim'] },
    { name: 'Classic Leather Sneakers', category: 'Fashion', brand: 'StrideCo', price: 2299, originalPrice: 2999, stock: 55, featured: true, tags: ['shoes', 'sneakers'] },
    { name: 'Everyday Canvas Tote Bag', category: 'Fashion', brand: 'CarryAll', price: 599, originalPrice: 899, stock: 90, featured: false, tags: ['bag', 'accessories'] },
    { name: 'Non-Stick Cookware Set (5 Pieces)', category: 'Home & Kitchen', brand: 'HomeCraft', price: 2199, originalPrice: 2999, stock: 30, featured: true, tags: ['kitchen', 'cookware'] },
    { name: 'Ceramic Dinner Set (16 Pieces)', category: 'Home & Kitchen', brand: 'TableTales', price: 1899, originalPrice: 2599, stock: 28, featured: false, tags: ['dinnerware'] },
    { name: 'Aromatic Scented Candle Set', category: 'Home & Kitchen', brand: 'CozyGlow', price: 499, originalPrice: 749, stock: 120, featured: false, tags: ['decor', 'candles'] },
    { name: 'Memory Foam Pillow (Pack of 2)', category: 'Home & Kitchen', brand: 'RestWell', price: 899, originalPrice: 1299, stock: 65, featured: false, tags: ['bedding', 'pillow'] },
    { name: 'Stainless Steel Water Bottle 1L', category: 'Home & Kitchen', brand: 'HydroLife', price: 449, originalPrice: 649, stock: 150, featured: false, tags: ['bottle', 'hydration'] },
    { name: 'Vitamin C Brightening Face Serum', category: 'Beauty & Personal Care', brand: 'GlowLab', price: 699, originalPrice: 999, stock: 85, featured: true, tags: ['skincare', 'serum'] },
    { name: 'Herbal Shampoo & Conditioner Combo', category: 'Beauty & Personal Care', brand: 'NatureRoots', price: 549, originalPrice: 799, stock: 95, featured: false, tags: ['haircare'] },
    { name: 'Electric Trimmer & Grooming Kit', category: 'Beauty & Personal Care', brand: 'GroomPro', price: 1299, originalPrice: 1799, stock: 40, featured: false, tags: ['grooming'] },
    { name: 'SPF 50 Sunscreen Gel', category: 'Beauty & Personal Care', brand: 'GlowLab', price: 399, originalPrice: 549, stock: 110, featured: false, tags: ['skincare', 'sunscreen'] },
    { name: 'Yoga Mat with Carry Strap', category: 'Sports & Fitness', brand: 'FlexCore', price: 799, originalPrice: 1099, stock: 75, featured: true, tags: ['yoga', 'fitness'] },
    { name: 'Adjustable Dumbbell Set 10kg', category: 'Sports & Fitness', brand: 'IronGrit', price: 1999, originalPrice: 2699, stock: 30, featured: false, tags: ['strength', 'dumbbell'] },
    { name: 'Running Shoes Air Cushion', category: 'Sports & Fitness', brand: 'StrideCo', price: 2599, originalPrice: 3399, stock: 48, featured: true, tags: ['running', 'shoes'] },
    { name: 'Resistance Bands Set (5 Levels)', category: 'Sports & Fitness', brand: 'FlexCore', price: 499, originalPrice: 699, stock: 100, featured: false, tags: ['resistance', 'training'] },
    { name: 'Insulated Sports Water Bottle 750ml', category: 'Sports & Fitness', brand: 'HydroLife', price: 549, originalPrice: 749, stock: 90, featured: false, tags: ['bottle', 'sports'] },
    { name: 'Bestselling Fiction Novel Box Set', category: 'Books & Stationery', brand: 'PageTurner', price: 1099, originalPrice: 1499, stock: 40, featured: true, tags: ['books', 'fiction'] },
    { name: 'Premium Hardcover Notebook (Set of 3)', category: 'Books & Stationery', brand: 'InkWell', price: 449, originalPrice: 649, stock: 130, featured: false, tags: ['notebook', 'stationery'] },
    { name: 'Fountain Pen Gift Set', category: 'Books & Stationery', brand: 'InkWell', price: 799, originalPrice: 1099, stock: 55, featured: false, tags: ['pen', 'gift'] },
  ];

  let created = 0;
  let updated = 0;

  for (const def of productDefs) {
    const category = categories[def.category];
    if (!category) continue;

    const slug = makeSlug(def.name);
    const seedKey = slug;

    const doc = {
      name: def.name,
      slug,
      description: `${def.name} from ${def.brand}. A ${def.category.toLowerCase()} favorite trusted by UrbanCart shoppers for everyday quality and reliable performance.`,
      price: def.price,
      originalPrice: def.originalPrice,
      category: category._id,
      brand: def.brand,
      images: [IMG(seedKey), IMG(`${seedKey}-2`)],
      stock: def.stock,
      rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 120),
      featured: def.featured,
      tags: def.tags,
      specifications: [
        { key: 'Brand', value: def.brand },
        { key: 'Category', value: def.category },
      ],
      isActive: true,
    };

    const result = await Product.findOneAndUpdate({ slug }, doc, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created += 1;
    else updated += 1;
  }
  console.log(`  ✔ ${productDefs.length} products seeded (created/updated as needed)`);

  // ---------- Demo admin ----------
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!existingAdmin) {
      await User.create({
        name: 'UrbanCart Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`  ✔ Demo admin created: ${adminEmail}`);
    } else if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`  ✔ Existing user ${adminEmail} promoted to admin`);
    } else {
      console.log(`  ✔ Demo admin already exists: ${adminEmail}`);
    }
  } else {
    console.log('  ⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping demo admin creation.');
  }

  console.log('\n✅ Seeding complete.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
