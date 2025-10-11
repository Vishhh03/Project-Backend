# FinalDestination API - Complete Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Database Configuration](#database-configuration)
- [Running the Application](#running-the-application)
- [Testing the API](#testing-the-api)
- [IDE Configuration](#ide-configuration)
- [Deployment Options](#deployment-options)
- [Environment-Specific Configurations](#environment-specific-configurations)

## Prerequisites

### Required Software

1. **.NET 8 SDK**
   - **Download**: [https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0)
   - **Verify Installation**: 
     ```bash
     dotnet --version
     # Should show 8.0.x or higher
     ```

2. **SQL Server LocalDB** (Recommended)
   - **Option 1**: Install with Visual Studio 2022
   - **Option 2**: Download SQL Server Express with LocalDB
   - **Download**: [https://www.microsoft.com/en-us/sql-server/sql-server-downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
   - **Verify Installation**:
     ```bash
     sqllocaldb info
     # Should list available LocalDB instances
     ```

3. **Git** (for version control)
   - **Download**: [https://git-scm.com/downloads](https://git-scm.com/downloads)
   - **Verify Installation**:
     ```bash
     git --version
     ```

### Recommended Tools

1. **Visual Studio 2022** (Recommended IDE)
   - **Edition**: Community (free) or higher
   - **Workloads**: ASP.NET and web development
   - **Download**: [https://visualstudio.microsoft.com/downloads/](https://visualstudio.microsoft.com/downloads/)

2. **Visual Studio Code** (Alternative IDE)
   - **Download**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - **Required Extensions**:
     - C# for Visual Studio Code
     - .NET Extension Pack
     - REST Client (for API testing)

3. **API Testing Tools**
   - **Postman**: [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
   - **Insomnia**: [https://insomnia.rest/download](https://insomnia.rest/download)
   - **Thunder Client** (VS Code extension)

4. **Database Management** (Optional)
   - **SQL Server Management Studio (SSMS)**: [Download SSMS](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
   - **Azure Data Studio**: [Download Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio)

## Development Environment Setup

### Option 1: Visual Studio 2022 Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd FinalDestinationAPI
   ```

2. **Open in Visual Studio**
   - Open Visual Studio 2022
   - Click "Open a project or solution"
   - Navigate to the cloned folder
   - Select `FinalDestinationAPI.sln` or `FinalDestinationAPI.csproj`

3. **Restore NuGet Packages**
   - Visual Studio will automatically restore packages
   - Or manually: Right-click solution → "Restore NuGet Packages"

4. **Build the Solution**
   - Press `Ctrl+Shift+B` or Build → Build Solution
   - Ensure no build errors

### Option 2: Visual Studio Code Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd FinalDestinationAPI
   ```

2. **Open in VS Code**
   ```bash
   code .
   ```

3. **Install Required Extensions**
   - C# for Visual Studio Code (ms-dotnettools.csharp)
   - .NET Extension Pack (ms-dotnettools.vscode-dotnet-pack)

4. **Restore Dependencies**
   ```bash
   dotnet restore
   ```

5. **Build the Project**
   ```bash
   dotnet build
   ```

### Option 3: Command Line Setup

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd FinalDestinationAPI
   ```

2. **Restore and Build**
   ```bash
   dotnet restore
   dotnet build
   ```

## Database Configuration

### Option 1: SQL Server LocalDB (Recommended)

1. **Verify LocalDB Installation**
   ```bash
   sqllocaldb info
   ```

2. **Start LocalDB Instance**
   ```bash
   sqllocaldb start mssqllocaldb
   ```

3. **Configuration**
   - The application is pre-configured for LocalDB
   - Connection string in `appsettings.json`:
     ```json
     {
       "ConnectionStrings": {
         "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinalDestinationDB;Trusted_Connection=true;MultipleActiveResultSets=true"
       }
     }
     ```

4. **Database Creation**
   - Database will be created automatically on first run
   - Sample data will be seeded automatically

### Option 2: In-Memory Database (For Testing)

1. **Modify Configuration**
   ```json
   // In appsettings.Development.json
   {
     "UseLocalDb": false
   }
   ```

2. **Benefits**
   - No SQL Server installation required
   - Faster startup for testing
   - Data is reset on each application restart

### Option 3: Full SQL Server Instance

1. **Install SQL Server**
   - Download SQL Server Developer Edition (free)
   - Or use SQL Server Express

2. **Update Connection String**
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=FinalDestinationDB;Trusted_Connection=true;MultipleActiveResultSets=true"
     }
   }
   ```

3. **Create Database**
   ```bash
   dotnet ef database update
   ```

## Running the Application

### Method 1: Visual Studio

1. **Set Startup Project**
   - Right-click on `FinalDestinationAPI` project
   - Select "Set as Startup Project"

2. **Run the Application**
   - Press `F5` (Debug mode) or `Ctrl+F5` (Without debugging)
   - Application will open in browser at `https://localhost:7000`

### Method 2: Visual Studio Code

1. **Run with Debugger**
   - Press `F5`
   - Select ".NET Core" if prompted
   - Application will start with debugger attached

2. **Run without Debugger**
   ```bash
   dotnet run
   ```

### Method 3: Command Line

1. **Development Mode**
   ```bash
   dotnet run
   ```

2. **Watch Mode (Auto-restart on changes)**
   ```bash
   dotnet watch run
   ```

3. **Production Mode**
   ```bash
   dotnet run --environment Production
   ```

### Verify Application is Running

1. **Check Console Output**
   ```
   info: Microsoft.Hosting.Lifetime[14]
         Now listening on: https://localhost:7000
   info: Microsoft.Hosting.Lifetime[14]
         Now listening on: http://localhost:5000
   ```

2. **Open Browser**
   - Navigate to `https://localhost:7000`
   - Should see Swagger UI interface

3. **Test API Endpoint**
   ```bash
   curl https://localhost:7000/api/hotels
   ```

## Testing the API

### Using Swagger UI (Recommended for Beginners)

1. **Access Swagger UI**
   - Open browser to `https://localhost:7000`
   - Swagger UI is the default page

2. **Test Authentication**
   - Expand "Auth" section
   - Click on "POST /api/auth/login"
   - Click "Try it out"
   - Use sample credentials:
     ```json
     {
       "email": "admin@hotel.com",
       "password": "Admin123!"
     }
     ```
   - Click "Execute"
   - Copy the token from the response

3. **Authorize Requests**
   - Click "Authorize" button at top of page
   - Enter: `Bearer <your-token>`
   - Click "Authorize"

4. **Test Protected Endpoints**
   - Try any endpoint marked with a lock icon
   - Should now work with your authorization

### Using Postman

1. **Import Collection**
   - Create a new collection in Postman
   - Add requests for each endpoint

2. **Set Base URL**
   - Create environment variable: `baseUrl = https://localhost:7000`

3. **Authentication Setup**
   - Login to get token
   - Set Authorization header: `Bearer <token>`
   - Use collection-level authorization

4. **Sample Requests**
   ```bash
   # Login
   POST {{baseUrl}}/api/auth/login
   Content-Type: application/json
   
   {
     "email": "admin@hotel.com",
     "password": "Admin123!"
   }
   
   # Get Hotels
   GET {{baseUrl}}/api/hotels
   
   # Create Booking (requires auth)
   POST {{baseUrl}}/api/bookings
   Authorization: Bearer <token>
   Content-Type: application/json
   
   {
     "hotelId": 1,
     "checkInDate": "2024-12-01",
     "checkOutDate": "2024-12-03",
     "numberOfGuests": 2,
     "guestName": "John Doe",
     "guestEmail": "john@example.com"
   }
   ```

### Using cURL

1. **Login**
   ```bash
   curl -X POST "https://localhost:7000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@hotel.com", "password": "Admin123!"}'
   ```

2. **Get Hotels**
   ```bash
   curl "https://localhost:7000/api/hotels"
   ```

3. **Protected Request**
   ```bash
   curl -X GET "https://localhost:7000/api/bookings/my" \
     -H "Authorization: Bearer <your-token>"
   ```

## IDE Configuration

### Visual Studio 2022 Configuration

1. **Debugging Settings**
   - Tools → Options → Debugging
   - Enable "Suppress JIT optimization on module load"
   - Enable "Enable .NET Framework source stepping"

2. **Code Style**
   - Tools → Options → Text Editor → C# → Code Style
   - Configure formatting preferences
   - Enable EditorConfig support

3. **Extensions** (Optional)
   - Web Essentials
   - Productivity Power Tools
   - CodeMaid

### Visual Studio Code Configuration

1. **Settings Configuration**
   ```json
   // .vscode/settings.json
   {
     "dotnet.defaultSolution": "FinalDestinationAPI.sln",
     "omnisharp.enableRoslynAnalyzers": true,
     "editor.formatOnSave": true,
     "csharp.format.enable": true
   }
   ```

2. **Launch Configuration**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": ".NET Core Launch (web)",
         "type": "coreclr",
         "request": "launch",
         "preLaunchTask": "build",
         "program": "${workspaceFolder}/bin/Debug/net8.0/FinalDestinationAPI.dll",
         "args": [],
         "cwd": "${workspaceFolder}",
         "stopAtEntry": false,
         "serverReadyAction": {
           "action": "openExternally",
           "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
         },
         "env": {
           "ASPNETCORE_ENVIRONMENT": "Development"
         }
       }
     ]
   }
   ```

3. **Tasks Configuration**
   ```json
   // .vscode/tasks.json
   {
     "version": "2.0.0",
     "tasks": [
       {
         "label": "build",
         "command": "dotnet",
         "type": "process",
         "args": ["build", "${workspaceFolder}/FinalDestinationAPI.csproj"],
         "problemMatcher": "$msCompile"
       }
     ]
   }
   ```

## Deployment Options

### Local IIS Deployment

1. **Publish Application**
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. **Configure IIS**
   - Install IIS with ASP.NET Core Module
   - Create new website pointing to publish folder
   - Configure application pool for "No Managed Code"

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
   WORKDIR /app
   EXPOSE 80
   EXPOSE 443
   
   FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
   WORKDIR /src
   COPY ["FinalDestinationAPI.csproj", "."]
   RUN dotnet restore "./FinalDestinationAPI.csproj"
   COPY . .
   WORKDIR "/src/."
   RUN dotnet build "FinalDestinationAPI.csproj" -c Release -o /app/build
   
   FROM build AS publish
   RUN dotnet publish "FinalDestinationAPI.csproj" -c Release -o /app/publish
   
   FROM base AS final
   WORKDIR /app
   COPY --from=publish /app/publish .
   ENTRYPOINT ["dotnet", "FinalDestinationAPI.dll"]
   ```

2. **Build and Run**
   ```bash
   docker build -t simple-hotel-api .
   docker run -p 8080:80 simple-hotel-api
   ```

### Azure App Service Deployment

1. **Publish from Visual Studio**
   - Right-click project → Publish
   - Choose Azure App Service
   - Follow wizard to create and deploy

2. **CLI Deployment**
   ```bash
   # Install Azure CLI
   az login
   az webapp up --name your-app-name --resource-group your-rg
   ```

## Environment-Specific Configurations

### Development Environment

```json
// appsettings.Development.json
{
  "UseLocalDb": true,
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinalDestinationDB_Dev;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "DevelopmentSuperSecretKeyThatIsAtLeast32CharactersLongForJWTTokenGeneration!",
    "ExpiryInHours": 24
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  },
  "Payment": {
    "MockSuccessRate": 1.0,
    "ProcessingDelayMs": 500
  }
}
```

### Production Environment

```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-prod-server;Database=FinalDestinationDB;User Id=your-user;Password=your-password;Encrypt=true;TrustServerCertificate=false;"
  },
  "Jwt": {
    "Key": "ProductionSuperSecretKeyThatIsAtLeast32CharactersLongForJWTTokenGeneration!",
    "ExpiryInHours": 1
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Payment": {
    "MockSuccessRate": 0.95,
    "ProcessingDelayMs": 2000
  }
}
```

### Environment Variables

```bash
# Set environment variables
export ASPNETCORE_ENVIRONMENT=Development
export ConnectionStrings__DefaultConnection="your-connection-string"
export Jwt__Key="your-jwt-key"

# Windows
set ASPNETCORE_ENVIRONMENT=Development
set ConnectionStrings__DefaultConnection=your-connection-string
set Jwt__Key=your-jwt-key
```

## Troubleshooting Setup Issues

### Common Issues and Solutions

1. **Port Already in Use**
   ```bash
   # Find process using port
   netstat -ano | findstr :7000
   # Kill process
   taskkill /PID <process-id> /F
   ```

2. **SSL Certificate Issues**
   ```bash
   dotnet dev-certs https --clean
   dotnet dev-certs https --trust
   ```

3. **Database Connection Issues**
   ```bash
   # Check LocalDB status
   sqllocaldb info
   # Start LocalDB
   sqllocaldb start mssqllocaldb
   ```

4. **NuGet Package Issues**
   ```bash
   # Clear NuGet cache
   dotnet nuget locals all --clear
   # Restore packages
   dotnet restore
   ```

### Verification Checklist

- [ ] .NET 8 SDK installed and working
- [ ] SQL Server LocalDB installed and running
- [ ] Project builds without errors
- [ ] Database connection successful
- [ ] Application starts on correct ports
- [ ] Swagger UI accessible
- [ ] Sample data loaded correctly
- [ ] Authentication working
- [ ] API endpoints responding

## Next Steps

After successful setup:

1. **Explore the API** using Swagger UI
2. **Test different endpoints** with various user roles
3. **Review the code** to understand implementation
4. **Try the exercises** in the Learning Resources guide
5. **Experiment with modifications** to learn more

For additional help, refer to:
- [API Documentation](API_DOCUMENTATION.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Learning Resources](LEARNING_RESOURCES.md)




