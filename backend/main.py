from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Golf Handicap Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

@app.get("/")
def root():
    return {"message": "Golf handicap API is running"}