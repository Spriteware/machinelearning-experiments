#!/usr/bin/env python3

import sys
import numpy as np
import matplotlib.pyplot as plt

file = open("c:/wamp64/www/machinelearning/data/ball-data-5.js", "r")
input_data = []
target_data = []
l = 0

inputs_nb = 0
inputs_target = 0

for line in file: 

    error = False
    splitted = line.split(":")
    if len(splitted) != 2:
        continue

    raw_inputs = splitted[0].split()
    raw_targets = splitted[1].split()

    inputs = []
    targets = []

    for i in range(len(raw_inputs)):
        try:
            inputs.append( float(raw_inputs[i].strip("\\;")) )
        except ValueError:
            error = True
            break

    for i in range(len(raw_targets)):
        try:
            targets.append( float(raw_targets[i].strip("\\;")) )
        except ValueError:
            error = True
            break

    if error:
        continue

    input_data.append(inputs)
    target_data.append(targets)

input_data = np.matrix(input_data).transpose()
input_mean = np.mean(input_data, axis=1).getA1()
input_data_size = input_data.shape[0]

target_data = np.matrix(target_data).transpose()
target_mean = np.mean(target_data, axis=1).getA1()
target_data_size = target_data.shape[0]

######## DISPLAY

subplots = input_data_size + target_data_size
n = 0

for i in range(input_data_size):
    n += 1
    ax = plt.subplot(subplots, 1, n)
    data = input_data[i].getA1()
    plt.plot(data)
    plt.plot([0, len(data)], [input_mean[i], input_mean[i]])
    ax.set_xlim(0, len(data))
    ax.set_ylim(-1.1, 1.1)

for i in range(target_data_size):
    n += 1
    ax = plt.subplot(subplots, 1, n)
    data = target_data[i].getA1()
    plt.plot(data)
    plt.plot([0, len(data)], [target_mean[i], target_mean[i]])
    ax.set_xlim(0, len(data))
    ax.set_ylim(-1.1, 1.1)

plt.show()

######## END DISPLAY