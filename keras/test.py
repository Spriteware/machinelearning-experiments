
import os
import sys
import csv
import numpy as np

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

def main():

    path = "./tmp/" + str(dir_count("./tmp"))

    # Building model
    model = Sequential()
    callback = TensorBoard(log_dir=path)
    sgd = optimizers.SGD(lr=0.01, decay=1e-6, momentum=0.9, nesterov=True)

    # Adding layers
    model.add(layers.Dense(units=4, activation="linear", input_dim=2))
    model.add(layers.ELU(alpha=0.001))
    model.add(layers.Dense(units=4, activation="linear"))
    model.add(layers.ELU(alpha=0.001))
    model.add(layers.Dense(units=1, activation="sigmoid"))

    model.compile(loss="binary_crossentropy", optimizer=sgd, metrics=["accuracy"])

    training = np.loadtxt("training-set.csv", delimiter=",").transpose()
    validation = np.loadtxt("validation-set.csv", delimiter=",").transpose()
    test = np.loadtxt("test-set.csv", delimiter=",").transpose()

    X_train, y_train = split_set(training)
    X_validation, y_validation = split_set(validation)
    X_test, y_test = split_set(test)

    print (X_test, y_test)

    # model.fit(X_train, y_train, epochs=30, batch_size=128, callbacks=[callback])
    model.fit(X_test, y_test, epochs=100, batch_size=32, callbacks=[callback])

    validation_metrics = model.evaluate(X_validation, y_validation, batch_size=128)
    print("validation:\t", validation_metrics)


if __name__ == "__main__":
    main()
