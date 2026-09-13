
## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Git Workflow](#git-workflow)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

**NextLevel** is a full-stack e-commerce marketplace application that connects sellers and buyers. The platform provides secure transactions, role-based access control, product management, order processing, and comprehensive analytics.

### Project Type
- **Frontend:** Next.js 15 React Application
- **Backend:** Express.js REST API
- **Database:** MongoDB
- **Authentication:** JWT with Refresh Tokens

---

## ✨ Key Features

### For All Users
- 🔐 **Secure Authentication** - JWT-based login and registration
- 🎨 **Responsive UI** - Works on desktop, tablet, and mobile
- 🔍 **Smart Search** - Find products with filters and location-based search
- ⭐ **Reviews & Ratings** - User reviews and product ratings
- 💬 **Messaging System** - Direct communication between buyers and sellers
- ❤️ **Wishlist** - Save favorite products
- 📱 **Notifications** - Real-time alerts

### For Buyers
- 🛒 **Shopping Cart** - Add/remove products, manage quantities
- 💳 **Checkout** - Secure payment processing
- 📦 **Order Tracking** - Track orders in real-time
- 💰 **Coupon System** - Apply discount codes
- 📊 **Order History** - View past purchases
- 📍 **Multiple Addresses** - Save delivery addresses

### For Sellers
- 🏪 **Store Management** - Create and manage your shop
- 📦 **Product Listings** - Add products with images and variants
- 📊 **Sales Dashboard** - View sales analytics and reports
- 💰 **Withdrawal System** - Request earnings withdrawal
- 🎯 **Promotions** - Create special offers and discounts
- 📈 **Statistics** - Track sales and performance

### For Admins
- 👥 **User Management** - Manage users and roles
- 🏪 **Store Approval** - Verify and approve seller stores
- 📦 **Content Moderation** - Review listings and comments
- 💳 **Transaction Management** - View all transactions
- 📊 **Analytics** - System-wide statistics
- 🔧 **Settings** - Configure platform settings

---

## 📚 Tech Stack

### Frontend Technologies
```
Framework & Language:
- Next.js 15.3.1 - React meta-framework
- React 19 - UI library
- TypeScript 5.0 - Static typing

Styling & UI:
- Tailwind CSS 4.3 - Utility-first CSS
- HeroUI - React component library
- Framer Motion - Animation library

State Management:
- Zustand - Client state
- React Query - Server state
- React Context - Theme & global state

Forms & Validation:
- React Hook Form - Form management
- Zod - Schema validation
- Formik - Alternative form handling

Data & Charts:
- ApexCharts - Data visualization
- React ApexCharts - Chart components
- Recharts - React charting library

Maps & Location:
- Leaflet - Map library
- React-Leaflet - React wrapper
- Leaflet Routing Machine - Routing

Other Libraries:
- Axios - HTTP client
- JWT Decode - Token parsing
- React Hot Toast - Notifications
- React Toastify - Toast messages
- SweetAlert2 - Beautiful alerts
- Swiper - Carousel/slider
- React Multi Date Picker - Date selection
```

### Backend Technologies
```
Framework:
- Express.js 5.2 - Web framework
- Node.js - JavaScript runtime

Database:
- MongoDB 9.2 - NoSQL database
- Mongoose 9.2 - MongoDB ODM

Authentication & Security:
- JWT - Token-based auth
- Bcryptjs - Password hashing
- Helmet - Security headers
- CORS - Cross-origin requests
- Express Rate Limit - Rate limiting

Validation & Data:
- Zod - Schema validation
- Fastest Validator - Fast validation

File Management:
- Multer - File uploads
- Slug - URL-friendly strings

Email:
- Nodemailer - Email service

Caching:
- Redis - In-memory cache
- ioRedis - Redis client

Development:
- Nodemon - Auto-reload
- Jest/Node Test - Testing
```

---

## 🏗️ Project Structure

```
NextLevel/
│
├── front/                          # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── (dashboard)/       # Dashboard routes
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── (admin)/   # Admin pages
│   │   │   │   │   ├── (seller)/  # Seller pages
│   │   │   │   │   └── (user)/    # User pages
│   │   │   │   └── layout.tsx
│   │   │   ├── (main)/            # Main site routes
│   │   │   │   ├── page.tsx       # Homepage
│   │   │   │   ├── posts/         # Product listings
│   │   │   │   ├── stores/        # Store pages
│   │   │   │   └── cart/          # Shopping cart
│   │   │   ├── api/               # API routes
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── error.tsx          # Error boundary
│   │   │   └── not-found.tsx      # 404 page
│   │   │
│   │   ├── components/            # React components
│   │   │   ├── index/             # Homepage components
│   │   │   ├── posts/             # Product components
│   │   │   ├── modals/            # Modal dialogs
│   │   │   ├── stores/            # Store components
│   │   │   ├── shared/            # Shared components
│   │   │   └── skeleton/          # Loading skeletons
│   │   │
│   │   ├── services/              # API hooks & functions
│   │   │   ├── Auth/
│   │   │   ├── Listings/
│   │   │   ├── Store/
│   │   │   ├── Cart/
│   │   │   ├── Order/
│   │   │   ├── Chat/
│   │   │   ├── Comment/
│   │   │   └── ...
│   │   │
│   │   ├── types/                 # TypeScript interfaces
│   │   │   ├── Auth/
│   │   │   ├── Listings.ts
│   │   │   ├── User.ts
│   │   │   ├── Order.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/                 # Utility functions
│   │   │   ├── hooks/             # Custom hooks
│   │   │   ├── providers/         # Context providers
│   │   │   └── helpers.ts
│   │   │
│   │   ├── context/               # React contexts
│   │   │   ├── ThemeSwitcher.tsx
│   │   │   └── ...
│   │   │
│   │   └── assets/                # Static files
│   │       └── fonts/
│   │
│   ├── public/                    # Public assets
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── README.md
│
├── back/                           # Backend (Express.js + Node.js)
│   ├── controllers/               # Route handlers
│   │   ├── authController.js
│   │   ├── storeController.js
│   │   ├── listingController.js
│   │   ├── orderController.js
│   │   ├── userController.js
│   │   ├── chatController.js
│   │   └── ...
│   │
│   ├── models/                    # MongoDB schemas
│   │   ├── User.js
│   │   ├── Store.js
│   │   ├── Listing.js
│   │   ├── Order.js
│   │   ├── Comment.js
│   │   ├── Chat.js
│   │   └── ...
│   │
│   ├── routes/                    # API endpoints
│   │   ├── auth.js
│   │   ├── store.js
│   │   ├── listing.js
│   │   ├── cart.js
│   │   ├── order.js
│   │   ├── chat.js
│   │   └── ...
│   │
│   ├── services/                  # Business logic
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   ├── paymentService.js
│   │   └── ...
│   │
│   ├── middlewares/               # Express middlewares
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── ...
│   │
│   ├── validators/                # Input validation
│   │   ├── authValidator.js
│   │   ├── storeValidator.js
│   │   └── ...
│   │
│   ├── utils/                     # Helper functions
│   │   ├── logger.js
│   │   ├── AppError.js
│   │   ├── helpers.js
│   │   └── ...
│   │
│   ├── public/                    # Static files & uploads
│   │   ├── users/
│   │   ├── listings/
│   │   └── uploads/
│   │
│   ├── __tests__/                 # Test files
│   │   ├── auth.test.js
│   │   └── ...
│   │
│   ├── app.js                     # Express app configuration
│   ├── server.js                  # Server entry point
│   ├── redis.js                   # Redis configuration
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── README.md                       # This file
└── LICENSE
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Redis** (optional)
- **Git**

### 1-Minute Setup

```bash
# Clone repository
git clone <repository-url>
cd NextLevel

# Frontend
cd front
npm install
npm run dev

# Backend (in another terminal)
cd back
npm install
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

## 📦 Installation

### Backend Setup

```bash
cd back

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values
```

**Backend .env:**
```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=mongodb://localhost:27017/nextlevel
# OR
MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/nextlevel

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRE=7d

# Redis
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./public/uploads
```

**Start Backend:**
```bash
npm run dev
```

### Frontend Setup

```bash
cd front

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

**Frontend .env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=NextLevel
NEXT_PUBLIC_APP_DESCRIPTION=E-Commerce Marketplace
```

**Start Frontend:**
```bash
npm run dev
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login user
POST   /api/auth/logout                # Logout user
POST   /api/auth/refresh-token         # Refresh JWT
POST   /api/auth/resend-code           # Resend OTP
POST   /api/auth/verify                # Verify phone
```

### Stores
```
GET    /api/stores                     # Get all stores
POST   /api/stores                     # Create store
GET    /api/stores/:id                 # Get store details
PUT    /api/stores/:id                 # Update store
POST   /api/stores/:id/verify          # Verify store
```

### Listings (Products)
```
GET    /api/listings                   # Get all listings
POST   /api/listings                   # Create listing
GET    /api/listings/:id               # Get listing details
PUT    /api/listings/:id               # Update listing
DELETE /api/listings/:id               # Delete listing
```

### Cart
```
GET    /api/cart                       # Get cart
POST   /api/cart                       # Add to cart
PUT    /api/cart/:itemId               # Update cart item
DELETE /api/cart/:itemId               # Remove from cart
```

### Orders
```
GET    /api/orders                     # Get user orders
POST   /api/orders                     # Create order
GET    /api/orders/:id                 # Get order details
PUT    /api/orders/:id                 # Update order
```

### Comments
```
GET    /api/comments                   # Get comments
POST   /api/comments                   # Post comment
DELETE /api/comments/:id               # Delete comment
```

### Chat
```
GET    /api/chat                       # Get conversations
POST   /api/chat                       # Start conversation
POST   /api/chat/:id/messages          # Send message
```

### Other
```
GET    /api/categories                 # Get categories
GET    /api/wishList                   # Get favorites
POST   /api/coupon                     # Apply coupon
GET    /api/notifications              # Get notifications
```

---

## 💾 Database Models

### User Model
```javascript
{
  _id: ObjectId,
  phone: String (unique),
  firstName: String,
  lastName: String,
  email: String,
  avatar: String,
  password: String (hashed),
  role: "user" | "seller" | "admin",
  isBanned: Boolean,
  addresses: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Store Model
```javascript
{
  _id: ObjectId,
  owner: ObjectId (ref: User),
  name: String,
  slug: String (unique),
  description: String,
  logo: String,
  banner: String,
  isVerified: Boolean,
  rating: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Listing Model
```javascript
{
  _id: ObjectId,
  store: ObjectId (ref: Store),
  title: String,
  description: String,
  category: ObjectId (ref: Category),
  images: Array,
  price: Number,
  discountPrice: Number,
  stock: Number,
  rating: Number,
  reviews: Array,
  location: String,
  status: "active" | "inactive" | "pending",
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  _id: ObjectId,
  buyer: ObjectId (ref: User),
  seller: ObjectId (ref: User),
  items: Array,
  totalPrice: Number,
  discountAmount: Number,
  shippingPrice: Number,
  finalPrice: Number,
  status: "pending" | "confirmed" | "shipped" | "delivered",
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 Running the Application

### Development

**Terminal 1 - Backend:**
```bash
cd back
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd front
npm run dev
```

### Production Build

**Backend:**
```bash
cd back
npm install --production
NODE_ENV=production node server.js
```

**Frontend:**
```bash
cd front
npm run build
npm start
```

---

## 📝 Git Workflow

### Adding Files to Git

```bash
# Add specific files
git add README.md

# Add all changes
git add .

# Check status
git status

# Commit
git commit -m "feat: add feature name"

# Push
git push origin main
```

### Commit Message Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Style changes
refactor: Code refactoring
perf:     Performance improvement
test:     Test addition
chore:    Build/dependency update
```

### Example Workflow

```bash
# Create feature branch
git checkout -b feature/add-payment

# Make changes...

# Stage changes
git add src/services/payment.ts

# Commit
git commit -m "feat: integrate payment gateway"

# Push
git push origin feature/add-payment

# Create Pull Request on GitHub
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit: `git commit -m "feat: add your feature"`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

### Guidelines
- Write clear commit messages
- Test your code before pushing
- Follow the project's code style
- Update documentation if needed

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check MongoDB is running
mongod

# Update DATABASE_URL in .env
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

### Clear Node Modules
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear Build Cache
```bash
# Frontend
rm -rf .next
npm run dev

# Backend
rm -rf node_modules
npm install
```

---

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Authors

- **Development Team**: NextLevel Contributors
- **Contributors**: See [GitHub Contributors](../../contributors)

---

## 📞 Support

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Email**: support@nextlevel.com

---

## 🙏 Acknowledgments

Thank you to everyone who contributed to this project!

Special thanks to:
- The Next.js and React communities
- MongoDB for excellent documentation
- The Express.js community
- All open-source libraries used

---

## 📚 Additional Resources

### Frontend
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

### Backend
- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose ODM](https://mongoosejs.com)
- [JWT Guide](https://jwt.io/introduction)

---

<div align="center">

**⭐ If this project helped you, please give it a star!**

**Made with ❤️ by the Development Team**

![NextLevel](https://img.shields.io/badge/NextLevel-E--Commerce-blue)

</div>