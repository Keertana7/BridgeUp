def clean(value):
    """Convert empty values to None and remove extra whitespace."""
    if value is None:
        return None

    value = str(value).replace("\\n", " ").strip()

    return value if value else None


def transform_experience(row):
    """Transform one Google Form response into an experience record."""

    return {
        "name": clean(row.get("Name")),
        "company": clean(row.get("Company ")),
        "role": clean(
            row.get(
                "Role Offered (Eg: Software Engineer, SDE Intern, Graduate Engineer Trainee, Data Analyst,etc..)"
            )
        ),
        "package": clean(row.get("Approximate package/ stipend range")),
        "opportunity_type": clean(row.get("Type of Opportunity")),
        "selection_status": clean(row.get("Selection status")),
        "interview_date": clean(row.get("Interview month and year")),

        "rounds": clean(
            row.get(
                "How many rounds were there? Please list the rounds in order and how far did you progress"
            )
        ),

        "online_assessment": clean(
            row.get(
                "Please describe your experience of all Online assessments for this company "
            )
        ),

        "interview_mode": clean(row.get("Mode of interview")),

        "interview_experience": clean(
            row.get("Please describe your interview experience ?(Of all rounds)")
        ),

        "technical_interview": clean(row.get("Technical Interview")),

        "programming_languages": clean(
            row.get("Which programming language(s) were discussed? ")
        ),

        "difficulty": clean(row.get("Overall difficulty")),

        "preparation_duration": clean(
            row.get("How long did you prepare specifically for this opportunity?  ")
        ),

        "unexpected": clean(
            row.get("Was there anything in the interview process that you did not expect?  ")
        ),

        "preparation_strategy": clean(
            row.get("What was your preparation strategy?  ")
        ),

        "useful_topics": clean(
            row.get("Which topics turned out to be most useful?")
        ),

        "mistakes": clean(
            row.get("What mistakes did you make during preparation/Interview?  ")
        ),

        "advice": clean(
            row.get(
                "What advice would you give to a student preparing for this company/role?  "
            )
        ),

        "wish_known": clean(
            row.get(
                "What is the one thing you wish you knew before attending the interview?  "
            )
        ),

        "consent": clean(
            row.get(
                "Do you consent to us storing and using your submitted experience anonymously for educational and placement-preparation purposes? "
            )
        ),
    }


def transform_questions(row):
    """Extract question-related information from one response."""

    return {
        "oa_aptitude": clean(
            row.get(
                "If yes, please describe the aptitude topics/questions you remember."
            )
        ),

        "oa_coding": clean(
            row.get("If you remember , please mention the questions.")
        ),

        "technical_questions": clean(
            row.get(
                "Please write the questions related to programming languages, DSA questions, core subjects, AI ML related, SDLC etc.."
            )
        ),

        "project_questions": clean(
            row.get(
                "If yes, what questions were asked?(Eg: Project architecture, your contribution, challenges faced, scaling)"
            )
        ),

        "internship_questions": clean(
            row.get("If yes, Please mention the questions")
        ),

        "technical_aptitude": clean(
            row.get(
                "Were you asked any aptitude/logical reasoning questions during the technical interview? If yes, please mention them. "
            )
        ),

        "hr_questions": clean(
            row.get(
                "What HR, behavioral, managerial or personal questions(  your background, hobbies, interests, academics, gaps, or personal experiences)  were asked? "
            )
        ),
    }


def transform_advice(row):
    """Extract advice and preparation information."""

    return {
        "preparation_strategy": clean(
            row.get("What was your preparation strategy?  ")
        ),

        "useful_topics": clean(
            row.get("Which topics turned out to be most useful?")
        ),

        "mistakes": clean(
            row.get("What mistakes did you make during preparation/Interview?  ")
        ),

        "advice": clean(
            row.get(
                "What advice would you give to a student preparing for this company/role?  "
            )
        ),

        "wish_known": clean(
            row.get(
                "What is the one thing you wish you knew before attending the interview?  "
            )
        ),
    }


def transform_resources(row):
    """Extract resources shared by the senior."""

    return {
        "study_material": clean(
            row.get(
                "Share useful pdfs/study material resources/notes/cheatsheets if you are comfortable sharing them.  \n[Note: Your emails are not collected by default.Dont worryy :)  ]"
            )
        ),

        "links": clean(
            row.get(
                "Share useful youtube links/website links/github repos"
            )
        ),

        "resume": clean(
            row.get("If you are comfortable sharing resume please upload it here")
        ),

        "resume_visibility": clean(
            row.get("Can this resume be shown to other users? \n")
        ),
    }


if __name__ == "__main__":
    from google_sheets import get_sheet_data

    data = get_sheet_data()

    first_response = data[0]

    print("\n===== EXPERIENCE =====")
    print(transform_experience(first_response))

    print("\n===== QUESTIONS =====")
    print(transform_questions(first_response))

    print("\n===== ADVICE =====")
    print(transform_advice(first_response))

    print("\n===== RESOURCES =====")
    print(transform_resources(first_response))