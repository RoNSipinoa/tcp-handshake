input.onButtonPressed(Button.B, function on_button_pressed_b() {
    if (state == "idle") {
        pict_list[y32][x32] = 1 - pict_list[y32][x32]
        refresh()
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
function send_ack() {
    
    radio.sendString("ACK")
    basic.pause(50)
    radio.sendValue("ack", seq_before + 1)
    basic.pause(50)
    seq += 1
    radio.sendValue("seq", seq)
}

radio.onReceivedNumber(function on_received_number(receivedNumber: number) {
    
    let current_row2 = 0
    y3 = current_row2
    n = receivedNumber
    for (let x3 = 0; x3 < 5; x3++) {
        pict_list[y3][x3] = Math.idiv(n % 2 ** (5 - x3), 2 ^ 4 - x3)
    }
    refresh()
})
input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    
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
    }
    
    if (state == "connected") {
        for (let y2 = 0; y2 < 5; y2++) {
            result = 0
            for (let x2 = 0; x2 < 5; x2++) {
                result += pict_list[y2][x2] * 2 ** (4 - x2)
            }
            radio.sendValue("seq", y2)
            basic.pause(200)
            radio.sendNumber(result)
            basic.pause(200)
        }
    }
    
})
function send_syn() {
    
    state = "SYN_SENT"
    radio.sendString("SYN")
    basic.pause(50)
    seq = randint(0, 4094)
    radio.sendValue("seq", seq)
}

radio.onReceivedString(function on_received_string(receivedString: string) {
    
    if (!(state == "connected")) {
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
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    let current_row: number;
    
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
        current_row = value
    }
    
})
let result = 0
let n = 0
let y3 = 0
let seq = 0
let led_loc = 0
let seq_before = 0
let x32 = 0
let y32 = 0
let pict_list : number[][] = []
let state = ""
radio.setGroup(1)
state = "idle"
pict_list = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
radio.sendNumber(0)
basic.forever(function on_forever() {
    
    if (state == "idle") {
        refresh()
        basic.pause(500)
    }
    
    if (state == "idle") {
        x32 = led_loc % 5
        y32 = Math.idiv(led_loc, 5)
        led.plotBrightness(x32, y32, 128)
        basic.pause(500)
    }
    
})
