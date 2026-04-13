"""
Two-phase training:
  Phase 1 (epochs 1-15):  Head only, LR=1e-3, backbone frozen.
  Phase 2 (epochs 16-35): Full network, LR=1e-5.
Saves best model by validation AUC to models/best_model.pt.
Key metrics: FAR (spoof accepted as real, target < 0.01)
             FRR (real voter rejected, target < 0.05)
"""

import time, json, argparse
from pathlib import Path
import torch, torch.nn as nn, torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR
from sklearn.metrics import roc_auc_score, confusion_matrix, accuracy_score
import numpy as np
from src.dataset import build_dataloaders
from src.model import get_model

def compute_metrics(labels, preds, probs):
    acc = accuracy_score(labels, preds)
    auc = roc_auc_score(labels, probs)
    tn, fp, fn, tp = confusion_matrix(labels, preds).ravel()
    far = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    frr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
    return dict(accuracy=acc, auc=auc, FAR=far, FRR=frr,
                TP=int(tp), TN=int(tn), FP=int(fp), FN=int(fn))

def run_epoch(model, loader, criterion, optimizer, device, training):
    model.train() if training else model.eval()
    total_loss, all_labels, all_preds, all_probs = 0.0, [], [], []
    with torch.set_grad_enabled(training):
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            logits = model(images)
            loss = criterion(logits, labels)
            if training:
                optimizer.zero_grad(); loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
            total_loss += loss.item() * images.size(0)
            probs = torch.softmax(logits, dim=1)[:, 1].detach().cpu().numpy()
            all_probs.extend(probs)
            all_preds.extend((probs >= 0.5).astype(int))
            all_labels.extend(labels.cpu().numpy())
    metrics = compute_metrics(all_labels, all_preds, all_probs)
    metrics["loss"] = total_loss / len(loader.dataset)
    return metrics

def train(config):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    train_loader, val_loader, test_loader = build_dataloaders(
        data_dir=config["data_dir"], image_size=config["image_size"],
        batch_size=config["batch_size"], num_workers=config["num_workers"])
    model = get_model(pretrained=True, dropout=config["dropout"]).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=config["lr_phase1"], weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=config["phase1_epochs"])
    save_dir = Path(config["save_dir"]); save_dir.mkdir(parents=True, exist_ok=True)
    best_val_auc, patience_count, history = 0.0, 0, []
    total_epochs = config["phase1_epochs"] + config["phase2_epochs"]
    print("-- Phase 1: head only --")
    for epoch in range(1, total_epochs + 1):
        if epoch == config["phase1_epochs"] + 1:
            print("\n-- Phase 2: full network --")
            model.unfreeze_all()
            optimizer = optim.AdamW(model.parameters(), lr=config["lr_phase2"], weight_decay=1e-4)
            scheduler = CosineAnnealingLR(optimizer, T_max=config["phase2_epochs"], eta_min=1e-7)
        t0 = time.time()
        tr = run_epoch(model, train_loader, criterion, optimizer, device, training=True)
        vl = run_epoch(model, val_loader, criterion, None, device, training=False)
        scheduler.step()
        print(f"Epoch {epoch:02d}/{total_epochs} | Loss {tr['loss']:.4f}/{vl['loss']:.4f} | "
              f"AUC {tr['auc']:.4f}/{vl['auc']:.4f} | FAR {vl['FAR']:.4f} FRR {vl['FRR']:.4f} | {time.time()-t0:.1f}s")
        history.append({"epoch": epoch, "train": tr, "val": vl})
        if vl["auc"] > best_val_auc:
            best_val_auc = vl["auc"]; patience_count = 0
            torch.save({"epoch": epoch, "model_state_dict": model.state_dict(),
                        "val_auc": best_val_auc, "config": config}, save_dir / "best_model.pt")
            print(f"  * Best model saved (val AUC {best_val_auc:.4f})")
        else:
            patience_count += 1
            if patience_count >= config["patience"]:
                print(f"\nEarly stopping at epoch {epoch}"); break
    print("\n-- Test results --")
    ckpt = torch.load(save_dir / "best_model.pt", map_location=device)
    model.load_state_dict(ckpt["model_state_dict"])
    test = run_epoch(model, test_loader, criterion, None, device, training=False)
    print(f"AUC {test['auc']:.4f} | FAR {test['FAR']:.4f} | FRR {test['FRR']:.4f}")
    with open(save_dir / "training_history.json", "w") as f:
        json.dump(history, f, indent=2)
    return model, history

DEFAULT = dict(data_dir="data", image_size=224, batch_size=32, num_workers=2,
               dropout=0.4, lr_phase1=1e-3, lr_phase2=1e-5,
               phase1_epochs=15, phase2_epochs=20, patience=7, save_dir="models")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    for k, v in DEFAULT.items():
        parser.add_argument(f"--{k}", type=type(v), default=v)
    train(vars(parser.parse_args()))
