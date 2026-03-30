# Frontend Integration Guide

How to integrate the Insurance Quote API into your Next.js (or any) frontend application.

---

## Quick Start

### 1. Setup API Client with Bearer Auth

```typescript
// lib/api.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Helper to create Bearer token header
export const createAuthHeader = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
});

// Admin client (for consultant management)
export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: createAuthHeader(ADMIN_API_KEY),
});
```

### 2. Register a Consultant

Called once during consultant onboarding. Returns the auto-generated `api_key` — **store it securely**.

```typescript
// lib/consultants.ts
import { createAuthHeader } from './api';
import axios from 'axios';

interface ConsultantData {
  onezone_id: string;
  name: string;
  surname: string;
  ecohub_username?: string;     // Optional
  ecohub_password?: string;     // Optional
  ecohub_totp_secret?: string;  // Optional (if 2FA enabled)
  commission_number?: string;
  registration_number?: string;
}

export const registerConsultant = async (
  data: ConsultantData,
  adminApiKey: string
) => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/consultants`,
    data,
    { headers: createAuthHeader(adminApiKey) }
  );
  return response.data; // { status, onezone_id, api_key }
};

export const getConsultant = async (
  onezone_id: string,
  adminApiKey: string
) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/consultants/${onezone_id}`,
    { headers: createAuthHeader(adminApiKey) }
  );
  return response.data;
};

export const updateConsultantCredentials = async (
  onezone_id: string,
  credentials: {
    ecohub_username: string;
    ecohub_password: string;
    ecohub_totp_secret?: string;
  },
  adminApiKey: string
) => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/consultants/${onezone_id}/credentials`,
    credentials,
    { headers: createAuthHeader(adminApiKey) }
  );
  return response.data;
};
```

### 3. Request Quotes

Send user data to generate quotes. Requires consultant `api_key` from Step 2.

```typescript
// lib/quotes.ts
import axios from 'axios';
import { createAuthHeader } from './api';

interface GenerateQuotesRequest {
  first_name: string;
  last_name: string;
  email: string;
  birthdate: string;              // DD.MM.YYYY
  nationality: string;            // ISO 3166-1 alpha-2 (CH, IT, FR, DE, etc)
  gender: string;                 // M or F
  marital_status: string;
  vehicle_registration: string;
  vehicle_type: string;
  vehicle_usage: string;
  vehicle_fuel: string;
  comprehensive_insurance: string; // Totale, Parziale, Responsabilita
  deductible: string;             // CHF500, CHF250, etc.
  canton?: string;
  [key: string]: any;             // Other fields from UserSchema
}

export const generateQuotes = async (
  userData: GenerateQuotesRequest,
  consultantApiKey: string,
  scrapers?: string[]
) => {
  const payload = {
    ...userData,
    ...(scrapers && { scrapers }),
  };

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/generate-quotes`,
    payload,
    { headers: createAuthHeader(consultantApiKey) }
  );
  return response.data; // { status, request_id, message }
};
```

### 4. Track Quote Status

Poll your Supabase database for progress (or implement a custom backend endpoint).

```typescript
// lib/requests.ts
import { supabase } from './supabase'; // Your Supabase client

export const pollQuoteStatus = async (requestId: number) => {
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) throw error;
  return data;
};

// Use React Query for automatic polling
import { useQuery } from '@tanstack/react-query';

export const useQuoteStatus = (requestId: number | null) => {
  return useQuery({
    queryKey: ['quoteStatus', requestId],
    queryFn: () => pollQuoteStatus(requestId!),
    refetchInterval: 5000,                    // Poll every 5 seconds
    refetchIntervalInBackground: true,
    enabled: !!requestId && requestId > 0,
  });
};
```

---

## Usage Patterns

### Pattern 1: Simple Quote Request (No Per-Consultant Auth)

For applications using a shared global account:

```typescript
const handleGenerateQuotes = async (formData: GenerateQuotesRequest) => {
  try {
    const response = await generateQuotes(formData, SHARED_CONSULTANT_API_KEY);
    const { request_id } = response;

    // Start polling for status
    const interval = setInterval(async () => {
      const status = await pollQuoteStatus(request_id);
      if (status.status === 'completed' || status.status === 'error') {
        clearInterval(interval);
        if (status.status === 'completed') {
          showSuccessMessage('Quotes ready!');
        } else {
          showErrorMessage(status.error_message);
        }
      }
    }, 5000);
  } catch (error) {
    console.error('Failed to generate quotes:', error);
    showErrorMessage('Request failed. Check console for details.');
  }
};
```

### Pattern 2: Multi-Tenant (Each Consultant Has Own Credentials)

```typescript
// Step 1: Register consultant during onboarding
const onboardConsultant = async (consultantInfo: ConsultantData) => {
  try {
    const result = await registerConsultant(consultantInfo, ADMIN_API_KEY);
    console.log('Consultant registered:', result.onezone_id);

    // ⚠️ CRITICAL: Save api_key securely (e.g., encrypted localStorage, session storage)
    // DO NOT expose in URLs or logs
    saveConsultantApiKey(result.api_key); // Your secure storage function

    return result;
  } catch (error) {
    if (error.response?.status === 409) {
      console.warn('Consultant already registered');
    } else {
      throw error;
    }
  }
};

// Step 2: Request quotes with consultant's api_key
const handleGenerateQuotes = async (formData: GenerateQuotesRequest) => {
  const consultantApiKey = getConsultantApiKey(); // Your secure retrieval function

  try {
    const response = await generateQuotes(
      formData,
      consultantApiKey,
      ['axa', 'helvetia', 'allianz', 'zurich'] // Optional: specify scrapers
    );

    const { request_id } = response;
    // Poll for completion...
  } catch (error) {
    if (error.response?.status === 429) {
      showErrorMessage('Session pool full. Please try again in a moment.');
    } else {
      showErrorMessage('Failed to generate quotes.');
    }
  }
};

// Step 3: Update credentials
const handleUpdateCredentials = async (newCredentials: CredentialUpdate) => {
  const onezone_id = getCurrentConsultantOnezoneId();
  try {
    await updateConsultantCredentials(onezone_id, newCredentials, ADMIN_API_KEY);
    showSuccessMessage('Credentials updated. Session evicted.');
  } catch (error) {
    showErrorMessage('Failed to update credentials.');
  }
};
```

### Pattern 3: React Component with React Query

```typescript
// components/QuoteGenerator.tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateQuotes, useQuoteStatus } from '@/lib/quotes';
import { useState } from 'react';

interface QuoteGeneratorProps {
  consultantApiKey: string;
}

export const QuoteGenerator = ({ consultantApiKey }: QuoteGeneratorProps) => {
  const [requestId, setRequestId] = useState<number | null>(null);

  // Mutation for generating quotes
  const generateMutation = useMutation({
    mutationFn: (formData: GenerateQuotesRequest) =>
      generateQuotes(formData, consultantApiKey),
    onSuccess: (data) => {
      setRequestId(data.request_id);
    },
    onError: (error: any) => {
      if (error.response?.status === 429) {
        alert('Session pool full. Please try again later.');
      } else {
        alert('Failed to generate quotes.');
      }
    },
  });

  // Query for polling status
  const { data: quoteStatus, isLoading: isPolling } = useQuoteStatus(requestId);

  const handleSubmit = (formData: GenerateQuotesRequest) => {
    generateMutation.mutate(formData);
  };

  return (
    <div className="quote-generator">
      {/* Form submission */}
      <button
        onClick={() => handleSubmit(formData)}
        disabled={generateMutation.isPending}
        className="submit-btn"
      >
        {generateMutation.isPending ? 'Generating...' : 'Generate Quotes'}
      </button>

      {/* Status display */}
      {requestId && (
        <div className="status">
          <p>Request ID: {requestId}</p>
          <p>Status: {quoteStatus?.status || 'pending'}</p>
          {isPolling && <p>Polling...</p>}
          {quoteStatus?.status === 'completed' && (
            <div className="success">
              ✅ Quotes ready! Check email or download from dashboard.
            </div>
          )}
          {quoteStatus?.status === 'error' && (
            <div className="error">
              ❌ Error: {quoteStatus.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## Environment Variables

Create `.env.local` in your Next.js project:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_API_KEY=<your-admin-api-key>

# Optional: Supabase for tracking (direct DB queries)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=<anon-key>

# Optional: For production, implement secure token delivery via backend
BACKEND_ADMIN_API_KEY=<server-side-secret>
```

**⚠️ Security Notes**:
- `ADMIN_API_KEY` should **NOT** be in `NEXT_PUBLIC_` unless you fully understand the security implications
- Better: Store admin key server-side, call a protected backend endpoint to manage consultants
- Consultant `api_key` returned from `/consultants` is user-specific and should be stored securely
- Never log or expose api_keys in errors or console

---

## Error Handling

```typescript
import axios from 'axios';

const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;

    switch (status) {
      case 401:
        console.error('Unauthorized: Invalid or missing API key');
        // Redirect to login or request re-auth
        break;
      case 403:
        console.error('Forbidden: Insufficient permissions');
        break;
      case 404:
        console.error('Not found: Resource does not exist');
        break;
      case 409:
        console.error('Conflict: Duplicate consultant');
        break;
      case 429:
        console.error('Too many requests: Pool is full, retry later');
        // Show user-friendly message, suggest retry
        break;
      case 422:
        console.error('Validation error:', message);
        // Show validation errors to user
        break;
      case 500:
        console.error('Server error:', message);
        break;
      default:
        console.error(`HTTP ${status}: ${message}`);
    }
  }
};

// Usage
try {
  await generateQuotes(data, apiKey);
} catch (error) {
  handleApiError(error);
}
```

---

## Security Best Practices

### ✅ DO

```typescript
// ✅ Use environment variables for sensitive config
const ADMIN_API_KEY = process.env.BACKEND_ADMIN_API_KEY; // Server-side only

// ✅ Store consultant api_key securely
localStorage.setItem('consultant_api_key', encryptedToken);

// ✅ Use HTTPS in production
const API_URL = process.env.NEXT_PUBLIC_API_URL; // Must be https://...

// ✅ Encrypt sensitive data in transit
// (Axios + HTTPS handles this automatically)

// ✅ Validate user input before sending
if (!isValidEmail(email)) {
  showError('Invalid email');
  return;
}
```

### ❌ DON'T

```typescript
// ❌ Don't expose ADMIN_API_KEY in frontend code
const ADMIN_KEY = "secret-key-here"; // NEVER!

// ❌ Don't log api_keys
console.log('Token:', consultantApiKey); // NEVER!

// ❌ Don't embed credentials in source code
const API_PASSWORD = "password123"; // NEVER!

// ❌ Don't expose in error messages
showError(`API error: ${apiKey} failed`); // NEVER!
```

---

## Testing the Integration

### Manual Testing with Axios

```typescript
import axios from 'axios';

const testIntegration = async () => {
  const ADMIN_API_KEY = 'your-secret-admin-key';
  const API_URL = 'http://localhost:8000';

  try {
    // 1. Health check
    console.log('1. Health check...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health:', health.data);

    // 2. Create consultant
    console.log('2. Creating consultant...');
    const consultantRes = await axios.post(
      `${API_URL}/consultants`,
      {
        onezone_id: 'test_001',
        name: 'Test',
        surname: 'User',
        ecohub_username: 'test@example.com',
        ecohub_password: 'password123',
      },
      { headers: { 'Authorization': `Bearer ${ADMIN_API_KEY}` } }
    );
    const { api_key } = consultantRes.data;
    console.log('✅ Consultant created, api_key:', api_key);

    // 3. Generate quotes
    console.log('3. Generating quotes...');
    const quotesRes = await axios.post(
      `${API_URL}/generate-quotes`,
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        birthdate: '1980-01-15',
        nationality: 'CH',
        gender: 'M',
        marital_status: 'Single',
        vehicle_registration: 'AB123CD',
        vehicle_type: 'Car',
        vehicle_usage: 'Commuting',
        vehicle_fuel: 'Benzin',
        comprehensive_insurance: 'Totale',
        deductible: 'CHF500',
      },
      { headers: { 'Authorization': `Bearer ${api_key}` } }
    );
    console.log('✅ Quotes requested, request_id:', quotesRes.data.request_id);

    // 4. Check session pool
    console.log('4. Checking sessions...');
    const sessionsRes = await axios.get(
      `${API_URL}/sessions`,
      { headers: { 'Authorization': `Bearer ${ADMIN_API_KEY}` } }
    );
    console.log('✅ Sessions:', sessionsRes.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testIntegration();
```

---

## Troubleshooting

### "Invalid or missing API key" (401)

**Cause**: Bearer token is invalid, expired, or malformed.

**Solution**:
- Verify api_key is correct (check database: `select api_key from consultants`)
- Verify header format: `Authorization: Bearer <api_key>` (not `Basic`, not missing `Bearer`)
- Check if consultant is marked `is_active = true`

### "Session pool full" (429)

**Cause**: 5 different consultants are already generating quotes.

**Solution**:
- Wait for active sessions to complete (idle timeout: 30 min)
- Check `/sessions` endpoint to see pool status
- Retry with exponential backoff

### "Consultant not found" (404)

**Cause**: Consultant doesn't exist or wrong `onezone_id`.

**Solution**:
- Verify consultant was registered with `POST /consultants`
- Use `GET /consultants/{onezone_id}` to verify status
- Check spelling of `onezone_id`

### Quotes not generating

**Cause**: Validation error or scraper failure.

**Solution**:
- Check `quote_requests.error_message` in Supabase
- Verify user data matches UserSchema (check `modules/schemas.py`)
- Verify EcoHub credentials are correct and TOTP secret (if 2FA enabled)
- Check server logs for detailed error messages

---

## API Reference

### Core Endpoints

#### `POST /consultants` — Register Consultant

Register a new consultant and receive an auto-generated API key.

**Auth**: Requires `ADMIN_API_KEY`

**Request**:
```typescript
POST /consultants
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json

{
  "onezone_id": "consultant_123",           // Unique identifier (required)
  "name": "John",                           // Consultant name (optional)
  "surname": "Doe",                         // Consultant surname (optional)
  "ecohub_username": "john@example.com",    // EcoHub email (optional)
  "ecohub_password": "password123",         // EcoHub password (optional)
  "ecohub_totp_secret": "JBSWY3DPEBLW64...", // 2FA secret (optional, if enabled)
  "commission_number": "COM123",            // Commission number (optional)
  "registration_number": "REG123"           // Registration number (optional)
}
```

**Response** (201 Created):
```json
{
  "status": "created",
  "onezone_id": "consultant_123",
  "api_key": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Codes**:
- `409` — Consultant already exists (duplicate `onezone_id`)
- `500` — Server error during creation

**Important**: Save the `api_key` securely — it cannot be retrieved later and is required for all quote requests.

---

#### `GET /consultants/{onezone_id}` — Get Consultant

Retrieve consultant metadata (credentials are never exposed).

**Auth**: Requires `ADMIN_API_KEY`

**Request**:
```typescript
GET /consultants/consultant_123
Authorization: Bearer <ADMIN_API_KEY>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "onezone_id": "consultant_123",
  "name": "John",
  "surname": "Doe",
  "commission_number": "COM123",
  "registration_number": "REG123",
  "is_active": true,
  "created_at": "2026-03-09T10:00:00Z",
  "updated_at": "2026-03-09T10:00:00Z"
}
```

**Error Codes**:
- `404` — Consultant not found
- `401` — Invalid or missing API key

---

#### `POST /consultants/{onezone_id}/credentials` — Update EcoHub Credentials

Update a consultant's EcoHub login credentials and evict any active browser session.

**Auth**: Requires `ADMIN_API_KEY`

**Request**:
```typescript
POST /consultants/consultant_123/credentials
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json

{
  "ecohub_username": "new_email@example.com",
  "ecohub_password": "new_password123",
  "ecohub_totp_secret": "JBSWY3DPEBLW64..."  // Optional
}
```

**Response** (200 OK):
```json
{
  "status": "updated",
  "onezone_id": "consultant_123"
}
```

**Important**: The endpoint updates credentials in the database **before** evicting the session. This ensures the next scraping request uses the new credentials.

**Error Codes**:
- `404` — Consultant not found
- `401` — Invalid API key

---

#### `POST /consultants/{consultant_id}/verify-login` — Verify EcoHub Credentials

Test a consultant's EcoHub login credentials by attempting an actual authentication.

**Auth**: Requires `ADMIN_API_KEY`

**Request**:
```typescript
POST /consultants/1/verify-login
Authorization: Bearer <ADMIN_API_KEY>
```

**Response**:
```json
{
  "status": "verified",
  "login_check": true
}
```

Or on failure:
```json
{
  "status": "failed",
  "login_check": false,
  "error": "Invalid EcoHub credentials"
}
```

**Status Values**:
- `already_verified` — Consultant credentials passed a previous verification
- `verified` — Login succeeded, flag updated in database
- `failed` — Login failed (check `error` field)
- `error` — Missing credentials or consultant not found (check `error` field)

**Error Codes**:
- `404` — Consultant not found
- `401` — Invalid API key

---

#### `GET /sessions` — Get Session Pool Status

Check the current state of the consultant session pool (max 5 concurrent sessions).

**Auth**: Requires `ADMIN_API_KEY`

**Request**:
```typescript
GET /sessions
Authorization: Bearer <ADMIN_API_KEY>
```

**Response**:
```json
{
  "active_sessions": 2,
  "max_sessions": 5,
  "sessions": [
    {
      "session_id": 1,
      "onezone_id": "consultant_123",
      "status": "active",
      "last_used": "2026-03-09T10:30:00Z",
      "idle_minutes": 2
    },
    {
      "session_id": 2,
      "onezone_id": "consultant_456",
      "status": "active",
      "last_used": "2026-03-09T10:25:00Z",
      "idle_minutes": 7
    }
  ]
}
```

**Note**: Sessions are automatically evicted after 30 minutes of inactivity.

---

### Quote Generation

#### `POST /generate-quotes` — Generate Insurance Quotes

Request insurance quotes for a user. Validates user data and queues scraping task.

**Auth**: Requires consultant `api_key` (from `/consultants` registration)

**Request**:
```typescript
POST /generate-quotes
Authorization: Bearer <consultant_api_key>
Content-Type: application/json

{
  // User Information
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "birth_date": "01.01.1990",
  "nationality": "CH",
  "gender": "Maschio",
  "language": "de",

  // Address
  "zip_code": "8000",
  "canton": "ZH",
  "area": "Zurich",
  "address": "Bahnhofstrasse",
  "address_number": "1",

  // Contact
  "phone": "+41791234567",

  // Vehicle 1
  "car_brand_1": "Tesla",
  "car_model_1": "Model 3",
  "serial_number_1": "5Y2SR67049Z123456",
  "first_registration_date_1": "01.01.2020",
  "leasing_1": "No",
  "garage_parking_1": "Si",
  "interchangeable_plate": "No",
  "license_plate": "ZH123456",

  // Insurance Options
  "vehicle_usage": "Uso privato",
  "civil_insurance": "No",
  "comprehensive_insurance": "Totale",
  "headlights_mirrors": "Si",
  "personal_belongings_coverage": "2000",
  "tires_damage": "No",
  "bonus_protection": "Si",
  "roadside_assistance": "Si",
  "garage_free_choice": "fissa",
  "passenger_injury": "Si",
  "payment_mode": "Annuale",

  // Claims History
  "current_insurance": "Allianz",
  "n_rc_claims_5_years": "0",
  "n_collisions_claims_5_years": "0",
  "n_parking_claims_5_years": "0",
  "n_glass_claims_5_years": "0",
  "n_partial_comprehensive_claims_5_years": "0",

  // Optional
  "scrapers": ["axa", "helvetia", "allianz", "zurich", "automate"],
  "first_driving_license_date": "01.01.2005"
}
```

**Response** (202 Accepted):
```json
{
  "status": "accepted",
  "request_id": 42,
  "message": "Quote request saved and processing queued"
}
```

**Error Codes**:
- `422` — Validation error (missing or invalid fields)
- `429` — Session pool full (max 5 concurrent consultants), retry later
- `401` — Invalid consultant API key
- `500` — Database or server error

**Important**:
- The endpoint returns immediately with a `request_id` — scraping happens asynchronously
- Poll the Supabase database (or a custom endpoint) for completion status
- Consultant must have EcoHub credentials (set via `/consultants/{id}/credentials`) or use fallback global account
- If `scrapers` array is omitted, all available scrapers are used

---

### TOTP & 2FA

#### `POST /extract-totp-secret` — Extract TOTP Secret from QR Code

Extract the TOTP secret from an authenticator QR code image (useful for 2FA setup).

**Auth**: None (public endpoint)

**Request**:
```typescript
POST /extract-totp-secret
Content-Type: multipart/form-data

[Form Data]
qr_image: <binary image file (PNG, JPG, etc.)>
```

**Response**:
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "issuer": "EcoHub",
  "name": "john@example.com"
}
```

**Error Codes**:
- `400` — File is not an image
- `422` — No QR code found or invalid TOTP URI

**Usage**: Useful when onboarding consultants with 2FA enabled. Users can upload their QR code, and the API extracts the secret for storage.

---

### Debug & Testing

#### `POST /debug-generate-quotes` — Debug Quote Endpoint

Temporary endpoint for debugging request body validation. Logs raw request and validation errors.

**Auth**: None (debug only)

**Request**:
```typescript
POST /debug-generate-quotes
Content-Type: application/json

// Any JSON payload — will log validation errors against QuoteRequest schema
```

**Response**:
```json
{
  "content_type": "application/json",
  "raw_body_preview": "{ \"first_name\": \"John\", ... }",
  "parsed_json_keys": ["first_name", "last_name", "email", ...],
  "parsed_json": { ... },
  "validation_errors": [
    {
      "type": "missing",
      "loc": ["email"],
      "msg": "Field required"
    }
  ]
}
```

**⚠️ Warning**: This endpoint is for development only — remove before production deployment.

---

#### `POST /test-single-user` — Test with Predefined User

Process a predefined test user through all scrapers (or selected ones).

**Auth**: None (test endpoint)

**Request**:
```typescript
POST /test-single-user
Content-Type: application/json

{
  "scrapers": ["axa", "helvetia"]  // Optional — if omitted, all scrapers run
}
```

**Response**:
```json
{
  "status": "accepted",
  "message": "Test task queued (Scrapers: all)"
}
```

**⚠️ Warning**: This endpoint has no authentication — remove before production deployment.

---

#### `POST /test-by-request-id/{request_id}` — Re-run Request

Re-run scraping for an existing request ID from the database (useful for debugging failed requests).

**Auth**: None (test endpoint)

**Request**:
```typescript
POST /test-by-request-id/42
Content-Type: application/json

{
  "scrapers": ["axa"],    // Optional — specific scrapers to run
  "update_db": true,      // Update database with new results
  "send_email": false     // Send email to user (optional)
}
```

**Response**:
```json
{
  "status": "accepted",
  "request_id": 42,
  "message": "Test task queued for request 42 (Scrapers: all)"
}
```

**⚠️ Warning**: This endpoint has no authentication — remove before production deployment.

---

### Health & Status

#### `GET /health` — Health Check

Simple health check endpoint for monitoring.

**Auth**: None

**Request**:
```typescript
GET /health
```

**Response**:
```json
{
  "status": "ok"
}
```

---

## Quick Reference Table

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/consultants` | POST | ADMIN_API_KEY | Register new consultant, get auto-generated api_key |
| `/consultants/{onezone_id}` | GET | ADMIN_API_KEY | Get consultant metadata |
| `/consultants/{onezone_id}/credentials` | POST | ADMIN_API_KEY | Update EcoHub credentials |
| `/consultants/{consultant_id}/verify-login` | POST | ADMIN_API_KEY | Verify EcoHub credentials by attempting login |
| `/sessions` | GET | ADMIN_API_KEY | Check session pool status (max 5 concurrent) |
| `/generate-quotes` | POST | Consultant api_key | Request quotes (async) |
| `/extract-totp-secret` | POST | None | Extract TOTP secret from QR code image |
| `/debug-generate-quotes` | POST | None | Debug endpoint — logs validation errors (remove before production) |
| `/test-single-user` | POST | None | Test with predefined user (remove before production) |
| `/test-by-request-id/{id}` | POST | None | Re-run scraping for existing request (remove before production) |
| `/health` | GET | None | Health check |
