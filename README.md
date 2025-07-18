# Trip-Tex - Textile & Fashion Production Ecosystem Research Tool

Trip-Tex is a comprehensive MERN stack application designed to help fashion entrepreneurs research, document, compare, and manage textile production vendors. The platform provides tools for vendor management, project tracking, automated web research, and file management.

## Features

### Core Functionality
- **Vendor Management**: Complete vendor profiles with business information, contact details, capabilities, and ratings
- **Project Tracking**: Create and manage design projects with vendor linking and milestone tracking
- **Automated Research**: AI-powered web research to discover new vendors and extract business data
- **Document Management**: Upload and organize vendor catalogs, samples, certificates, and quotes
- **Dashboard Analytics**: Visual insights into vendor statistics and project progress
- **Authentication System**: Secure user registration and login with JWT tokens

### Research System Features
- **Multi-Engine Search**: Automated searches across Google, Bing, and DuckDuckGo
- **Data Extraction**: Intelligent parsing of vendor websites for business information
- **Validation Workflow**: Review and validate research results before importing
- **Bulk Import**: Import validated vendors directly into the vendor management system
- **Smart Detection**: Automatically detects pricing, services, contact info, and certifications
- **Result Management**: Track research sessions and monitor data quality

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
│   │   │   ├── Research/  # Automated research system
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
│   ├── Project.js
│   └── Research.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── vendors.js
│   ├── projects.js
│   ├── research.js
│   └── upload.js
├── services/               # Business logic services
│   ├── WebSearchService.js
│   └── DataExtractionService.js
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

# Research API Keys (Required for Research feature)
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-google-search-engine-id
BING_SEARCH_API_KEY=your-bing-search-api-key
SCRAPINGBEE_API_KEY=your-scrapingbee-api-key

# Research Configuration
MAX_SEARCH_RESULTS=10
MAX_CONCURRENT_SCRAPING=5
SCRAPING_TIMEOUT=30000
SEARCH_API_RATE_LIMIT=100
```

#### Setting Up Research API Keys

To use the automated research feature, you'll need to obtain API keys from these services:

1. **Google Custom Search API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Custom Search API
   - Create credentials (API key)
   - Set up a Custom Search Engine at [cse.google.com](https://cse.google.com/cse/)
   - Add `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` to your `.env`

2. **Bing Web Search API**:
   - Go to [Microsoft Azure Portal](https://portal.azure.com/)
   - Create a Bing Search resource
   - Get your subscription key
   - Add `BING_SEARCH_API_KEY` to your `.env`

3. **ScrapingBee API** (for web scraping):
   - Sign up at [ScrapingBee](https://www.scrapingbee.com/)
   - Get your API key from the dashboard
   - Add `SCRAPINGBEE_API_KEY` to your `.env`

**Note**: The research feature will work with limited functionality if only some API keys are provided, but for best results, configure all three services.

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

### Research
- `POST /api/research/sessions` - Create new research session
- `GET /api/research/sessions` - Get all research sessions
- `GET /api/research/sessions/:id` - Get research session by ID
- `DELETE /api/research/sessions/:id` - Delete research session
- `GET /api/research/sessions/:id/results` - Get research results for session
- `GET /api/research/sessions/:id/status` - Get session status
- `POST /api/research/sessions/:id/cancel` - Cancel running research session
- `PUT /api/research/sessions/:id/results/:resultId/validate` - Validate research result
- `POST /api/research/sessions/:id/validate-all` - Bulk validate results
- `POST /api/research/sessions/:id/import` - Import validated results to vendor database
- `GET /api/research/sessions/:id/export` - Export research results
- `GET /api/research/sessions/:id/stats` - Get session statistics
- `GET /api/research/stats/overview` - Get overall research statistics

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
- Service types (printing, sewing, design, shipping, etc.)
- Printing methods (DTG, DTF, screen printing, etc.)
- Pricing models and price ranges
- Business policies (MOQ, lead times, payment terms)
- Production capacity and equipment
- Quality ratings and reviews
- Document attachments
- Sourcing status tracking
- Research data and source tracking

### Project
- Project details and specifications
- Timeline and budget tracking
- Linked vendors with status
- Quote management
- Document storage
- Team collaboration

### Research
- Research session management
- Search terms and configuration
- Search results and extracted data
- Data validation status
- Import tracking and history
- Quality metrics and confidence scores

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

## Using the Research Feature

The automated research feature helps you discover new textile and fashion vendors by searching multiple search engines and extracting relevant business data.

### How to Use Research

1. **Navigate to Research**: Click on "Research" in the main navigation menu

2. **Create Research Session**:
   - Enter search terms (e.g., "DTG printing manufacturers China", "fabric suppliers India")
   - Configure search settings (number of results, search engines to use)
   - Click "Start Research" to begin the automated process

3. **Monitor Progress**: 
   - View real-time progress as the system searches and extracts data
   - See status updates for each search term and result

4. **Review Results**:
   - Browse extracted vendor information in the results table
   - Use filters to focus on specific criteria (location, services, etc.)
   - Sort by data quality, confidence score, or other metrics

5. **Validate Data**:
   - Click "Validate" on any result to review and edit extracted information
   - Verify company details, contact information, and services
   - Mark results as validated, needs review, or invalid

6. **Import to Vendors**:
   - Select validated results you want to import
   - Configure import settings (conflict resolution, default status, tags)
   - Click "Import Selected" to add vendors to your database

### Research Data Types

The system automatically extracts:

- **Company Information**: Name, website, description, business type
- **Contact Details**: Email, phone, address, country
- **Services**: Types of services offered (printing, sewing, design, etc.)
- **Printing Methods**: DTG, DTF, screen printing, heat transfer, etc.
- **Pricing**: Price ranges, MOQ (Minimum Order Quantity), pricing models
- **Business Policies**: Return policies, payment terms, shipping options
- **Certifications**: Quality certifications, industry standards
- **Production Capacity**: Equipment, capabilities, lead times
- **Reputation**: Ratings, reviews, testimonials

### Best Practices

- **Search Terms**: Use specific, industry-relevant keywords
- **Review Carefully**: Always validate important data before importing
- **Regular Research**: Run periodic searches to find new vendors
- **Organize Results**: Use tags and categories to organize imported vendors
- **Monitor Quality**: Check confidence scores and data completeness

### Troubleshooting

- **API Rate Limits**: If searches fail, check your API key quotas
- **Low Quality Results**: Try more specific search terms
- **Import Conflicts**: Use merge settings to handle duplicate vendors
- **Missing Data**: Manually edit results during validation
