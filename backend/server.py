from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT Token Management
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Get current user
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        del user["_id"]
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(alias="_id")
    email: str
    name: str
    role: str

class FlightCreate(BaseModel):
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    aircraft_type: str = "Boeing 737"
    total_seats: int = 180

class FlightUpdate(BaseModel):
    flight_number: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    price: Optional[float] = None
    aircraft_type: Optional[str] = None
    status: Optional[str] = None

class FlightResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    duration: str
    price: float
    aircraft_type: str
    total_seats: int
    available_seats: int
    status: str

class SeatResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    flight_id: str
    seat_number: str
    row: int
    column: str
    seat_type: str
    is_available: bool

class BookingCreate(BaseModel):
    flight_id: str
    seat_ids: List[str]

class BookingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    flight_id: str
    seat_numbers: List[str]
    total_price: float
    booking_date: str
    status: str
    payment_status: str

class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# AUTH ENDPOINTS
@api_router.post("/auth/register")
async def register(user: UserRegister, response: Response):
    email = user.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user.name,
        "role": "customer",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email, "customer")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user.name, "role": "customer"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    email = credentials.email.lower()
    
    # Brute force check
    identifier = f"{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        locked = attempt["locked_until"]
        if locked.tzinfo is None:
            locked = locked.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < locked:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        if not attempt:
            await db.login_attempts.insert_one({
                "identifier": identifier,
                "attempts": 1,
                "last_attempt": datetime.now(timezone.utc)
            })
        else:
            attempts = attempt.get("attempts", 0) + 1
            update_doc = {"attempts": attempts, "last_attempt": datetime.now(timezone.utc)}
            if attempts >= 5:
                update_doc["locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
            await db.login_attempts.update_one({"identifier": identifier}, {"$set": update_doc})
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user.get("role", "customer"))
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user.get("name"), "role": user.get("role", "customer")}

@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"], user.get("role", "customer"))
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    email = request.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "email": email,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False
    })
    
    reset_link = f"https://seat-picker-2.preview.emergentagent.com/reset-password?token={token}"
    print(f"\n\nPASSWORD RESET LINK: {reset_link}\n\n")
    
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    reset = await db.password_reset_tokens.find_one({"token": request.token})
    if not reset or reset.get("used") or datetime.now(timezone.utc) > reset.get("expires_at"):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    hashed = hash_password(request.new_password)
    await db.users.update_one({"email": reset["email"]}, {"$set": {"password_hash": hashed}})
    await db.password_reset_tokens.update_one({"token": request.token}, {"$set": {"used": True}})
    
    return {"message": "Password reset successful"}

# FLIGHT ENDPOINTS
@api_router.get("/flights")
async def get_flights(origin: Optional[str] = None, destination: Optional[str] = None, date: Optional[str] = None):
    query = {"status": "scheduled"}
    if origin:
        query["origin"] = {"$regex": origin, "$options": "i"}
    if destination:
        query["destination"] = {"$regex": destination, "$options": "i"}
    if date:
        start_date = datetime.fromisoformat(date)
        end_date = start_date + timedelta(days=1)
        query["departure_time"] = {"$gte": start_date, "$lt": end_date}
    
    flights = await db.flights.find(query, {"_id": 0}).to_list(100)
    for flight in flights:
        if isinstance(flight["departure_time"], datetime):
            flight["departure_time"] = flight["departure_time"].isoformat()
        if isinstance(flight["arrival_time"], datetime):
            flight["arrival_time"] = flight["arrival_time"].isoformat()
    return flights

@api_router.get("/flights/{flight_id}")
async def get_flight(flight_id: str):
    flight = await db.flights.find_one({"id": flight_id}, {"_id": 0})
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    if isinstance(flight["departure_time"], datetime):
        flight["departure_time"] = flight["departure_time"].isoformat()
    if isinstance(flight["arrival_time"], datetime):
        flight["arrival_time"] = flight["arrival_time"].isoformat()
    return flight

@api_router.post("/admin/flights")
async def create_flight(flight: FlightCreate, admin: dict = Depends(get_current_admin)):
    import uuid
    flight_id = str(uuid.uuid4())
    duration = flight.arrival_time - flight.departure_time
    hours = int(duration.total_seconds() // 3600)
    minutes = int((duration.total_seconds() % 3600) // 60)
    
    flight_doc = {
        "id": flight_id,
        "flight_number": flight.flight_number,
        "origin": flight.origin,
        "destination": flight.destination,
        "departure_time": flight.departure_time,
        "arrival_time": flight.arrival_time,
        "duration": f"{hours}h {minutes}m",
        "price": flight.price,
        "aircraft_type": flight.aircraft_type,
        "total_seats": flight.total_seats,
        "available_seats": flight.total_seats,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc)
    }
    await db.flights.insert_one(flight_doc)
    
    # Create seats
    seats = []
    rows = flight.total_seats // 6
    for row in range(1, rows + 1):
        for col in ['A', 'B', 'C', 'D', 'E', 'F']:
            seat_id = str(uuid.uuid4())
            seat_type = "business" if row <= 3 else "premium" if row <= 10 else "economy"
            seats.append({
                "id": seat_id,
                "flight_id": flight_id,
                "seat_number": f"{row}{col}",
                "row": row,
                "column": col,
                "seat_type": seat_type,
                "is_available": True
            })
    if seats:
        await db.seats.insert_many(seats)
    
    flight_doc.pop("_id", None)
    flight_doc["departure_time"] = flight_doc["departure_time"].isoformat()
    flight_doc["arrival_time"] = flight_doc["arrival_time"].isoformat()
    flight_doc.pop("created_at", None)
    return flight_doc

@api_router.put("/admin/flights/{flight_id}")
async def update_flight(flight_id: str, flight: FlightUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in flight.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.flights.update_one({"id": flight_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flight not found")
    return {"message": "Flight updated successfully"}

@api_router.delete("/admin/flights/{flight_id}")
async def delete_flight(flight_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.flights.delete_one({"id": flight_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flight not found")
    await db.seats.delete_many({"flight_id": flight_id})
    return {"message": "Flight deleted successfully"}

@api_router.get("/admin/flights")
async def get_all_flights_admin(admin: dict = Depends(get_current_admin)):
    flights = await db.flights.find({}, {"_id": 0}).sort("departure_time", 1).to_list(1000)
    for flight in flights:
        if isinstance(flight["departure_time"], datetime):
            flight["departure_time"] = flight["departure_time"].isoformat()
        if isinstance(flight["arrival_time"], datetime):
            flight["arrival_time"] = flight["arrival_time"].isoformat()
    return flights

# SEAT ENDPOINTS
@api_router.get("/flights/{flight_id}/seats")
async def get_seats(flight_id: str):
    seats = await db.seats.find({"flight_id": flight_id}, {"_id": 0}).to_list(1000)
    return seats

# BOOKING HELPERS
SEAT_PRICE_MULTIPLIERS = {"business": 2.5, "premium": 1.5, "economy": 1.0}

async def validate_booking_seats(flight_id: str, seat_ids: list):
    """Validate seats exist and are available for the given flight."""
    seats = await db.seats.find({"id": {"$in": seat_ids}, "flight_id": flight_id}).to_list(1000)
    if len(seats) != len(seat_ids):
        raise HTTPException(status_code=400, detail="One or more seats not found")
    for seat in seats:
        if not seat["is_available"]:
            raise HTTPException(status_code=400, detail=f"Seat {seat['seat_number']} is not available")
    return seats

def calculate_booking_price(seats: list, base_price: float) -> float:
    """Calculate total price for selected seats based on their type."""
    return sum(base_price * SEAT_PRICE_MULTIPLIERS.get(s["seat_type"], 1.0) for s in seats)

# BOOKING ENDPOINTS
@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, user: dict = Depends(get_current_user)):
    import uuid
    
    flight = await db.flights.find_one({"id": booking.flight_id})
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    seats = await validate_booking_seats(booking.flight_id, booking.seat_ids)
    total_price = calculate_booking_price(seats, flight["price"])
    
    # Create booking
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "user_id": user["id"],
        "flight_id": booking.flight_id,
        "seat_ids": booking.seat_ids,
        "seat_numbers": [s["seat_number"] for s in seats],
        "total_price": round(total_price, 2),
        "booking_date": datetime.now(timezone.utc),
        "status": "pending",
        "payment_status": "pending",
        "flight_snapshot": {
            "flight_number": flight["flight_number"],
            "origin": flight["origin"],
            "destination": flight["destination"],
            "departure_time": flight["departure_time"].isoformat() if isinstance(flight["departure_time"], datetime) else flight["departure_time"],
            "arrival_time": flight["arrival_time"].isoformat() if isinstance(flight["arrival_time"], datetime) else flight["arrival_time"],
        }
    }
    await db.bookings.insert_one(booking_doc)
    
    # Mark seats as unavailable temporarily
    await db.seats.update_many({"id": {"$in": booking.seat_ids}}, {"$set": {"is_available": False}})
    await db.flights.update_one({"id": booking.flight_id}, {"$inc": {"available_seats": -len(booking.seat_ids)}})
    
    # Remove MongoDB _id before returning
    booking_doc.pop("_id", None)
    booking_doc["booking_date"] = booking_doc["booking_date"].isoformat()
    return booking_doc

@api_router.get("/bookings")
async def get_user_bookings(user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    for booking in bookings:
        if isinstance(booking["booking_date"], datetime):
            booking["booking_date"] = booking["booking_date"].isoformat()
        # Get flight details
        flight = await db.flights.find_one({"id": booking["flight_id"]}, {"_id": 0})
        if flight:
            if isinstance(flight["departure_time"], datetime):
                flight["departure_time"] = flight["departure_time"].isoformat()
            if isinstance(flight["arrival_time"], datetime):
                flight["arrival_time"] = flight["arrival_time"].isoformat()
            booking["flight"] = flight
    return bookings

@api_router.get("/admin/bookings")
async def get_all_bookings(admin: dict = Depends(get_current_admin)):
    bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    for booking in bookings:
        if isinstance(booking["booking_date"], datetime):
            booking["booking_date"] = booking["booking_date"].isoformat()
        # Get flight and user details
        flight = await db.flights.find_one({"id": booking["flight_id"]}, {"_id": 0})
        user = await db.users.find_one({"_id": ObjectId(booking["user_id"])}, {"_id": 0, "password_hash": 0})
        if flight:
            if isinstance(flight["departure_time"], datetime):
                flight["departure_time"] = flight["departure_time"].isoformat()
            if isinstance(flight["arrival_time"], datetime):
                flight["arrival_time"] = flight["arrival_time"].isoformat()
            booking["flight"] = flight
        if user:
            user.pop("_id", None)
            booking["user"] = user
    return bookings

# PAYMENT ENDPOINTS
@api_router.post("/payments/checkout")
async def create_checkout(request: CheckoutRequest, user: dict = Depends(get_current_user)):
    # Get booking
    booking = await db.bookings.find_one({"id": request.booking_id, "user_id": user["id"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["payment_status"] == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")
    
    # Initialize Stripe
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    webhook_url = f"{request.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/bookings"
    
    checkout_request = CheckoutSessionRequest(
        amount=booking["total_price"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": request.booking_id,
            "user_id": user["id"],
            "flight_id": booking["flight_id"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "booking_id": request.booking_id,
        "user_id": user["id"],
        "amount": booking["total_price"],
        "currency": "usd",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc),
        "metadata": checkout_request.metadata
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, user: dict = Depends(get_current_user)):
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["payment_status"] == "paid":
        return {"status": "complete", "payment_status": "paid", "booking_id": transaction["booking_id"]}
    
    # Get status from Stripe
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and booking if paid
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "status": "complete"}}
        )
        await db.bookings.update_one(
            {"id": transaction["booking_id"]},
            {"$set": {"payment_status": "paid", "status": "confirmed"}}
        )
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "booking_id": transaction["booking_id"]
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            if transaction and transaction["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}}
                )
                await db.bookings.update_one(
                    {"id": transaction["booking_id"]},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ADMIN STATS
@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    total_flights = await db.flights.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"payment_status": "paid"})
    
    # Calculate total revenue
    bookings = await db.bookings.find({"payment_status": "paid"}).to_list(1000)
    total_revenue = sum(b.get("total_price", 0) for b in bookings)
    
    return {
        "total_flights": total_flights,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "pending_bookings": total_bookings - confirmed_bookings,
        "total_revenue": round(total_revenue, 2)
    }

# Admin seeding
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@airline.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
    
    # Write credentials to test_credentials.md
    Path("/app/memory").mkdir(exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write("- Role: admin\n\n")
        f.write("## Test Customer Account\n")
        f.write("- Email: customer@test.com\n")
        f.write("- Password: test123\n")
        f.write("- Role: customer\n\n")
        f.write("## Auth Endpoints\n")
        f.write("/api/auth/register\n")
        f.write("/api/auth/login\n")
        f.write("/api/auth/logout\n")
        f.write("/api/auth/me\n")

async def seed_flights():
    """Seed sample flights if none exist."""
    import uuid as _uuid
    count = await db.flights.count_documents({})
    if count > 0:
        return

    sample_flights = [
        {"fn": "SK101", "origin": "New York (JFK)", "dest": "London (LHR)", "price": 549.00, "hours": 7, "mins": 30},
        {"fn": "SK202", "origin": "Los Angeles (LAX)", "dest": "Tokyo (NRT)", "price": 899.00, "hours": 11, "mins": 15},
        {"fn": "SK303", "origin": "Chicago (ORD)", "dest": "Paris (CDG)", "price": 629.00, "hours": 8, "mins": 45},
        {"fn": "SK404", "origin": "San Francisco (SFO)", "dest": "Sydney (SYD)", "price": 1150.00, "hours": 15, "mins": 30},
        {"fn": "SK505", "origin": "Miami (MIA)", "dest": "Dubai (DXB)", "price": 780.00, "hours": 14, "mins": 0},
        {"fn": "SK606", "origin": "New York (JFK)", "dest": "Dubai (DXB)", "price": 850.00, "hours": 13, "mins": 30},
        {"fn": "SK707", "origin": "London (LHR)", "dest": "Singapore (SIN)", "price": 720.00, "hours": 12, "mins": 45},
        {"fn": "SK808", "origin": "Paris (CDG)", "dest": "Tokyo (NRT)", "price": 950.00, "hours": 12, "mins": 0},
        {"fn": "SK909", "origin": "Los Angeles (LAX)", "dest": "London (LHR)", "price": 680.00, "hours": 10, "mins": 30},
        {"fn": "SK110", "origin": "Chicago (ORD)", "dest": "Rome (FCO)", "price": 590.00, "hours": 9, "mins": 15},
        {"fn": "SK211", "origin": "San Francisco (SFO)", "dest": "Seoul (ICN)", "price": 810.00, "hours": 11, "mins": 0},
        {"fn": "SK312", "origin": "Miami (MIA)", "dest": "Sao Paulo (GRU)", "price": 480.00, "hours": 8, "mins": 30},
    ]

    base_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=3)

    for i, fl in enumerate(sample_flights):
        flight_id = str(_uuid.uuid4())
        dep = base_date + timedelta(days=i % 7, hours=6 + (i * 2) % 12)
        arr = dep + timedelta(hours=fl["hours"], minutes=fl["mins"])
        total_seats = 180

        flight_doc = {
            "id": flight_id,
            "flight_number": fl["fn"],
            "origin": fl["origin"],
            "destination": fl["dest"],
            "departure_time": dep,
            "arrival_time": arr,
            "duration": f"{fl['hours']}h {fl['mins']}m",
            "price": fl["price"],
            "aircraft_type": "Boeing 737" if i % 2 == 0 else "Airbus A320",
            "total_seats": total_seats,
            "available_seats": total_seats,
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc),
        }
        await db.flights.insert_one(flight_doc)

        seats = []
        rows = total_seats // 6
        for row in range(1, rows + 1):
            for col in ["A", "B", "C", "D", "E", "F"]:
                seat_type = "business" if row <= 3 else "premium" if row <= 10 else "economy"
                seats.append({
                    "id": str(_uuid.uuid4()),
                    "flight_id": flight_id,
                    "seat_number": f"{row}{col}",
                    "row": row,
                    "column": col,
                    "seat_type": seat_type,
                    "is_available": True,
                })
        await db.seats.insert_many(seats)

    logger.info(f"Seeded {len(sample_flights)} flights")

@app.on_event("startup")
async def startup():
    await seed_admin()
    await seed_flights()
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.flights.create_index("id", unique=True)
    await db.seats.create_index("id", unique=True)
    await db.bookings.create_index("id", unique=True)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()