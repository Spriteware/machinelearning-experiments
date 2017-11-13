#!/usr/bin/env python3 -u

# Run python with -u to flush output directly

import sys
import argparse
import numpy as np
import matplotlib.pyplot as plt

parser = argparse.ArgumentParser()
parser.add_argument("file", help="file path to analyze")
parser.add_argument("--no-inputs", help="no display inputs", action="store_true")
parser.add_argument("--no-targets", help="no display targets", action="store_true")
parser.add_argument("-n", "--number", help="max number of inputs and targets displayed", type=int, default=0)

args = parser.parse_args()
path = args.file
print "Loading ", args.file

file = open(path, "r")
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

print "Done with loaded data (size=" + str(len(input_data)) + ")"

subplots = 0

if args.no_inputs is False:
    input_data = np.matrix(input_data).transpose()
    input_mean = np.mean(input_data, axis=1).getA1()
    input_data_size = input_data.shape[0]
    subplots += min(args.number, input_data_size) if args.number != 0 else input_data_size


if args.no_targets is False:
    target_data = np.matrix(target_data).transpose()
    target_mean = np.mean(target_data, axis=1).getA1()
    target_data_size = target_data.shape[0]
    subplots += min(args.number, target_data_size) if args.number != 0 else target_data_size


print "Done with matrix operations. Shape is " + str(input_data_size) + ":" + str(target_data_size)

######## DISPLAY

n = 0
sax = plt.subplot(subplots, 1, 1)

if args.no_inputs is False:
    for i in range(input_data_size):
        n += 1
        ax = sax if n == 1 else plt.subplot(subplots, 1, n, sharex=sax)
        data = input_data[i].getA1()

        plt.plot(data)
        plt.plot([0, len(data)], [input_mean[i], input_mean[i]], "g")
        ax.set_xlim(0, len(data))
        # ax.set_ylim(-1.1, 1.1)

        if args.number != 0 and i >= min(args.number, input_data_size)-1:
            break

if args.no_targets is False:
    for i in range(target_data_size):
        n += 1
        ax = sax if n == 1 else plt.subplot(subplots, 1, n, sharex=sax)
        data = target_data[i].getA1()

        plt.plot(data, "r")
        plt.plot([0, len(data)], [target_mean[i], target_mean[i]], "g")
        ax.set_xlim(0, len(data))
        ax.set_ylim(-1.1, 1.1)

        if args.number != 0 and i >= min(args.number, target_data_size)-1:
            break

plt.show()

######## END DISPLAY