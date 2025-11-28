# FitPro CRM - Complete Pre-Production Testing Checklist

**Last Updated:** November 28, 2025  
**Status:** Ready for Testing  
**Deployment Target:** Production

---

## CRITICAL FLOWS - MUST TEST FIRST

### 1. User Authentication & Authorization
- [ ] Admin can login with `admin@fitpro.com` / `admin123`
- [ ] Trainer can login with `trainer@fitpro.com` / `trainer123`
- [ ] Client can login with their credentials
- [ ] Invalid credentials show error message
- [ ] JWT tokens are properly stored in localStorage
- [ ] Expired tokens redirect to login page
- [ ] Users cannot access other roles' pages (RBAC working)
- [ ] Password reset functionality (if enabled) works

### 2. Complete Client Journey (Start to Finish)
1. [ ] **Client Registration/Onboarding**
   - [ ] New client can sign up with email
   - [ ] Client assigned to correct package (Basic/Fit Plus/Pro/Elite)
   - [ ] Package assignment persists in database
   - [ ] Client can see their subscription details in profile

2. [ ] **Trainer Assignment**
   - [ ] Admin assigns trainer to client
   - [ ] Trainer appears in client's header
   - [ ] Trainer can see client in "Assigned Clients" list
   - [ ] Multiple clients can be assigned to one trainer

3. [ ] **Diet Plan Assignment**
   - [ ] Admin/Trainer creates or selects diet template
   - [ ] Admin assigns diet to client
   - [ ] Client sees diet immediately on `/client/diet` page
   - [ ] Diet shows all 4 meals per day (breakfast, lunch, snack, dinner)
   - [ ] **MOBILE**: Diet shows 2-column grid layout on mobile
   - [ ] **DESKTOP**: Diet shows horizontal layout with 4 meals per row
   - [ ] Macro breakdown shows correctly (protein, carbs, fats)
   - [ ] When new diet assigned, old diet is replaced (not stacked)
   - [ ] Client can download diet plan as PDF

4. [ ] **Workout Plan Assignment**
   - [ ] Admin/Trainer creates or selects workout template
   - [ ] Admin assigns workout to client
   - [ ] Client sees workout on `/client/workout` page
   - [ ] Workout shows day selector (Monday-Sunday)
   - [ ] Exercises display with sets, reps, weight, rest time
   - [ ] **CALORIES BURNED**: Shows total calories burned for day
   - [ ] **CALORIE BALANCE**: Shows consumed vs burned vs deficit/surplus
   - [ ] Client can view exercise details in popup
   - [ ] When new workout assigned, old workout is replaced

5. [ ] **Video Library**
   - [ ] Trainer can upload/assign workout videos
   - [ ] Client can see assigned videos
   - [ ] Videos play without errors
   - [ ] Video thumbnails display correctly
   - [ ] Video metadata (duration, trainer) shows correctly

6. [ ] **Habit Tracking (Pro/Elite Only)**
   - [ ] **Pro/Elite Clients**: See "Habits" in header
   - [ ] **Basic/Fit Plus Clients**: See upgrade prompt when clicking habits
   - [ ] Trainer can assign habits to Pro/Elite clients
   - [ ] Habit assignment shows in trainer dashboard
   - [ ] Client can mark habit complete for today
   - [ ] Completion status persists (refresh shows same status)
   - [ ] Trainer can see completion logs for each client
   - [ ] Trainer can delete habits (cascades to logs)
   - [ ] Habit completion percentage shows correctly

7. [ ] **Trainer Contact (Pro/Elite Only)**
   - [ ] **Pro/Elite Clients**: See trainer contact icon in header
   - [ ] **Basic/Fit Plus Clients**: See upgrade prompt when clicking
   - [ ] Dialog shows trainer phone number
   - [ ] Phone number links to `tel:` for phone calls
   - [ ] WhatsApp button opens WhatsApp with trainer
   - [ ] Availability schedule displays correctly

---

## ADMIN DASHBOARD - COMPREHENSIVE TEST

### Admin Client Management
- [ ] View all clients in list/table
- [ ] Search clients by name or email
- [ ] Filter clients by package type
- [ ] Create new client with all required fields
  - [ ] Email, name, age, weight, gender required
  - [ ] Package auto-selected
  - [ ] Phone/address optional
- [ ] Edit client details (all fields editable)
- [ ] Delete client (confirm dialog appears)
- [ ] Client deletion cascades (diets/workouts/habits/logs deleted)
- [ ] CSV export of clients works
- [ ] Client profile shows all info from database (no mock data)

### Admin Trainer Management
- [ ] View all trainers
- [ ] Create new trainer with email/name/password
- [ ] Edit trainer details
- [ ] Delete trainer
- [ ] Assign trainers to clients
- [ ] Trainer assignment persists
- [ ] Trainer can see assigned clients after assignment

### Admin Diet Management
- [ ] View all diet templates
- [ ] Create diet template with meals (breakfast, lunch, snack, dinner)
- [ ] Each meal has: name, calories, protein, carbs, fats, dishes
- [ ] Edit diet template
- [ ] Delete diet template
- [ ] Assign diet to single client
- [ ] Bulk assign diet to multiple clients
- [ ] **Reassign diet**: Remove old diet, assign new one
- [ ] Client sees updated diet immediately
- [ ] Diet analytics show views/completion rates

### Admin Workout Management
- [ ] View all workout templates
- [ ] Create workout with:
  - [ ] Name, description, difficulty
  - [ ] Duration in weeks
  - [ ] Exercises by day (Monday, Tuesday, etc.)
  - [ ] Each exercise: name, sets, reps, weight, duration, intensity
  - [ ] **CALORIES BURNED**: Calculate based on intensity/duration
- [ ] Edit workout template
- [ ] Delete workout template
- [ ] Assign workout to single client
- [ ] Bulk assign workout to multiple clients
- [ ] **Reassign workout**: Remove old, assign new
- [ ] Client sees updated workout immediately
- [ ] Workout analytics show completion rates

### Admin Session Management
- [ ] Create live training session with:
  - [ ] Session name, date, time, duration
  - [ ] Trainer assignment
  - [ ] **MEETING LINK**: Persistent link for this session (e.g., zoom/meet link)
  - [ ] Client assignment (single or bulk)
- [ ] Session shows in trainer's dashboard
- [ ] Session shows in client's upcoming sessions
- [ ] Assign trainer to session (updates in real-time)
- [ ] Assign clients to batch (shows count updating)
- [ ] Prevent duplicate trainer assignment
- [ ] Remove trainer/client assignment
- [ ] Session attendance tracking
- [ ] Email reminders sent to clients 10 minutes before session
- [ ] Session link provided in email and visible to client
- [ ] Delete session (with confirm)

### Admin Analytics & Reports
- [ ] Revenue Dashboard:
  - [ ] Total revenue displays correctly
  - [ ] Revenue by package type
  - [ ] Monthly revenue trends
  - [ ] Export revenue report as PDF/CSV
- [ ] Client Statistics:
  - [ ] Total active clients count
  - [ ] Clients by package type
  - [ ] Churn/retention metrics
  - [ ] Client engagement score
- [ ] Video Performance:
  - [ ] Views per video
  - [ ] Completion rates
  - [ ] Most watched videos
- [ ] Session Attendance:
  - [ ] Trainer attendance rate
  - [ ] Client attendance rate
  - [ ] No-show tracking
- [ ] Engagement Report:
  - [ ] Diet adherence rates
  - [ ] Workout completion rates
  - [ ] Habit completion rates (Pro/Elite)
  - [ ] Platform usage metrics

### Admin Package Management
- [ ] View all packages (Basic, Fit Plus, Pro, Elite)
- [ ] Each package shows:
  - [ ] Name, price, duration
  - [ ] Features list
  - [ ] Clients in this package
  - [ ] Active vs expired subscriptions
- [ ] Track subscription expiry dates
- [ ] Upgrade prompt shows for Basic/Fit Plus clients

---

## TRAINER DASHBOARD - COMPREHENSIVE TEST

### Trainer Client Management
- [ ] View all assigned Pro/Elite clients (Basic/Fit Plus excluded)
- [ ] Click client to see profile and details
- [ ] Search/filter clients by name
- [ ] Trainer info displays (name, email, phone)

### Trainer Diet & Workout Assignment
- [ ] Create diet template
  - [ ] All 4 meal types required
  - [ ] Macros calculated or entered
- [ ] Assign diet to Pro/Elite clients
  - [ ] Single or bulk assignment
  - [ ] Client sees diet immediately
- [ ] Create workout template
  - [ ] All days (Monday-Sunday) optional
  - [ ] Exercises by day
  - [ ] Intensity/difficulty settings
- [ ] Assign workout to Pro/Elite clients
  - [ ] Single or bulk assignment
  - [ ] Client sees workout immediately

### Trainer Video Management
- [ ] Upload workout videos
  - [ ] Supports MP4, WebM formats
  - [ ] Optional thumbnail upload
- [ ] Assign video to clients
- [ ] View uploaded videos
- [ ] Delete video (confirm dialog)

### Trainer Habit Tracking (Pro/Elite Only)
- [ ] View Pro/Elite clients only
- [ ] Assign multiple habits to each client
  - [ ] Habit name, description, frequency
  - [ ] Confirmation shows in list
- [ ] View habit completion logs
  - [ ] See which days client completed habit
  - [ ] See completion percentage
  - [ ] Date range filter works
- [ ] Delete habit (cascades to all logs)
- [ ] Trainer-specific habits (don't affect other trainers)

### Trainer Session Management
- [ ] View all assigned sessions
- [ ] See session details: name, date, time, duration
- [ ] See assigned clients list
- [ ] See meeting link (Zoom/Meet)
- [ ] Client attendance tracking
- [ ] Can record notes/attendance

### Trainer Analytics
- [ ] Client adherence metrics
  - [ ] Diet completion %
  - [ ] Workout completion %
  - [ ] Habit completion %
- [ ] Session attendance rates
- [ ] Performance trends (weekly/monthly)

---

## CLIENT DASHBOARD - COMPREHENSIVE TEST (ALL PACKAGES)

### Client Home/Dashboard
- [ ] Welcome message with client name
- [ ] Shows assigned trainer (if any)
- [ ] Quick stats: diet status, workout status, sessions upcoming
- [ ] Navigation to diet, workout, videos, profile

### Client Diet Page
- [ ] Shows current assigned diet (only one at a time)
- [ ] **DESKTOP**: 4 meals in horizontal row
- [ ] **MOBILE**: 2-column grid layout
- [ ] Each meal shows:
  - [ ] Meal name (breakfast, lunch, snack, dinner)
  - [ ] Calories total
  - [ ] Macro breakdown (protein, carbs, fats)
  - [ ] Dishes list with quantity
- [ ] Total daily calories calculated
- [ ] Macro percentages calculated correctly
- [ ] Download plan as PDF
- [ ] "No diet assigned" message if none
- [ ] Real data from database (not mock)

### Client Workout Page
- [ ] Shows current assigned workout
- [ ] **Summary Cards**: Duration, Difficulty, Daily Calorie Burn
- [ ] Day selector with all available days
- [ ] Exercises table for selected day:
  - [ ] Exercise name, sets, reps, weight, rest time
  - [ ] Details button opens popup
- [ ] **CALORIES BALANCE SECTION**:
  - [ ] Calories consumed (from diet)
  - [ ] Calories burned (from workout)
  - [ ] Deficit/surplus indicator
  - [ ] Progress bar showing balance
- [ ] "No workout assigned" message if none
- [ ] Real data from database

### Client Video Library
- [ ] Browse all available videos
- [ ] Search videos by title
- [ ] Filter by category/trainer
- [ ] Click to play video
- [ ] Video player works without errors
- [ ] Thumbnail displays
- [ ] Video duration shows
- [ ] Trainer name displays

### Client Profile Page
- [ ] Personal Info tab:
  - [ ] Name, email, phone, age, gender, weight
  - [ ] Edit functionality (if enabled)
- [ ] Health tab:
  - [ ] Height, weight, BMI, goal
  - [ ] Edit functionality (if enabled)
- [ ] Subscription tab:
  - [ ] Current package name (Basic/Fit Plus/Pro/Elite)
  - [ ] Package price (real from database)
  - [ ] Package features list
  - [ ] Subscription end date
  - [ ] Payment method
- [ ] Privacy tab:
  - [ ] Privacy settings/preferences
- [ ] All data from real database (not mock)

### Client Sessions (All Packages)
- [ ] View upcoming sessions
- [ ] Session shows:
  - [ ] Session name, date, time, duration
  - [ ] Trainer name
  - [ ] **MEETING LINK**: Clickable to join session (Zoom/Meet/etc)
- [ ] Past sessions listed
- [ ] Session reminders show (email + in-app)
- [ ] "No sessions assigned" message if none

### Client Habits (Pro/Elite Only)
- [ ] **Pro/Elite**: See assigned habits
  - [ ] List all habits
  - [ ] "Mark Today Done" button for each
  - [ ] Shows completion status (green if done today)
  - [ ] Daily progress (2/3 habits completed)
  - [ ] Completion percentage
  - [ ] Edit/delete habit (if trainer enabled)
- [ ] **Basic/Fit Plus**: See upgrade prompt
  - [ ] CTA button to upgrade package
  - [ ] Explains Pro/Elite benefits

### Client Trainer Contact (Pro/Elite Only)
- [ ] **Pro/Elite**: Click trainer icon in header
  - [ ] Dialog shows trainer info
  - [ ] Phone number displays
  - [ ] **CALL button**: Opens `tel:` link
  - [ ] **WHATSAPP button**: Opens WhatsApp
  - [ ] Availability schedule shows (if available)
- [ ] **Basic/Fit Plus**: See upgrade prompt
  - [ ] Explains Pro/Elite benefit

---

## TECHNICAL QUALITY CHECKS

### Backend API
- [ ] All endpoints return proper HTTP status codes
  - [ ] 200 for success
  - [ ] 201 for creation
  - [ ] 400 for bad request
  - [ ] 401 for unauthorized
  - [ ] 403 for forbidden
  - [ ] 404 for not found
  - [ ] 500 for server error
- [ ] Error messages are descriptive
- [ ] No console errors in server logs
- [ ] No 500 errors in production
- [ ] API response times < 500ms
- [ ] Rate limiting active but not blocking legitimate requests
- [ ] CORS configured correctly
- [ ] No hardcoded credentials in logs

### Frontend
- [ ] No console errors/warnings (except known Vite warnings)
- [ ] No React warnings about missing keys
- [ ] All images load correctly
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1920px)
- [ ] Dark/light theme toggle works on all pages
- [ ] Theme preference persists (localStorage)
- [ ] No layout shifts on hover/interaction
- [ ] Loading states show (spinners/skeletons)
- [ ] Error states show with retry buttons
- [ ] Empty states show with helpful messages

### Database
- [ ] MongoDB connection stable
- [ ] All collections created (Clients, Trainers, Diets, Workouts, etc)
- [ ] Indexes created for performance
- [ ] No duplicate records after operations
- [ ] Cascading deletes work (delete client → diets/workouts deleted)
- [ ] Data relationships maintained (client → trainer, diet, etc)
- [ ] Timestamps accurate (createdAt, updatedAt if used)

### Security
- [ ] JWT authentication on all protected routes
- [ ] Role-based access control (RBAC) enforced
  - [ ] Admin routes only accessible to admin
  - [ ] Trainer routes only to trainers
  - [ ] Client routes only to clients
- [ ] Passwords hashed with bcrypt
- [ ] No passwords in logs or responses
- [ ] No sensitive data in localStorage (only tokens)
- [ ] CORS doesn't allow all origins (*) - specific domains only
- [ ] SQL injection prevention (using Mongoose/validated inputs)
- [ ] XSS protection (React escapes by default)
- [ ] CSRF tokens (if applicable)
- [ ] Rate limiting prevents brute force
- [ ] Session timeouts implemented

### Email Notifications
- [ ] SMTP configured and working
- [ ] Session reminders sent 10 min before
- [ ] Email contains:
  - [ ] Session details (name, time, trainer)
  - [ ] Meeting link (clickable)
  - [ ] Client name
  - [ ] Unsubscribe option (if needed)
- [ ] Emails sent from correct address
- [ ] No errors in email logs

### Real-Time Features (if using WebSocket)
- [ ] WebSocket connection established
- [ ] Session reminders broadcast correctly
- [ ] Data updates sync across tabs
- [ ] Reconnection works if disconnected
- [ ] No memory leaks from open connections

---

## DATA INTEGRITY CHECKS

### Admin Create & Assign Flow
- [ ] Create client → Check in DB
- [ ] Assign trainer to client → Verify relationship
- [ ] Create diet → Check in DB
- [ ] Assign diet to client → Client sees it → Old diet removed
- [ ] Create workout → Check in DB
- [ ] Assign workout to client → Client sees it → Old workout removed
- [ ] Create session → Check in DB
- [ ] Assign trainer to session → Session visible in trainer dashboard
- [ ] Assign clients to session → Sessions visible in client upcoming
- [ ] Reassign trainer → Old trainer removed, new shows
- [ ] Reassign clients → Client list updated

### Data Validation
- [ ] Email format validated
- [ ] Phone number format validated
- [ ] Age/weight numeric and reasonable
- [ ] Package selection required
- [ ] Trainer assignment optional (can be empty)
- [ ] Subscription dates validated
- [ ] Calorie inputs numeric
- [ ] Date/time inputs valid

### Cache Invalidation
- [ ] Update diet → Client cache invalidated immediately
- [ ] Update workout → Client cache invalidated immediately
- [ ] Assign habit → Cache refreshes
- [ ] Mark habit done → Cache refreshes
- [ ] Delete session → Dashboard updates immediately
- [ ] Refresh page → All data still accurate

---

## EDGE CASES & ERROR HANDLING

### Error Scenarios
- [ ] Delete client while assigned to trainer → Trainer list updates
- [ ] Delete trainer → Clients reassigned or marked as unassigned
- [ ] Delete diet while assigned → Client sees "no diet" message
- [ ] Delete workout while assigned → Client sees "no workout" message
- [ ] Assign to offline client → Queued/retried properly
- [ ] Network error during submit → Retry option appears
- [ ] Concurrent assignment (same diet to same client twice) → Prevented
- [ ] Assign diet to client without package → Works if Pro/Elite, blocked if Basic

### Boundary Cases
- [ ] Very long names (100+ chars) → Truncated or wrapped
- [ ] Very large numbers (price, calories) → Formatted correctly
- [ ] Special characters in inputs → Escaped/validated
- [ ] Empty searches → "No results" message
- [ ] No clients assigned to trainer → Show empty state
- [ ] No sessions scheduled → Show "Schedule one" message
- [ ] Client with no profile picture → Show avatar fallback
- [ ] Multiple tabs open → Data syncs correctly

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All environment variables set (.env)
  - [ ] MongoDB URI
  - [ ] JWT secret
  - [ ] SMTP credentials
  - [ ] Zoom/Meet API keys (if used)
- [ ] Database backup taken
- [ ] SSL certificates valid
- [ ] Domain/DNS configured
- [ ] CDN configured (if using)
- [ ] Email service authenticated
- [ ] Rate limiting configured for production loads
- [ ] Logging configured for debugging
- [ ] Error tracking enabled (Sentry, etc - optional)
- [ ] Analytics configured (Google Analytics, etc - optional)

### Post-Deployment
- [ ] Test in staging environment first
- [ ] Run full checklist in staging
- [ ] Backup production database before deploying
- [ ] Deploy to production
- [ ] Run smoke tests:
  - [ ] Admin can login
  - [ ] Trainer can login
  - [ ] Client can login
  - [ ] Create client
  - [ ] Assign diet
  - [ ] Assign workout
  - [ ] Create session
- [ ] Monitor logs for errors
- [ ] Monitor performance metrics
- [ ] Check email delivery rate
- [ ] Verify SSL certificate working

---

## LAUNCH DAY TASKS

1. [ ] Notify all admins/trainers of launch
2. [ ] Send welcome email to first clients
3. [ ] Monitor system for first 24 hours
4. [ ] Have rollback plan ready
5. [ ] Support team trained on troubleshooting
6. [ ] Escalation procedures documented
7. [ ] Monitor error rates and performance
8. [ ] Celebrate launch!

---

## NOTES FOR MANUAL TESTING

### Known Issues to Verify Fixed
- ✅ Diet assignment now uses correct endpoint
- ✅ Edit/Reassign buttons no longer duplicate functionality
- ✅ Habit assignment validation fixed
- ✅ Trainer can see assigned clients
- ✅ Trainer can see assigned sessions

### Things to Specifically Focus On
1. **Session Meeting Links** - Verify persistent link works (Zoom/Meet)
2. **Trainer Assignment** - Ensure only Pro/Elite clients show for trainers
3. **Mobile Responsiveness** - Diet page 2-column grid on mobile
4. **Calories Burned** - Verify calculation matches manual testing
5. **Real Data** - Ensure NO mock data in production (all from DB)
6. **Email Notifications** - Test session reminders and other emails
7. **Cache Invalidation** - Verify instant updates after changes
8. **Role-Based Access** - Admin can't access trainer pages, etc.

