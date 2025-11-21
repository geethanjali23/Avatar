# assistant.py
import os
import time
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from gemini_client import GeminiClient
from speech import ContinuousSpeech

MEMORY_FILE = "memory.json"

def load_memory():
    p = Path(MEMORY_FILE)
    if not p.exists():
        return {"conversations": [], "notes": []}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {"conversations": [], "notes": []}

def save_memory(mem):
    try:
        Path(MEMORY_FILE).write_text(json.dumps(mem, indent=2), encoding="utf-8")
    except Exception as e:
        print("Failed to save memory:", e)

class VoiceAssistant:
    def __init__(self):
        self.name = os.getenv("ASSISTANT_NAME", "Assistant")
        self.wake_word = os.getenv("WAKE_WORD", "hey assistant").lower()
        self.mem_limit = int(os.getenv("MEMORY_LIMIT", "5"))
        self.memory = load_memory()
        self.speech = ContinuousSpeech(assistant_name=self.name)
        # Gemini client
        try:
            self.ai = GeminiClient()
            self.llm_ok = True
        except Exception as e:
            print("Gemini client init error (no key?):", e)
            self.ai = None
            self.llm_ok = False

        self.running = True

    def start(self):
        self.speech.start_listening()
        # greeting
        self.speech.speak(f"Hello, I am {self.name}. I am listening continuously. Say 'stop' to quit.", wait=True)
        # main loop: process recognized phrases from queue
        while self.running:
            try:
                # block until a phrase arrives
                phrase = self.speech.queue.get(timeout=0.5)
            except Exception:
                # loop again
                continue

            if not phrase:
                continue

            # Optionally support wake-word: only process if wake_word present
            # For continuous mode, we process everything, but ignore short noises
            p = phrase.lower().strip()
            # Basic stop commands
            if any(k in p for k in ["stop", "exit", "quit", "shutdown", "goodbye"]):
                self.speech.speak("Goodbye. Shutting down.", wait=True)
                self.stop()
                break

            # If wake-word style desired, uncomment below:
            # if self.wake_word not in p:
            #    continue
            # else:
            #    # strip wake-word
            #    p = p.replace(self.wake_word, "").strip()

            # short-term memory: send last few user/assistant turns as context if needed
            # send prompt to LLM
            reply = self._get_reply(p)
            # speak reply (this will pause recognition because speak acquires lock)
            self.speech.speak(reply, wait=True)
            # save to memory
            conv = {"user": p, "assistant": reply, "time": time.time()}
            self.memory.setdefault("conversations", []).append(conv)
            # keep memory bounded
            if len(self.memory["conversations"]) > 200:
                self.memory["conversations"] = self.memory["conversations"][-200:]
            save_memory(self.memory)

        # cleanup
        self.speech.stop_listening()

    def _get_context(self):
        conv = self.memory.get("conversations", [])[-self.mem_limit:]
        parts = []
        for item in conv:
            u = item.get("user","").strip()
            a = item.get("assistant","").strip()
            if u:
                parts.append(f"User: {u}")
            if a:
                parts.append(f"Assistant: {a}")
        return "\n".join(parts)

    def _get_reply(self, prompt):
        if self.llm_ok and self.ai:
            system = f"You are {self.name}, a friendly, balanced assistant. Reply in 3-5 short sentences."
            context = self._get_context()
            if context:
                input_prompt = system + "\n\nConversation:\n" + context + "\n\nUser: " + prompt
            else:
                input_prompt = system + "\n\nUser: " + prompt
            try:
                resp = self.ai.ask(input_prompt)
                # postprocess: make 3-5 short sentences
                return self._postprocess(resp)
            except Exception as e:
                print("LLM call error:", e)
                return self.local_fallback(prompt)
        else:
            return self.local_fallback(prompt)

    def _postprocess(self, text):
        t = " ".join(text.split())
        sentences = [s.strip() for s in t.replace("\n"," ").split(".") if s.strip()]
        if len(sentences) > 5:
            sentences = sentences[:5]
        out = ". ".join(sentences)
        if not out.endswith("."):
            out += "."
        return out

    def local_fallback(self, prompt):
        p = prompt.lower()
        if "time" in p:
            import datetime
            return "It's " + datetime.datetime.now().strftime("%I:%M %p") + "."
        if "your name" in p or "who are you" in p:
            return f"My name is {self.name}. How can I help?"
        if "joke" in p:
            return "Why did the programmer quit? Because he didn't get arrays. Want another?"
        return "I can answer simple questions. For smarter replies, add your Gemini API key to .env."

    def stop(self):
        self.running = False
