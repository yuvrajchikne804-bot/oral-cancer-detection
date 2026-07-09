import os
# pyrefly: ignore [missing-import]
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from PIL import Image
import io

app = Flask(__name__)
# Enable CORS for all domains, specifically allowing our frontend (default Vite port is 5173)
CORS(app, resources={r"/*": {"origins": "*"}})

# Path to the patched model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "Oral cancer detection.h5")

# Load model globally on startup
print("Loading model...")
try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    })

@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model is not loaded on server. Check logs."}), 500

    if "image" not in request.files:
        return jsonify({"error": "No image file provided in the request"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename selected"}), 400

    try:
        # Read the image file using PIL
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))

        # Ensure RGB format
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Resize to 256x256 (expected input shape of the model)
        img_resized = img.resize((256, 256))

        # Convert to numpy array
        img_array = np.array(img_resized, dtype=np.float32)

        # Add batch dimension (1, 256, 256, 3)
        img_batch = np.expand_dims(img_array, axis=0)

        # Run inference. Since the model has a rescaling layer, we pass the 0-255 range directly.
        # Use model(x, training=False) as it is faster and safer for concurrent requests in Flask.
        predictions = model(img_batch, training=False)
        
        # Define 9 classes sorted alphabetically (default Keras class sorting from directory structure)
        class_names = [
            "Canker Sores",          # Index 0 (Benign/Low Risk)
            "Cold Sores",            # Index 1 (Benign/Low Risk)
            "Gingivostomatitis",     # Index 2 (Benign/Low Risk)
            "Leukoplakia",           # Index 3 (Pre-cancerous/High Risk)
            "Mouth Cancer",          # Index 4 (Malignant/High Risk)
            "Normal",                # Index 5 (Healthy/Low Risk)
            "Oral Cancer",           # Index 6 (Malignant/High Risk)
            "Oral Lichen Planus",    # Index 7 (Potentially malignant/High Risk)
            "Oral Thrush"            # Index 8 (Benign/Low Risk)
        ]
        
        # Get index with highest probability
        predicted_idx = int(np.argmax(predictions[0]))
        predicted_class = class_names[predicted_idx]
        
        # Get raw probability of the predicted class
        raw_prob = float(predictions[0][predicted_idx])
        confidence = raw_prob * 100
        
        # Determine classification and confidence based on high-risk cancer classes
        cancer_classes = {"Leukoplakia", "Mouth Cancer", "Oral Cancer", "Oral Lichen Planus"}
        
        if predicted_class in cancer_classes:
            result = "Cancer Detected"
        else:
            result = "No Cancer"

        return jsonify({
            "success": True,
            "prediction": raw_prob,
            "result": result,
            "confidence": round(confidence, 2),
            "class_name": predicted_class
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    # Run the server on port 5000
    app.run(host="0.0.0.0", port=5000, debug=False)
