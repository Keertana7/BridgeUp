import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getExperienceContentPresentation,
  getVisibleFormAnswers,
} from '../src/pages/formAnswerDisplay.js';

test('preserves original question wording, answers, and source order', () => {
  const formAnswers = [
    { question: 'Which programming language(s) were discussed? ', answer: 'C++, React' },
    { question: 'What mistakes did you make?', answer: 'System architecture.' },
  ];

  assert.deepEqual(getVisibleFormAnswers(formAnswers), formAnswers);
});

test('excludes personal, metadata, consent, and system-generated fields', () => {
  const formAnswers = [
    { question: 'Name', answer: 'Private Person' },
    { question: 'Email Address', answer: 'private@example.test' },
    { question: 'Company ', answer: 'Acme' },
    { question: 'Role Offered (Engineer)', answer: 'Engineer' },
    { question: 'Graduation/Batch year', answer: '2025' },
    { question: 'Approximate package/ stipend range', answer: '10 LPA' },
    { question: 'Type of Opportunity', answer: 'Full-time' },
    { question: 'Selection status', answer: 'Selected' },
    { question: 'Interview month and year', answer: 'October 2026' },
    { question: 'Timestamp', answer: '2026-10-01' },
    { question: 'Do you consent to storing this?', answer: 'I Agree' },
    { question: 'Mode of interview', answer: 'Online' },
  ];

  assert.deepEqual(getVisibleFormAnswers(formAnswers), [
    { question: 'Mode of interview', answer: 'Online' },
  ]);
});

test('excludes score and punctuation variants of resume-sharing question only', () => {
  const formAnswers = [
    { question: 'Score', answer: '100' },
    { question: ' score ', answer: '99' },
    { question: 'Can this resume be shown to other users?', answer: 'Yes' },
    { question: 'Can-this resume be shown to other users !', answer: 'No' },
    { question: 'Which interview questions were asked?', answer: 'Example question' },
  ];

  assert.deepEqual(getVisibleFormAnswers(formAnswers), [
    { question: 'Which interview questions were asked?', answer: 'Example question' },
  ]);
});

test('hides empty answers but preserves meaningful short answers', () => {
  const formAnswers = [
    { question: 'Null', answer: null },
    { question: 'Missing', answer: undefined },
    { question: 'Blank', answer: '   \n' },
    { question: 'No', answer: 'No' },
    { question: "Don't remember", answer: "Don't remember" },
    { question: 'Not Applicable', answer: 'Not Applicable' },
    { question: 'Zero', answer: 0 },
    { question: 'False', answer: false },
  ];

  assert.deepEqual(
    getVisibleFormAnswers(formAnswers).map(({ question }) => question),
    ['No', "Don't remember", 'Not Applicable', 'Zero', 'False']
  );
});

test('keeps multiline formatting and URL answer text intact', () => {
  const answer = 'First paragraph.\n\nSecond paragraph.\nhttps://example.test';
  const visible = getVisibleFormAnswers([
    { question: 'Resources and links', answer },
  ]);

  assert.equal(visible[0].answer, answer);
});

test('falls back to existing content for legacy form experiences', () => {
  const content = 'Legacy experience text';

  assert.deepEqual(
    getExperienceContentPresentation({
      source_type: 'form',
      form_answers: [],
      content,
    }),
    { mode: 'content', answers: [], content }
  );
});

test('falls back when form_answers is unavailable', () => {
  const content = 'Legacy experience text';

  assert.deepEqual(
    getExperienceContentPresentation({
      source_type: 'form',
      content,
    }),
    { mode: 'content', answers: [], content }
  );
});

test('keeps PDF experiences on the existing content rendering path', () => {
  const content = 'PDF extracted text';

  assert.deepEqual(
    getExperienceContentPresentation({
      source_type: 'pdf',
      form_answers: [{ question: 'Should not render', answer: 'form data' }],
      content,
    }),
    { mode: 'content', answers: [], content }
  );
});

test('hides conditional questions when the answer was not provided', () => {
  assert.deepEqual(
    getVisibleFormAnswers([
      { question: 'If yes, what questions were asked?', answer: '' },
      { question: 'If no, explain why', answer: 'Not Applicable' },
    ]),
    [{ question: 'If no, explain why', answer: 'Not Applicable' }]
  );
});
