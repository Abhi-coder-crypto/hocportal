// Load environment variables from .env file
// Note: Replit Secrets take priority over .env file
import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { hashPassword } from "./utils/auth";
import { User } from "./models/user";
import { Trainer, WorkoutPlan } from "./models";
import { startSessionReminderScheduler } from "./utils/session-reminder-scheduler";
import { emailService } from "./utils/email";
import { migrateLiveSessionReferences } from "./migrate-sessions";

const app = express();

// Extend IncomingMessage for rawBody
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Middleware to log API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Connect to MongoDB using .env MONGODB_URI
    await storage.connect();
    log("✅ Database connected successfully");

    // Run LiveSession schema migration (converts legacy string IDs to ObjectId)
    await migrateLiveSessionReferences();

    // Check for existing packages
    const existingPackages = await storage.getAllPackages();
    if (existingPackages.length === 0) {
      const defaultPackages = [
        {
          name: "Basic",
          description: "Perfect for beginners",
          price: 29.99,
          features: ["Access to gym equipment", "Basic workout plans"],
          videoAccess: false,
          liveSessionsPerMonth: 0,
          dietPlanAccess: false,
          workoutPlanAccess: true,
        },
        {
          name: "Premium",
          description: "Most popular choice",
          price: 59.99,
          features: [
            "All Basic features",
            "Video library access",
            "Diet plans",
            "2 live sessions/month",
          ],
          videoAccess: true,
          liveSessionsPerMonth: 2,
          dietPlanAccess: true,
          workoutPlanAccess: true,
        },
        {
          name: "Elite",
          description: "Complete fitness solution",
          price: 99.99,
          features: [
            "All Premium features",
            "Unlimited live sessions",
            "Personal trainer support",
            "Priority support",
          ],
          videoAccess: true,
          liveSessionsPerMonth: 999,
          dietPlanAccess: true,
          workoutPlanAccess: true,
        },
      ];

      for (const pkg of defaultPackages) {
        await storage.createPackage(pkg);
      }
      log(`📦 Created ${defaultPackages.length} default packages`);
    } else {
      log(`📦 Found ${existingPackages.length} existing packages`);
    }
    
      
      // ALWAYS ensure default admin and trainer accounts exist
      // These accounts are REQUIRED for system operation
      const adminEmail = "admin@fitpro.com";
      const adminPassword = "Admin@123";
      const trainerEmail = "trainer@fitpro.com";
      const trainerPassword = "Trainer@123";
      
      // Admin Account - Create or Update
      let adminUser = await User.findOne({ email: adminEmail });
      const hashedAdminPassword = await hashPassword(adminPassword);
      
      if (!adminUser) {
        adminUser = await User.create({
          email: adminEmail,
          password: hashedAdminPassword,
          role: 'admin',
          name: 'FitPro Admin',
        });
        log(`🔐 Created default admin user (email: ${adminEmail})`);
      } else {
        // FORCE ensure password and role are ALWAYS admin (critical fix)
        await User.updateOne(
          { email: adminEmail },
          { $set: { password: hashedAdminPassword, role: 'admin', name: 'FitPro Admin' } }
        );
        
        // Verify it was actually updated
        const verifyAdmin = await User.findOne({ email: adminEmail });
        if (verifyAdmin?.role !== 'admin') {
          console.warn('⚠️ Admin role was not admin, forcing update again...');
          await User.updateOne(
            { _id: verifyAdmin?._id },
            { $set: { role: 'admin' } }
          );
        }
        log(`🔐 Verified admin user (email: ${adminEmail}, role: ${verifyAdmin?.role || 'admin'})`);
      }
      
      // Trainer Account - Create or Update
      let trainerUser = await User.findOne({ email: trainerEmail });
      let demoTrainer = await Trainer.findOne({ email: trainerEmail });
      
      // Create trainer profile if doesn't exist
      if (!demoTrainer) {
        demoTrainer = await Trainer.create({
          name: "FitPro Trainer",
          email: trainerEmail,
          phone: "9876543210",
          specialty: "Strength & Conditioning",
          bio: "Professional certified trainer",
          experience: 5,
          status: 'active',
        });
      }
      
      if (!trainerUser) {
        const hashedTrainerPassword = await hashPassword(trainerPassword);
        trainerUser = await User.create({
          email: trainerEmail,
          password: hashedTrainerPassword,
          role: 'trainer',
          name: 'FitPro Trainer',
          phone: '9876543210',
          trainerId: demoTrainer._id,
        });
        log(`🔐 Created default trainer user (email: ${trainerEmail})`);
      } else {
        // Ensure password is correct
        const hashedTrainerPassword = await hashPassword(trainerPassword);
        trainerUser.password = hashedTrainerPassword;
        trainerUser.role = 'trainer';
        trainerUser.trainerId = String(demoTrainer._id);
        await trainerUser.save();
        log(`🔐 Verified trainer user (email: ${trainerEmail})`);
      }
      
      // Seed videos if none exist
      const existingVideos = await storage.getAllVideos();
      if (existingVideos.length === 0) {
        const packages = await storage.getAllPackages();
        const premiumPackage = packages.find(p => p.name === "Premium");
        
        const videos = [
          { title: "Full Body Strength Training", category: "Strength", duration: 45, url: "https://example.com/video1", description: "Complete full body workout", packageRequirement: premiumPackage?._id?.toString() },
          { title: "Morning Yoga Flow", category: "Yoga", duration: 30, url: "https://example.com/video2", description: "Energizing morning yoga", packageRequirement: premiumPackage?._id?.toString() },
          { title: "HIIT Cardio Blast", category: "Cardio", duration: 25, url: "https://example.com/video3", description: "High intensity cardio", packageRequirement: premiumPackage?._id?.toString() },
          { title: "Upper Body Power", category: "Strength", duration: 40, url: "https://example.com/video4", description: "Focus on upper body", packageRequirement: premiumPackage?._id?.toString() },
          { title: "Flexibility & Stretching", category: "Yoga", duration: 20, url: "https://example.com/video5", description: "Improve flexibility", packageRequirement: premiumPackage?._id?.toString() },
          { title: "Advanced HIIT Circuit", category: "HIIT", duration: 35, url: "https://example.com/video6", description: "Advanced HIIT training", packageRequirement: premiumPackage?._id?.toString() },
          { title: "Core Strength Builder", category: "Strength", duration: 30, url: "https://example.com/video7", description: "Build core strength", packageRequirement: premiumPackage?._id?.toString() },
          { title: "Evening Relaxation Yoga", category: "Yoga", duration: 25, url: "https://example.com/video8", description: "Wind down yoga session", packageRequirement: premiumPackage?._id?.toString() },
          { title: "Beginner Cardio Workout", category: "Cardio", duration: 20, url: "https://example.com/video9", description: "Cardio for beginners", packageRequirement: premiumPackage?._id?.toString() },
        ];
        
        for (const video of videos) {
          await storage.createVideo(video);
        }
        log(`🎥 Created ${videos.length} demo videos`);
      }
      
      // Seed live sessions if none exist
      const existingSessions = await storage.getAllSessions();
      if (existingSessions.length === 0) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        
        const dayAfter = new Date(now);
        dayAfter.setDate(dayAfter.getDate() + 2);
        dayAfter.setHours(19, 0, 0, 0);
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(17, 30, 0, 0);
        
        const sessions = [
          { title: "Power Yoga Session", description: "Energizing yoga flow", sessionType: "Power Yoga", scheduledAt: tomorrow, duration: 60, status: "upcoming", meetingLink: "https://meet.example.com/yoga1" },
          { title: "HIIT Training", description: "High intensity interval training", sessionType: "HIIT", scheduledAt: dayAfter, duration: 45, status: "upcoming", meetingLink: "https://meet.example.com/hiit1" },
          { title: "Strength Building", description: "Full body strength", sessionType: "Strength Building", scheduledAt: yesterday, duration: 50, status: "completed", meetingLink: "https://meet.example.com/strength1" },
          { title: "Cardio Bootcamp", description: "Morning cardio session", sessionType: "Cardio Bootcamp", scheduledAt: tomorrow, duration: 40, status: "upcoming", meetingLink: "https://meet.example.com/cardio1" },
        ];
        
        for (const session of sessions) {
          await storage.createSession(session);
        }
        log(`📅 Created ${sessions.length} demo live sessions`);
      }
      
      // Seed demo clients assigned to trainer if none exist
      const existingClients = await storage.getAllClients();
      if (existingClients.length === 0) {
        const packages = await storage.getAllPackages();
        const premiumPackage = packages.find(p => p.name === 'Premium');
        
        // Create demo clients
        const demoClients = [
          { name: 'John Smith', phone: '1234567890', email: 'john@example.com', packageId: premiumPackage?._id?.toString(), trainerId: demoTrainer._id?.toString(), status: 'active' },
          { name: 'Sarah Johnson', phone: '2345678901', email: 'sarah@example.com', packageId: premiumPackage?._id?.toString(), trainerId: demoTrainer._id?.toString(), status: 'active' },
          { name: 'Mike Davis', phone: '3456789012', email: 'mike@example.com', packageId: premiumPackage?._id?.toString(), trainerId: demoTrainer._id?.toString(), status: 'active' },
          { name: 'Emma Wilson', phone: '4567890123', email: 'emma@example.com', packageId: premiumPackage?._id?.toString(), trainerId: demoTrainer._id?.toString(), status: 'active' },
        ];
        
        const createdClients = [];
        for (const clientData of demoClients) {
          const client = await storage.createClient(clientData);
          createdClients.push(client);
        }
        log(`👥 Created ${createdClients.length} demo clients assigned to trainer`);
        
        // Create demo diet plans for clients
        for (const client of createdClients) {
          const dietPlan = await storage.createDietPlan({
            clientId: client._id?.toString(),
            name: 'Weekly Nutrition Plan',
            description: 'Balanced diet for weight loss and muscle gain',
            meals: {
              Monday: [{ mealType: 'breakfast', description: 'Oatmeal with berries', calories: 350 }],
              Tuesday: [{ mealType: 'breakfast', description: 'Eggs and whole wheat toast', calories: 400 }],
              Wednesday: [{ mealType: 'breakfast', description: 'Smoothie bowl', calories: 380 }],
            },
            selectedDay: 'Monday',
          });
          log(`🥗 Created diet plan for client: ${client.name}`);
        }
        
        // Create demo workout plans for clients
        for (const client of createdClients) {
          const workoutPlan = await storage.createWorkoutPlan({
            clientId: client._id?.toString(),
            trainerId: demoTrainer._id?.toString(),
            name: 'Full Body Strength',
            description: 'Complete strength training program',
            exercises: {
              Monday: [
                { name: 'Squats', sets: 4, reps: 8, weight: 185, notes: 'Heavy load' },
                { name: 'Bench Press', sets: 4, reps: 6, weight: 225, notes: 'Focus on form' },
              ],
              Wednesday: [
                { name: 'Deadlifts', sets: 3, reps: 5, weight: 315, notes: 'Power day' },
              ],
              Friday: [
                { name: 'Pull-ups', sets: 3, reps: 10, weight: null, notes: 'Bodyweight' },
              ],
            },
          });
          log(`💪 Created workout plan for client: ${client.name}`);
        }
        
        // Create demo videos if none exist
        const existingVideos = await storage.getAllVideos();
        if (existingVideos.length === 0) {
          const sampleVideos = [
            {
              title: "Full Body Strength Training",
              description: "Complete 45-minute full body workout for building strength and muscle mass. Perfect for intermediate to advanced fitness enthusiasts.",
              url: "https://www.youtube.com/watch?v=R6gZoAzAhCg",
              thumbnail: "https://i.ytimg.com/vi/R6gZoAzAhCg/maxresdefault.jpg",
              category: "Strength",
              duration: 45,
              intensity: "High",
              difficulty: "intermediate",
              trainer: "FitPro Trainer",
              equipment: ["Dumbbells", "Barbell", "Bench"],
              isDraft: false,
            },
            {
              title: "Morning Yoga Flow",
              description: "Energizing 30-minute morning yoga session to start your day with flexibility and mindfulness.",
              url: "https://www.youtube.com/watch?v=VaoV1PrYft4",
              thumbnail: "https://i.ytimg.com/vi/VaoV1PrYft4/maxresdefault.jpg",
              category: "Yoga",
              duration: 30,
              intensity: "Low",
              difficulty: "beginner",
              trainer: "FitPro Trainer",
              equipment: ["Yoga Mat"],
              isDraft: false,
            },
            {
              title: "HIIT Cardio Blast",
              description: "High-intensity interval training for maximum calorie burn in just 25 minutes. No equipment needed!",
              url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
              thumbnail: "https://i.ytimg.com/vi/ml6cT4AZdqI/maxresdefault.jpg",
              category: "Cardio",
              duration: 25,
              intensity: "High",
              difficulty: "intermediate",
              trainer: "FitPro Trainer",
              equipment: [],
              isDraft: false,
            },
            {
              title: "Upper Body Power Workout",
              description: "Build strength and definition in your chest, shoulders, and arms with this focused 40-minute session.",
              url: "https://www.youtube.com/watch?v=WvLMDMT-u-s",
              thumbnail: "https://i.ytimg.com/vi/WvLMDMT-u-s/maxresdefault.jpg",
              category: "Strength",
              duration: 40,
              intensity: "High",
              difficulty: "advanced",
              trainer: "FitPro Trainer",
              equipment: ["Dumbbells", "Pull-up Bar"],
              isDraft: false,
            },
            {
              title: "Evening Relaxation Yoga",
              description: "Wind down with this gentle 35-minute evening yoga practice designed to promote deep relaxation and better sleep.",
              url: "https://www.youtube.com/watch?v=COp7BR_Dvps",
              thumbnail: "https://i.ytimg.com/vi/COp7BR_Dvps/maxresdefault.jpg",
              category: "Yoga",
              duration: 35,
              intensity: "Low",
              difficulty: "beginner",
              trainer: "FitPro Trainer",
              equipment: ["Yoga Mat", "Yoga Blocks"],
              isDraft: false,
            },
            {
              title: "Running Endurance Training",
              description: "50-minute treadmill or outdoor running workout to build cardiovascular endurance and stamina.",
              url: "https://www.youtube.com/watch?v=V8nYE8PiGLo",
              thumbnail: "https://i.ytimg.com/vi/V8nYE8PiGLo/maxresdefault.jpg",
              category: "Cardio",
              duration: 50,
              intensity: "Moderate",
              difficulty: "intermediate",
              trainer: "FitPro Trainer",
              equipment: ["Running Shoes"],
              isDraft: false,
            },
            {
              title: "Core Conditioning & Abs",
              description: "Intense 35-minute core workout targeting all abdominal muscles for a stronger, more defined midsection.",
              url: "https://www.youtube.com/watch?v=3p8EBPVZ2Iw",
              thumbnail: "https://i.ytimg.com/vi/3p8EBPVZ2Iw/maxresdefault.jpg",
              category: "Strength",
              duration: 35,
              intensity: "Moderate",
              difficulty: "intermediate",
              trainer: "FitPro Trainer",
              equipment: ["Exercise Mat"],
              isDraft: false,
            },
            {
              title: "Flexibility & Mobility Training",
              description: "Improve your range of motion and prevent injuries with this comprehensive 45-minute stretching routine.",
              url: "https://www.youtube.com/watch?v=L_xrDAtykMI",
              thumbnail: "https://i.ytimg.com/vi/L_xrDAtykMI/maxresdefault.jpg",
              category: "Flexibility",
              duration: 45,
              intensity: "Low",
              difficulty: "beginner",
              trainer: "FitPro Trainer",
              equipment: ["Yoga Mat", "Resistance Band"],
              isDraft: false,
            },
          ];

          for (const video of sampleVideos) {
            await storage.createVideo(video);
          }
          log(`🎥 Created ${sampleVideos.length} sample workout videos`);
        } else {
          log(`🎥 Found ${existingVideos.length} existing videos`);
        }
      }

      // Seed workout templates if none exist
      try {
        const workoutTemplateCount = await WorkoutPlan.countDocuments({ isTemplate: true });
        if (workoutTemplateCount === 0) {
          const fullBodyTemplate = await WorkoutPlan.create({
            name: "Full Body Split – Beginner",
            description: "A beginner-friendly 7-day full body split designed to build strength, improve form, and develop consistent training habits. Includes 6 training days and 1 active rest day.",
            category: "general",
            difficulty: "beginner",
            durationWeeks: 4,
            isTemplate: true,
            exercises: {
              "Monday": [
                { name: "Push-Ups", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Dumbbell Bench Press", sets: 3, reps: "10-12", rest: "90s" },
                { name: "Chest Fly (Dumbbells or Machine)", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Tricep Dips (Bench)", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Tricep Rope Pushdown", sets: 3, reps: "12-15", rest: "60s" }
              ],
              "Tuesday": [
                { name: "Lat Pulldown", sets: 3, reps: "10-12", rest: "90s" },
                { name: "Seated Row Machine", sets: 3, reps: "10-12", rest: "90s" },
                { name: "Dumbbell Bent-Over Row", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Dumbbell Bicep Curl", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Hammer Curl", sets: 3, reps: "12", rest: "60s" }
              ],
              "Wednesday": [
                { name: "Dumbbell Shoulder Press", sets: 3, reps: "10-12", rest: "90s" },
                { name: "Lateral Raises", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Front Raises", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Plank", sets: 3, reps: "30-45 sec", rest: "60s" },
                { name: "Bicycle Crunch", sets: 3, reps: "20 reps", rest: "60s" }
              ],
              "Thursday": [
                { name: "Bodyweight Squats", sets: 3, reps: "12-15", rest: "90s" },
                { name: "Leg Press", sets: 3, reps: "10-12", rest: "90s" },
                { name: "Leg Extension", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Hamstring Curl Machine", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Calf Raise Machine", sets: 3, reps: "15", rest: "60s" }
              ],
              "Friday": [
                { name: "Kettlebell Deadlift", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Dumbbell Shoulder Press", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Push-Ups", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Seated Row", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Plank", sets: 3, reps: "30-45 sec", rest: "60s" }
              ],
              "Saturday": [
                { name: "Glute Bridges", sets: 3, reps: "15", rest: "60s" },
                { name: "Hip Thrusts", sets: 3, reps: "12", rest: "90s" },
                { name: "Goblet Squat", sets: 3, reps: "12", rest: "60s" },
                { name: "Side Planks", sets: 3, reps: "30 sec each side", rest: "60s" },
                { name: "Treadmill Walk", sets: 1, reps: "10 minutes", rest: "0s" }
              ],
              "Sunday": [
                { name: "Light Walking", sets: 1, reps: "10-20 minutes", rest: "0s" },
                { name: "Stretching", sets: 1, reps: "5-10 minutes", rest: "0s" }
              ]
            }
          });
          log(`💪 Created workout template: ${fullBodyTemplate.name}`);
        } else {
          log(`💪 Found ${workoutTemplateCount} existing workout templates`);
        }
      } catch (workoutError) {
        console.warn('⚠️  Could not create workout template:', (workoutError as any).message);
      }

  } catch (error) {
    log("❌ Failed to connect to database:");
    console.error(error);
    process.exit(1);
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  
  // Register all routes
  const server = await registerRoutes(app);

  // Setup WebSocket for live chat
  setupWebSocket(server);
  log("🔌 WebSocket server initialized");

  startSessionReminderScheduler();

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup static/Vite
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);

  // Bind to 0.0.0.0 for Replit environment
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on http://0.0.0.0:${port}`);
  });
})();
