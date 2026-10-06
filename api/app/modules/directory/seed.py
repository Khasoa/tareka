from sqlalchemy import select

from app.core.database import SessionLocal
from app.modules.directory.models import Material

MATERIALS = [
    ("Plastic", "plastic", None),
    ("PET", "pet", "plastic"),
    ("HDPE", "hdpe", "plastic"),
    ("PP", "pp", "plastic"),
    ("Paper", "paper", None),
    ("Cardboard", "cardboard", "paper"),
    ("Glass", "glass", None),
    ("Metal", "metal", None),
    ("Aluminium", "aluminium", "metal"),
    ("Steel", "steel", "metal"),
    ("Textiles", "textiles", None),
    ("Organic Waste", "organic-waste", None),
    ("E-waste", "e-waste", None),
    ("Tyres", "tyres", None),
]


def seed() -> None:
    with SessionLocal() as db:
        parent_materials: dict[str, Material] = {}

        for name, slug, parent_slug in MATERIALS:
            existing = db.scalar(select(Material).where(Material.slug == slug))
            if existing:
                parent_materials[slug] = existing
                continue

            parent = parent_materials.get(parent_slug) if parent_slug else None
            material = Material(
                name=name, slug=slug, parent_id=parent.id if parent else None
            )
            db.add(material)
            db.flush()
            parent_materials[slug] = material

        db.commit()


if __name__ == "__main__":
    seed()
