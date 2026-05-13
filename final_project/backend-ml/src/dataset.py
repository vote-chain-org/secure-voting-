"""
Loads fingerprint images from data/real (label=1) and data/spoof (label=0).
Applies augmentation for training, plain resize/normalize for val/test.
Uses WeightedRandomSampler to handle class imbalance.
Splits: 75% train / 15% val / 10% test, stratified.
"""

import numpy as np
from pathlib import Path
from PIL import Image
from sklearn.model_selection import train_test_split
import torch
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import torchvision.transforms as T

EXTENSIONS = {".bmp", ".png", ".jpg", ".jpeg", ".tif", ".tiff"}

def get_train_transforms(image_size=224):
    return T.Compose([
        T.Resize((image_size, image_size)),
        T.Grayscale(num_output_channels=3),
        T.RandomRotation(degrees=10),
        T.RandomAffine(degrees=0, translate=(0.05, 0.05), scale=(0.95, 1.05), shear=3),
        T.ColorJitter(brightness=0.3, contrast=0.3),
        T.GaussianBlur(kernel_size=3, sigma=(0.1, 1.0)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

def get_val_transforms(image_size=224):
    return T.Compose([
        T.Resize((image_size, image_size)),
        T.Grayscale(num_output_channels=3),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

class FingerprintLivenessDataset(Dataset):
    def __init__(self, file_paths, labels, transform=None):
        self.file_paths = file_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        try:
            image = Image.open(self.file_paths[idx]).convert("RGB")
        except Exception:
            image = Image.new("RGB", (224, 224), color=128)
        if self.transform:
            image = self.transform(image)
        return image, torch.tensor(self.labels[idx], dtype=torch.long)

    @classmethod
    def scan_directory(cls, data_dir):
        data_dir = Path(data_dir)
        paths, labels = [], []
        for p in (data_dir / "real").iterdir():
            if p.suffix.lower() in EXTENSIONS:
                paths.append(str(p)); labels.append(1)
        for p in (data_dir / "spoof").iterdir():
            if p.suffix.lower() in EXTENSIONS:
                paths.append(str(p)); labels.append(0)
        print(f"Found {labels.count(1)} real, {labels.count(0)} spoof images")
        return paths, labels

def build_dataloaders(data_dir, image_size=224, batch_size=32,
                      val_split=0.15, test_split=0.10, num_workers=2, seed=42):
    paths, labels = FingerprintLivenessDataset.scan_directory(data_dir)
    tr_p, tmp_p, tr_l, tmp_l = train_test_split(
        paths, labels, test_size=val_split + test_split, stratify=labels, random_state=seed)
    val_ratio = val_split / (val_split + test_split)
    vl_p, te_p, vl_l, te_l = train_test_split(
        tmp_p, tmp_l, test_size=1 - val_ratio, stratify=tmp_l, random_state=seed)
    train_ds = FingerprintLivenessDataset(tr_p, tr_l, get_train_transforms(image_size))
    val_ds   = FingerprintLivenessDataset(vl_p, vl_l, get_val_transforms(image_size))
    test_ds  = FingerprintLivenessDataset(te_p, te_l, get_val_transforms(image_size))
    counts  = np.bincount(tr_l)
    weights = 1.0 / counts[tr_l]
    sampler = WeightedRandomSampler(torch.DoubleTensor(weights), len(train_ds), replacement=True)
    train_loader = DataLoader(train_ds, batch_size=batch_size, sampler=sampler,
                              num_workers=num_workers, pin_memory=True)
    val_loader   = DataLoader(val_ds, batch_size=batch_size, shuffle=False,
                              num_workers=num_workers, pin_memory=True)
    test_loader  = DataLoader(test_ds, batch_size=batch_size, shuffle=False,
                              num_workers=num_workers, pin_memory=True)
    print(f"Split -> train: {len(train_ds)}, val: {len(val_ds)}, test: {len(test_ds)}")
    return train_loader, val_loader, test_loader
