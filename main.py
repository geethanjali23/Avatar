# main.py
from assistant import VoiceAssistant

def main():
    va = VoiceAssistant()
    try:
        va.start()
    except KeyboardInterrupt:
        print("Interrupted by user. Exiting.")
        va.stop()

if __name__ == "__main__":
    main()
