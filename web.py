from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from providers.providers import CheckModelExistProvider, PruneModelProvider
from utils.utils import checkModelExistence, countParameters,count_model_size_gb
from transformers import AutoTokenizer, AutoModelForCausalLM
from services.compressionUtils import CompressionUtils
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

compressionUtils = CompressionUtils()

app = FastAPI()

origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)


app.mount("/static", StaticFiles(directory="frontend",html=True), name="static")

@app.get("/")
async def read_index():
    return FileResponse("frontend/index.html")

@app.post("/api/check_model")
async def checkModelUrlValidity(provider: CheckModelExistProvider):
    model_name = provider.model_name
    is_valid,model= checkModelExistence(model_name)

    if is_valid:
        model_parameters = countParameters(model)
        model_size_gb = count_model_size_gb(model)
        return {"exit": 1, "model_parameters": model_parameters, "model_size": model_size_gb,"model_name": model_name}
    
    return {"exit": 0}


@app.post("/api/prune_model")
async def pruneModel(provider: PruneModelProvider):
    model_name = provider.model_name
    prune_percentage = provider.prune_percentage/100.0
    
    is_valid = checkModelExistence(model_name)

    if not is_valid:
        return {"exit": 1, "message": "Model not found"}
    # Placeholder for pruning logic
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model  = AutoModelForCausalLM.from_pretrained(model_name)
    model = compressionUtils.pruneModel(model, prune_percentage=prune_percentage)
    parameters = countParameters(model)
    return {"parameters_after_pruning": parameters}

    
if __name__ == "__main__":
    uvicorn.run("web:app", host="127.0.0.1", port=8000, reload=True)
