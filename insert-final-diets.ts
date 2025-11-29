import mongoose from "mongoose";
import { DietPlan } from "./server/models";

const templates = [
  {
    name: "Monday Fit Plan",
    description: "Monday - High Protein Recovery",
    targetCalories: 1855,
    protein: 153,
    carbs: 155,
    fats: 73,
    meals: {
      breakfast: {
        name: "Scrambled eggs (3) + spinach + 1 toast",
        calories: 430,
        protein: 32,
        carbs: 34,
        fats: 20,
        dishes: [
          { name: "Scrambled eggs (3)", quantity: "3 eggs" },
          { name: "Fresh spinach", quantity: "1 cup" },
          { name: "Whole-grain toast", quantity: "1 slice" }
        ]
      },
      lunch: {
        name: "Grilled chicken breast + quinoa + broccoli",
        calories: 560,
        protein: 55,
        carbs: 48,
        fats: 12,
        dishes: [
          { name: "Grilled chicken breast", quantity: "250g" },
          { name: "Quinoa", quantity: "1 cup cooked" },
          { name: "Steamed broccoli", quantity: "2 cups" }
        ]
      },
      "pre-workout": {
        name: "Banana",
        calories: 105,
        protein: 1,
        carbs: 27,
        fats: 0,
        dishes: [{ name: "Banana", quantity: "1 medium" }]
      },
      "post-workout": {
        name: "Whey protein shake + 10 almonds",
        calories: 210,
        protein: 27,
        carbs: 6,
        fats: 9,
        dishes: [
          { name: "Whey protein shake", quantity: "1 scoop" },
          { name: "Almonds", quantity: "10 pcs" }
        ]
      },
      dinner: {
        name: "Baked salmon + salad + roasted veggies",
        calories: 550,
        protein: 38,
        carbs: 20,
        fats: 32,
        dishes: [
          { name: "Baked salmon", quantity: "200g" },
          { name: "Salad", quantity: "2 cups" },
          { name: "Roasted vegetables", quantity: "2 cups" }
        ]
      }
    }
  },
  {
    name: "Tuesday Fit Plan",
    description: "Tuesday - Lean & Light",
    targetCalories: 1680,
    protein: 125,
    carbs: 155,
    fats: 49,
    meals: {
      breakfast: {
        name: "Greek yogurt + berries + chia",
        calories: 320,
        protein: 22,
        carbs: 38,
        fats: 8,
        dishes: [
          { name: "Greek yogurt", quantity: "200g" },
          { name: "Mixed berries", quantity: "1 cup" },
          { name: "Chia seeds", quantity: "1 tbsp" }
        ]
      },
      lunch: {
        name: "Turkey wrap",
        calories: 460,
        protein: 40,
        carbs: 42,
        fats: 12,
        dishes: [
          { name: "Turkey breast", quantity: "150g" },
          { name: "Whole-grain tortilla", quantity: "1" },
          { name: "Lettuce & tomato", quantity: "1 wrap" }
        ]
      },
      "pre-workout": {
        name: "Apple + small walnuts",
        calories: 230,
        protein: 3,
        carbs: 28,
        fats: 14,
        dishes: [
          { name: "Apple", quantity: "1 medium" },
          { name: "Walnuts", quantity: "small handful" }
        ]
      },
      "post-workout": {
        name: "Protein shake + 1 boiled egg",
        calories: 210,
        protein: 30,
        carbs: 4,
        fats: 5,
        dishes: [
          { name: "Whey protein shake", quantity: "1 scoop" },
          { name: "Boiled egg", quantity: "1" }
        ]
      },
      dinner: {
        name: "Chicken/tofu stir fry + rice",
        calories: 480,
        protein: 32,
        carbs: 55,
        fats: 11,
        dishes: [
          { name: "Chicken or tofu", quantity: "200g" },
          { name: "Brown rice", quantity: "1 cup cooked" },
          { name: "Mixed vegetables", quantity: "2 cups" }
        ]
      }
    }
  },
  {
    name: "Wednesday Fit Plan",
    description: "Wednesday - Power Day",
    targetCalories: 1820,
    protein: 150,
    carbs: 165,
    fats: 48,
    meals: {
      breakfast: {
        name: "Protein oatmeal",
        calories: 400,
        protein: 30,
        carbs: 52,
        fats: 8,
        dishes: [
          { name: "Oatmeal", quantity: "1 cup cooked" },
          { name: "Whey protein powder", quantity: "1 scoop" },
          { name: "Blueberries", quantity: "1 cup" }
        ]
      },
      lunch: {
        name: "Shrimp + sweet potato + salad",
        calories: 510,
        protein: 40,
        carbs: 46,
        fats: 14,
        dishes: [
          { name: "Grilled shrimp", quantity: "250g" },
          { name: "Sweet potato", quantity: "1 medium" },
          { name: "Mixed salad", quantity: "2 cups" }
        ]
      },
      "pre-workout": {
        name: "Rice cake + peanut butter",
        calories: 130,
        protein: 3,
        carbs: 14,
        fats: 6,
        dishes: [
          { name: "Rice cake", quantity: "1" },
          { name: "Peanut butter", quantity: "1 tbsp" }
        ]
      },
      "post-workout": {
        name: "Protein shake + cottage cheese",
        calories: 260,
        protein: 35,
        carbs: 10,
        fats: 5,
        dishes: [
          { name: "Whey protein shake", quantity: "1 scoop" },
          { name: "Cottage cheese", quantity: "100g" }
        ]
      },
      dinner: {
        name: "Lean beef chili + vegetables",
        calories: 520,
        protein: 42,
        carbs: 38,
        fats: 16,
        dishes: [
          { name: "Lean beef", quantity: "200g" },
          { name: "Chili preparation", quantity: "2 cups" },
          { name: "Steamed vegetables", quantity: "2 cups" }
        ]
      }
    }
  },
  {
    name: "Thursday Fit Plan",
    description: "Thursday - Balance Day",
    targetCalories: 1710,
    protein: 145,
    carbs: 161,
    fats: 48,
    meals: {
      breakfast: {
        name: "Protein smoothie",
        calories: 350,
        protein: 32,
        carbs: 45,
        fats: 6,
        dishes: [
          { name: "Whey protein", quantity: "1 scoop" },
          { name: "Banana", quantity: "1" },
          { name: "Spinach", quantity: "1 cup" },
          { name: "Almond milk", quantity: "1 cup" }
        ]
      },
      lunch: {
        name: "Baked chicken + couscous + carrots",
        calories: 520,
        protein: 45,
        carbs: 52,
        fats: 10,
        dishes: [
          { name: "Baked chicken thigh", quantity: "200g" },
          { name: "Couscous", quantity: "1 cup cooked" },
          { name: "Roasted carrots", quantity: "2 cups" }
        ]
      },
      "pre-workout": {
        name: "Orange",
        calories: 80,
        protein: 1,
        carbs: 20,
        fats: 0,
        dishes: [{ name: "Orange", quantity: "1 large" }]
      },
      "post-workout": {
        name: "Protein shake + yogurt",
        calories: 260,
        protein: 35,
        carbs: 24,
        fats: 6,
        dishes: [
          { name: "Whey protein shake", quantity: "1 scoop" },
          { name: "Greek yogurt", quantity: "100g" }
        ]
      },
      dinner: {
        name: "White fish + veggies + avocado",
        calories: 500,
        protein: 38,
        carbs: 20,
        fats: 26,
        dishes: [
          { name: "Grilled white fish", quantity: "250g" },
          { name: "Mixed vegetables", quantity: "2 cups" },
          { name: "Avocado", quantity: "1/2 avocado" }
        ]
      }
    }
  },
  {
    name: "Friday Fit Plan",
    description: "Friday - Fuel Up",
    targetCalories: 1860,
    protein: 142,
    carbs: 166,
    fats: 50,
    meals: {
      breakfast: {
        name: "Veggie omelet + toast",
        calories: 380,
        protein: 28,
        carbs: 32,
        fats: 16,
        dishes: [
          { name: "Eggs", quantity: "3" },
          { name: "Onions & peppers", quantity: "1 cup" },
          { name: "Whole-grain toast", quantity: "1 slice" }
        ]
      },
      lunch: {
        name: "Tuna salad + brown rice",
        calories: 460,
        protein: 40,
        carbs: 48,
        fats: 10,
        dishes: [
          { name: "Canned tuna in olive oil", quantity: "200g" },
          { name: "Brown rice", quantity: "1 cup cooked" },
          { name: "Lemon juice", quantity: "1 tbsp" }
        ]
      },
      "pre-workout": {
        name: "Apple + cashews",
        calories: 190,
        protein: 2,
        carbs: 26,
        fats: 8,
        dishes: [
          { name: "Apple", quantity: "1 medium" },
          { name: "Cashews", quantity: "small handful" }
        ]
      },
      "post-workout": {
        name: "Protein shake + banana",
        calories: 250,
        protein: 27,
        carbs: 32,
        fats: 1,
        dishes: [
          { name: "Whey protein shake", quantity: "1 scoop" },
          { name: "Banana", quantity: "1 small" }
        ]
      },
      dinner: {
        name: "Chicken stir-fry + cauliflower rice",
        calories: 480,
        protein: 45,
        carbs: 28,
        fats: 14,
        dishes: [
          { name: "Chicken breast", quantity: "200g" },
          { name: "Cauliflower rice", quantity: "2 cups" },
          { name: "Green salad", quantity: "2 cups" }
        ]
      }
    }
  },
  {
    name: "Saturday Fit Plan",
    description: "Saturday - Bulk Day",
    targetCalories: 1950,
    protein: 151,
    carbs: 174,
    fats: 59,
    meals: {
      breakfast: {
        name: "Cottage cheese + pineapple",
        calories: 320,
        protein: 26,
        carbs: 30,
        fats: 9,
        dishes: [
          { name: "Cottage cheese", quantity: "200g" },
          { name: "Pineapple chunks", quantity: "1 cup" }
        ]
      },
      lunch: {
        name: "Turkey meatballs + zucchini noodles",
        calories: 470,
        protein: 45,
        carbs: 28,
        fats: 16,
        dishes: [
          { name: "Turkey meatballs", quantity: "250g" },
          { name: "Zucchini noodles", quantity: "3 cups" },
          { name: "Marinara sauce", quantity: "1 cup" }
        ]
      },
      "pre-workout": {
        name: "Half protein bar",
        calories: 110,
        protein: 10,
        carbs: 14,
        fats: 3,
        dishes: [{ name: "Protein bar (half)", quantity: "1/2" }]
      },
      "post-workout": {
        name: "Protein shake + boiled egg",
        calories: 210,
        protein: 30,
        carbs: 4,
        fats: 5,
        dishes: [
          { name: "Whey protein shake", quantity: "1 scoop" },
          { name: "Boiled egg", quantity: "1" }
        ]
      },
      dinner: {
        name: "Salmon + sweet potato + asparagus",
        calories: 540,
        protein: 40,
        carbs: 42,
        fats: 22,
        dishes: [
          { name: "Baked salmon", quantity: "200g" },
          { name: "Sweet potato", quantity: "1 medium" },
          { name: "Asparagus", quantity: "1.5 cups" }
        ]
      }
    }
  },
  {
    name: "Sunday Fit Plan",
    description: "Sunday - Recovery",
    targetCalories: 1760,
    protein: 138,
    carbs: 156,
    fats: 50,
    meals: {
      breakfast: {
        name: "Protein pancakes + strawberries",
        calories: 400,
        protein: 32,
        carbs: 48,
        fats: 8,
        dishes: [
          { name: "Oats", quantity: "1 cup" },
          { name: "Egg whites", quantity: "4" },
          { name: "Whey protein", quantity: "1 scoop" },
          { name: "Strawberries", quantity: "1 cup" }
        ]
      },
      lunch: {
        name: "Chicken Caesar salad (light dressing)",
        calories: 450,
        protein: 38,
        carbs: 20,
        fats: 22,
        dishes: [
          { name: "Grilled chicken breast", quantity: "250g" },
          { name: "Romaine lettuce", quantity: "3 cups" },
          { name: "Caesar dressing (light)", quantity: "2 tbsp" }
        ]
      },
      "pre-workout": {
        name: "Banana",
        calories: 110,
        protein: 1,
        carbs: 28,
        fats: 0,
        dishes: [{ name: "Banana", quantity: "1 medium" }]
      },
      "post-workout": {
        name: "Protein shake + yogurt",
        calories: 260,
        protein: 35,
        carbs: 24,
        fats: 6,
        dishes: [
          { name: "Whey protein shake", quantity: "1 scoop" },
          { name: "Greek yogurt", quantity: "100g" }
        ]
      },
      dinner: {
        name: "Lean beef/tofu + quinoa + veggies",
        calories: 540,
        protein: 42,
        carbs: 40,
        fats: 16,
        dishes: [
          { name: "Lean beef or tofu", quantity: "200g" },
          { name: "Quinoa", quantity: "1 cup cooked" },
          { name: "Mixed vegetables", quantity: "2 cups" }
        ]
      }
    }
  }
];

async function insertFinalDiets() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://fitpro:fitpro123@localhost:27017/fitpro?authSource=admin";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Delete ALL old templates
    const deleteResult = await DietPlan.deleteMany({ isTemplate: true });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old templates`);

    // Create new templates
    for (let i = 0; i < templates.length; i++) {
      const dietPlan = new DietPlan({
        ...templates[i],
        isTemplate: true
      });
      await dietPlan.save();
      console.log(`✅ ${templates[i].name}: ${JSON.stringify(dietPlan._id)}`);
    }

    console.log("\n✅ All 7 diet templates inserted with EXACT data!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

insertFinalDiets();
