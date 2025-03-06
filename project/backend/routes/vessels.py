from fastapi import APIRouter
from models import Vessel

router = APIRouter()

@router.get("/", response_model=list[Vessel])
def get_vessels():
    return [
        {"id": 1, "name": "Vessel A", "location": [20.0, 70.0]},
        {"id": 2, "name": "Vessel B", "location": [22.5, 72.0]},
    ]
