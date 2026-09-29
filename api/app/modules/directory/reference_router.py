from fastapi import APIRouter

from app.core.deps import DbSession
from app.modules.directory import service
from app.modules.directory.schemas import MaterialResponse

router = APIRouter(prefix="/directory", tags=["directory"])


@router.get("/materials", response_model=list[MaterialResponse])
def get_materials(db: DbSession):
    return service.list_materials(db)


@router.get("/counties", response_model=list[str])
def get_counties(db: DbSession):
    return service.list_counties(db)