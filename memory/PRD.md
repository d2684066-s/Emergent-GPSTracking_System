# GCE Campus Transportation & Safety System - PRD

## Original Problem Statement
Build a comprehensive campus transportation and safety management system consisting of three panels:
- **Public App (GCE Map App)**: Mobile web app for students to track buses and book ambulances
- **Driver App (GCE Driver App)**: Mobile web app for bus and ambulance drivers
- **Admin Panel**: Web-based dashboard for campus administrators

## User Personas
1. **Students**: Track buses, book ambulances, view ETA
2. **Bus Drivers**: Start/end trips, mark out-of-station, track location
3. **Ambulance Drivers**: Accept bookings, verify OTP, complete rides
4. **Administrators**: Manage vehicles, view offences, monitor system

## Core Requirements (Static)
- JWT-based authentication with role separation (student, driver, admin)
- Vehicle management (buses/ambulances) with unique IMEI and barcode
- Real-time GPS tracking via mock endpoint
- Ambulance booking with OTP verification (mock system)
- ETA calculation using Haversine formula
- Speed violation detection (40km/h campus limit)
- RFID-based student offence tracking

## What's Been Implemented (Jan 2026)

### Backend (FastAPI + MongoDB)
- ✅ Complete RESTful API with /api/auth, /api/public, /api/driver, /api/admin namespaces
- ✅ JWT authentication with role-based access control
- ✅ Vehicle management (CRUD for buses and ambulances)
- ✅ Trip management (start/end trips, track history)
- ✅ Ambulance booking system with OTP (mock mode)
- ✅ GPS receiver endpoint (/api/gps/receive) - detects bus overspeeding
- ✅ RFID scan endpoint (/api/rfid/scan) - detects student speed violations
- ✅ Offence tracking and management
- ✅ Admin seeding (admin@gceits.com / Admin@12345)

### Frontend (React + Tailwind CSS)
- ✅ Admin Dashboard with dark theme
- ✅ Add Vehicle page with GPS/Barcode scan buttons
- ✅ Vehicles list with search and delete
- ✅ Vehicle details with trip history
- ✅ Offences management (bus overspeeding)
- ✅ Student offences (RFID violations)
- ✅ RFID devices management
- ✅ Students and Drivers management
- ✅ Trips and Bookings monitoring
- ✅ Driver Home (Bus/Ambulance selection)
- ✅ Bus Driver Login & Work page (start/end trips)
- ✅ Ambulance Driver Login & Work page (accept bookings, verify OTP)
- ✅ Driver Signup
- ✅ Public Map view with bus tracking
- ✅ Student Signup/Login
- ✅ Ambulance booking popup

## Prioritized Backlog

### P0 (Critical) - ✅ DONE
- Authentication system
- Vehicle management
- Trip management
- Basic GPS tracking

### P1 (Important) - ✅ DONE
- Ambulance booking with OTP
- Offence detection
- Admin dashboard stats
- Real-time updates (polling)

### P2 (Nice to Have)
- [ ] Actual Leaflet map integration with markers
- [ ] Socket.IO real-time updates (currently polling)
- [ ] Twilio SMS integration (code commented, ready)
- [ ] Push notifications
- [ ] Trip route history visualization
- [ ] Fine amount configuration
- [ ] Report generation/export

## Tech Stack
- **Backend**: FastAPI, MongoDB, python-socketio
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Lucide icons
- **Auth**: JWT with bcrypt hashing
- **Maps**: Haversine formula for distance (OpenStreetMap ready)

## Next Tasks
1. Enable Twilio SMS for real OTP (uncomment code in server.py)
2. Add actual Leaflet map with markers
3. Implement Socket.IO for real-time updates
4. Add trip route visualization
5. Generate PDF reports for offences
