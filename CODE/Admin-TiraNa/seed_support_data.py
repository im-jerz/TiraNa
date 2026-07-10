"""
Seed script: Creates support tickets and disputes in the Admin database
using existing data from Client (CockroachDB) and Host (Oracle) databases.

Run inside Admin container:
    docker exec tira_backend python /app/seed_support_data.py

Run from host (if Python is installed):
    python seed_support_data.py

Prerequisites:
    - All 3 modules running via docker-compose
"""

import os
import sys
import random
import argparse
import requests
import psycopg2
import oracledb

# ── Config ──────────────────────────────────────────────────────────────
# Detect if running inside Docker (Admin container)
IN_DOCKER = os.path.exists("/.dockerenv") or os.environ.get("DOCKER_CONTAINER") == "1"

if IN_DOCKER:
    ADMIN_API = "http://localhost:5002"
    COCKROACH_HOST = "client-tirana-cockroachdb-1"
    COCKROACH_PORT = 26257
    ORACLE_HOST = "tirana-oracle"
    ORACLE_PORT = 1521
else:
    ADMIN_API = "http://localhost:5002"
    COCKROACH_HOST = "localhost"
    COCKROACH_PORT = 26257
    ORACLE_HOST = "localhost"
    ORACLE_PORT = 1521

COCKROACH_URL = {
    "host": COCKROACH_HOST,
    "port": COCKROACH_PORT,
    "user": "root",
    "dbname": "defaultdb",
    "sslmode": "disable",
}
ORACLE_PASSWORD = os.environ.get("ORACLE_PASSWORD", "Carlangelo#19")
ORACLE_URL = {
    "user": "AIRBNB_HOST",
    "password": ORACLE_PASSWORD,
    "dsn": f"{ORACLE_HOST}:{ORACLE_PORT}/FREEPDB1",
}

# ── Support ticket templates (based on real scenarios) ───────────────────
TICKET_TEMPLATES = [
    {
        "subject": "Unable to cancel my booking",
        "description": "I tried to cancel my upcoming reservation but the cancel button is not working. I need to cancel before the check-in date.",
        "category": "booking",
        "priority": "high",
    },
    {
        "subject": "Payment not reflecting after checkout",
        "description": "I completed an online payment for my booking but it still shows as pending. The amount was already deducted from my bank account.",
        "category": "payment",
        "priority": "urgent",
    },
    {
        "subject": "Property not as described",
        "description": "The property I booked does not match the photos and description posted. The amenities listed were not available upon arrival.",
        "category": "general",
        "priority": "medium",
    },
    {
        "subject": "Refund not processed yet",
        "description": "My booking was cancelled a week ago but I still haven't received my refund. Can you check the status?",
        "category": "payment",
        "priority": "high",
    },
    {
        "subject": "Cannot login to my account",
        "description": "I'm having trouble logging in. I keep getting an error saying invalid credentials even though I'm sure my password is correct.",
        "category": "technical",
        "priority": "medium",
    },
    {
        "subject": "Host not responding to messages",
        "description": "I've been trying to reach the host about my upcoming reservation but they are not responding to any of my messages.",
        "category": "general",
        "priority": "medium",
    },
    {
        "subject": "Wrong amount charged for booking",
        "description": "I was charged a different amount than what was shown during checkout. The total price was supposed to be lower.",
        "category": "payment",
        "priority": "high",
    },
    {
        "subject": "Need to change booking dates",
        "description": "I need to change my check-in and check-out dates for an existing booking. Is this possible?",
        "category": "booking",
        "priority": "low",
    },
    {
        "subject": "Account verification issue",
        "description": "I uploaded my ID for verification but it keeps showing as pending. It's been 3 days already.",
        "category": "technical",
        "priority": "medium",
    },
    {
        "subject": "Property listing shows wrong availability",
        "description": "A property I'm interested in shows as available but when I try to book it, it says the dates are not available.",
        "category": "technical",
        "priority": "low",
    },
    {
        "subject": "Cancellation policy not clear",
        "description": "I cancelled my booking thinking it was under the flexible policy, but I was still charged a fee. The policy was not clearly displayed.",
        "category": "booking",
        "priority": "medium",
    },
    {
        "subject": "How do I list my property?",
        "description": "I'm a new host and I want to list my property on the platform. Can you guide me through the process?",
        "category": "general",
        "priority": "low",
    },
    {
        "subject": "Request for invoice/receipt",
        "description": "I need an official receipt or invoice for my completed booking for business expense reporting purposes.",
        "category": "general",
        "priority": "low",
    },
    {
        "subject": "Wallet withdrawal not received",
        "description": "I requested a withdrawal from my host wallet 5 days ago but the money hasn't arrived in my bank account yet.",
        "category": "payment",
        "priority": "high",
    },
    {
        "subject": "Guest damaged my property",
        "description": "A guest checked out and left significant damage to my property. I need to file a damage claim and request compensation.",
        "category": "general",
        "priority": "urgent",
    },
]

# ── Dispute templates (tied to real booking scenarios) ──────────────────
DISPUTE_TEMPLATES = [
    {
        "reason": "Guest cancelled last minute but host already prepared the property. Requesting partial compensation for lost opportunity.",
        "evidence": "Booking was cancelled 1 day before check-in. Property was fully prepared and other bookings were declined.",
    },
    {
        "reason": "Host cancelled the booking after I had already made travel arrangements. I incurred additional costs for alternative accommodation.",
        "evidence": "Flight tickets and transportation already booked. Host cancelled 3 days before check-in.",
    },
    {
        "reason": "Property condition was significantly different from listing photos. Cleanliness was below acceptable standards.",
        "evidence": "Photos showed modern, clean interior. Actual property had mold, broken fixtures, and was not cleaned before arrival.",
    },
    {
        "reason": "Refund was promised by host but not processed. Host agreed to full refund but only partial amount was returned.",
        "evidence": "Chat messages showing host agreement for full refund. Only 50% was refunded.",
    },
    {
        "reason": "Unexpected charges added after booking. Host requested additional payment not mentioned in the listing.",
        "evidence": "Listing showed clean price. Host demanded extra cleaning fee and utilities fee after booking confirmation.",
    },
    {
        "reason": "Guest overstayed by 2 nights without prior arrangement. Additional charges were not paid.",
        "evidence": "Check-out was on Jan 15 but guest stayed until Jan 17. No communication about extension.",
    },
    {
        "reason": "Noise complaint from neighboring properties during the stay. Guest held noisy party past midnight despite house rules.",
        "evidence": "Multiple noise complaints from neighbors. Security was called. House rules clearly state quiet hours after 10pm.",
    },
    {
        "reason": "Payment was double-charged for a single booking. Requesting reversal of the duplicate charge.",
        "evidence": "Bank statement shows two identical charges for the same booking ID.",
    },
]


def connect_cockroach():
    """Connect to CockroachDB (Client module)."""
    try:
        conn = psycopg2.connect(**COCKROACH_URL)
        print("[OK] Connected to CockroachDB (Client)")
        return conn
    except Exception as e:
        print(f"[WARN] Could not connect to CockroachDB: {e}")
        return None


def connect_oracle():
    """Connect to Oracle (Host module)."""
    try:
        conn = oracledb.connect(**ORACLE_URL)
        print("[OK] Connected to Oracle (Host)")
        return conn
    except Exception as e:
        print(f"[WARN] Could not connect to Oracle: {e}")
        return None


def fetch_client_users(conn):
    """Fetch users with personal info from CockroachDB."""
    cur = conn.cursor()
    cur.execute("""
        SELECT
            cu.id,
            cu.username,
            cu.email,
            COALESCE(pi.first_name, '') || ' ' || COALESCE(pi.last_name, '') AS full_name
        FROM client_users cu
        LEFT JOIN personal_information pi ON pi.user_id = cu.id
        ORDER BY cu.created_at DESC
    """)
    users = []
    for row in cur.fetchall():
        users.append({
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "name": row[3].strip() or row[1],
        })
    cur.close()
    return users


def fetch_client_bookings(conn):
    """Fetch bookings from CockroachDB."""
    cur = conn.cursor()
    cur.execute("""
        SELECT
            b.id,
            b.user_id,
            b.property_id,
            b.status,
            b.total_price::float,
            b.payment_method,
            cu.username,
            cu.email,
            COALESCE(pi.first_name, '') || ' ' || COALESCE(pi.last_name, '') AS full_name
        FROM bookings b
        JOIN client_users cu ON cu.id = b.user_id
        LEFT JOIN personal_information pi ON pi.user_id = cu.id
        ORDER BY b.created_at DESC
    """)
    bookings = []
    for row in cur.fetchall():
        bookings.append({
            "id": row[0],
            "user_id": row[1],
            "property_id": row[2],
            "status": row[3],
            "total_price": row[4],
            "payment_method": row[5],
            "username": row[6],
            "email": row[7],
            "name": row[8].strip() or row[6],
        })
    cur.close()
    return bookings


def fetch_host_data(conn):
    """Fetch hosts and properties from Oracle."""
    cur = conn.cursor()
    cur.execute("""
        SELECT
            h.ID,
            hp.FULL_NAME,
            h.EMAIL
        FROM HOSTS h
        LEFT JOIN HOST_PROFILES hp ON hp.HOST_ID = h.ID
        ORDER BY h.CREATED_AT DESC
    """)
    hosts = []
    for row in cur.fetchall():
        hosts.append({
            "id": row[0],
            "name": row[1] or "Host",
            "email": row[2],
        })

    cur.execute("""
        SELECT
            p.ID,
            p.TITLE,
            p.HOST_ID,
            h.EMAIL AS host_email,
            hp.FULL_NAME AS host_name
        FROM PROPERTIES p
        JOIN HOSTS h ON h.ID = p.HOST_ID
        LEFT JOIN HOST_PROFILES hp ON hp.HOST_ID = h.ID
        ORDER BY p.CREATED_AT DESC
    """)
    properties = []
    for row in cur.fetchall():
        properties.append({
            "id": row[0],
            "title": row[1],
            "host_id": row[2],
            "host_email": row[3],
            "host_name": row[4] or "Host",
        })

    cur.close()
    return hosts, properties


def create_ticket(data):
    """POST a support ticket to the Admin API."""
    resp = requests.post(f"{ADMIN_API}/admin/support/", json=data, timeout=10)
    resp.raise_for_status()
    return resp.json()


def create_dispute(data):
    """POST a dispute to the Admin API."""
    resp = requests.post(f"{ADMIN_API}/admin/disputes/", json=data, timeout=10)
    resp.raise_for_status()
    return resp.json()


def seed_tickets(users, bookings, dry_run=False):
    """Create support tickets from existing user and booking data."""
    print("\n═══ Creating Support Tickets ═══")
    tickets_to_create = []

    # Use as many templates as we have users, cycling if needed
    templates = list(TICKET_TEMPLATES)
    random.shuffle(templates)

    for i, user in enumerate(users):
        template = templates[i % len(templates)]

        # If we have a matching booking, reference it
        user_bookings = [b for b in bookings if b["user_id"] == user["id"]]
        booking_ref = ""
        if user_bookings:
            b = random.choice(user_bookings)
            booking_ref = f"\n\nBooking ID: {b['id']}\nProperty ID: {b['property_id']}\nStatus: {b['status']}\nAmount: ₱{b['total_price']:,.2f}"

        ticket = {
            "subject": template["subject"],
            "description": template["description"] + booking_ref,
            "requester_name": user["name"],
            "requester_email": user["email"],
            "category": template["category"],
            "priority": template["priority"],
        }
        tickets_to_create.append(ticket)

    print(f"  {len(tickets_to_create)} tickets to create")

    if dry_run:
        for t in tickets_to_create:
            print(f"  [DRY RUN] {t['subject']} → {t['requester_name']}")
        return len(tickets_to_create)

    created = 0
    for t in tickets_to_create:
        try:
            result = create_ticket(t)
            print(f"  [CREATED] #{result['id']} {t['subject']} → {t['requester_name']}")
            created += 1
        except Exception as e:
            print(f"  [ERROR] {t['subject']}: {e}")

    print(f"  Total tickets created: {created}/{len(tickets_to_create)}")
    return created


def seed_disputes(bookings, hosts, properties, dry_run=False):
    """Create disputes from existing booking data."""
    print("\n═══ Creating Disputes ═══")
    disputes_to_create = []

    templates = list(DISPUTE_TEMPLATES)
    random.shuffle(templates)

    # Pick bookings for disputes — prefer cancelled/refund_requested statuses
    dispute_bookings = []
    priority_statuses = ["cancelled", "refund_requested", "refund_completed"]
    for b in bookings:
        if b["status"] in priority_statuses:
            dispute_bookings.append(b)
    # Fill remaining slots with other bookings
    if len(dispute_bookings) < len(templates):
        remaining = [b for b in bookings if b not in dispute_bookings]
        dispute_bookings.extend(remaining)

    dispute_bookings = dispute_bookings[:len(templates)]

    for i, booking in enumerate(dispute_bookings):
        template = templates[i % len(templates)]

        # Sometimes the dispute is filed by the host, sometimes by the guest
        if random.random() < 0.3 and hosts:
            # Host-filed dispute
            host = random.choice(hosts)
            filed_by = host["name"]
            filed_by_email = host["email"]
        else:
            # Guest-filed dispute
            filed_by = booking["name"]
            filed_by_email = booking["email"]

        dispute = {
            "booking_external_id": str(booking["id"]),
            "filed_by": filed_by,
            "filed_by_email": filed_by_email,
            "reason": template["reason"],
            "evidence": template["evidence"],
        }
        disputes_to_create.append(dispute)

    print(f"  {len(disputes_to_create)} disputes to create")

    if dry_run:
        for d in disputes_to_create:
            print(f"  [DRY RUN] Booking {d['booking_external_id'][:8]}... by {d['filed_by']}")
        return len(disputes_to_create)

    created = 0
    for d in disputes_to_create:
        try:
            result = create_dispute(d)
            print(f"  [CREATED] #{result['id']} Booking {d['booking_external_id'][:8]}... by {d['filed_by']}")
            created += 1
        except Exception as e:
            print(f"  [ERROR] Booking {d['booking_external_id'][:8]}...: {e}")

    print(f"  Total disputes created: {created}/{len(disputes_to_create)}")
    return created


def main():
    parser = argparse.ArgumentParser(description="Seed Admin support tickets and disputes from existing data")
    parser.add_argument("--dry-run", action="store_true", help="Preview what would be created without making changes")
    parser.add_argument("--tickets-only", action="store_true", help="Only create support tickets")
    parser.add_argument("--disputes-only", action="store_true", help="Only create disputes")
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════╗")
    print("║  TiraNa — Support & Dispute Seed Script         ║")
    print("╚══════════════════════════════════════════════════╝")

    # Check Admin API is running
    try:
        resp = requests.get(f"{ADMIN_API}/health", timeout=5)
        if resp.status_code == 200:
            print("[OK] Admin API is running")
        else:
            print(f"[WARN] Admin API returned status {resp.status_code}")
    except Exception as e:
        print(f"[ERROR] Cannot reach Admin API at {ADMIN_API}: {e}")
        print("       Make sure Admin-TiraNa is running: docker-compose up -d")
        sys.exit(1)

    users = []
    bookings = []
    hosts = []
    properties = []

    # Fetch from Client DB (CockroachDB)
    if not args.disputes_only:
        crdb = connect_cockroach()
        if crdb:
            try:
                users = fetch_client_users(crdb)
                print(f"  Found {len(users)} users")
                bookings = fetch_client_bookings(crdb)
                print(f"  Found {len(bookings)} bookings")
            except Exception as e:
                print(f"[ERROR] Querying CockroachDB: {e}")
            finally:
                crdb.close()

    # Fetch from Host DB (Oracle)
    if not args.tickets_only:
        oracle = connect_oracle()
        if oracle:
            try:
                hosts, properties = fetch_host_data(oracle)
                print(f"  Found {len(hosts)} hosts")
                print(f"  Found {len(properties)} properties")
            except Exception as e:
                print(f"[ERROR] Querying Oracle: {e}")
            finally:
                oracle.close()

    # Validate we have data
    if not args.disputes_only and not users:
        print("\n[ERROR] No users found in Client DB. Cannot create tickets.")
        sys.exit(1)
    if not args.tickets_only and not bookings:
        print("\n[ERROR] No bookings found. Cannot create disputes.")
        sys.exit(1)

    # Seed
    total_tickets = 0
    total_disputes = 0

    if not args.disputes_only:
        total_tickets = seed_tickets(users, bookings, dry_run=args.dry_run)

    if not args.tickets_only:
        total_disputes = seed_disputes(bookings, hosts, properties, dry_run=args.dry_run)

    # Summary
    print("\n═══ Summary ═══")
    mode = " [DRY RUN]" if args.dry_run else ""
    print(f"  Support tickets created: {total_tickets}{mode}")
    print(f"  Disputes created: {total_disputes}{mode}")
    print(f"\n  View at: {ADMIN_API}/admin/support  and  {ADMIN_API}/admin/disputes")

    if args.dry_run:
        print("\n  Run without --dry-run to actually create the records.")


if __name__ == "__main__":
    main()
