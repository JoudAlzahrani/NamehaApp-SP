import numpy as np
import pandas as pd
import os
import json
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

SEQUENCE_LENGTH = 30
TEST_SIZE       = 0.2
EPOCHS          = 100
BATCH_SIZE      = 64
DATA_FOLDER     = "data_us_improved"
MODEL_FOLDER    = "model"
os.makedirs(MODEL_FOLDER, exist_ok=True)

def load_all_data():
    all_sequences = []
    all_labels    = []

    csv_files = [f for f in os.listdir(DATA_FOLDER) if f.endswith(".csv")]
    print(f"Found {len(csv_files)} US stock files\n")

    for filename in csv_files:
        ticker = filename.replace(".csv", "")
        path   = os.path.join(DATA_FOLDER, filename)

        try:
            df = pd.read_csv(path, index_col=0)
            df = df.select_dtypes(include=[np.number])
            df = df.dropna()

            if len(df) < SEQUENCE_LENGTH + 10:
                print(f"  ⚠️  {ticker}: not enough data, skipping")
                continue

            close_prices = df["Close"].values
            scaler       = MinMaxScaler()
            scaled       = scaler.fit_transform(df)
            sequences, labels = build_sequences(scaled, close_prices)
            all_sequences.extend(sequences)
            all_labels.extend(labels)

            print(f"  ✅ {ticker}: {len(sequences)} sequences, "
                  f"{df.shape[1]} features")

        except Exception as e:
            print(f"  ❌ {ticker}: error — {e}")

    return np.array(all_sequences), np.array(all_labels)


def build_sequences(scaled_data, close_prices):
    sequences = []
    labels    = []

    for i in range(SEQUENCE_LENGTH, len(scaled_data)):
        sequences.append(scaled_data[i - SEQUENCE_LENGTH:i])
        went_up = 1 if close_prices[i] > close_prices[i - 1] else 0
        labels.append(went_up)

    return sequences, labels


def build_model(input_shape):
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(64, return_sequences=True),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(32, activation="relu"),
        Dense(16, activation="relu"),
        Dense(1,  activation="sigmoid")
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.0005),
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )

    return model


def train():
    print("=" * 50)
    print("NAMEHA LSTM TRAINING — US MARKET")
    print("=" * 50)

    print("\n📂 Loading US data...")
    X, y = load_all_data()

    if len(X) == 0:
        print("❌ No data loaded.")
        return

    print(f"\n✅ Total sequences: {len(X)}")
    print(f"   Sequence shape:  {X.shape}")
    print(f"   Up days:         {y.sum()} ({y.mean()*100:.1f}%)")
    print(f"   Down days:       {len(y) - y.sum()} ({(1-y.mean())*100:.1f}%)")

    up_count   = y.sum()
    down_count = len(y) - up_count
    total      = len(y)

    class_weight = {
        0: total / (2 * down_count),
        1: total / (2 * up_count)
    }

    print(f"\n⚖️  Class weights:")
    print(f"   Down weight: {class_weight[0]:.3f}")
    print(f"   Up weight:   {class_weight[1]:.3f}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, shuffle=True, random_state=42
    )

    print(f"\n📊 Training set: {len(X_train)} sequences")
    print(f"   Test set:     {len(X_test)} sequences")
    print(f"   Features:     {X.shape[2]}")

    print("\n🔨 Building model...")
    model = build_model(input_shape=(X.shape[1], X.shape[2]))
    model.summary()

    early_stop = EarlyStopping(
        monitor="val_accuracy",
        patience=15,
        restore_best_weights=True,
        verbose=1
    )

    reduce_lr = ReduceLROnPlateau(
        monitor="val_accuracy",
        factor=0.3,
        patience=7,
        min_lr=0.000001,
        verbose=1,
        mode="max"
    )

    print("\n🚀 Training started...")
    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_split=0.1,
        class_weight=class_weight,
        callbacks=[early_stop, reduce_lr],
        shuffle=True,
        verbose=1
    )

    print("\n📈 Evaluating on test data...")
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"\n✅ Test Accuracy: {accuracy * 100:.2f}%")
    print(f"   Test Loss:     {loss:.4f}")

    model_path = os.path.join(MODEL_FOLDER, "lstm_us.keras")
    model.save(model_path)
    print(f"\n💾 Model saved to {model_path}")

    stats = {
        "test_accuracy":   round(accuracy * 100, 2),
        "test_loss":       round(float(loss), 4),
        "sequences":       len(X),
        "features":        int(X.shape[2]),
        "sequence_length": SEQUENCE_LENGTH,
        "market":          "US",
        "stocks":          20,
        "epochs_trained":  len(history.history["accuracy"])
    }

    with open(os.path.join(MODEL_FOLDER, "model_us_stats.json"), "w") as f:
        json.dump(stats, f, indent=2)

    print(f"   Stats saved to model/model_us_stats.json")

    plt.figure(figsize=(12, 4))

    plt.subplot(1, 2, 1)
    plt.plot(history.history["accuracy"],     label="Train accuracy")
    plt.plot(history.history["val_accuracy"], label="Val accuracy")
    plt.title("US Model Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history["loss"],     label="Train loss")
    plt.plot(history.history["val_loss"], label="Val loss")
    plt.title("US Model Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()

    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_FOLDER, "training_chart_us.png"))
    print(f"   Chart saved to model/training_chart_us.png")

    print("\n🎉 Training complete!")
    print(f"   Final accuracy: {accuracy * 100:.2f}%")

    if accuracy >= 0.60:
        print("   ✅ Excellent — strong US model for Nameha")
    elif accuracy >= 0.55:
        print("   ✅ Good — usable US model for Nameha")
    else:
        print("   ⚠️  Low — needs more work")

    return model, stats


if __name__ == "__main__":
    train()