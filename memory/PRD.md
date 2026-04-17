# Airline Reservation System - PRD

## Original Problem Statement
Airline Reservation System: Flight scheduling, seat selection, and ticket booking

## Architecture
- **Frontend**: React 18 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB (Motor async driver)
- **Payment**: Stripe via emergentintegrations
- **Auth**: JWT + bcrypt (httpOnly cookies)

## User Personas
1. **Customer** - searches flights, selects seats, books tickets, manages bookings
2. **Admin** - manages flights (CRUD), views all bookings, monitors revenue stats

## Core Requirements
- JWT authentication with admin/customer roles
- Flight scheduling with origin, destination, departure/arrival times
- Interactive seat selection map (Business/Premium/Economy)
- Booking flow with dynamic pricing per seat class
- Stripe payment integration
- Admin dashboard with stats and management tools

## What's Been Implemented (April 11, 2026)
- Full JWT authentication (register, login, logout, refresh tokens, brute force protection)
- Admin seeding on startup
- Flight CRUD (admin) with auto-generated seat maps (30 rows x 6 columns)
- Flight search & filtering (origin, destination, date)
- Interactive seat selection with 3 classes (business 2.5x, premium 1.5x, economy 1x)
- Booking creation with price calculation
- Stripe payment integration (checkout + polling)
- Payment success page with status verification
- User bookings page with status tracking
- Admin dashboard (stats: flights, bookings, revenue + flight/booking management)
- Swiss/High-Contrast design theme (Cabinet Grotesk, IBM Plex Sans, JetBrains Mono)

## Test Results
- Backend: 13/13 API tests pass
- Frontend: 100% all flows tested

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (Important)
- Email notifications for booking confirmations
- Booking cancellation flow
- Flight status updates (delayed, cancelled)

### P2 (Nice to have)
- User profile management
- Booking history export/PDF tickets
- Flight search with price range filter
- Seat preference saving
- Multiple passengers per booking
- Loyalty/rewards program
