from fastapi import FastAPI
from routes import vessels, weather, optimize, hazards

app = FastAPI()

app.include_router(vessels.router, prefix="/vessels")
app.include_router(weather.router, prefix="/weather")
app.include_router(optimize.router, prefix="/optimize")
app.include_router(hazards.router, prefix="/hazards")

@app.get("/")
def read_root():
    return {"message": "Ocean Route Optimization Backend Running"}
