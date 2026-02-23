

# Create Super Admin Account

## What Will Happen
A super admin account will be created with the email `admin@platform.com` and a secure password. This account will have full administrative access to manage users, projects, disputes, finances, and all platform settings.

## Steps

1. **Register the account** through the existing signup flow using the authentication system
2. **Assign the `super_admin` role** by updating the `user_roles` table entry (the signup trigger creates a default role, so we'll update it to `super_admin`)
3. **Auto-confirm the email** so you can log in immediately without needing email verification

## Credentials
- **Email:** admin@platform.com
- **Password:** Admin@2024! (you should change this after first login)

## Technical Details

| Step | Action |
|------|--------|
| 1 | Use the authentication system API to create the user with email `admin@platform.com` and password `Admin@2024!` |
| 2 | Query the `user_roles` table to find the new user's record and update the role to `super_admin` |
| 3 | Auto-confirm the user's email so login works immediately |

No code changes are needed -- this is a data operation only using the backend tools.

