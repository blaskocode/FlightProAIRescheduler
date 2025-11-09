# Firebase Admin SDK Setup

## What You Need

To create Firebase accounts programmatically, you need a **Firebase Service Account Key**. This is different from the client-side Firebase config.

## Step 1: Get Your Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **⚙️ Settings** icon → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **"Generate New Private Key"**
6. Click **"Generate Key"** to download the JSON file
7. **Save this file securely** - it contains sensitive credentials

## Step 2: Add to Environment Variables

You have two options:

### Option A: Add to .env.local (Recommended)

Create or edit `.env.local` in your project root:

```bash
# Firebase Admin SDK (for creating accounts programmatically)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Important**: 
- Put the ENTIRE JSON content in single quotes
- Keep it on ONE line
- Escape newlines in the private key (they should be `\n`)

### Option B: Save as File (Alternative)

1. Save the downloaded JSON file as `firebase-service-account.json` in project root
2. Add to `.gitignore`: `firebase-service-account.json`
3. Update the script to read from file instead of env var

## Step 3: Verify Setup

Run this test command:

```bash
node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}').project_id || 'Not set')"
```

You should see your project ID, not "Not set".

## Step 4: Run the Script

Once configured, run:

```bash
npm run db:firebase
```

## Quick Setup (Copy-Paste Template)

1. Download your service account key from Firebase Console
2. Open the JSON file
3. Copy ALL the content
4. Create/edit `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT='PASTE_YOUR_JSON_HERE_IN_SINGLE_LINE'
```

5. Restart your terminal/IDE to load the new env var
6. Run `npm run db:firebase`

## Troubleshooting

### "Service account object must contain project_id"
- Your `FIREBASE_SERVICE_ACCOUNT` is not set or is invalid
- Make sure you copied the ENTIRE JSON content
- Make sure it's wrapped in single quotes

### "Invalid private key"
- Make sure newlines in the private key are escaped as `\n`
- Don't modify the private key content

### "Environment variable not loading"
- Restart your terminal/IDE
- Make sure the file is named `.env.local` (not `.env.local.txt`)
- Make sure it's in the project root directory

## Security Notes

- ⚠️ **NEVER commit service account keys to git**
- ⚠️ `.env.local` is in `.gitignore` - keep it there
- ⚠️ Service account has admin access - protect it carefully
- ⚠️ For production, use secret management (Vercel env vars, etc.)

