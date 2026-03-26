export type VariantAnswerMatchStrategy =
  | 'exact'
  | 'assignment_rhs'
  | 'numeric'
  | 'normalized_text'
  | 'unmatched';

export interface VariantAnswerEvaluation {
  is_correct: boolean;
  strategy: VariantAnswerMatchStrategy;
  normalized_expected: string;
  normalized_student: string;
  expected_display: string;
  student_display: string;
}

function normalizeAnswerText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/^答案[:：]?\s*/i, '')
    .replace(/[，、]/g, ',')
    .replace(/[；]/g, ';')
    .replace(/[。．]/g, '.')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/[【]/g, '[')
    .replace(/[】]/g, ']')
    .replace(/\s+/g, '')
    .trim();
}

function extractAssignment(value: string) {
  const match = value.match(/^([a-z])=([^=]+)$/i);
  if (!match) {
    return null;
  }

  return {
    variable: match[1].toLowerCase(),
    rhs: match[2],
  };
}

function parseSimpleNumber(value: string) {
  const normalized = value.replace(/^\+/, '').replace(/^\((-?.+)\)$/, '$1');

  if (/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)%$/.test(normalized)) {
    return Number(normalized.slice(0, -1)) / 100;
  }

  if (/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    return Number(normalized);
  }

  if (/^[-+]?\d+\/[-+]?\d+$/.test(normalized)) {
    const [numerator, denominator] = normalized.split('/').map(Number);
    if (denominator === 0) {
      return null;
    }
    return numerator / denominator;
  }

  return null;
}

function numbersEqual(left: number, right: number) {
  return Math.abs(left - right) <= 1e-9;
}

export function evaluateVariantAnswer(input: {
  expectedAnswer: string;
  studentAnswer: string;
}): VariantAnswerEvaluation {
  const normalizedExpected = normalizeAnswerText(input.expectedAnswer || '');
  const normalizedStudent = normalizeAnswerText(input.studentAnswer || '');

  if (!normalizedExpected || !normalizedStudent) {
    return {
      is_correct: false,
      strategy: 'unmatched',
      normalized_expected: normalizedExpected,
      normalized_student: normalizedStudent,
      expected_display: normalizedExpected,
      student_display: normalizedStudent,
    };
  }

  if (normalizedExpected === normalizedStudent) {
    return {
      is_correct: true,
      strategy: 'exact',
      normalized_expected: normalizedExpected,
      normalized_student: normalizedStudent,
      expected_display: normalizedExpected,
      student_display: normalizedStudent,
    };
  }

  const expectedAssignment = extractAssignment(normalizedExpected);
  const studentAssignment = extractAssignment(normalizedStudent);
  const assignmentCompatible =
    !expectedAssignment ||
    !studentAssignment ||
    expectedAssignment.variable === studentAssignment.variable;

  if (assignmentCompatible) {
    const assignmentExpectedValue = expectedAssignment?.rhs ?? normalizedExpected;
    const assignmentStudentValue = studentAssignment?.rhs ?? normalizedStudent;

    if (assignmentExpectedValue === assignmentStudentValue) {
      return {
        is_correct: true,
        strategy: 'assignment_rhs',
        normalized_expected: normalizedExpected,
        normalized_student: normalizedStudent,
        expected_display: assignmentExpectedValue,
        student_display: assignmentStudentValue,
      };
    }

    const expectedAssignmentNumber = parseSimpleNumber(assignmentExpectedValue);
    const studentAssignmentNumber = parseSimpleNumber(assignmentStudentValue);

    if (
      expectedAssignmentNumber !== null &&
      studentAssignmentNumber !== null &&
      numbersEqual(expectedAssignmentNumber, studentAssignmentNumber)
    ) {
      return {
        is_correct: true,
        strategy: 'numeric',
        normalized_expected: normalizedExpected,
        normalized_student: normalizedStudent,
        expected_display: assignmentExpectedValue,
        student_display: assignmentStudentValue,
      };
    }
  }

  const expectedNumber = parseSimpleNumber(normalizedExpected);
  const studentNumber = parseSimpleNumber(normalizedStudent);
  if (expectedNumber !== null && studentNumber !== null && numbersEqual(expectedNumber, studentNumber)) {
    return {
      is_correct: true,
      strategy: 'numeric',
      normalized_expected: normalizedExpected,
      normalized_student: normalizedStudent,
      expected_display: normalizedExpected,
      student_display: normalizedStudent,
    };
  }

  if (normalizedExpected.toLowerCase() === normalizedStudent.toLowerCase()) {
    return {
      is_correct: true,
      strategy: 'normalized_text',
      normalized_expected: normalizedExpected,
      normalized_student: normalizedStudent,
      expected_display: normalizedExpected,
      student_display: normalizedStudent,
    };
  }

  return {
    is_correct: false,
    strategy: 'unmatched',
    normalized_expected: normalizedExpected,
    normalized_student: normalizedStudent,
    expected_display: normalizedExpected,
    student_display: normalizedStudent,
  };
}
