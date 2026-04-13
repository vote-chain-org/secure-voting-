"""
ResNet-18 binary classifier: output 0 = spoof, 1 = real/live finger.
Layers conv1, bn1, layer1, layer2 are frozen during Phase 1 training.
Call model.unfreeze_all() at the start of Phase 2.
"""

import torch
import torch.nn as nn
import torchvision.models as models

class LivenessNet(nn.Module):
    def __init__(self, pretrained=True, dropout=0.4):
        super().__init__()
        weights = models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        backbone = models.resnet18(weights=weights)
        for layer in [backbone.conv1, backbone.bn1, backbone.layer1, backbone.layer2]:
            for param in layer.parameters():
                param.requires_grad = False
        self.backbone = nn.Sequential(*list(backbone.children())[:-1])
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(256, 64), nn.ReLU(inplace=True),
            nn.Dropout(dropout / 2),
            nn.Linear(64, 2),
        )
        for m in self.head.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, nonlinearity="relu")
                nn.init.zeros_(m.bias)

    def forward(self, x):
        return self.head(self.backbone(x))

    def liveness_score(self, x):
        with torch.no_grad():
            return torch.softmax(self.forward(x), dim=1)[:, 1]

    def unfreeze_all(self):
        for p in self.parameters():
            p.requires_grad = True

def get_model(pretrained=True, dropout=0.4):
    return LivenessNet(pretrained=pretrained, dropout=dropout)
