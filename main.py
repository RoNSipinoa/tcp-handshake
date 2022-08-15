def on_received_number(receivedNumber):
    global y3, n, state
    y3 = current_row
    n = receivedNumber
    for x in range(5):
        pict_list[y3][x] = Math.idiv(n % 2 ** (5 - x), 2 ** (4 - x))
    refresh()
    if y3 == 4:
        state = "complete"
radio.on_received_number(on_received_number)

def refresh():
    for y in range(5):
        for x2 in range(5):
            led.plot_brightness(x2, y, 255 * pict_list[y][x2])
def send_synack():
    radio.send_string("SYN-ACK")
    basic.pause(50)
    radio.send_value("ack", seq_before + 1)
    basic.pause(50)
    radio.send_value("seq", randint(0, 4094))

def on_button_pressed_a():
    global led_loc
    if state == "idle":
        led_loc += 1
        led_loc = led_loc % 25
input.on_button_pressed(Button.A, on_button_pressed_a)

def send_fin():
    global state, seq
    state = "FIN_WAIT_1"
    radio.send_string("FIN")
    basic.pause(50)
    seq += 1
    radio.send_value("seq", seq)
def send_ack():
    global seq
    radio.send_string("ACK")
    basic.pause(50)
    radio.send_value("ack", seq_before + 1)
    basic.pause(50)
    seq += 1
    radio.send_value("seq", seq)
def send_syn():
    global state, seq
    state = "SYN_SENT"
    radio.send_string("SYN")
    basic.pause(50)
    seq = randint(0, 4094)
    radio.send_value("seq", seq)

def on_button_pressed_ab():
    global state
    if state == "idle":
        send_syn()
        images.create_image("""
            . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
        """).scroll_image(1, 200)
        led.plot_bar_graph(1, 3)
    elif state == "connected":
        for y2 in range(5):
            result = 0
            for x3 in range(5):
                result += pict_list[y2][x3] * 2 ** (4 - x3)
            radio.send_value("seq", y2)
            basic.pause(200)
            radio.send_number(result)
            basic.pause(200)
        state = "complete"
    elif state == "complete":
        send_fin()
        images.create_image("""
            # # # # #
                        # # # # #
                        # # # # #
                        # # # # #
                        # # # # #
        """).scroll_image(1, 200)
        led.plot_bar_graph(3, 4)
input.on_button_pressed(Button.AB, on_button_pressed_ab)

def on_received_string(receivedString):
    global state
    if state == "FIN_WAIT_1":
        if receivedString == "ACK":
            state = "FIN_WAIT_2"
    elif state == "FIN_WAIT_2":
        if receivedString == "FIN":
            state = "TIME_WAIT"
    elif state == "LAST_ACK":
        if receivedString == "ACK":
            state = "idle"
    elif not (state == "connected"):
        if receivedString == "SYN":
            state = "SYN_RECEIVED"
        if receivedString == "SYN-ACK":
            state = "ESTABLISHED_SEND"
        if receivedString == "ACK":
            state = "ESTABLISHED_RECEIVE"
        if receivedString == "FIN":
            state = "CLOSE_WAIT"
radio.on_received_string(on_received_string)

def on_button_pressed_b():
    if state == "idle":
        y3 = led_loc // 5
        x4 = led_loc % 5
        pict_list[y3][x4] = 1 - pict_list[y3][x4]
        refresh()
input.on_button_pressed(Button.B, on_button_pressed_b)

def on_received_value(name, value):
    global seq_before, state, current_row
    if state == "SYN_RECEIVED":
        seq_before = value
        basic.pause(300)
        images.create_image("""
            . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
        """).scroll_image(1, 200)
        basic.pause(200)
        led.plot_bar_graph(1, 3)
        basic.pause(1000)
        send_synack()
        led.plot_bar_graph(2, 3)
    if state == "ESTABLISHED_SEND":
        if name == "ack" and not (value == seq + 1):
            send_syn()
        else:
            basic.pause(200)
            led.plot_bar_graph(2, 3)
            basic.pause(500)
        if name == "seq":
            seq_before = value
            send_ack()
            led.plot_bar_graph(3, 3)
            basic.pause(1000)
            images.create_image("""
                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
            """).scroll_image(1, 200)
            state = "connected"
    if state == "ESTABLISHED_RECEIVE":
        if name == "ack" and not (value == seq + 1):
            send_synack()
        else:
            basic.pause(300)
            led.plot_bar_graph(3, 3)
            basic.pause(1000)
        if name == "seq":
            images.create_image("""
                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
            """).scroll_image(1, 200)
            state = "connected"
    if state == "connected":
        if name == "seq":
            current_row = value
    if state == "CLOSE_WAIT":
        if name == "seq":
            seq_before = value
            basic.pause(300)
            images.create_image("""
                # # # # #
                                # # # # #
                                # # # # #
                                # # # # #
                                # # # # #
            """).scroll_image(1, 200)
            basic.pause(200)
            led.plot_bar_graph(3, 4)
            basic.pause(1000)
            send_ack()
            led.plot_bar_graph(2, 4)
            basic.pause(2000)
            send_fin()
            state = "LAST_ACK"
            led.plot_bar_graph(1, 4)
            basic.pause(200)
    if state == "FIN_WAIT_2":
        if name == "ack" and not (value == seq + 1):
            send_fin()
        else:
            basic.pause(200)
            led.plot_bar_graph(2, 4)
            basic.pause(500)
    if state == "TIME_WAIT":
        if name == "seq":
            seq_before = value
            led.plot_bar_graph(1, 4)
            basic.pause(1000)
            send_ack()
            led.plot_bar_graph(0, 4)
            state = "idle"

radio.on_received_value(on_received_value)

seq = 0
led_loc = 0
seq_before = 0
n = 0
current_row = 0
y3 = 0
pict_list: List[List[number]] = []
state = ""
radio.set_group(1)
state = "idle"
pict_list = [[0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]]
radio.send_number(0)

def on_forever():
    if state == "idle":
        refresh()
        basic.pause(500)
    if state == "idle":
        x5 = led_loc % 5
        y4 = Math.idiv(led_loc, 5)
        led.plot_brightness(x5, y4, 128)
        basic.pause(500)
basic.forever(on_forever)
