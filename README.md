## Project Info

**Project Name**: Booksy  
A modern web application connecting customers with local service providers. Built with React, TypeScript, and Supabase.

### Features
- 🔐 User authentication (Customer/Provider)
- 📅 Service booking system with time slots
- 💼 Provider dashboard with booking management
- 👤 Customer dashboard with booking history
- ⭐ Review and rating system
- 🔍 Service discovery by category and city
- 📍 Multi-city support
- 💫 Real-time booking updates

### Tech Stack
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, ShadcnUI
- **State Management**: TanStack Query
- **Backend**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth

### Prerequisites
- Node.js (v16 or higher)
- npm/yarn
- Supabase account

### Environment Setup

Create a `.env` file in the root directory.

The only requirement is having Node.js & npm installed. You can install Node.js with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

Follow these steps:

```bash
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
