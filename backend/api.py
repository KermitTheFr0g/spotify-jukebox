import os

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from routers import admin
from routers import juke

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(juke.router)

@app.get("/")
async def root():
    return {"message": "JukeBox is live!"}
