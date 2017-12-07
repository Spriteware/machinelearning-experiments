#! C:/Python3/pythonw.exe -u

import os
import sys
import csv
import time
import numpy as np

from keras.models import Sequential
from keras.callbacks import TensorBoard, EarlyStopping
from keras.optimizers import SGD
from keras.layers import LSTM, Dropout, Dense, Activation

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Hide messy TensorFlow warnings

def dir_count(path):
    for curr, dirnames, filenames in os.walk(path):
        return len(dirnames)

def split_set(dataset):
    X = np.array([dataset[0], dataset[1]]).transpose()
    y = np.array([dataset[2]]).transpose()
    return X, y

def sine(x):
    return np.sin(x / 20) / 2

###############################


def generate_data(dataset_size, sequence_size, padding=0.0):
    
    if dataset_size <= sequence_size:
        raise ValueError("The dataset size can't be smaller or equal to the sequence size")

    # Generating and displaying data
    raw = np.asarray(np.fromfunction(lambda x: sine(x+padding), (dataset_size,), dtype=int)).tolist()
    data = []
    i = sequence_size

    # We shift our window (size by sequence_size) of 1 on the right. i is the right edge of the window
    while True:
        data.append( raw[i - sequence_size: i+1] )

        if i >= dataset_size-1:
            break
        i += 1

    # Data shuffling
    data = np.asarray(data)
    np.random.shuffle(data)

    data = data.transpose()
    y1d = np.copy(data[sequence_size])
    x2d = np.delete(data, sequence_size, 0).transpose()

    # print("FIRST x2d", x2d.shape, x2d, "\n")
    # print("FIRST y1d", y1d.shape, y1d, "\n")

    y1d = y1d.reshape((y1d.shape[0], 1))
    x2d = x2d.reshape((x2d.shape[0], x2d.shape[1], 1))

    # print("SECOND x2d", x2d.shape, x2d, "\n")
    # print("SECOND y1d", y1d.shape, y1d, "\n")

    return raw, x2d, y1d



class BatchHistory(TensorBoard):

    def on_epoch_begin(self, epoch, logs=None):
        self.curr_epoch = epoch
    
    def on_batch_end(self, batch, logs={}):
        self.on_epoch_end(self.curr_epoch, logs)
    

def build_model(dim):
    
    # Computing the right folder for TensorBoard
    path = "./tmp/" + str(dir_count("./tmp"))
    print("> Saving in '{}'".format(path));

    # Building model
    model = Sequential()
    sgd = SGD(lr=0.01, decay=1e-6, momentum=0.9, nesterov=True)
    tensorboard = TensorBoard(log_dir=path, write_grads=True, write_images=True)
    early_stopping = EarlyStopping(monitor="val_loss")
    callbacks = [tensorboard, early_stopping]
    # callback = BatchHistory(log_dir=path)

    model.add(LSTM(
        units=dim[1],
        input_shape=(dim[1], dim[0]),
        activation=None,
        return_sequences=True,
        implementation=1))
    model.add(Dropout(0.2))

    model.add(LSTM(
        units=dim[2],
        activation=None,
        return_sequences=False,
        implementation=1))
    model.add(Dropout(0.2))

    model.add(Dense(
        units=dim[3], 
        activation="linear"))
    model.add(Activation("linear"))

    start = time.time()
    model.compile(loss="mse", optimizer=sgd)
    print("> Compilation Time : ", time.time() - start)

    return model, callbacks
