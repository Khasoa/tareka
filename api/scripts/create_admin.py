import getpass

from app.core.database import SessionLocal
from app.modules.admin.models import AdminUser
from app.modules.admin.security import hash_password


def run() -> None:
    email = input("Admin email: ").strip().lower()

    if not email or "@" not in email or len(email) > 200:
        print("Enter a valid admin email address.")
        return

    password = getpass.getpass("Admin password (minimum 12 characters): ")
    if len(password) < 12:
        print("Password must be at least 12 characters.")
        return

    confirmation = getpass.getpass("Confirm admin password: ")
    if password != confirmation:
        print("Passwords do not match.")
        return

    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter_by(email=email).first()
        if existing:
            print("An admin with that email already exists.")
            return

        db.add(
            AdminUser(
                email=email,
                password_hash=hash_password(password),
            )
        )
        db.commit()
        print("Admin created.")

    finally:
        db.close()


if __name__ == "__main__":
    run()
