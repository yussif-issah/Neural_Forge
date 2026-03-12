from pydantic import BaseModel

class CheckModelExistProvider(BaseModel):
    model_name: str

class PruneModelProvider(BaseModel):
    model_name: str
    prune_percentage: float
    techniques: list