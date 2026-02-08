from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.document_routes import router as document_router
from routes.qa_routes import router as qa_router

app = FastAPI(title="Document Q&A API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(document_router)
app.include_router(qa_router)


@app.get("/")
def read_root():
    return {"message": "Document Q&A API", "status": "running", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
