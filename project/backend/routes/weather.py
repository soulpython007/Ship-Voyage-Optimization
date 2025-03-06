from fastapi import APIRouter

router = APIRouter()

@router.get("/forecast")
def get_weather():
    return {"forecast": "Sunny with scattered clouds"}
