import serial
import time
import sys

def main():
    print('[*] Connecting to ESP8266 on COM3...')
    s = serial.Serial('COM3', 115200, timeout=3)
    time.sleep(1)
    
    # Interrupt and enter raw REPL
    s.write(b'\r\n\x03\x03')
    time.sleep(0.5)
    s.read_all()
    
    s.write(b'\x01') # Enter raw REPL
    time.sleep(0.5)
    resp = s.read_all().decode('ascii', errors='ignore')
    print('[*] Raw REPL response:', repr(resp))
    
    py_code = """
with open('main.py', 'w') as f:
    f.write('''import machine, time
led2 = machine.Pin(2, machine.Pin.OUT)
try:
    led16 = machine.Pin(16, machine.Pin.OUT)
except:
    led16 = None

print("ESP8266 Blinker Running (5 second interval)")
while True:
    # LED ON (active low)
    led2.value(0)
    if led16:
        led16.value(0)
    time.sleep(0.8)
    
    # LED OFF for 5 seconds
    led2.value(1)
    if led16:
        led16.value(1)
    time.sleep(5)
''')
print("SAVED_MAIN_PY_OK")
"""
    print('[*] Uploading main.py to ESP8266 flash...')
    s.write(py_code.encode('utf-8') + b'\x04')
    time.sleep(1.5)
    exec_resp = s.read_all().decode('ascii', errors='ignore')
    print('[*] Execution output:', repr(exec_resp))
    
    # Soft reboot ESP8266 to start main.py
    print('[*] Rebooting ESP8266 into autonomous 5-second blinker mode...')
    s.write(b'\x04')
    time.sleep(0.5)
    
    # Exit raw REPL
    s.write(b'\x02')
    time.sleep(1)
    boot_resp = s.read_all().decode('ascii', errors='ignore')
    print('[*] Boot log:', repr(boot_resp))
    
    s.close()
    print('[+] SUCCESS! ESP8266 is now running the 5-second blinker autonomously in hardware!')

if __name__ == '__main__':
    main()
