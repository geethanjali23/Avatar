import os
import requests

# 1. Setup paths relative to THIS script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
MODELS_DIR = os.path.join(STATIC_DIR, "models")

# 2. Create directories if missing
if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)
    print(f"Created directory: {MODELS_DIR}")
else:
    print(f"Directory exists: {MODELS_DIR}")

# 3. Files required for SSD MobileNet (High Accuracy)
base_url = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
files = [
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
]

print("\n--- DOWNLOADING FILES ---")
for file_name in files:
    save_path = os.path.join(MODELS_DIR, file_name)
    url = f"{base_url}/{file_name}"
    
    print(f"Downloading {file_name}...")
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            print(f" -> Saved to: {save_path}")
        else:
            print(f" -> ERROR {response.status_code}: Could not download {url}")
    except Exception as e:
        print(f" -> FAILED: {e}")

print("\n✅ Check complete. Restart your Flask server.")