import torch
from model_arch import VideoOnlyBaseline

model = VideoOnlyBaseline()

x = torch.randn(1, 16, 3, 224, 224)

output = model(x)

print(output.shape)
