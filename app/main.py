from fastapi import FastAPI

from app.routers.schemes import router

app = FastAPI()

app.include_router(router)