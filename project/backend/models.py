from pydantic import BaseModel

class Vessel(BaseModel):
    id: int
    name: str
    location: list[float]

class RouteRequest(BaseModel):
    vessel_id: int
    destination: list[float]

class RouteSegment(BaseModel):
    lat: float
    lon: float
    status: str
