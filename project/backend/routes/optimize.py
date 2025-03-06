from fastapi import APIRouter
from models import RouteRequest, RouteSegment
from typing import List

router = APIRouter()

@router.post("/", response_model=List[RouteSegment])
def optimize_route(request: RouteRequest):
    route = [
        {"lat": 20.0, "lon": 70.0, "status": "Safe"},
        {"lat": 21.0, "lon": 71.0, "status": "Storm"},
        {"lat": 22.5, "lon": 72.0, "status": "Safe"}
    ]
    return route
