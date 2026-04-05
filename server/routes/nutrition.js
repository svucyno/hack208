const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const FoodNutrition = require('../models/FoodNutrition');
const { Op } = require('sequelize');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Upload Nutrition Data (XLSX or CSV)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    let data = [];

    if (req.file.originalname.endsWith('.xlsx') || req.file.originalname.endsWith('.xls')) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (req.file.originalname.endsWith('.csv')) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({
            mapHeaders: ({ header }) =>
              // Strip BOM and trim whitespace from headers
              header.replace(/^\uFEFF/, '').trim().toLowerCase()
          }))
          .on('data', (row) => data.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Invalid file format. Please upload XLSX or CSV.' });
    }

    console.log(`[Upload] Raw rows parsed: ${data.length}`);
    if (data.length > 0) {
      console.log('[Upload] Sample row keys:', Object.keys(data[0]));
      console.log('[Upload] Sample row:', data[0]);
    }

    // Standardize and Upsert Data
    const formattedData = data.map((item, idx) => {
      // Normalize keys for case-insensitive matching
      const normalizedItem = {};
      Object.keys(item).forEach(k => {
        normalizedItem[k.toLowerCase().trim()] = item[k];
      });

      const findValue = (keys) => {
        const key = Object.keys(normalizedItem).find(k =>
          keys.some(search => k.includes(search.toLowerCase()))
        );
        return key ? normalizedItem[key] : null;
      };

      const parseNum = (val) => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') return val;
        // Handle strings like "200 kcal", "12.5g", "< 1"
        const match = val.toString().replace(/,/g, '').match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : null;
      };

      // Expanded column name variants (all lowercase because we normalized)
      // Note: findValue does substring matching, so "energy (kcal)" matches "energy"
      // and "item name" matches "item", etc.
      const name   = findValue(['name', 'food', 'item', 'description', 'ingredient', 'product', 'meal', 'dish', 'title']);
      const calRaw = findValue(['calorie', 'kcal', 'energy', 'cal', 'cals', 'calories']);
      const proRaw = findValue(['protein', 'prot', 'pro']);
      const carbRaw = findValue(['carb', 'carbohydrate', 'cho', 'sugar', 'starch']);
      const fatRaw  = findValue(['fat', 'lipid', 'oil']);
      const srvRaw  = findValue(['serving', 'portion', 'amount', 'quantity', 'weight', 'size']);
      const catRaw  = findValue(['category', 'type', 'group', 'class', 'section']);

      const calories = parseNum(calRaw);
      const protein  = parseNum(proRaw) ?? 0;
      const carbs    = parseNum(carbRaw) ?? 0;
      const fats     = parseNum(fatRaw) ?? 0;

      const cleanName = (name || '').toString().toLowerCase().trim();

      if (!cleanName) {
        console.log(`[Upload] Row ${idx + 1} skipped: no food name found.`);
        console.log(`[Upload]   Available keys: ${Object.keys(normalizedItem).join(' | ')}`);
        console.log(`[Upload]   Row values:`, JSON.stringify(normalizedItem));
        return null;
      }
      if (calories === null || isNaN(calories)) {
        console.log(`[Upload] Row ${idx + 1} ("${cleanName}") skipped: calories not found or unparseable.`);
        console.log(`[Upload]   calRaw="${calRaw}"  Available keys: ${Object.keys(normalizedItem).join(' | ')}`);
        return null;
      }

      return {
        name: cleanName,
        calories,
        protein,
        carbs,
        fats,
        servingSize: srvRaw ? srvRaw.toString().trim() : '100g',
        category:    catRaw ? catRaw.toString().trim() : 'General'
      };
    }).filter(Boolean); // remove nulls

    console.log(`[Upload] Valid rows after parsing: ${formattedData.length}`);

    if (formattedData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: 'No valid rows found in your file. Please check that your columns include a food name and calorie values.'
      });
    }

    let upserted = 0;
    let skipped = 0;
    for (const item of formattedData) {
      try {
        // Use findOne + update/create instead of upsert() — more reliable with SQLite
        const existing = await FoodNutrition.findOne({ where: { name: item.name } });
        if (existing) {
          await existing.update(item);
        } else {
          await FoodNutrition.create(item);
        }
        upserted++;
        console.log(`[Upload] ✅ Saved: "${item.name}" (${item.calories} kcal)`);
      } catch (rowErr) {
        skipped++;
        console.error(`[Upload] ❌ Failed to save "${item.name}":`, rowErr.message);
      }
    }

    console.log(`[Upload] Done — ${upserted} saved, ${skipped} skipped.`);
    fs.unlinkSync(filePath);
    res.json({ message: `${upserted} food items updated successfully!${skipped > 0 ? ` (${skipped} skipped due to errors)` : ''}` });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Failed to process file: ' + err.message });
  }
});


// Search Nutrition Data
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Missing query' });

    const lowerQuery = query.toLowerCase().trim();
    
    // Extract quantity if present (e.g., "2 eggs", "100g rice")
    let quantity = 1;
    let foodName = lowerQuery;
    const match = lowerQuery.match(/^(\d+(\.\d+)?)\s*(.*)$/);
    if (match) {
      quantity = parseFloat(match[1]);
      foodName = match[3].trim();
    }

    // Try exact match first
    let food = await FoodNutrition.findOne({
      where: { name: foodName }
    });

    // If not found, try partial match
    if (!food) {
      food = await FoodNutrition.findOne({
        where: { name: { [Op.like]: `%${foodName}%` } }
      });
    }

    if (!food) {
      return res.status(404).json({ message: `I couldn't find nutrition data for '${foodName}'.` });
    }

    const result = {
      name: food.name,
      calories: (food.calories * quantity).toFixed(1),
      protein: (food.protein * quantity).toFixed(1),
      carbs: (food.carbs * quantity).toFixed(1),
      fats: (food.fats * quantity).toFixed(1),
      servingSize: food.servingSize,
      quantity,
      originalName: food.name
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Built-in food calorie dictionary (fallback) ─────────────────────────────
// Values are per 100g unless noted via servingHint
const FOOD_DICT = {
  // Grains & Staples
  rice: { cal: 130, serving: '1 cup (cooked, ~200g)', scale: 2 },
  'white rice': { cal: 130, serving: '1 cup cooked (~200g)', scale: 2 },
  'brown rice': { cal: 111, serving: '1 cup cooked (~195g)', scale: 1.95 },
  bread: { cal: 265, serving: '1 slice (~30g)', scale: 0.3 },
  'white bread': { cal: 265, serving: '1 slice (~30g)', scale: 0.3 },
  'wheat bread': { cal: 247, serving: '1 slice (~28g)', scale: 0.28 },
  chapati: { cal: 297, serving: '1 piece (~40g)', scale: 0.4 },
  roti: { cal: 297, serving: '1 piece (~40g)', scale: 0.4 },
  naan: { cal: 310, serving: '1 piece (~90g)', scale: 0.9 },
  pasta: { cal: 158, serving: '1 cup cooked (~140g)', scale: 1.4 },
  noodles: { cal: 138, serving: '1 cup cooked (~160g)', scale: 1.6 },
  oats: { cal: 389, serving: '1/2 cup dry (~40g)', scale: 0.4 },
  oatmeal: { cal: 71, serving: '1 cup cooked (~234g)', scale: 2.34 },
  cornflakes: { cal: 357, serving: '1 bowl (~30g)', scale: 0.3 },
  poha: { cal: 333, serving: '1 cup dry (~100g)', scale: 1 },
  idli: { cal: 39, serving: '1 piece (~40g)', scale: 0.4 },
  dosa: { cal: 133, serving: '1 medium dosa (~90g)', scale: 0.9 },
  upma: { cal: 170, serving: '1 cup (~200g)', scale: 2 },

  // Proteins
  egg: { cal: 155, serving: '1 egg (~50g)', scale: 0.5 },
  eggs: { cal: 155, serving: 'per egg (~50g)', scale: 0.5 },
  'boiled egg': { cal: 155, serving: '1 egg (~50g)', scale: 0.5 },
  'fried egg': { cal: 196, serving: '1 egg (~46g)', scale: 0.46 },
  chicken: { cal: 165, serving: '100g', scale: 1 },
  'chicken breast': { cal: 165, serving: '100g', scale: 1 },
  'chicken curry': { cal: 175, serving: '1 cup (~200g)', scale: 2 },
  'grilled chicken': { cal: 165, serving: '100g', scale: 1 },
  'chicken biryani': { cal: 200, serving: '1 cup (~200g)', scale: 2 },
  mutton: { cal: 294, serving: '100g', scale: 1 },
  beef: { cal: 250, serving: '100g', scale: 1 },
  fish: { cal: 136, serving: '100g fillet', scale: 1 },
  salmon: { cal: 208, serving: '100g', scale: 1 },
  tuna: { cal: 132, serving: '100g', scale: 1 },
  prawn: { cal: 99, serving: '100g', scale: 1 },
  shrimp: { cal: 99, serving: '100g', scale: 1 },
  tofu: { cal: 76, serving: '100g', scale: 1 },
  paneer: { cal: 265, serving: '100g', scale: 1 },

  // Dairy
  milk: { cal: 42, serving: '1 cup (240ml)', scale: 2.4 },
  'whole milk': { cal: 61, serving: '1 cup (240ml)', scale: 2.4 },
  'skim milk': { cal: 34, serving: '1 cup (240ml)', scale: 2.4 },
  curd: { cal: 60, serving: '1 cup (~245g)', scale: 2.45 },
  yogurt: { cal: 59, serving: '1 cup (~245g)', scale: 2.45 },
  'greek yogurt': { cal: 59, serving: '100g', scale: 1 },
  cheese: { cal: 402, serving: '1 slice (~25g)', scale: 0.25 },
  butter: { cal: 717, serving: '1 tbsp (~14g)', scale: 0.14 },
  ghee: { cal: 900, serving: '1 tbsp (~13g)', scale: 0.13 },
  cream: { cal: 292, serving: '2 tbsp (~30g)', scale: 0.3 },

  // Fruits
  apple: { cal: 52, serving: '1 medium apple (~182g)', scale: 1.82 },
  banana: { cal: 89, serving: '1 medium banana (~118g)', scale: 1.18 },
  orange: { cal: 47, serving: '1 medium orange (~131g)', scale: 1.31 },
  mango: { cal: 60, serving: '1 cup sliced (~165g)', scale: 1.65 },
  grapes: { cal: 62, serving: '1 cup (~92g)', scale: 0.92 },
  watermelon: { cal: 30, serving: '2 cups (~280g)', scale: 2.8 },
  strawberry: { cal: 32, serving: '1 cup (~152g)', scale: 1.52 },
  pineapple: { cal: 50, serving: '1 cup chunks (~165g)', scale: 1.65 },
  papaya: { cal: 43, serving: '1 cup (~145g)', scale: 1.45 },
  guava: { cal: 68, serving: '1 medium (~90g)', scale: 0.9 },

  // Vegetables
  potato: { cal: 77, serving: '1 medium (~150g)', scale: 1.5 },
  'sweet potato': { cal: 86, serving: '1 medium (~130g)', scale: 1.3 },
  tomato: { cal: 18, serving: '1 medium (~123g)', scale: 1.23 },
  onion: { cal: 40, serving: '1 medium (~110g)', scale: 1.1 },
  spinach: { cal: 23, serving: '1 cup (~30g)', scale: 0.3 },
  broccoli: { cal: 34, serving: '1 cup (~91g)', scale: 0.91 },
  carrot: { cal: 41, serving: '1 medium (~61g)', scale: 0.61 },
  cucumber: { cal: 16, serving: '1 cup sliced (~119g)', scale: 1.19 },
  cabbage: { cal: 25, serving: '1 cup shredded (~90g)', scale: 0.9 },
  cauliflower: { cal: 25, serving: '1 cup (~107g)', scale: 1.07 },
  corn: { cal: 86, serving: '1 ear (~90g)', scale: 0.9 },
  peas: { cal: 81, serving: '1/2 cup (~80g)', scale: 0.8 },

  // Legumes & Dal
  dal: { cal: 116, serving: '1 cup cooked (~198g)', scale: 1.98 },
  lentils: { cal: 116, serving: '1 cup cooked (~198g)', scale: 1.98 },
  chickpeas: { cal: 164, serving: '1 cup cooked (~164g)', scale: 1.64 },
  'rajma': { cal: 127, serving: '1 cup cooked (~177g)', scale: 1.77 },
  'kidney beans': { cal: 127, serving: '1 cup cooked (~177g)', scale: 1.77 },
  'black beans': { cal: 132, serving: '1 cup cooked (~172g)', scale: 1.72 },

  // Snacks & Fast Food
  pizza: { cal: 266, serving: '1 slice (~107g)', scale: 1.07 },
  burger: { cal: 295, serving: '1 burger (~170g)', scale: 1.7 },
  'french fries': { cal: 312, serving: '1 medium serving (~117g)', scale: 1.17 },
  chips: { cal: 536, serving: '1 oz bag (~28g)', scale: 0.28 },
  samosa: { cal: 262, serving: '1 piece (~75g)', scale: 0.75 },

  // Sweets & Desserts
  chocolate: { cal: 546, serving: '1 bar (~40g)', scale: 0.4 },
  'dark chocolate': { cal: 598, serving: '1 bar (~40g)', scale: 0.4 },
  icecream: { cal: 207, serving: '1 scoop (~100g)', scale: 1 },
  'ice cream': { cal: 207, serving: '1 scoop (~100g)', scale: 1 },
  cake: { cal: 347, serving: '1 slice (~100g)', scale: 1 },
  cookie: { cal: 480, serving: '1 cookie (~20g)', scale: 0.2 },
  ladoo: { cal: 397, serving: '1 piece (~50g)', scale: 0.5 },
  halwa: { cal: 320, serving: '1 cup (~150g)', scale: 1.5 },

  // Beverages
  coffee: { cal: 2, serving: '1 cup black (~240ml)', scale: 1 },
  'coffee with milk': { cal: 30, serving: '1 cup (~240ml)', scale: 1 },
  tea: { cal: 2, serving: '1 cup plain (~240ml)', scale: 1 },
  'masala chai': { cal: 50, serving: '1 cup (~200ml)', scale: 1 },
  juice: { cal: 45, serving: '1 cup (~240ml)', scale: 1 },
  'orange juice': { cal: 45, serving: '1 cup (~240ml)', scale: 1 },
  'coconut water': { cal: 19, serving: '1 cup (~240ml)', scale: 1 },
  soda: { cal: 37, serving: '1 can (~355ml)', scale: 1 },
  cola: { cal: 37, serving: '1 can (~355ml)', scale: 1 },

  // Nuts & Seeds
  almonds: { cal: 579, serving: '1 oz / 23 nuts (~28g)', scale: 0.28 },
  peanuts: { cal: 567, serving: '1 oz (~28g)', scale: 0.28 },
  walnuts: { cal: 654, serving: '1 oz (~28g)', scale: 0.28 },
  cashews: { cal: 553, serving: '1 oz (~28g)', scale: 0.28 },
  peanut_butter: { cal: 588, serving: '2 tbsp (~32g)', scale: 0.32 },
  'peanut butter': { cal: 588, serving: '2 tbsp (~32g)', scale: 0.32 },

  // Oils
  oil: { cal: 884, serving: '1 tbsp (~14g)', scale: 0.14 },
  'olive oil': { cal: 884, serving: '1 tbsp (~14g)', scale: 0.14 },
  'coconut oil': { cal: 862, serving: '1 tbsp (~14g)', scale: 0.14 },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function parseQuantityAndFood(raw) {
  const text = raw.toLowerCase().trim();

  // Weight/volume with unit stuck to number: "100g rice", "200ml milk"
  const gramsMatch = text.match(/^(\d+(\.\d+)?)(g|ml|kg)\s+(.+)$/);
  if (gramsMatch) {
    let grams = parseFloat(gramsMatch[1]);
    const unit = gramsMatch[3];
    if (unit === 'kg') grams *= 1000;
    return { qty: 1, grams, foodName: gramsMatch[4].trim() };
  }

  // Quantity + optional unit word + food: "2 eggs", "1 cup rice", "3 slices bread"
  const numMatch = text.match(/^(\d+(\.\d+)?)\s*(cup|cups|tbsp|tsp|oz|piece|pieces|slice|slices|bowl|unit|units)?\s+(.+)$/);
  if (numMatch) {
    return { qty: parseFloat(numMatch[1]), grams: null, foodName: numMatch[4].trim() };
  }

  return { qty: 1, grams: null, foodName: text };
}

function calorieTag(cal) {
  if (cal < 50)  return '🟢 Very low-calorie option';
  if (cal < 150) return '🟢 Low-calorie option';
  if (cal < 300) return '🟡 Moderate-calorie food';
  if (cal < 500) return '🟠 High-calorie food';
  return '🔴 Very high-calorie food';
}

function lookupBuiltIn(foodName, qty, grams) {
  const key = foodName.toLowerCase().trim();
  let entry = FOOD_DICT[key];
  if (!entry) {
    const partialKey = Object.keys(FOOD_DICT).find(k => k.includes(key) || key.includes(k));
    if (partialKey) entry = FOOD_DICT[partialKey];
  }
  if (!entry) return null;

  let totalCal;
  if (grams != null) {
    // User specified exact grams — cal field is per 100g value
    totalCal = Math.round((entry.cal / 100) * grams);
  } else {
    // qty = number of default servings
    totalCal = Math.round(entry.cal * entry.scale * Math.max(qty, 1));
  }
  return { calories: totalCal, serving: grams != null ? `${grams}g` : entry.serving };
}

async function fetchOpenFoodFacts(foodName, qty) {
  try {
    const https = require('https');
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,serving_size`;
    const data = await new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: 4000 }, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('JSON parse error')); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
    const products = (data.products || []).filter(p => p.nutriments?.['energy-kcal_100g']);
    if (!products.length) return null;
    const p = products[0];
    const kcalPer100 = p.nutriments['energy-kcal_100g'];
    const servingSize = p.nutriments['serving_size'] || p.serving_size || '100g';
    // estimate ~100g per serving if no explicit serving
    const grams = 100 * Math.max(qty, 1);
    const cal = Math.round((kcalPer100 / 100) * grams);
    return { calories: cal, serving: `~${grams}g (${servingSize})`, source: 'Open Food Facts' };
  } catch {
    return null;
  }
}

// ── New: Calories Query Endpoint ─────────────────────────────────────────────
router.get('/calories', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Missing query parameter.' });

  const { qty, grams, foodName } = parseQuantityAndFood(query);

  // 1️⃣ Check uploaded nutrition DB first
  try {
    let food = await FoodNutrition.findOne({ where: { name: foodName } });
    if (!food) {
      food = await FoodNutrition.findOne({ where: { name: { [Op.like]: `%${foodName}%` } } });
    }
    if (food) {
      const multiplier = grams != null ? grams / 100 : Math.max(qty, 1);
      const totalCal = Math.round(food.calories * multiplier);
      return res.json({
        food: food.name,
        quantity: qty,
        calories: totalCal,
        serving: grams != null ? `${grams}g` : food.servingSize,
        protein: (food.protein * multiplier).toFixed(1),
        carbs: (food.carbs * multiplier).toFixed(1),
        fats: (food.fats * multiplier).toFixed(1),
        tag: calorieTag(totalCal),
        source: 'Your nutrition dataset'
      });
    }
  } catch (_) { /* DB fail — continue */ }

  // 2️⃣ Try built-in dictionary
  const dictResult = lookupBuiltIn(foodName, qty, grams);
  if (dictResult) {
    return res.json({
      food: foodName,
      quantity: qty,
      calories: dictResult.calories,
      serving: dictResult.serving,
      tag: calorieTag(dictResult.calories),
      source: 'estimate'
    });
  }

  // 3️⃣ Try Open Food Facts (external API, no key needed)
  const offResult = await fetchOpenFoodFacts(foodName, qty);
  if (offResult) {
    return res.json({
      food: foodName,
      quantity: qty,
      calories: offResult.calories,
      serving: offResult.serving,
      tag: calorieTag(offResult.calories),
      source: 'Open Food Facts'
    });
  }

  // Not found
  return res.status(404).json({ message: `Couldn't find calorie data for "${foodName}".` });
});

module.exports = router;

