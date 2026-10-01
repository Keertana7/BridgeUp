from privacy import sanitize_text


text = """
Name: Aashitha
Email: aashitha@gmail.com
Phone: 9876543210
USN: 1GS22CS001

Company: HSBC
Role: Software Engineer
"""

print(sanitize_text(text))