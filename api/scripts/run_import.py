from pathlib import Path

from app.core.database import SessionLocal
from app.modules.import_.csv_import import import_businesses

with SessionLocal() as db:
    imported, errors = import_businesses(db, Path("data/businesses.csv"))
    print(f"Imported {imported} businesses.")
    if errors:
        print(f"{len(errors)} row(s) skipped:")
        for e in errors:
            print(f"  - {e}")