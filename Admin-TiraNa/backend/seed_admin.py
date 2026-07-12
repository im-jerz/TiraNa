import bcrypt
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tira_admin:tira_secret@localhost:5432/tirana_db")
ADMIN_EMAIL = "j1e1r1s1o1n@gmail.com"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Cardo123@"

def seed():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        existing = db.execute(
            text("SELECT id FROM admin_accounts WHERE email = :email"),
            {"email": ADMIN_EMAIL}
        ).fetchone()

        if existing:
            print(f"Admin account {ADMIN_EMAIL} already exists. Updating password...")
            hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            db.execute(
                text("UPDATE admin_accounts SET password_hash = :hash, is_active = true WHERE email = :email"),
                {"hash": hashed, "email": ADMIN_EMAIL}
            )
        else:
            print(f"Creating admin account {ADMIN_EMAIL}...")
            hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            db.execute(
                text("""
                    INSERT INTO admin_accounts (username, email, password_hash, is_active, password_changed)
                    VALUES (:username, :email, :hash, true, true)
                """),
                {"username": ADMIN_USERNAME, "email": ADMIN_EMAIL, "hash": hashed}
            )

        db.commit()
        print("Admin seed completed successfully!")
        print(f"  Email:    {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding admin: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
