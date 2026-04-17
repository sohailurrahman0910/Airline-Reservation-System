import requests
import sys
import json
from datetime import datetime, timedelta

class AirlineAPITester:
    def __init__(self, base_url="https://seat-picker-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_session = requests.Session()
        self.customer_session = requests.Session()
        self.test_flight_id = None
        self.test_booking_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.customer_email = None

    def log_test(self, name, success, details=""):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"  PASS {name}")
        else:
            print(f"  FAIL {name} - {details}")

    def run_all_tests(self):
        print("Starting Airline Reservation System API Tests")
        print("=" * 60)

        # 1. Admin Login
        print("\n--- Auth Tests ---")
        r = self.admin_session.post(f"{self.base_url}/api/auth/login", json={
            "email": "admin@airline.com", "password": "admin123"
        })
        admin_ok = r.status_code == 200 and r.json().get("role") == "admin"
        self.log_test("Admin Login", admin_ok, f"Status: {r.status_code}")

        # 2. Customer Registration
        ts = datetime.now().strftime("%H%M%S")
        self.customer_email = f"testcust{ts}@test.com"
        r = self.customer_session.post(f"{self.base_url}/api/auth/register", json={
            "email": self.customer_email, "password": "test123", "name": f"Test Customer {ts}"
        })
        reg_ok = r.status_code == 200 and r.json().get("role") == "customer"
        self.log_test("Customer Registration", reg_ok, f"Status: {r.status_code}, Body: {r.text[:100]}")

        # 3. Customer Login (new session to verify login works)
        cust_login_session = requests.Session()
        r = cust_login_session.post(f"{self.base_url}/api/auth/login", json={
            "email": self.customer_email, "password": "test123"
        })
        login_ok = r.status_code == 200 and r.json().get("role") == "customer"
        self.log_test("Customer Login", login_ok, f"Status: {r.status_code}, Body: {r.text[:100]}")

        # 4. Auth Me (customer session from registration)
        r = self.customer_session.get(f"{self.base_url}/api/auth/me")
        me_ok = r.status_code == 200 and "email" in r.json()
        self.log_test("Auth Me", me_ok, f"Status: {r.status_code}")

        # 5. Admin Stats
        print("\n--- Admin Tests ---")
        r = self.admin_session.get(f"{self.base_url}/api/admin/stats")
        stats_ok = r.status_code == 200 and "total_flights" in r.json()
        self.log_test("Admin Stats", stats_ok, f"Status: {r.status_code}, Body: {r.text[:100]}")

        # 6. Create Flight (admin)
        departure = (datetime.now() + timedelta(days=7)).isoformat()
        arrival = (datetime.now() + timedelta(days=7, hours=3)).isoformat()
        r = self.admin_session.post(f"{self.base_url}/api/admin/flights", json={
            "flight_number": f"SK{datetime.now().strftime('%H%M')}",
            "origin": "New York",
            "destination": "London",
            "departure_time": departure,
            "arrival_time": arrival,
            "price": 299.99,
            "aircraft_type": "Boeing 737",
            "total_seats": 180
        })
        flight_ok = r.status_code == 200 and "id" in r.json()
        if flight_ok:
            self.test_flight_id = r.json()["id"]
        self.log_test("Create Flight", flight_ok, f"Status: {r.status_code}, Body: {r.text[:100]}")

        # 7. Get Flights (public)
        print("\n--- Flight Tests ---")
        r = requests.get(f"{self.base_url}/api/flights")
        flights_ok = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
        self.log_test("Get Flights", flights_ok, f"Status: {r.status_code}, Count: {len(r.json()) if isinstance(r.json(), list) else 'N/A'}")

        # 8. Get Flight Seats
        if self.test_flight_id:
            r = requests.get(f"{self.base_url}/api/flights/{self.test_flight_id}/seats")
            seats_ok = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
            self.log_test("Get Flight Seats", seats_ok, f"Status: {r.status_code}, Count: {len(r.json()) if isinstance(r.json(), list) else 'N/A'}")
        else:
            self.log_test("Get Flight Seats", False, "No flight ID")

        # 9. Create Booking (customer)
        print("\n--- Booking Tests ---")
        if self.test_flight_id:
            r = requests.get(f"{self.base_url}/api/flights/{self.test_flight_id}/seats")
            seats_data = r.json()
            available = [s for s in seats_data if s.get("is_available")]
            if available:
                r = self.customer_session.post(f"{self.base_url}/api/bookings", json={
                    "flight_id": self.test_flight_id,
                    "seat_ids": [available[0]["id"]]
                })
                booking_ok = r.status_code == 200 and "id" in r.json()
                if booking_ok:
                    self.test_booking_id = r.json()["id"]
                self.log_test("Create Booking", booking_ok, f"Status: {r.status_code}, Body: {r.text[:200]}")
            else:
                self.log_test("Create Booking", False, "No available seats")
        else:
            self.log_test("Create Booking", False, "No flight ID")

        # 10. Get User Bookings (customer)
        r = self.customer_session.get(f"{self.base_url}/api/bookings")
        bookings_ok = r.status_code == 200 and isinstance(r.json(), list)
        self.log_test("Get User Bookings", bookings_ok, f"Status: {r.status_code}, Body: {r.text[:200]}")

        # 11. Admin Get All Bookings
        r = self.admin_session.get(f"{self.base_url}/api/admin/bookings")
        admin_bookings_ok = r.status_code == 200 and isinstance(r.json(), list)
        self.log_test("Admin Get All Bookings", admin_bookings_ok, f"Status: {r.status_code}, Body: {r.text[:200]}")

        # 12. Payment Checkout (customer)
        print("\n--- Payment Tests ---")
        if self.test_booking_id:
            r = self.customer_session.post(f"{self.base_url}/api/payments/checkout", json={
                "booking_id": self.test_booking_id,
                "origin_url": "https://seat-picker-2.preview.emergentagent.com"
            })
            pay_ok = r.status_code == 200 and "url" in r.json()
            self.log_test("Payment Checkout", pay_ok, f"Status: {r.status_code}, Body: {r.text[:200]}")
        else:
            self.log_test("Payment Checkout", False, "No booking ID")

        # 13. Delete Flight (admin cleanup)
        print("\n--- Cleanup ---")
        if self.test_flight_id:
            r = self.admin_session.delete(f"{self.base_url}/api/admin/flights/{self.test_flight_id}")
            del_ok = r.status_code == 200
            self.log_test("Delete Flight", del_ok, f"Status: {r.status_code}")
        else:
            self.log_test("Delete Flight", False, "No flight ID")

        print("\n" + "=" * 60)
        print(f"Results: {self.tests_passed}/{self.tests_run} passed")
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    tester = AirlineAPITester()
    sys.exit(tester.run_all_tests())
