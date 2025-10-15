# Hotel Manager Application Process Guide

## Overview

This guide explains how legitimate hotel managers can register and get approved to manage hotels on the FinalDestination platform.

## 🔐 Security Model

For security reasons, all users initially register as **Guests**. Hotel managers must go through an application and approval process to gain hotel management privileges.

### Why This Approach?

- **Prevents Abuse**: Stops malicious users from self-assigning elevated privileges
- **Quality Control**: Ensures only legitimate businesses join the platform
- **Legal Compliance**: Verifies business licenses and documentation
- **Brand Protection**: Maintains platform reputation and trust

## 🚀 Application Process

### Step 1: Register as a Guest

**Endpoint**: `POST /api/auth/register`

```json
{
  "name": "John Smith",
  "email": "john@grandhotel.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "contactNumber": "+1234567890"
}
```

**Response**: You'll receive a JWT token and be logged in as a Guest.

### Step 2: Submit Hotel Manager Application

**Endpoint**: `POST /api/auth/apply-hotel-manager`  
**Authorization**: Bearer token (from Step 1)

```json
{
  "businessName": "Grand Hotel & Resort",
  "businessAddress": "123 Main Street, Miami, FL 33101",
  "businessLicense": "FL-HOTEL-2024-001234",
  "contactPerson": "John Smith",
  "businessPhone": "+1234567890",
  "businessEmail": "info@grandhotel.com",
  "additionalInfo": "Family-owned hotel operating since 1995. We have 50 rooms and offer luxury accommodations."
}
```

**Response**:
```json
{
  "id": 1,
  "userId": 123,
  "userName": "John Smith",
  "userEmail": "john@grandhotel.com",
  "businessName": "Grand Hotel & Resort",
  "businessAddress": "123 Main Street, Miami, FL 33101",
  "businessLicense": "FL-HOTEL-2024-001234",
  "contactPerson": "John Smith",
  "businessPhone": "+1234567890",
  "businessEmail": "info@grandhotel.com",
  "additionalInfo": "Family-owned hotel operating since 1995...",
  "applicationDate": "2024-12-01T10:00:00Z",
  "status": "Pending",
  "statusText": "Pending"
}
```

### Step 3: Check Application Status

**Endpoint**: `GET /api/auth/my-application`  
**Authorization**: Bearer token

**Response**: Same as Step 2, with updated status and admin notes if processed.

### Step 4: Admin Approval

An administrator will review your application and either:
- **Approve**: Your role is upgraded to Hotel Manager
- **Reject**: Application denied with reason
- **Request More Info**: Additional documentation needed

Once approved, you can immediately start creating and managing hotels!

## 📋 Application Requirements

### Required Information

| Field | Description | Example |
|-------|-------------|---------|
| **Business Name** | Official hotel/business name | "Grand Hotel & Resort" |
| **Business Address** | Full physical address | "123 Main St, Miami, FL 33101" |
| **Business License** | License/registration number | "FL-HOTEL-2024-001234" |
| **Contact Person** | Primary contact name | "John Smith" |
| **Business Phone** | Business phone number | "+1234567890" |
| **Business Email** | Business email address | "info@grandhotel.com" |
| **Additional Info** | Optional details about your business | "Family-owned since 1995..." |

### Validation Rules

- **Business Name**: 2-200 characters
- **Business Address**: 10-500 characters
- **Business License**: 3-100 characters
- **Contact Person**: 2-100 characters
- **Business Phone**: Valid phone format, max 20 characters
- **Business Email**: Valid email format, max 255 characters
- **Additional Info**: Optional, max 1000 characters

## 🔄 Application Statuses

| Status | Description | Next Steps |
|--------|-------------|------------|
| **Pending** | Application submitted, awaiting review | Wait for admin review (typically 3-5 business days) |
| **Approved** | Application approved, role upgraded | You can now create and manage hotels! |
| **Rejected** | Application denied | Review admin notes and reapply if appropriate |
| **RequiresMoreInfo** | Additional information needed | Provide requested information and resubmit |

## 🎯 After Approval

Once your application is approved:

1. **Your role is automatically upgraded** to Hotel Manager
2. **You can create hotels** using `POST /api/hotels`
3. **You can update hotels** using `PUT /api/hotels/{id}`
4. **You can view all bookings** for your hotels
5. **You can manage hotel details** including pricing and availability

## 🛠️ Admin Endpoints

### View All Applications

**Endpoint**: `GET /api/auth/admin/applications?status=Pending`  
**Authorization**: Admin role required

Query Parameters:
- `status` (optional): Filter by ApplicationStatus (Pending, Approved, Rejected, RequiresMoreInfo)

### Process Application

**Endpoint**: `POST /api/auth/admin/applications/{id}/process`  
**Authorization**: Admin role required

```json
{
  "status": "Approved",
  "adminNotes": "All documents verified. Business license is valid and active."
}
```

Valid statuses:
- `Approved` - Upgrades user to Hotel Manager
- `Rejected` - Denies application
- `RequiresMoreInfo` - Requests additional information

## 🧪 Testing Examples

### Complete Flow with cURL

```bash
# Step 1: Register
curl -X POST "https://localhost:7000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Manager",
    "email": "jane@luxuryhotel.com",
    "password": "Manager123!",
    "confirmPassword": "Manager123!",
    "contactNumber": "+1987654321"
  }'

# Save the token from response

# Step 2: Apply for Hotel Manager
curl -X POST "https://localhost:7000/api/auth/apply-hotel-manager" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Luxury Beach Resort",
    "businessAddress": "456 Ocean Drive, Miami Beach, FL 33139",
    "businessLicense": "FL-RESORT-2024-567890",
    "contactPerson": "Jane Manager",
    "businessPhone": "+1987654321",
    "businessEmail": "contact@luxuryhotel.com",
    "additionalInfo": "Beachfront resort with 100 rooms, spa, and fine dining."
  }'

# Step 3: Check application status
curl -X GET "https://localhost:7000/api/auth/my-application" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Admin: Approve application (requires admin token)
curl -X POST "https://localhost:7000/api/auth/admin/applications/1/process" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Approved",
    "adminNotes": "Verified business license and documentation. Approved."
  }'
```

## 🔍 Common Issues

### "Only Guest users can apply for Hotel Manager role"
- You're already a Hotel Manager or Admin
- No need to apply again

### "You already have a pending application"
- Wait for your current application to be processed
- Check status with `GET /api/auth/my-application`

### "You already have an approved application"
- Your role has been upgraded
- You may need to log out and log back in to get updated token

### "Authorization token is required"
- Make sure you're logged in
- Include `Authorization: Bearer <token>` header in your request

## 📞 Support

If you have questions about the application process:
1. Check your application status regularly
2. Review admin notes if your application requires more information
3. Contact platform support if you need assistance

## 🎯 Best Practices

1. **Provide Accurate Information**: Ensure all business details are correct
2. **Valid Documentation**: Use real business license numbers
3. **Professional Email**: Use your business email address
4. **Complete Additional Info**: Provide context about your hotel business
5. **Be Patient**: Allow 3-5 business days for review
6. **Respond Promptly**: If more information is requested, respond quickly

## 🔒 Security Notes

- Never share your JWT token
- Use strong passwords for your account
- Keep your business information up to date
- Report any suspicious activity immediately

---

**Ready to get started?** Register as a Guest and submit your Hotel Manager application today!
