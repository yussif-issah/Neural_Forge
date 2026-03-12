import torch
import torch.nn as nn


class CompressionUtils:
    def __init__(self):
        super().__init__()
    
    def computeNeuronImportance(self,weight_gate,weight_up):
        # Placeholder for neuron importance computation logic

        gate_max_abs = torch.max(weight_gate,dim=1).values + torch.abs(torch.min(weight_gate,dim=1).values)
        up_max_abs =  torch.max(weight_up,dim=1).values + torch.abs(torch.min(weight_up,dim=1).values)
        importance_scores = gate_max_abs + up_max_abs
        return importance_scores
        
    def computeAttentionHeadImportance(self,attention):
        # Placeholder for attention head importance computation logic
        pass
    def computeLayerImportance(self,layer):
        # Placeholder for layer importance computation logic
        pass
    def prune_neuron(self,mlp,prune_percentage):
        # Placeholder for model pruning logic
        gated_weight = mlp.gate_proj.weight.data.float()
        up_weight = mlp.up_proj.weight.data.data.float()

        importance_scores = self.computeNeuronImportance(gated_weight,up_weight)

        total_neurons = gated_weight.size(0)
        k  = int(total_neurons-1 - (total_neurons * prune_percentage))
        
        if k <= 0:
            raise ValueError("Prune percentage is too high, cannot prune all neurons.")

        _, indices_to_keep = torch.topk(importance_scores, k, largest=True,sorted=True)

        indices_to_keep = indices_to_keep.sort().values 

        new_gate_weight = nn.Linear(mlp.gate_proj.in_features, k,bias = False)
        new_up_weight = nn.Linear(mlp.up_proj.in_features, k,bias = False)
        new_down_proj = nn.Linear(k, mlp.down_proj.out_features,bias = False)


        new_gate_weight.weight.data = mlp.gate_proj.weight.data[indices_to_keep,:]
        new_up_weight.weight.data = mlp.up_proj.weight.data[indices_to_keep,:]
        new_down_proj.weight.data = mlp.down_proj.weight.data[:, indices_to_keep]

        return new_gate_weight, new_up_weight, new_down_proj,k
    
    def pruneModel(self,model,prune_percentage):

        new_intermediate_size = None
        for idx, layer in enumerate(model.model.layers):

            mlp = layer.mlp
            new_gate_weight, new_up_weight, new_down_proj,new_size = self.prune_neuron(mlp, prune_percentage)

            mlp.gate_proj = new_gate_weight
            mlp.up_proj = new_up_weight
            mlp.down_proj = new_down_proj

            if new_intermediate_size is None:
                new_intermediate_size = new_size
            
        model.config.intermediate_size = new_intermediate_size
        return model
        








