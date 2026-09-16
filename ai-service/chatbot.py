# ai-services/chatbot.py
import os
import re
from fastapi import APIRouter
from dotenv import load_dotenv
from chatbot_kb import NEXTEST_KNOWLEDGE
from langdetect import detect, DetectorFactory

load_dotenv()

router = APIRouter()

DetectorFactory.seed = 0


def detect_language(text: str) -> str:
    if re.search(r'[\u0600-\u06FF]', text):
        return "ar"
    if len(text.strip()) < 25:
        if re.search(r'[àâäéèêëîïôùûüç]', text, re.IGNORECASE):
            return "fr"
        if re.search(r"\b(c'est|qu'est|quoi|comment|pourquoi|où|combien)\b", text, re.IGNORECASE):
            return "fr"
    try:
        code = detect(text)
        return code if code in ("fr", "en", "ar") else "en"
    except Exception:
        return "en"


LANG_NAMES = {"fr": "French", "en": "English", "ar": "Arabic"}


@router.post("/chat")
def chat(data: dict):
    message = data.get("message", "")
    history = data.get("history", [])

    if not message:
        return {"error": "message is required"}

    lang = detect_language(message)
    lang_name = LANG_NAMES[lang]

    system_prompt = f"""You are Nextest AI, the official assistant of the NexTest platform.

STRICT RULE: Answer ONLY using facts explicitly present in the knowledge base below. If a topic (like Laravel, React, PostgreSQL, etc.) is only mentioned briefly in the knowledge base, give ONLY that brief information — do not add general/external knowledge about that technology even if you know more. Example: if the knowledge base only says "Backend: Laravel + PostgreSQL", your answer about Laravel must stay limited to its role in NexTest, not a general Laravel tutorial.

If the question is unrelated to NexTest entirely (general programming questions, unrelated topics, etc.), reply with a short sentence (in {lang_name}) saying you can only answer NexTest-related questions — and nothing else.

Be concise (max 4-5 sentences), use bullet points if useful. Never repeat the same phrase, word, or list item more than once.

=== NEXTEST KNOWLEDGE BASE ===
{NEXTEST_KNOWLEDGE}
=== END ==="""

    user_content = f"[MANDATORY: your entire answer must be written in {lang_name}, regardless of the language used earlier in this conversation]\n\n{message}"

    messages = [
        {"role": "system", "content": system_prompt},
        *history[-6:],
        {"role": "user", "content": user_content},
    ]

    try:
        from openai import OpenAI

        groq_client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
        )

        resp = groq_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=0.3,
            max_tokens=600,
            presence_penalty=0.3,
            frequency_penalty=0.3,
        )

        return {"reply": resp.choices[0].message.content.strip()}

    except Exception as e:
        print(f"[CHATBOT] error: {e}")
        return {"error": str(e)}