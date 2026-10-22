import logging
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


logger = logging.getLogger(__name__)
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"


def _generate_with_nvidia(
    prompt: str,
    system_instruction: str | None,
    temperature: float,
    max_output_tokens: int,
) -> str:
    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY is not configured.")

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    response = requests.post(
        NVIDIA_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        json={
            "model": os.getenv(
                "NVIDIA_MODEL",
                "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
            ),
            "messages": messages,
            "max_tokens": max_output_tokens,
            "temperature": temperature,
            "stream": False,
        },
        timeout=(10, 120),
    )
    response.raise_for_status()

    result = response.json()
    choices = result.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("NVIDIA returned no completion choices.")

    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("NVIDIA returned an empty completion.")

    return content.strip()


def _generate_with_gemini(
    prompt: str,
    system_instruction: str | None,
    temperature: float,
    max_output_tokens: int,
) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            system_instruction=system_instruction,
        ),
    )
    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return response.text.strip()


def generate_text(
    prompt: str,
    system_instruction: str | None = None,
    temperature: float = 0.7,
    max_output_tokens: int = 1000,
) -> str:
    providers = {
        "nvidia": _generate_with_nvidia,
        "gemini": _generate_with_gemini,
    }
    preferred_provider = os.getenv("AI_TEXT_PROVIDER", "nvidia").strip().lower()
    if preferred_provider not in providers:
        raise ValueError("AI_TEXT_PROVIDER must be 'nvidia' or 'gemini'.")

    fallback_provider = "gemini" if preferred_provider == "nvidia" else "nvidia"
    errors = []
    generation_args = {
        "prompt": prompt,
        "system_instruction": system_instruction,
        "temperature": temperature,
        "max_output_tokens": max_output_tokens,
    }

    for provider_name in (preferred_provider, fallback_provider):
        if not os.getenv(f"{provider_name.upper()}_API_KEY", "").strip():
            continue

        try:
            return providers[provider_name](**generation_args)
        except Exception as error:
            errors.append((provider_name, error))
            logger.warning(
                "%s text generation failed (%s); trying the other provider.",
                provider_name.capitalize(),
                type(error).__name__,
            )

    if not errors:
        raise RuntimeError(
            "Configure NVIDIA_API_KEY or GEMINI_API_KEY for text generation."
        )

    failed_providers = ", ".join(
        f"{provider} ({type(error).__name__})"
        for provider, error in errors
    )
    raise RuntimeError(
        f"Text generation failed for all configured providers: {failed_providers}."
    ) from errors[-1][1]
