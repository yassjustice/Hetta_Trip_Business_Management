# Trip-Tex - Textile & Fashion Production Ecosystem Research Tool

Trip-Tex is a comprehensive MERN stack application designed to help fashion entrepreneurs research, document, compare, and manage textile production vendors. The platform provides tools for vendor management, project tracking, quote comparison, and file management.

## Features

### Core Functionality
- **Vendor Management**: Complete vendor profiles with business information, contact details, capabilities, and ratings
- **Project Tracking**: Create and manage design projects with vendor linking and milestone tracking
- **Quote Comparison**: Compare quotes from different vendors side-by-side
- **Document Management**: Upload and organize vendor catalogs, samples, certificates, and quotes
- **Dashboard Analytics**: Visual insights into vendor statistics and project progress
- **Authentication System**: Secure user registration and login with JWT tokens

### Technical Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **File Upload Support**: Handle multiple file formats (PDF, DOC, XLS, images)
- **Advanced Filtering**: Search and filter vendors by country, product category, status, etc.
- **Real-time Updates**: Dynamic content updates without page refreshes
- **Data Validation**: Comprehensive input validation on both client and server
- **Security**: Rate limiting, input sanitization, and secure authentication

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting

### Frontend
- **React** - User interface library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Heroicons** - Icon library
- **Headless UI** - Unstyled UI components
- **Date-fns** - Date utility library

## Project Structure

```
trip-tex/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Auth/      # Authentication components
│   │   │   ├── Common/    # Shared components
│   │   │   ├── Dashboard/ # Dashboard components
│   │   │   ├── Layout/    # Layout components
│   │   │   ├── Projects/  # Project management
│   │   │   ├── Quotes/    # Quote comparison
│   │   │   ├── Profile/   # User profile
│   │   │   └── Vendors/   # Vendor management
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── models/                 # MongoDB schemas
│   ├── User.js
│   ├── Vendor.js
│   └── Project.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── vendors.js
│   ├── projects.js
│   └── upload.js
├── middleware/             # Express middleware
│   ├── auth.js
│   └── upload.js
├── uploads/                # File upload directory
│   ├── vendors/
│   ├── projects/
│   └── avatars/
├── server.js               # Express server
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd trip-tex
```

### 2. Environment Setup
Create a `.env` file in the root directory based on `.env.example`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/triptex
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
```

### 3. Install Dependencies

#### Backend Dependencies
```bash
npm install
```

#### Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 4. Database Setup
Ensure MongoDB is running on your system. The application will automatically create the database and collections on first run.

### 5. Start the Application

#### Development Mode (Both server and client)
```bash
npm run dev
```

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the server
npm start
```

#### Individual Services
```bash
# Start only the backend server
npm run server

# Start only the frontend (in client directory)
cd client && npm start
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: Available through the API endpoints

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Vendors
- `GET /api/vendors` - Get all vendors (with filtering)
- `POST /api/vendors` - Create new vendor
- `GET /api/vendors/:id` - Get vendor by ID
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `PUT /api/vendors/:id/rating` - Update vendor rating
- `GET /api/vendors/stats/overview` - Get vendor statistics

### Projects
- `GET /api/projects` - Get all projects (with filtering)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/vendors` - Link vendor to project
- `PUT /api/projects/:projectId/vendors/:vendorId` - Update vendor status
- `DELETE /api/projects/:projectId/vendors/:vendorId` - Remove vendor from project
- `GET /api/projects/stats/overview` - Get project statistics

### File Upload
- `POST /api/upload/vendor/:id/documents` - Upload vendor documents
- `POST /api/upload/project/:id/documents` - Upload project documents
- `POST /api/upload/project/:projectId/vendor/:vendorId/quote` - Upload quote documents
- `POST /api/upload/avatar` - Upload user avatar
- `DELETE /api/upload/document` - Delete document

## Data Models

### User
- Basic user information with authentication
- Role-based access control
- Profile avatar support

### Vendor
- Company and contact information
- Business capabilities and certifications
- Product categories and specializations
- Pricing and delivery information
- Quality ratings and reviews
- Document attachments
- Sourcing status tracking

### Project
- Project details and specifications
- Timeline and budget tracking
- Linked vendors with status
- Quote management
- Document storage
- Team collaboration

## Development Guidelines

### Code Style
- Use ES6+ JavaScript features
- Follow React best practices
- Implement proper error handling
- Use meaningful variable and function names
- Add comments for complex logic

### Security Considerations
- Input validation on both client and server
- SQL injection prevention through Mongoose
- XSS protection with proper sanitization
- CSRF protection for state-changing operations
- Rate limiting on API endpoints
- Secure file upload validation

### Performance Optimizations
- Database indexing for search operations
- Image optimization for uploads
- Lazy loading for large datasets
- Caching strategies for static content
- Pagination for large result sets

## Deployment

### Environment Variables
Ensure all environment variables are properly set in production:
- Use strong JWT secrets
- Configure production MongoDB URI
- Set appropriate CORS origins
- Configure file upload limits

### Build Process
```bash
# Build the frontend for production
npm run build

# Start the production server
npm start
```

### Recommended Deployment Platforms
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Database**: MongoDB Atlas, DigitalOcean Managed Databases
- **Frontend**: Netlify, Vercel, AWS S3 + CloudFront
- **File Storage**: AWS S3, DigitalOcean Spaces

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation for common solutions
- Review the API endpoints for integration guidance

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**Trip-Tex** - Streamlining textile and fashion production vendor management for modern entrepreneurs.
