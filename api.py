import os

import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse

from routers import admin
from routers import juke

app = FastAPI()

app.include_router(admin.router)
app.include_router(juke.router)

@app.get("/")
async def root():
    return {"message": "JukeBox is live!"}
