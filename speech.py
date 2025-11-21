# speech.py
import threading
import queue
import time
import os
import speech_recognition as sr
import pyttsx3

class ContinuousSpeech:
    """
    Listens continuously in background and pushes recognized text to a queue.
    Pauses listening while TTS is speaking to avoid echo/loop.
    """
    def __init__(self, assistant_name="Assistant"):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.queue = queue.Queue()
        self._stop_listening = None
        self.speaking_lock = threading.Lock()
        self.engine = pyttsx3.init()
        self.engine.setProperty("rate", 165)
        self.assistant_name = assistant_name
        self._listening = False

    def _callback(self, recognizer, audio):
        # Called from background thread when audio is captured
        # If assistant is speaking, drop capture
        if self.speaking_lock.locked():
            return
        try:
            text = recognizer.recognize_google(audio)
            text = text.strip()
            if text:
                print(f"[You] {text}")
                self.queue.put(text)
        except sr.UnknownValueError:
            # nothing recognized
            return
        except sr.RequestError as e:
            print("Speech API error:", e)
            return

    def start_listening(self):
        if self._listening:
            return
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=0.6)
        # start background listening
        self._stop_listening = self.recognizer.listen_in_background(self.microphone, self._callback)
        self._listening = True
        print("Listening (continuous) ...")

    def stop_listening(self):
        if self._stop_listening:
            self._stop_listening(wait_for_stop=False)
        self._listening = False

    def speak(self, text, wait=True):
        # Acquire lock to pause recognition callback
        def _run():
            with self.speaking_lock:
                print(f"[{self.assistant_name}] {text}")
                self.engine.say(text)
                self.engine.runAndWait()
        if wait:
            _run()
        else:
            t = threading.Thread(target=_run, daemon=True)
            t.start()
