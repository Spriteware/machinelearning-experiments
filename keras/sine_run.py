#! C:/Python3/pythonw.exe -u

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
import sine_lstm as lstm

###############################  CORE BELOW ###############################

SEQ_SIZE = 3
TRAIN_SIZE = 6000

# SEQ_SIZE = 3
# TRAIN_SIZE = 30

TEST_SIZE = SEQ_SIZE+1
TRAIN_PADDING = 0
TEST_PADDING = int(np.random.random() * SEQ_SIZE)
# TEST_PADDING = int(np.random.random() * SEQ_SIZE)
TEST_PADDING = 14

print("> Train dataset size={}, Sequence size={}, Padding={} ".format(TRAIN_SIZE, SEQ_SIZE, TRAIN_PADDING))
print("> Test dataset size={}, Sequence size={}, Padding={} ".format(TEST_SIZE, SEQ_SIZE, TEST_PADDING))

############################### DATA

raw_train, x_train, y_train = lstm.generate_data(TRAIN_SIZE, SEQ_SIZE, TRAIN_PADDING)
raw_test, x_test, y_test = lstm.generate_data(TEST_SIZE, SEQ_SIZE, TEST_PADDING)

# print("x_train\n", x_train.shape, "\n", x_train)
# print("y_train\n", y_train.shape, "\n", y_train)
print("x_train\n", x_train.shape, "\n")
print("y_train\n", y_train.shape, "\n")
# print("x_test\n", x_test.shape, "\n", x_test)

# for i in range(x_train.shape[0]):
#     tab = x_train[i]
#     print(i, tab[-4:], y_train[i], "\n")

# sys.exit(0)

############################### MODEL

model, callbacks = lstm.build_model([1, SEQ_SIZE, 5, 1])
model.fit(
    x_train, 
    y_train,
    batch_size=32,
    epochs=1,
    validation_split=0.1,
    callbacks=callbacks)

############################### PREDICTION

n = 300
window = np.copy(x_test)
predictions = []
i = SEQ_SIZE

while n > 0:
    n -= 1
    predicted = model.predict(window).flatten()[0]
    window = window.flatten()[1:SEQ_SIZE]  # shift window
    # window = np.append(window, [raw_train[i]])
    window = np.append(window, [predicted])
    window = np.reshape(window, (1, window.shape[0], 1))
    predictions.append(predicted)
    i += 1

    # print ("> Predicted: {}".format(predicted))
    # print("\n", window, "\n")

predictions = np.array(predictions)

############################### DISPLAY

fig = plt.figure()

# plt.plot(np.arange(TRAIN_SIZE) + TRAIN_PADDING, raw_train, "-.", linewidth=1, markersize=1, label="Training data")
plt.plot(np.arange(TEST_SIZE) + TEST_PADDING, raw_test, "--", linewidth=1, markersize=1, label="Test window")
plt.plot(np.arange(predictions.shape[0]) + TEST_SIZE - 1 + TEST_PADDING, predictions, ".r", linewidth=1, markersize=2, label="Prediction")
plt.plot(np.arange(1) + TEST_SIZE - 1 + TEST_PADDING, y_test, "xb", linewidth=1, markersize=2, label="Test wanted")


plt.legend()
plt.savefig("./img/" + str(lstm.dir_count("./img")), bbox_inches='tight')
plt.show()
