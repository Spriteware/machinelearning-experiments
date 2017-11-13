#!/usr/bin/env python3 -u

import sys
import argparse
import numpy as np
import matplotlib.pyplot as plt

from mpl_toolkits.mplot3d import Axes3D

parser = argparse.ArgumentParser()
parser.add_argument("file", help="file name to create", default="generated-data.js")
parser.add_argument("variable", help="variable name")
parser.add_argument("size", help="size of the sample to create", type=int)
parser.add_argument("--display", help="display generated data on a graph", action="store_true")

args = parser.parse_args()
filename = args.file
variable = args.variable
size = args.size
display = args.display

########################

def function(k, data):
    if k == 2:
        return True if data[0] > data[1] else False
    else:
        return True if data[0] >= data[1] and data[1] >= data[2] else False

K = 2
inputs = []
targets = []
class_0 = 0
class_1 = 0

# Building 50% target=0 and 50% target=1
while class_0 < size / 2 or class_1 < size / 2:

    # curr = np.random.randn(k)
    curr = np.random.uniform(-0.5, 0.5, K)

    if class_1 < size / 2 and function(K, curr):
        inputs.append(curr)
        targets.append(1)
        class_1 += 1

    elif class_0 < size / 2:
        inputs.append(curr)
        targets.append(0)
        class_0 += 1

########################################################
# Statistics
print("Distribution statistics:")
print("mean: {:f}, std: {:f}, variance: {:f}".format(np.mean(inputs), np.std(inputs), np.var(inputs)))

#########################################################

# Generate data string
data = "var " + variable + " = \""

for i in range(size):
    data += " ".join(map(str, inputs[i])) + " : " + str(targets[i]) + ";\\\n"

data += "\";"

# Display data
# print(data)

# Save data to a file
fh = open(filename, "w+")
fh.write(data)
fh.close()


#########################################################

inputs = np.asarray(inputs).transpose()
targets = np.asarray(targets)

# Display points in 2 D
if display:

    colors = []
    for i in range(size):
        colors.append("red" if targets[i] == 1 else (0,0,0,0.2))

    fig = plt.figure()

    # Create subplot
    if K == 2:
        ax = fig.add_subplot(111, aspect=1.0)
        ax.scatter(inputs[0], inputs[1], s=100, color=colors, alpha=0.8)
    else:
        ax = fig.add_subplot(111, aspect=1.0, projection="3d")
        ax.scatter(inputs[0], inputs[1], inputs[2], s=50, color=colors)

        X = 0; Y = 1; Z = 2
        pts = [
            (-0.5, -0.5, -0.5),
            (0.5, -0.5, -0.5),
            (0.5, 0.5, -0.5),
            (0.5, 0.5, 0.5),
        ]

        def line_to(pt_from, pt_to):
            ax.plot([pts[pt_from][0], pts[pt_to][0]], [pts[pt_from][1], pts[pt_to][1]], "b--", zs=[pts[pt_from][2], pts[pt_to][2]])

        line_to(0, 1)
        line_to(1, 2)
        line_to(2, 3)
        line_to(3, 0)
        line_to(3, 1)
        line_to(0, 2)
        
        ax.set_zlim(-0.5, 0.5)
        ax.set_zlabel("c")
        

    ax.set_xlabel("a")
    ax.set_ylabel("b")
    ax.set_xlim(-0.5, 0.5)
    ax.set_ylim(-0.5, 0.5)

    plt.show()
