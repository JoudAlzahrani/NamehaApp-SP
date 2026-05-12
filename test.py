from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()
print("Key found:", os.getenv("GROQ_API_KEY"))
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "system",
            "content": "You are Nameha, an investment assistant for beginner investors in Saudi Arabia."
        },
        {
            "role": "user",
            "content": "Explain in 3 simple sentences why diversifying investments is important."
        }
    ]
)

print(response.choices[0].message.content)