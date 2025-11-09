# Demo Accounts Setup Guide

## Overview

This guide shows you how to create Firebase accounts for all users in your database for thorough demo testing.

## Quick Start

### Step 1: Create Firebase Accounts

Run the script to create Firebase Authentication accounts for ALL users:

```bash
npm run db:firebase
```

This script will:
- Find all admins, instructors, and students in your database
- Create Firebase accounts for each with password `DemoPass123!`
- Update database records with Firebase UIDs
- Generate a `DEMO_CREDENTIALS.md` file with all login credentials

### Step 2: View Credentials

After running the script, open `DEMO_CREDENTIALS.md` to see:
- Quick access accounts (first admin, instructor, student)
- Complete list of all accounts organized by role and school
- All accounts use the same password: `DemoPass123!`

## Password

**All demo accounts use the password**: `DemoPass123!`

## Usage

### Log in as Any User

1. Go to `http://localhost:3000/login`
2. Enter any email from `DEMO_CREDENTIALS.md`
3. Enter password: `DemoPass123!`
4. Access the dashboard as that user

### Testing Different Roles

**Admin Account**:
- Full access to all features
- Can manage schools, users, and settings
- Access to analytics and reports

**Instructor Account**:
- View assigned students
- Manage flight schedule
- Report squawks
- Confirm reschedule requests

**Student Account**:
- View personal schedule
- See training progress
- Accept/reject reschedule suggestions
- View weather alerts

## Example Accounts

After running `npm run db:firebase`, your `DEMO_CREDENTIALS.md` will look like:

```markdown
# Demo Account Credentials

**Password for ALL accounts**: `DemoPass123!`

## Quick Access Accounts

### Admin Account
Email: admin.demo@flightpro.com
Password: DemoPass123!

### Instructor Account (First)
Email: john.smith0@skywest.com
Password: DemoPass123!

### Student Account (First)
Email: sarah.johnson0@skywest.com
Password: DemoPass123!
```

## Testing Scenarios

### Multi-User Testing

With credentials for ALL users, you can:
1. Log in as instructor A
2. View their students
3. Log in as one of those students
4. See their perspective
5. Test the full workflow

### Cross-School Testing

Test data isolation:
1. Log in as instructor from School A
2. Verify they only see School A data
3. Log in as instructor from School B
4. Verify they only see School B data

### Role-Based Access

Test permissions:
1. Log in as student - verify limited access
2. Log in as instructor - verify expanded access
3. Log in as admin - verify full access

## Re-running the Script

You can re-run `npm run db:firebase` at any time:
- Existing Firebase accounts are detected (no duplicates)
- New users get Firebase accounts created
- Database records are updated with Firebase UIDs
- `DEMO_CREDENTIALS.md` is regenerated

## Security Note

**IMPORTANT**: 
- `DEMO_CREDENTIALS.md` is in `.gitignore` - it won't be committed
- This is for DEMO/TESTING purposes only
- Never use these simple passwords in production
- Delete demo accounts before production deployment

## Troubleshooting

### "Firebase account creation failed"

Make sure your `FIREBASE_SERVICE_ACCOUNT` environment variable is set:

```bash
# In .env.local
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", ...}'
```

### "User already exists" error

This is normal - the script detects existing accounts and skips them.

### Can't find credentials file

Look for `DEMO_CREDENTIALS.md` in the project root directory.

## What Gets Created

For each user in the database:
1. **Firebase Auth Account**: Email + password authentication
2. **Database Link**: `firebaseUid` field updated to link to Firebase
3. **Credentials Entry**: Added to `DEMO_CREDENTIALS.md`

## Performance

The script processes:
- ~10 admins in seconds
- ~100 instructors in ~30 seconds
- ~1500 students in ~3-5 minutes

Progress is shown for large batches.

