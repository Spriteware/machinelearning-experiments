#!/usr/bin/env python3 -u

# This file generates a dataset for a classification experiment

import sys
import csv
import argparse
import numpy as np
import matplotlib.pyplot as plt

from matplotlib.pyplot import scatter, show, xlim, ylim
from mpl_toolkits.mplot3d import Axes3D

parser = argparse.ArgumentParser()
parser.add_argument(
    "type",
    help="type of the sample",
    choices=["training", "validation", "test"])
parser.add_argument("size", help="size of the sample to create", type=int)
parser.add_argument("--file", help="output file", default=None)
parser.add_argument(
    "--no-display",
    help="display generated data on a graph",
    action="store_true")

args = parser.parse_args()
args.file = args.type + "-set.csv" if args.file is None else args.file

########################


def function(k, data):
    if k == 2:
        return True if data[0] > data[1] else False
    else:
        return True if data[0] > data[1] and data[1] > data[2] else False


K = 2
inputs = []
targets = []
class_0 = 0
class_1 = 0

# Building 50% target=0 and 50% target=1
while class_0 < args.size / 2 or class_1 < args.size / 2:

    if args.type == "test":
        a, b = np.random.uniform(-5, 5, K)
        if (a > -0.5 and a < 0.5) or (b > -0.5 and b < 0.5):
            continue
    else:
        a, b = np.random.uniform(-0.5, 0.5, K)

    if class_1 < args.size / 2 and function(K, [a, b]):
        inputs.append([a, b])
        targets.append(1)
        class_1 += 1

    elif class_0 < args.size / 2 and not function(K, [a, b]):
        inputs.append([a, b])
        targets.append(0)
        class_0 += 1

########################################################
# Statistics
print("Distribution statistics:")
print("mean: {:f}, std: {:f}, variance: {:f}".format(
    np.mean(inputs), np.std(inputs), np.var(inputs)))

#########################################################
# Generate data CSV

with open(args.file, "w", newline="\n", encoding="utf-8") as csvfile:
    fieldnames = ["input_a", "input_b", "target"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for i in range(args.size):
        writer.writerow({
            "input_a": inputs[i][0],
            "input_b": inputs[i][1],
            "target": targets[i]
        })

#########################################################
# Display points in 2D

inputs = np.asarray(inputs).transpose()
targets = np.asarray(targets)

if args.no_display == False:

    colors = []
    for i in range(args.size):
        colors.append((1, 0, 0) if targets[i] == 1 else (0, 0, 0, 0.2))

    fig = plt.figure()

    # Create 2D or 3D subplots
    # Sometimes, we can see black plots over red plots when it's not supposed to be : I suspected that plt.scatter has trouble with mixing colors

    if K == 2:
        ax = fig.add_subplot(111, aspect=1.0)
        ax.scatter(inputs[0], inputs[1], s=100, color=colors, alpha=0.8)
    else:
        ax = fig.add_subplot(111, aspect=1.0, projection="3d")
        ax.scatter(inputs[0], inputs[1], inputs[2], s=50, color=colors)

        # Display the triangle in order to better visualize
        X = 0
        Y = 1
        Z = 2
        pts = [
            (-0.5, -0.5, -0.5),
            (0.5, -0.5, -0.5),
            (0.5, 0.5, -0.5),
            (0.5, 0.5, 0.5),
        ]

        def line_to(pt_from, pt_to):
            ax.plot(
                [pts[pt_from][0], pts[pt_to][0]],
                [pts[pt_from][1], pts[pt_to][1]],
                "b--",
                zs=[pts[pt_from][2], pts[pt_to][2]])

        line_to(0, 1)
        line_to(1, 2)
        line_to(2, 3)
        line_to(3, 0)
        line_to(3, 1)
        line_to(0, 2)

        ax.set_zlabel("c")

    ax.set_xlabel("a")
    ax.set_ylabel("b")
    # ax.set_xlim(-0.5, 0.5)
    # ax.set_ylim(-0.5, 0.5)

    plt.show()
