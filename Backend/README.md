# EduNode Backend

Node.js backend for an educational site with user auth, course management, and admin features.

## Features & Setup

- **User Authentication:** Signup, login, logout with JWT & refresh tokens  
- **Role Management:** Admin and User roles, access control  
- **Ban System:** Prevent banned users from registering or logging in  
- **Course Management:** Create, read, update, delete courses  
- **File Uploads:** Upload course images and attachments  
- **Comments & Reviews:** Users can comment on courses  
- **Input Validation:** Using Zod for secure and clean inputs  
- **Pagination:** Efficient retrieval of large datasets  
- **Password Security:** Hashing and password update with validation  
- **Error Handling:** Centralized error handler for all routes  
- **Cookies & Security:** HTTP-only cookies, CORS support, and secure headers

**Install & Run:**

```bash
git clone https://github.com/elahezand/edunode-backend.git
cd edunode-backend
npm install
cp .env.example .env  
npm run dev