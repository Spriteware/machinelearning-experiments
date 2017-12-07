
import os
import sys
import csv
import time
import numpy as np

import matplotlib.pyplot as plt

from keras.models import Sequential
from keras.callbacks import TensorBoard
from keras import optimizers
from keras import layers

def dir_count(path):
    for curr, dirnames, filenames in os.walk(path):
        return len(dirnames)

def split_set(dataset):
    X = np.array([dataset[0], dataset[1]]).transpose()
    y = np.array([dataset[2]]).transpose()
    return X, y

def sine(x):
    return np.sin(x / 15) / 2

###############################


def generate_data(sequences, sequences_size, padding=0.0):

    # Generating and displaying data
    raw = np.fromfunction(lambda x: sine(x+padding), (sequences - 1 + sequences_size,), dtype=int)
    X = []
    y = []

    for i in range(sequences):
        X.append(raw[i : i + sequences_size - 1])
        y.append(raw[i + sequences_size - 1 : i + sequences_size])

    return np.asarray(X), np.asarray(y)


def build_model(dim):
    
    # Computing the right folder for TensorBoard
    path = "./tmp/" + str(dir_count("./tmp"))
    print("> Saving in '{}'".format(path));

    # Building model
    model = Sequential()
    callback = TensorBoard(log_dir=path)
    sgd = optimizers.SGD(lr=0.01, decay=1e-6, momentum=0.9, nesterov=True)

    model.add(layers.LSTM(
        units=dim[1], 
        input_shape=(dim[0], 1),
        return_sequences=True))
    model.add(layers.LSTM(
        units=dim[2],
        return_sequences=False))
    model.add(layers.Dropout(0.2))
    model.add(layers.Dense(
        units=1))
    model.add(layers.Activation("linear"))

    start = time.time()
    model.compile(loss="mse", optimizer="rmsprop", metrics=["accuracy"])
    print("> Compilation Time : ", time.time() - start)

    return model, callback

###############################

seqs = 50
seq_size = 200
test_samples = 300
# test_padding = np.random.random_sample() * seq_size
test_padding = -seq_size

print("> {} sequences (size={}), {} test samples with padding={} Time : ".format(seqs, seq_size, test_samples, test_padding))

# Data
x_train, y_train = generate_data(seqs, seq_size)
x_test, y_test = generate_data(test_samples, seq_size, test_padding)

x_train_copy = np.copy(x_train)
x_test_copy = np.copy(x_test)

x_train = np.reshape(x_train, (x_train.shape[0], x_train.shape[1], 1))
x_test = np.reshape(x_test, (x_test.shape[0], x_test.shape[1], 1))

print("x_train", x_train.shape, x_train)
print()
print("x_test", x_test.shape, x_test)

# Model
model, callback = build_model([seq_size-1, 100, 1])
model.fit(x_train, y_train, batch_size=16, epochs=1, callbacks=[callback])

# Prediction
predicted = model.predict(x_test)
print ("> Predicted {}: {}".format(predicted.shape, predicted))

# Display
fig = plt.figure()

for i in range(test_samples):
    plt.plot(np.arange(seq_size - 1) + i + test_padding, x_test_copy[i], alpha=0.3)
    plt.plot(seq_size + i + test_padding, predicted[i][0], "or", markersize=2)

for i in range(seqs):
    plt.plot(np.arange(seq_size - 1) + i, x_train_copy[i], color="black")

plt.show()

# print(predicted)
