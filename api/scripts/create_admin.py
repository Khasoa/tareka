import getpass

from app.core.database import SessionLocal
from app.modules.admin.models import AdminUser
from app.modules.admin.security import hash_password


def run() -> None:
    email = input("Admin email: ").strip()
    password = getpass.getpass("Admin password: ")

    db = SessionLocal()

    try:
        if db.query(AdminUser).filter_by(email=email).first():
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
