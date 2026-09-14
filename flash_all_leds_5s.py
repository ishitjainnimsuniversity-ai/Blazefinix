import serial
import time

def program_all_leds():
    print("[*] Connecting to ESP8266 on COM3...")
    s = serial.Serial('COM3', 115200, timeout=2)
    time.sleep(1)
    
    # Enter raw REPL
    s.write(b'\r\n\x03\x03\x01')
    time.sleep(0.5)
    s.read_all()
    
    # MicroPython code that controls ALL LEDs (GPIO 2 and GPIO 16, active low & active high)
    # Blinks after every 5 seconds
    script = """
import machine, time

# Setup all possible LED pins on ESP8266 / NodeMCU
# GPIO 2 = Builtin ESP-12 LED (Active LOW)
# GPIO 16 = NodeMCU D0 onboard LED (Active LOW)
# Also initialize GPIO 0, 4, 5, 12, 13, 14, 15 just in case external LEDs are attached

pins_to_drive = [2, 16, 0, 4, 5, 12, 13, 14, 15]
led_objs = []
for p in pins_to_drive:
    try:
        led_objs.append(machine.Pin(p, machine.Pin.OUT))
    except Exception:
        pass

# Write to boot / main.py for permanent non-stop operation even without PC
main_code = '''import machine, time

pins = [2, 16, 0, 4, 5, 12, 13, 14, 15]
leds = []
for p in pins:
    try:
        leds.append(machine.Pin(p, machine.Pin.OUT))
    except:
        pass

print("ALL LEDs Blinking mode active (5 second cycle)")

while True:
    # TURN EVERY LIGHT ON (both active-low 0 and active-high)
    # Active-low LEDs turn ON at 0
    for l in leds:
        l.value(0)
    time.sleep(1.0) # Stay glowing ON for 1 second
    
    # TURN OFF for 5 seconds
    for l in leds:
        l.value(1)
    time.sleep(5.0) # Wait 5 seconds before next glow
'''

with open('main.py', 'w') as f:
    f.write(main_code)

print("FLASHED_ALL_LEDS_OK")
"""
    s.write(script.encode('utf-8') + b'\x04')
    time.sleep(1.5)
    resp = s.read_all().decode('ascii', errors='ignore')
    print("[*] Response:", resp)
    
    # Reboot ESP8266 to run main.py
    s.write(b'\x04')
    time.sleep(0.5)
    s.write(b'\x02')
    time.sleep(1)
    s.close()
    print("[+] All lights on ESP8266 are now configured and glowing/blinking every 5 seconds!")

if __name__ == '__main__':
    program_all_leds()
