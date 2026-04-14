import type { GradeLevel, QuestionType, SubjectType } from '../prompts/types';

export function isConfusionMessage(message: string): boolean {
  return /看不懂|不懂|不会|不知道|太难了|不明白|还是不懂|还是不会/u.test(message);
}

export function getMockQuestionBySubject(params: {
  subject: SubjectType;
  questionType: QuestionType;
  repeatedConfusion: boolean;
  geometryData?: any;
}): string {
  const { subject, questionType, repeatedConfusion, geometryData } = params;

  if (subject === 'math') {
    if (repeatedConfusion) {
      if (geometryData && geometryData.type && geometryData.type !== 'unknown') {
        return '那我们先退一步。图里最关键的一个点、线或角是哪一个？';
      }

      return '那我们先退一步。题目最后要你求什么？';
    }

    if (geometryData && geometryData.type && geometryData.type !== 'unknown') {
      return '先别急着想方法。图里最关键的一个点、线或角是哪一个？';
    }

    return '先别急着算。题目已经明确告诉了你哪个条件？';
  }

  if (subject === 'chinese') {
    if (repeatedConfusion) {
      return '那我们先退一步。你觉得答案应该回原文哪一句或哪一段找？';
    }

    return '先别急着答。题干里最关键的词是哪一个？';
  }

  if (subject === 'english') {
    if (repeatedConfusion) {
      if (questionType === 'reading') {
        return '那我们先退一步。题干现在问的是细节、主旨，还是推断？';
      }

      return '那我们先退一步。这个空前后各是什么词？';
    }

    if (questionType === 'reading') {
      return '先别急着选。题干现在问的是细节、主旨，还是推断？';
    }

    return '先别急。你先看这个空前后各是什么词？';
  }

  if (repeatedConfusion) {
    return '那我们先退一步。你现在最清楚的一个已知条件是什么？';
  }

  return '先别急。题目最后要你求什么？';
}

export function getNextStepQuestionBySubject(subject: SubjectType, questionType: QuestionType): string {
  if (subject === 'math') {
    return '下一步你想先确认哪个条件或关系？';
  }

  if (subject === 'chinese') {
    return '下一步你想先回题干，还是先回原文定位？';
  }

  if (subject === 'english') {
    if (questionType === 'reading') {
      return '下一步你想先看题干，还是先回原文定位？';
    }

    return '下一步你想先看词性、时态，还是固定搭配？';
  }

  return '下一步你想先确认哪个条件？';
}

export function generateImprovedMockResponse(
  userMessage: string,
  grade: GradeLevel,
  history: Array<{ role: string; content: string }>,
  subject: SubjectType,
  questionType: QuestionType,
  questionContent?: string,
  geometryData?: any,
): string {
  const userMessageCount = history.filter((message) => message.role === 'user').length;
  const lowerMessage = userMessage.toLowerCase();
  const userMessages = history.filter((message) => message.role === 'user').map((message) => message.content);
  const previousUserMessage =
    userMessages.length >= 2 ? userMessages[userMessages.length - 2] : '';

  const askingForAnswer = /答案|结果|对不对|是多少|怎么做/.test(lowerMessage);
  const givingSolution =
    /我觉得|我认为|应该是|我想|第一步|首先|用.*?方法|先算|然后|最后/.test(
      lowerMessage,
    );
  const confused = isConfusionMessage(userMessage);
  const repeatedConfusion = confused && isConfusionMessage(previousUserMessage);

  if (confused) {
    const question = getMockQuestionBySubject({
      subject,
      questionType,
      repeatedConfusion,
      geometryData,
    });

    return grade === 'junior'
      ? `没关系，我们先只抓最小一步。\n\n${question}`
      : `先不急着往下推。\n\n${question}`;
  }

  if (askingForAnswer) {
    return '我不直接给答案。\n\n先告诉我，题目已经明确给了你什么？';
  }

  if (givingSolution) {
    return `${grade === 'junior' ? '这个切入点可以。' : '这个方向可以。'}\n\n${getNextStepQuestionBySubject(subject, questionType)}`;
  }

  if (userMessageCount === 1) {
    return grade === 'junior'
      ? `我们先不急着整题往下做。\n\n${getMockQuestionBySubject({
          subject,
          questionType,
          repeatedConfusion: false,
          geometryData,
        })}`
      : `先做轻诊断。\n\n${getMockQuestionBySubject({
          subject,
          questionType,
          repeatedConfusion: false,
          geometryData,
        })}`;
  }

  return `${grade === 'junior' ? '继续。' : '往前推进一小步。'}\n\n${getNextStepQuestionBySubject(subject, questionType)}${questionContent ? `\n题目提醒：${questionContent}` : ''}`;
}
