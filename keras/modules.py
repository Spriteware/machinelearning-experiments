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

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Hide messy TensorFlow warnings
