import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Rust tutorial", description="Rust tutorial", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
    allow_credentials=True,
)


app.mount("/", StaticFiles(directory="docs", html=True), name="docs")

if __name__ == "__main__":
    # standalone
    uvicorn.run(app, host="0.0.0.0", port=8089, log_level="info")
