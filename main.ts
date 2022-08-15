radio.onReceivedNumber(function on_received_number(receivedNumber: number) {
    
    y = current_row
    n = receivedNumber
    for (let x = 0; x < 5; x++) {
        pict_list[y][x] = Math.idiv(n % 2 ** (5 - x), 2 ** (4 - x))
    }
    refresh()
    if (n == 4) {
        state = "complete"
    }
    
})
function refresh() {
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            led.plotBrightness(x, y, 255 * pict_list[y][x])
        }
    }
}

function send_synack() {
    radio.sendString("SYN-ACK")
    basic.pause(50)
    radio.sendValue("ack", seq_before + 1)
    basic.pause(50)
    radio.sendValue("seq", randint(0, 4094))
}

input.onButtonPressed(Button.A, function on_button_pressed_a() {
    
    if (state == "idle") {
        led_loc += 1
        led_loc = led_loc % 25
    }
    
})
function send_fin() {
    
    state = "FIN_WAIT_1"
    radio.sendString("FIN")
    basic.pause(50)
    seq += 1
    radio.sendValue("seq", seq)
}

function send_ack() {
    
    radio.sendString("ACK")
    basic.pause(50)
    radio.sendValue("ack", seq_before + 1)
    basic.pause(50)
    seq += 1
    radio.sendValue("seq", seq)
}

function send_syn() {
    
    state = "SYN_SENT"
    radio.sendString("SYN")
    basic.pause(50)
    seq = randint(0, 4094)
    radio.sendValue("seq", seq)
}

input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    let result: number;
    
    if (state == "idle") {
        send_syn()
        images.createImage(`
            . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
        `).scrollImage(1, 200)
        led.plotBarGraph(1, 3)
    } else if (state == "connected") {
        for (let y = 0; y < 5; y++) {
            result = 0
            for (let x = 0; x < 5; x++) {
                result += pict_list[y][x] * 2 ** (4 - x)
            }
            radio.sendValue("seq", y)
            basic.pause(200)
            radio.sendNumber(result)
            basic.pause(200)
        }
        state = "complete"
    } else if (state == "complete") {
        send_fin()
        images.createImage(`
            # # # # #
                        # # # # #
                        # # # # #
                        # # # # #
                        # # # # #
        `).scrollImage(1, 200)
        led.plotBarGraph(3, 4)
    }
    
})
radio.onReceivedString(function on_received_string(receivedString: string) {
    
    if (state == "FIN_WAIT_1") {
        if (receivedString == "ACK") {
            state = "FIN_WAIT_2"
        }
        
    } else if (state == "complete") {
        if (receivedString == "FIN") {
            state = "CLOSE_WAIT"
        }
        
    } else if (!(state == "connected")) {
        if (receivedString == "SYN") {
            state = "SYN_RECEIVED"
        }
        
        if (receivedString == "SYN-ACK") {
            state = "ESTABLISHED_SEND"
        }
        
        if (receivedString == "ACK") {
            state = "ESTABLISHED_RECEIVE"
        }
        
    }
    
})
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    if (state == "idle") {
        pict_list[y][x] = 1 - pict_list[y][x]
        refresh()
    }
    
})
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    
    if (state == "SYN_RECEIVED") {
        seq_before = value
        basic.pause(300)
        images.createImage(`
            . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
                        . . . . .
        `).scrollImage(1, 200)
        basic.pause(200)
        led.plotBarGraph(1, 3)
        basic.pause(1000)
        send_synack()
        led.plotBarGraph(2, 3)
    }
    
    if (state == "ESTABLISHED_SEND") {
        if (name == "ack" && !(value == seq + 1)) {
            send_syn()
        } else {
            basic.pause(200)
            led.plotBarGraph(2, 3)
            basic.pause(500)
        }
        
        if (name == "seq") {
            seq_before = value
            send_ack()
            led.plotBarGraph(3, 3)
            basic.pause(1000)
            images.createImage(`
                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
            `).scrollImage(1, 200)
            state = "connected"
        }
        
    }
    
    if (state == "ESTABLISHED_RECEIVE") {
        if (name == "ack" && !(value == seq + 1)) {
            send_synack()
        } else {
            basic.pause(300)
            led.plotBarGraph(3, 3)
            basic.pause(1000)
        }
        
        if (name == "seq") {
            images.createImage(`
                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
                                . . . . .
            `).scrollImage(1, 200)
            state = "connected"
        }
        
    }
    
    if (state == "connected") {
        if (name == "seq") {
            current_row = value
        }
        
    }
    
    if (state == "CLOSE_WAIT") {
        if (name == "seq") {
            seq_before = value
            basic.pause(300)
            images.createImage(`
                # # # # #
                                # # # # #
                                # # # # #
                                # # # # #
                                # # # # #
            `).scrollImage(1, 200)
            basic.pause(200)
            led.plotBarGraph(3, 4)
            basic.pause(1000)
            send_ack()
            led.plotBarGraph(2, 4)
        }
        
    }
    
    if (state == "FIN_WAIT_2") {
        if (name == "ack" && !(value == seq + 1)) {
            send_fin()
        } else {
            basic.pause(200)
            led.plotBarGraph(2, 4)
            basic.pause(500)
        }
        
    }
    
})
let x = 0
let seq = 0
let led_loc = 0
let seq_before = 0
let n = 0
let current_row = 0
let y = 0
let pict_list : number[][] = []
let state = ""
radio.setGroup(1)
state = "idle"
pict_list = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
radio.sendNumber(0)
basic.forever(function on_forever() {
    let x: number;
    let y: number;
    if (state == "idle") {
        refresh()
        basic.pause(500)
    }
    
    if (state == "idle") {
        x = led_loc % 5
        y = Math.idiv(led_loc, 5)
        led.plotBrightness(x, y, 128)
        basic.pause(500)
    }
    
})
