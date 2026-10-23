import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


BACKEND_DIR = str(Path(__file__).resolve().parents[1])
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from routes.chat import talk_to_me
from schemas.ai import ChatRequest


class ChatRouteTests(unittest.TestCase):
    def test_substantive_messages_request_a_full_but_concise_reply(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="I feel nervous about my interview tomorrow.",
                    history=[],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        _, kwargs = generate.call_args
        self.assertEqual(kwargs["max_output_tokens"], 2000)
        self.assertIn("100-150 words", kwargs["system_instruction"])
        self.assertIn("3 short", kwargs["system_instruction"])
        self.assertIn("paragraphs", kwargs["system_instruction"])
        self.assertIn(
            "Do not stop after a generic acknowledgment and one tip",
            kwargs["system_instruction"],
        )
        self.assertIn("do not force advice", kwargs["system_instruction"])

    def test_unrelated_recipe_request_gets_a_boundary_without_calling_ai(self):
        with patch("routes.chat.generate_text") as generate:
            result = talk_to_me(
                ChatRequest(message="How do I make tiramisu?", history=[])
            )

        generate.assert_not_called()
        self.assertIn("I can’t help with general knowledge", result["response"])

    def test_unrelated_factual_question_gets_a_boundary(self):
        with patch("routes.chat.generate_text") as generate:
            result = talk_to_me(
                ChatRequest(message="Who is Virat Kohli?", history=[])
            )

        generate.assert_not_called()
        self.assertIn("I’m here to support you", result["response"])

    def test_mixed_emotional_and_trivia_message_does_not_answer_trivia(self):
        with patch("routes.chat.generate_text") as generate:
            result = talk_to_me(
                ChatRequest(
                    message=(
                        "I feel nervous about my interview. Also, "
                        "who is Virat Kohli?"
                    ),
                    history=[],
                )
            )

        generate.assert_not_called()
        self.assertIn("I can’t help with general knowledge", result["response"])

    def test_unrelated_follow_up_stays_out_of_scope_after_support_context(self):
        with patch("routes.chat.generate_text") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="Who is Virat Kohli?",
                    history=[
                        {
                            "role": "user",
                            "content": "I feel nervous about my interview.",
                        },
                        {"role": "assistant", "content": "I can listen."},
                    ],
                )
            )

        generate.assert_not_called()
        self.assertIn("I can’t help with general knowledge", result["response"])

    def test_in_scope_follow_up_keeps_using_the_conversation_context(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="What should I do next?",
                    history=[
                        {
                            "role": "user",
                            "content": "I feel nervous about my interview tomorrow.",
                        },
                        {"role": "assistant", "content": "That sounds stressful."},
                    ],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_indirect_college_stress_message_is_not_rejected(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="College career feels stressfull and why do people fail?",
                    history=[],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_how_to_make_friends_is_not_mistaken_for_a_recipe_request(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="How do I make friends at college?",
                    history=[],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_personal_placement_anxiety_is_in_scope(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="I feel nervous about my interview tomorrow.",
                    history=[],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_indirect_career_direction_question_is_in_scope(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="Why am I feeling like pursuing a different career?",
                    history=[],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_college_career_stress_and_general_failure_question_is_in_scope(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="College career feels stressfull and why do people fail?",
                    history=[],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_ambiguous_reflective_question_is_not_rejected(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(message="Why do people fail?", history=[])
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_uncertain_personal_career_decision_is_in_scope(self):
        with patch("routes.chat.generate_text", return_value="A supportive reply.") as generate:
            result = talk_to_me(
                ChatRequest(
                    message="I'm unsure whether I should change careers.",
                    history=[],
                )
            )

        self.assertEqual(result, {"response": "A supportive reply."})
        generate.assert_called_once()

    def test_greeting_is_warmly_supported_without_general_knowledge(self):
        with patch("routes.chat.generate_text") as generate:
            result = talk_to_me(ChatRequest(message="Hi!", history=[]))

        generate.assert_not_called()
        self.assertIn("I’m here to listen and support you", result["response"])


if __name__ == "__main__":
    unittest.main()
