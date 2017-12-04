
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

def function(x):
    return np.sin(x / 10) / 2

###############################


def generate_data(sequences, sequences_size, display=True):

    # Generating and displaying data
    raw = np.fromfunction(function, (sequences - 1 + sequences_size,), dtype=int)
    X = []
    y = []

    for i in range(sequences):
        X.append(raw[i : i + sequences_size - 1])
        y.append(raw[i + sequences_size - 1 : i + sequences_size])

    if display is True:
        fig = plt.figure()
        for i in range(sequences):
            plt.plot(np.arange(sequences_size-1) + i, X[i] + i *0.01)
        plt.show()

    return np.asarray(X), np.asarray(y)


def build_model(dim):
    
    # Computing the right folder for TensorBoard
    path = "./tmp/" + str(dir_count("./tmp"))
    print("> Saving in '{}'".format(path));

    # Building model
    model = Sequential()
    callback = TensorBoard(log_dir=path)
    sgd = optimizers.SGD(lr=0.01, decay=1e-6, momentum=0.9, nesterov=True)

    model.add(layers.LSTM(units=dim[1], input_shape=(None, dim[0])))
    model.add(layers.Dropout(0.2))
    model.add(layers.Dense(units=dim[2]))
    model.add(layers.Activation("linear"))

    start = time.time()
    model.compile(loss="mse", optimizer="rmsprop")
    print("> Compilation Time : ", time.time() - start)

    return model, callback

###############################

seq = 10
seq_size = 100

X, y = generate_data(seq, seq_size, False)
model, callback = build_model([seq_size-1, 25, 1])

model.fit(X, y, batch_size=128, epochs=1, callbacks=[callback])
