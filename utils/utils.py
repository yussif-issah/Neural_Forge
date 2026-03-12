from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def checkModelExistence(model_name):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model  = AutoModelForCausalLM.from_pretrained(model_name)
        return True,model
    except Exception as e:
        print(f"Error loading model: {e}")
        return False,None

def countParameters(model):
    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return round(total_params/(1024**3), 2)


def count_model_size_gb(model):
    # Calculate bytes for parameters and buffers
    param_size = sum(p.nelement() * p.element_size() for p in model.parameters())
    buffer_size = sum(b.nelement() * b.element_size() for b in model.buffers())
    
    total_bytes = param_size + buffer_size
    
    # Convert to Gigabytes
    size_all_gb = total_bytes / (1024**3)

    return round(size_all_gb, 2)

#model_name = "meta-llama/Llama-3.1-8B"
#tokenizer = AutoTokenizer.from_pretrained(model_name)
#model  = AutoModelForCausalLM.from_pretrained(model_name)
