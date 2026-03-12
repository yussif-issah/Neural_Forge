import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("172.20.83.97", 16000))
s.sendall(b"Hello")
s.close()