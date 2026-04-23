# HealBook: Full Stack Project Setup Guide

This guide provides a detailed, step-by-step process for setting up the **HealBook** platform on your local machine. Follow every instruction carefully to ensure the database, authentication, and cloud services are configured correctly.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed on your computer:

- **Node.js**: [Download](https://nodejs.org/) (Version 18 or higher recommended).
- **npm**: Installed automatically with Node.js.
- **Git**: [Download](https://git-scm.com/) (Required for cloning the repository).
- **A Code Editor**: [VS Code](https://code.visualstudio.com/) is highly recommended.

### Required Service Accounts
You will also need to create free accounts for the following services:
- **Firebase** (Google Account)
- **Cloudinary** (Image/PDF Storage)
- **Google AI Studio** (For Gemini AI API Key)

---

## 2. Local Project Installation

### Step 1: Clone the Project
Open your terminal (PowerShell, Command Prompt, or Git Bash) and run:
```bash
git clone <your-repository-url>
cd healbook
```

### Step 2: Install Dependencies
This project uses **npm workspaces** to manage both the client and server. You only need to run the installation command once from the **root directory**:
```bash
npm install
```

### Step 3: Set up Environment Variables
1. In the root directory, create a new file named `.env.local`.
2. Copy the contents of `.env.local.example` into your new `.env.local` file.
3. Keep this file open; you will fill in the values in the next steps.

---

## 3. Firebase Configuration (Critical)

HealBook uses Firebase for **Authentication** and the **Firestore Database**.

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `healbook`.
3. (Optional) Disable Google Analytics for this project to speed up setup.
4. Once created, click **Continue**.

### Step 2: Register Web App (Web API Keys)
1. In the Project Overview, click the **Web icon (`</>`)**.
2. Register the app with a nickname (e.g., `healbook-client`).
3. **DO NOT** check "Firebase Hosting" for now.
4. You will see a `firebaseConfig` object. Copy these values into your `.env.local` file:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (and `FIREBASE_PROJECT_ID`)
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 3: Enable Authentication
1. In the Firebase left sidebar, click **Build** > **Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, select **Email/Password**.
4. Enable **Email/Password** and click **Save**.

### Step 4: Setup Firestore Database
1. In the sidebar, click **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a location (e.g., `us-central1`).
4. Select **Start in test mode** for initial setup (rules are provided in the repo for production).
5. Click **Create**.

### Step 5: Generate Admin SDK Service Account (For Server)
1. In the Firebase Console, click the **Gear Icon (Project Settings)** and select **Service accounts**.
2. Click **Firebase Admin SDK**.
3. Scroll down and click **Generate new private key**.
4. Download the JSON file.
5. **Open the JSON file** and copy the following into your `.env.local`:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
     - *Note: Ensure the private key is enclosed in quotes and preserves the `\n` characters (e.g., `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`).*

---

## 4. Cloudinary Setup (For Image Uploads)

HealBook uses Cloudinary for storage. Crucially, it uses an **Unsigned Upload Preset** to allow the frontend to upload files securely without exposing secrets.

### Step 1: Create a Cloudinary Account
1. Sign up at [Cloudinary](https://cloudinary.com/).
2. In your Dashboard, copy the **Cloud Name**, **API Key**, and **API Secret** to your `.env.local`:
   - `Cloud Name` → `CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`

### Step 2: Create an Unsigned Upload Preset
1. Click the **Gear Icon (Settings)** in Cloudinary.
2. Go to **Upload** > **Upload presets**.
3. Click **Add upload preset**.
4. Set **Signing Mode** to **Unsigned**.
5. Set the **Upload preset name** to `healbook_uploads` (or update your `.env` if you choose a different name).
6. Under **Folder**, you can set a default (like `medical_records`).
7. Click **Save**.

---

## 6. Environment Variables Reference

Your `.env.local` should now look like this. Ensure all values are filled.

| Variable | Source | Description |
| :--- | :--- | :--- |
| **NEXT_PUBLIC_FIREBASE_API_KEY** | Firebase Console (Web) | Public key for Firebase Auth/Firestore. |
| **NEXT_PUBLIC_FIREBASE_PROJECT_ID** | Firebase Console (Web) | Your Firebase project unique ID. |
| **FIREBASE_PROJECT_ID** | Firebase Console (Admin) | Same as above (for server-side use). |
| **FIREBASE_CLIENT_EMAIL** | Service Account JSON | Email from the Admin SDK private key file. |
| **FIREBASE_PRIVATE_KEY** | Service Account JSON | The full private key (including `\n`). |
| **CLOUDINARY_CLOUD_NAME** | Cloudinary Dashboard | Your cloud identifier. |
| **CLOUDINARY_API_KEY** | Cloudinary Dashboard | Your Cloudinary API Key. |
| **CLOUDINARY_API_SECRET** | Cloudinary Dashboard | Your Cloudinary API Secret. |
| **NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET** | Cloudinary Settings | Must be set to **Unsigned**. |
| **GEMINI_API_KEY** | Google AI Studio | API key for the Health AI chatbot. |

---

## 7. Firestore Indexing (Automated)

HealBook requires **9 Composite Indexes** for high-speed clinical data sorting. You can now build all of them at once using the Firebase CLI.

### Step 1: Install Firebase CLI
If you don't have it, install the tools globally:
```bash
npm install -g firebase-tools
```

### Step 2: Login and Link Project
1. Log in to your Google account:
   ```bash
   firebase login
   ```
2. Link the local folder to your Firebase project:
   ```bash
   firebase use --add
   ```
   *(Select your project and alias it as `default`)*

### Step 3: Deploy All Indexes
Run the following command to build all 9 required indexes automatically using the `firestore.indexes.json` file provided in the root:
```bash
firebase deploy --only firestore:indexes
```

### Verification (Manual Reference)
The command above creates the following indexes required for the system:

| Collection | Fields (with direction) | Feature |
| :--- | :--- | :--- |
| `appointments` | `doctorId` (Asc), `date` (Desc), `time` (Desc) | Doctor Dashboard |
| `appointments` | `doctorId` (Asc), `createdAt` (Desc) | Records Sorting |
| `appointments` | `patientId` (Asc), `createdAt` (Desc) | Patient History |
| `appointments` | `doctorId` (Asc), `date` (Asc) | Schedule View |
| `appointments` | `patientId` (Asc), `date` (Asc), `time` (Asc) | Patient Schedule |
| `doctors` | `specialization` (Asc), `rating` (Desc) | Doctor Discovery |
| `medical_records` | `userId` (Asc), `createdAt` (Desc) | Archive Filtering |
| `notifications` | `userId` (Asc), `createdAt` (Desc) | Alerts Hub |
| `users` | `role` (Asc), `createdAt` (Desc) | Admin Management |

*Note: It may take 5-10 minutes for Firestore to fully build these indexes once the command is finished.*

---

## 8. Database Seeding (Initial Data)

To populate the app with doctors and facilities, you can use two methods:

### Method A: Manual Script (Recommended)
This is the fastest method and doesn't require logging in.
1. Ensure your `.env.local` contains the `FIREBASE_PRIVATE_KEY` and other credentials.
2. Open your terminal in the `server` directory and run:
   ```bash
   npx tsx src/scripts/manual-seed.ts
   ```
3. This will create facilities and mock doctor profiles directly in your Firestore.

### Method B: API Route (For Admins)
1. Register a new account in the app.
2. Go to the **Firebase Console** > **Firestore**.
3. Find your user document in the `users` collection and change the `role` field from `"patient"` to `"admin"`.
4. Refresh the app and navigate to the Admin Dashboard.
5. Search for the "Seed Doctors" button in settings or use a tool like Postman to hit:
   `POST http://localhost:3000/api/seed/doctors` (with your auth token).

---

## 9. Running the Application

Once everything is configured:

1. Go to the **root directory** of the project.
2. Run the development command:
   ```bash
   npm run dev
   ```
3. The server and client will start simultaneously:
   - **Client**: [http://localhost:3000](http://localhost:3000)
   - **Server**: [http://localhost:5000](http://localhost:5000)

### Troubleshooting
- **Firebase Error**: Double check your `FIREBASE_PRIVATE_KEY` in `.env.local`. It must be the exact string from the JSON file.
- **Upload Error**: Ensure your Cloudinary upload preset is set to **Unsigned**.
- **Blank Dashboard**: Ensure you have run the seeding script (Step 8) and created the Firestore indexes (Step 7).

---

## 10. Netlify Deployment Guide

HealBook is pre-configured for a seamless "Single-Site" deployment on Netlify. The frontend is hosted as a static site, and the backend is automatically converted into **Netlify Functions**.

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/).
2. Initialize Git and push your code:
   ```bash
   git add .
   git commit -m "Netlify config added"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### Step 2: Create a Netlify Site
1. Log in to the [Netlify App](https://app.netlify.com/).
2. Click **Add new site** > **Import from an existing project**.
3. Choose **GitHub** and select your `healbook` repository.

### Step 3: Configure Build Settings
Netlify will automatically detect the `netlify.toml` file, but double-check these settings:
- **Base directory**: (Leave blank or set to `/`)
- **Build command**: `npm run build`
- **Publish directory**: `client/dist`
- **Functions directory**: `server/dist`

### Step 4: Add Environment Variables
1. In the Netlify Dashboard, go to **Site configuration** > **Environment variables**.
2. Add **EVERY** variable from your `.env.local` file.
3. **IMPORTANT Formatting for Netlify**:
   - **`FIREBASE_PRIVATE_KEY`**: 
     - Copy the entire key from your JSON file.
     - It should look like `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----`.
     - In the Netlify UI, just paste it directly into the Value field. **DO NOT** wrap it in quotes. The server code is now updated to handle both actual newlines and literal `\n`.
   - **`CLIENT_ORIGIN`**:
     - Set this to your production Netlify URL (e.g., `https://healbook.netlify.app`).
     - This is required to prevent CORS errors during authentication.
   - **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`**:
     - Ensure this is also added to Netlify so the frontend knows where to talk to.

### Step 5: Deploy
1. Click **Deploy site**.
2. Netlify will build the frontend and bundle the Express server into a lambda function.
3. Once the deploy is finished, your app will be live at a URL like `https://project-name.netlify.app`.

### Step 6: Authorized Domains (Crucial for Auth)
For Firebase Authentication to work on your live site, you must whitelist the Netlify domain:
1. Go to **Firebase Console** > **Authentication** > **Settings** > **Authorized domains**.
2. Click **Add domain**.
3. Paste your Netlify site URL (e.g., `healbook-123.netlify.app`).
4. Click **Add**.
   *Note: Without this step, users will see an "Unauthorized Domain" error when trying to log in.*

---

## 11. Clinical Documentation Workflow (Optimized)

HealBook features a specialized, icon-free clinical documentation system designed for high-density mobile usage.

### Digital Prescriptions
1. **Simplified Interface**: The prescription entry modal is optimized for focus, using clean typography and removing all distracting medical icons.
2. **Conditional Buttons**: The Doctor Dashboard intelligently displays "View Prescription" for existing records and "Edit" for revisions, ensuring a streamlined workflow.
3. **Verified Signatures**: All prescriptions include a digital verification header and professional clinical branding.

### Medical Archive & Records
1. **Bulk Management**: Users can now use "Select All" and "Batch Delete" in the Medical Records section for fast archive cleanup.
2. **Interactive Selection**: Record cards support tap-to-select and feature visual checkboxes for intuitive multi-record management.

### Security & Data Sync
1. **Pre-configured Rules**: The `firestore.rules` file in this repository is pre-configured to allow secure, real-time synchronization of clinical records between doctors and patients.
2. **Optimized Lookups**: The system uses high-performance direct document mapping (Appointment ID → Prescription ID), ensuring clinical data loads instantly without complex indexing.

---
