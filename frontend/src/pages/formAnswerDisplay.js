const EXCLUDED_HEADERS = new Set([
  'branch',
  'department',
  'branch/department',
  'name',
  'full name',
  'email',
  'email address',
  'company',
  'company name',
  'role',
  'graduation/batch year',
  'batch year',
  'approximate package/ stipend range',
  'package/ stipend range',
  'type of opportunity',
  'selection status',
  'interview month and year',
  'interview date',
  'score',
  'timestamp',
  'submission_id',
  'legacy_submission_id',
  'id',
  'response id',
  'row number',
  'row id',
  'created at',
  'updated at',
  'start time',
  'end time',
  'source type',
  'student id',
  'roll number',
  'registration number',
]);

function isExcludedQuestion(question) {
  const normalized = question
    .trim()
    .toLocaleLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');
  const compactNormalized = normalized.replace(/[^a-z0-9]/g, '');
  return (
    EXCLUDED_HEADERS.has(normalized) ||
    compactNormalized === 'canthisresumebeshowntootherusers' ||
    normalized.includes('email') ||
    normalized.includes('phone') ||
    normalized.includes('mobile') ||
    normalized.includes('contact number') ||
    normalized === 'first name' ||
    normalized === 'last name' ||
    normalized.startsWith('role offered') ||
    normalized.startsWith('approximate package') ||
    normalized.includes('consent')
  );
}

export function hasMeaningfulAnswer(answer) {
  if (answer === null || answer === undefined) return false;
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (Array.isArray(answer)) return answer.some(hasMeaningfulAnswer);
  if (typeof answer === 'object') {
    return Object.values(answer).some(hasMeaningfulAnswer);
  }
  return true;
}

export function getVisibleFormAnswers(formAnswers) {
  if (!Array.isArray(formAnswers)) return [];

  return formAnswers.filter(
    (item) =>
      item &&
      typeof item.question === 'string' &&
      item.question.trim().length > 0 &&
      !isExcludedQuestion(item.question) &&
      hasMeaningfulAnswer(item.answer)
  );
}

export function getExperienceContentPresentation(experience) {
  const answers = getVisibleFormAnswers(experience?.form_answers);
  if (experience?.source_type === 'form' && answers.length > 0) {
    return { mode: 'form_answers', answers };
  }
  return { mode: 'content', answers: [], content: experience?.content };
}
