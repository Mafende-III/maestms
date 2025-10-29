# Sales API Review - Coolify Deployment

**Date:** October 29, 2025
**Deployment URL:** http://jso8o40kcgws0kck0ookg0sc.31.220.17.127.sslip.io
**Planned Domain:** https://www.maest.streamlinexperts.rw

---

## Table of Contents
1. [API Endpoints Overview](#api-endpoints-overview)
2. [Authentication & Security](#authentication--security)
3. [Endpoint Specifications](#endpoint-specifications)
4. [Testing Instructions](#testing-instructions)
5. [Findings & Recommendations](#findings--recommendations)

---

## API Endpoints Overview

The Sales API provides comprehensive CRUD operations for managing sales records in the Mafende Estate Management System.

### Available Endpoints

| Method | Endpoint | Description | Auth Required | Permission |
|--------|----------|-------------|---------------|------------|
| GET | `/api/sales` | List all sales with optional filters | Yes | `sales.read` |
| POST | `/api/sales` | Create a new sale | Yes | `sales.create` |
| GET | `/api/sales/[id]` | Get a single sale by ID | Yes | `sales.read` |
| PUT | `/api/sales/[id]` | Update an existing sale | Yes | `sales.update` |
| DELETE | `/api/sales/[id]` | Delete a sale | Yes | `sales.delete` |

---

## Authentication & Security

### Authentication Method
- **Provider:** NextAuth.js with Credentials Provider
- **Strategy:** JWT-based session management
- **Session Duration:** 15 minutes
- **Cookie Security:**
  - `httpOnly: true`
  - `sameSite: 'lax'`
  - `secure: false` (to support HTTP in development)

### Current Status
✅ **Authentication is ENABLED** (as of commit `cee5817`)

The temporary authentication bypass that was used for data import has been removed. All endpoints now require valid authentication.

### Admin Credentials
- **Email:** admin@mafende.com
- **Password:** Admin123!
- **Role:** SUPER_ADMIN (has all permissions)

### Permission-Based Access Control
The API implements role-based access control with the following permissions:
- `sales.read` - View sales records
- `sales.create` - Create new sales
- `sales.update` - Update existing sales
- `sales.delete` - Delete sales

---

## Endpoint Specifications

### 1. List Sales - `GET /api/sales`

**Purpose:** Retrieve a list of sales with optional filtering

**Query Parameters:**
- `category` - Filter by category (CINEMA, MOBILE_MONEY, CHARCOAL, SHOP, SALON, PROPERTY, LIVESTOCK, RETAIL, SERVICES, OTHER)
- `saleType` - Filter by sale type (SHOP_SALE, PROPERTY_SALE, BULK_SALE, SERVICE, CASH_SALE)
- `paymentStatus` - Filter by payment status (PENDING, COMPLETED, OVERDUE, CANCELLED)
- `creditStatus` - Filter by credit status (PAID, UNPAID, PARTIAL)
- `assetId` - Filter by associated asset ID
- `date` - Filter by specific date (ISO format)

**Response:** Array of sale objects sorted by sale date (descending)

**Related Files:**
- Implementation: `src/app/api/sales/route.ts:34-92`

---

### 2. Create Sale - `POST /api/sales`

**Purpose:** Create a new sale record

**Request Body:**
```json
{
  "assetId": "string (optional)",
  "description": "string (required)",
  "salePrice": "number (required, >= 0)",
  "saleDate": "string (required, ISO datetime)",
  "buyerName": "string (optional)",
  "buyerPhone": "string (optional)",
  "buyerEmail": "string (optional, valid email)",
  "category": "enum (required)",
  "saleType": "enum (required)",
  "paymentMethod": "enum (optional)",
  "paymentStatus": "enum (default: COMPLETED)",
  "creditStatus": "enum (optional)",
  "quantity": "number (optional)",
  "unitPrice": "number (optional)",
  "location": "string (optional)",
  "agentName": "string (optional)",
  "commissionRate": "number (optional, 0-100)",
  "commissionAmount": "number (optional)",
  "currency": "string (default: UGX)",
  "notes": "string (optional)"
}
```

**Validation:**
- Powered by Zod schema validation
- Commission amount auto-calculated if rate is provided
- All enums validated against allowed values

**Response:** Created sale object with 201 status

**Related Files:**
- Implementation: `src/app/api/sales/route.ts:95-160`
- Schema: `src/app/api/sales/route.ts:10-31`

---

### 3. Get Single Sale - `GET /api/sales/[id]`

**Purpose:** Retrieve a specific sale by ID

**URL Parameters:**
- `id` - Sale ID (string)

**Response:** Sale object or 404 if not found

**Related Files:**
- Implementation: `src/app/api/sales/[id]/route.ts:31-60`

---

### 4. Update Sale - `PUT /api/sales/[id]`

**Purpose:** Update an existing sale

**URL Parameters:**
- `id` - Sale ID (string)

**Request Body:** Similar to create, but with validation schema differences (see note below)

⚠️ **Important Finding:** The update schema at `src/app/api/sales/[id]/route.ts:10-28` is outdated:
- Missing categories: SHOP, SALON (present in create schema)
- Missing sale types: CASH_SALE (present in create schema)
- Missing payment methods: CREDIT (present in create schema)
- References old field: `propertyAddress` (line 102)
- Missing several new fields from create schema

**Response:** Updated sale object

**Related Files:**
- Implementation: `src/app/api/sales/[id]/route.ts:63-132`

---

### 5. Delete Sale - `DELETE /api/sales/[id]`

**Purpose:** Delete a sale record

**URL Parameters:**
- `id` - Sale ID (string)

**Response:** Success message

**Related Files:**
- Implementation: `src/app/api/sales/[id]/route.ts:135-169`

---

## Testing Instructions

### Prerequisites
1. Ensure you have network access to the deployment
2. Have valid admin credentials
3. Install Node.js (if using the test script)

### Option 1: Using the Test Script

We've created a comprehensive test suite that validates all endpoints:

```bash
# Run from project root
node scripts/test-sales-api-coolify.js
```

The test script will:
1. ✅ Test unauthorized access (expect 401)
2. ✅ Authenticate with admin credentials
3. ✅ List all sales
4. ✅ List sales with filters
5. ✅ Create a test sale
6. ✅ Retrieve the created sale
7. ✅ Update the sale
8. ✅ Delete the sale (cleanup)

### Option 2: Manual Testing with cURL

#### Step 1: Authenticate

```bash
# Set the base URL
export BASE_URL="http://jso8o40kcgws0kck0ookg0sc.31.220.17.127.sslip.io"

# Login and capture cookies
curl -c cookies.txt -X POST \
  "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mafende.com",
    "password": "Admin123!",
    "redirect": false,
    "json": true
  }'
```

#### Step 2: Test List Sales

```bash
# List all sales
curl -b cookies.txt "$BASE_URL/api/sales"

# List sales with filters
curl -b cookies.txt "$BASE_URL/api/sales?category=CINEMA&paymentStatus=COMPLETED"
```

#### Step 3: Test Create Sale

```bash
curl -b cookies.txt -X POST \
  "$BASE_URL/api/sales" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test Cinema Sale",
    "salePrice": 50000,
    "saleDate": "2025-10-29T12:00:00Z",
    "category": "CINEMA",
    "saleType": "SHOP_SALE",
    "paymentMethod": "CASH",
    "paymentStatus": "COMPLETED",
    "location": "Ngoma Business Center",
    "currency": "UGX"
  }'
```

#### Step 4: Test Get Single Sale

```bash
# Replace {sale-id} with actual ID from create response
curl -b cookies.txt "$BASE_URL/api/sales/{sale-id}"
```

#### Step 5: Test Update Sale

```bash
# Replace {sale-id} with actual ID
curl -b cookies.txt -X PUT \
  "$BASE_URL/api/sales/{sale-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated Test Sale",
    "salePrice": 75000,
    "saleDate": "2025-10-29T12:00:00Z",
    "category": "CINEMA",
    "saleType": "SHOP_SALE",
    "paymentMethod": "MPESA",
    "paymentStatus": "COMPLETED"
  }'
```

#### Step 6: Test Delete Sale

```bash
# Replace {sale-id} with actual ID
curl -b cookies.txt -X DELETE "$BASE_URL/api/sales/{sale-id}"
```

### Option 3: Using Postman/Insomnia

1. Import the following base configuration:
   - **Base URL:** `http://jso8o40kcgws0kck0ookg0sc.31.220.17.127.sslip.io`
   - **Auth:** Handle authentication via `/api/auth/callback/credentials`

2. Create requests for each endpoint following the specifications above

3. Ensure cookies are properly handled for session management

---

## Findings & Recommendations

### ✅ Strengths

1. **Robust Authentication**
   - Session-based auth with JWT
   - 15-minute session timeout is reasonable for security
   - Proper permission-based access control

2. **Comprehensive Validation**
   - Zod schema validation ensures data integrity
   - Type-safe enum values
   - Proper error handling with detailed messages

3. **Flexible Filtering**
   - List endpoint supports multiple filter options
   - Includes asset relationship data
   - Date-based filtering with proper timezone handling

4. **Business Logic**
   - Auto-calculation of commission amounts
   - Smart defaults (e.g., payment methods based on category)
   - Support for multiple business models (shop, property, services, etc.)

### ⚠️ Issues Found

#### 1. **Critical: Inconsistent Schemas** (Priority: HIGH)

**Location:** `src/app/api/sales/[id]/route.ts:10-28` vs `src/app/api/sales/route.ts:10-31`

**Problem:**
- Update schema is missing categories: SHOP, SALON
- Update schema is missing sale type: CASH_SALE
- Update schema is missing payment method: CREDIT
- Update schema references old fields that don't exist in create schema

**Impact:**
- Cannot update sales to SHOP or SALON categories
- Cannot update sales to CASH_SALE type
- Update endpoint may fail or have unexpected behavior

**Recommendation:**
```typescript
// Unify the schemas by using a shared base schema
const baseSaleSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  salePrice: z.number().min(0, 'Sale price must be positive'),
  // ... all common fields
})

// Create can extend with additional fields
const createSaleSchema = baseSaleSchema.extend({
  assetId: z.string().optional(),
  // ... create-specific fields
})

// Update should allow same fields as create
const updateSaleSchema = baseSaleSchema.extend({
  assetId: z.string().optional(),
  // ... same as create
})
```

#### 2. **Security: Cookie Configuration** (Priority: MEDIUM)

**Location:** `src/lib/auth.ts:166-178`

**Current State:**
```typescript
useSecureCookies: false,
secure: false
```

**Problem:** Cookies are not marked as secure, allowing transmission over HTTP

**Recommendation:**
- For production with HTTPS, set `secure: true`
- Use environment-based configuration:
```typescript
useSecureCookies: process.env.NODE_ENV === 'production',
secure: process.env.NODE_ENV === 'production'
```

#### 3. **Update Endpoint Bug** (Priority: HIGH)

**Location:** `src/app/api/sales/[id]/route.ts:102`

**Problem:**
```typescript
propertyAddress: validatedData.propertyAddress, // Field doesn't exist!
```

**Impact:** Update requests will fail if this field is accessed

**Recommendation:**
Replace with:
```typescript
description: validatedData.description,
```

#### 4. **Missing Update Fields** (Priority: MEDIUM)

**Location:** `src/app/api/sales/[id]/route.ts:100-117`

**Problem:** Update data mapping is missing several fields present in create:
- `category`
- `currency`
- `creditStatus`
- `quantity`
- `unitPrice`
- `location`
- `notes` (present but in wrong position)

**Recommendation:** Ensure update data includes all fields that can be modified

#### 5. **Environment Variables** (Priority: LOW)

**Location:** `.env.production:9`

**Current:**
```
NEXTAUTH_SECRET=your-production-secret-key-change-this
```

**Recommendation:** Ensure this has been changed to a strong, unique secret in the actual deployment

### 📊 Performance Considerations

1. **Database Queries**
   - List endpoint includes asset relationship - monitor query performance with large datasets
   - Consider adding pagination for large result sets
   - Add indexes on frequently filtered columns (category, saleDate, assetId)

2. **Session Management**
   - 15-minute sessions may require frequent re-authentication
   - Consider implementing refresh tokens for better UX
   - Monitor session storage performance

### 🔒 Security Best Practices

1. **Rate Limiting**
   - Consider adding rate limiting to prevent abuse
   - Implement at the API gateway or application level

2. **Input Sanitization**
   - Zod validation is good, but consider additional sanitization for string fields
   - Protect against XSS in description/notes fields

3. **Audit Logging**
   - Consider logging all sale operations for audit trail
   - Track who created/updated/deleted sales

### 🚀 Enhancement Opportunities

1. **Bulk Operations**
   - Add endpoint for bulk sale creation (useful for CSV imports)
   - Add endpoint for bulk updates

2. **Export Functionality**
   - Add CSV/Excel export for sales data
   - Support date range exports

3. **Analytics Endpoints**
   - Sales summaries by category
   - Revenue analytics by date range
   - Commission reports

4. **Webhooks/Events**
   - Emit events on sale creation/update/deletion
   - Enable integration with other systems

---

## Testing Checklist

Use this checklist when testing the deployed API:

- [ ] Test unauthorized access returns 401
- [ ] Authentication succeeds with valid credentials
- [ ] Authentication fails with invalid credentials
- [ ] List all sales returns data
- [ ] Filter by category works
- [ ] Filter by date range works
- [ ] Create sale with minimal required fields
- [ ] Create sale with all optional fields
- [ ] Create sale validates enum values
- [ ] Create sale validates numeric ranges
- [ ] Create sale auto-calculates commission
- [ ] Get single sale by ID works
- [ ] Get non-existent sale returns 404
- [ ] Update sale modifies data correctly
- [ ] Update sale validates changes
- [ ] Delete sale removes record
- [ ] Delete non-existent sale returns 404
- [ ] Session expires after 15 minutes
- [ ] Permission-based access control works

---

## Related Files

| File | Purpose |
|------|---------|
| `src/app/api/sales/route.ts` | Main sales endpoint (GET, POST) |
| `src/app/api/sales/[id]/route.ts` | Individual sale operations (GET, PUT, DELETE) |
| `src/lib/auth.ts` | Authentication configuration |
| `src/lib/permissions.ts` | Permission system |
| `scripts/test-sales-api-coolify.js` | Automated test suite |
| `scripts/import-sales-to-production.js` | Production data import script |

---

## Conclusion

The Sales API is well-designed with proper authentication, validation, and permission controls. However, there are critical inconsistencies between the create and update schemas that need immediate attention. The update endpoint also has a bug referencing a non-existent field.

### Immediate Actions Required:

1. ✅ Fix update schema to match create schema categories and sale types
2. ✅ Fix `propertyAddress` bug in update endpoint
3. ✅ Add missing fields to update data mapping
4. ⚠️ Update NEXTAUTH_SECRET in production if not already done
5. ⚠️ Consider enabling secure cookies for production HTTPS deployment

### Future Enhancements:

1. Add pagination to list endpoint
2. Implement rate limiting
3. Add bulk operations
4. Create analytics endpoints
5. Implement audit logging

---

**Generated by:** Claude Code
**Review Date:** October 29, 2025
