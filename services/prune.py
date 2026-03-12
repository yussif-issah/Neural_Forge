
import sys
from pathlib import Path
import torch

# Add the directory containing 'utils' to sys.path
# (Going up two levels to reach the parent of 'utils')
path_root = Path(__file__).resolve().parents[1] 
sys.path.append(str(path_root))

from utils.utils import count_model_size_gb
from transformers import AutoTokenizer, AutoModelForCausalLM

from services.compressionUtils import CompressionUtils
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-1B")
model  = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-1B")

compressionUtils = CompressionUtils()

new_model =compressionUtils.pruneModel(model, prune_percentage=0.6)
count_model_size_gb(model)
count_model_size_gb(new_model)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
print(count_model_size_gb(model))
quantized_model = torch.ao.quantization.quantize(
    model,
    {torch.nn.Linear},
    dtype=torch.qint8
)

print(count_model_size_gb(quantized_model))
