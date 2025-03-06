from fastapi import APIRouter

router = APIRouter()

@router.get("/zones")
def get_hazard_zones():
    return [{"lat": 21.0, "lon": 71.0, "type": "Storm"}]
