import requests
import sys
from datetime import datetime, timedelta

class AirlineAPITester:
    def __init__(self, base_url="https://seat-picker-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.customer_token = None
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

    def auth_header(self, token):
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def run_all_tests(self):
        print("Starting Airline Reservation System API Tests")
        print("=" * 60)

        # 1. Admin Login
        print("\n--- Auth Tests ---")
        r = requests.post(f"{self.base_url}/api/auth/login", json={
            "email": "admin@airline.com", "password": "admin123"
        })
        admin_ok = r.status_code == 200 and r.json().get("role") == "admin" and "access_token" in r.json()
        if admin_ok:
            self.admin_token = r.json()["access_token"]
        self.log_test("Admin Login", admin_ok, f"Status: {r.status_code}")

        # 2. Customer Registration
        ts = datetime.now().strftime("%H%M%S")
        self.customer_email = f"testcust{ts}@test.com"
        r = requests.post(f"{self.base_url}/api/auth/register", json={
            "email": self.customer_email, "password": "test123", "name": f"Test Customer {ts}"
        })
        reg_ok = r.status_code == 200 and "access_token" in r.json()
        if reg_ok:
            self.customer_token = r.json()["access_token"]
        self.log_test("Customer Registration", reg_ok, f"Status: {r.status_code}")

        # 3. Customer Login
        r = requests.post(f"{self.base_url}/api/auth/login", json={
            "email": self.customer_email, "password": "test123"
        })
        login_ok = r.status_code == 200 and "access_token" in r.json()
        if login_ok:
            self.customer_token = r.json()["access_token"]
        self.log_test("Customer Login", login_ok, f"Status: {r.status_code}")

        # 4. Auth Me
        r = requests.get(f"{self.base_url}/api/auth/me", headers=self.auth_header(self.customer_token))
        me_ok = r.status_code == 200 and "email" in r.json()
        self.log_test("Auth Me", me_ok, f"Status: {r.status_code}")

        # 5. Admin Stats
        print("\n--- Admin Tests ---")
        r = requests.get(f"{self.base_url}/api/admin/stats", headers=self.auth_header(self.admin_token))
        stats_ok = r.status_code == 200 and "total_flights" in r.json()
        self.log_test("Admin Stats", stats_ok, f"Status: {r.status_code}")

        # 6. Create Flight
        dep = (datetime.now() + timedelta(days=7)).isoformat()
        arr = (datetime.now() + timedelta(days=7, hours=3)).isoformat()
        r = requests.post(f"{self.base_url}/api/admin/flights", json={
            "flight_number": f"SK{datetime.now().strftime('%H%M')}",
            "origin": "New York", "destination": "London",
            "departure_time": dep, "arrival_time": arr,
            "price": 299.99, "aircraft_type": "Boeing 737", "total_seats": 180
        }, headers=self.auth_header(self.admin_token))
        flight_ok = r.status_code == 200 and "id" in r.json()
        if flight_ok:
            self.test_flight_id = r.json()["id"]
        self.log_test("Create Flight", flight_ok, f"Status: {r.status_code}")

        # 7. Get Flights
        print("\n--- Flight Tests ---")
        r = requests.get(f"{self.base_url}/api/flights")
        flights_ok = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
        self.log_test("Get Flights", flights_ok, f"Count: {len(r.json()) if isinstance(r.json(), list) else 'N/A'}")

        # 8. Get Seats
        if self.test_flight_id:
            r = requests.get(f"{self.base_url}/api/flights/{self.test_flight_id}/seats")
            seats_ok = r.status_code == 200 and len(r.json()) > 0
            self.log_test("Get Flight Seats", seats_ok, f"Count: {len(r.json())}")
        else:
            self.log_test("Get Flight Seats", False, "No flight ID")

        # 9. Create Booking
        print("\n--- Booking Tests ---")
        if self.test_flight_id:
            r = requests.get(f"{self.base_url}/api/flights/{self.test_flight_id}/seats")
            available = [s for s in r.json() if s.get("is_available")]
            if available:
                r = requests.post(f"{self.base_url}/api/bookings", json={
                    "flight_id": self.test_flight_id, "seat_ids": [available[0]["id"]]
                }, headers=self.auth_header(self.customer_token))
                booking_ok = r.status_code == 200 and "id" in r.json()
                if booking_ok:
                    self.test_booking_id = r.json()["id"]
                self.log_test("Create Booking", booking_ok, f"Status: {r.status_code}")
            else:
                self.log_test("Create Booking", False, "No available seats")
        else:
            self.log_test("Create Booking", False, "No flight ID")

        # 10. Get Bookings
        r = requests.get(f"{self.base_url}/api/bookings", headers=self.auth_header(self.customer_token))
        bookings_ok = r.status_code == 200 and isinstance(r.json(), list)
        self.log_test("Get User Bookings", bookings_ok, f"Status: {r.status_code}")

        # 11. Admin Bookings
        r = requests.get(f"{self.base_url}/api/admin/bookings", headers=self.auth_header(self.admin_token))
        admin_bookings_ok = r.status_code == 200 and isinstance(r.json(), list)
        self.log_test("Admin Get All Bookings", admin_bookings_ok, f"Status: {r.status_code}")

        # 12. Payment Checkout
        print("\n--- Payment Tests ---")
        if self.test_booking_id:
            r = requests.post(f"{self.base_url}/api/payments/checkout", json={
                "booking_id": self.test_booking_id,
                "origin_url": "https://seat-picker-2.preview.emergentagent.com"
            }, headers=self.auth_header(self.customer_token))
            pay_ok = r.status_code == 200 and "url" in r.json()
            self.log_test("Payment Checkout", pay_ok, f"Status: {r.status_code}")
        else:
            self.log_test("Payment Checkout", False, "No booking ID")

        # 13. Delete Flight
        print("\n--- Cleanup ---")
        if self.test_flight_id:
            r = requests.delete(f"{self.base_url}/api/admin/flights/{self.test_flight_id}",
                              headers=self.auth_header(self.admin_token))
            self.log_test("Delete Flight", r.status_code == 200, f"Status: {r.status_code}")
        else:
            self.log_test("Delete Flight", False, "No flight ID")

        print("\n" + "=" * 60)
        print(f"Results: {self.tests_passed}/{self.tests_run} passed")
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    sys.exit(AirlineAPITester().run_all_tests())
