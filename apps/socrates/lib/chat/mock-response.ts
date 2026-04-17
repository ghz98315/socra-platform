import type { GradeLevel, QuestionType, SubjectType } from '../prompts/types';

export function isConfusionMessage(message: string): boolean {
  return /看不懂|不懂|不会|不知道|太难了|不明白|还是不懂|还是不会/u.test(message);
}

function looksLikeMultiPartQuestion(questionContent?: string) {
  if (!questionContent) {
    return false;
  }

  return /(?:\(\d+\)|（\d+）|[①②③④⑤⑥⑦⑧⑨⑩]|第[一二三四五六七八九十\d]+问)/u.test(questionContent);
}

function getMathPrompt(params: {
  repeatedConfusion: boolean;
  geometryData?: any;
  questionContent?: string;
}): string {
  const { repeatedConfusion, geometryData, questionContent } = params;
  const hasGeometry = Boolean(geometryData && geometryData.type && geometryData.type !== 'unknown');
  const multiPart = looksLikeMultiPartQuestion(questionContent);

  if (multiPart && repeatedConfusion) {
    return '我们先不要混着做。你现在卡的是第几小题？如果还不确定，就先说第 1 小题最后要求你求什么或证明什么？';
  }

  if (multiPart) {
    return '这题有多个小题。你现在先做哪一小题？这一小题最后要求你求什么或证明什么？';
  }

  if (hasGeometry && repeatedConfusion) {
    return '那我们先退一步，不认点名。题目现在要你证明或求什么？和这个目标最直接相关的是哪组边、角、三角形或平行垂直关系？';
  }

  if (hasGeometry) {
    return '先别急着想定理。题目现在要你证明或求什么？已知里哪组关系最接近这个目标？';
  }

  if (repeatedConfusion) {
    return '那我们先退一步。题目最后要你求什么？';
  }

  return '先别急着算。题目已经明确告诉了你哪个条件最关键？';
}

function getChinesePrompt(repeatedConfusion: boolean): string {
  if (repeatedConfusion) {
    return '那我们先退一步。你觉得答案应该回原文哪一句或哪一段找？';
  }

  return '先别急着答。题干里最关键的词是哪一个？';
}

function getEnglishPrompt(questionType: QuestionType, repeatedConfusion: boolean): string {
  if (questionType === 'reading') {
    if (repeatedConfusion) {
      return '那我们先退一步。题干现在问的是细节、主旨，还是推断？';
    }

    return '先别急着选。题干现在问的是细节、主旨，还是推断？';
  }

  if (repeatedConfusion) {
    return '那我们先退一步。这个空前后各是什么词？';
  }

  return '先别急。你先看这个空前后各是什么词？';
}

export function getMockQuestionBySubject(params: {
  subject: SubjectType;
  questionType: QuestionType;
  repeatedConfusion: boolean;
  geometryData?: any;
  questionContent?: string;
}): string {
  const { subject, questionType, repeatedConfusion, geometryData, questionContent } = params;

  if (subject === 'math') {
    return getMathPrompt({ repeatedConfusion, geometryData, questionContent });
  }

  if (subject === 'chinese') {
    return getChinesePrompt(repeatedConfusion);
  }

  if (subject === 'english') {
    return getEnglishPrompt(questionType, repeatedConfusion);
  }

  if (repeatedConfusion) {
    return '那我们先退一步。你现在最清楚的一个已知条件是什么？';
  }

  return '先别急。题目最后要你求什么？';
}

export function getNextStepQuestionBySubject(
  subject: SubjectType,
  questionType: QuestionType,
  questionContent?: string,
): string {
  if (subject === 'math') {
    if (looksLikeMultiPartQuestion(questionContent)) {
      return '先只围绕当前这一小题。你想先确认这一小题的目标，还是先确认最关键的已知关系？';
    }

    return '下一步你想先确认哪组已知关系最能连到目标？';
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

  const askingForAnswer = /答案|结果|对不对|是多少|怎么做/u.test(lowerMessage);
  const givingSolution =
    /我觉得|我认为|应该是|我想|第一步|首先|用.*?方法|先算|然后|最后|因为|所以/u.test(lowerMessage);
  const confused = isConfusionMessage(userMessage);
  const repeatedConfusion = confused && isConfusionMessage(previousUserMessage);

  if (confused) {
    const question = getMockQuestionBySubject({
      subject,
      questionType,
      repeatedConfusion,
      geometryData,
      questionContent,
    });

    return grade === 'junior'
      ? `没关系，我们先只抓最小一步。\n\n${question}`
      : `先不急着往下推。\n\n${question}`;
  }

  if (askingForAnswer) {
    return '我不直接给答案。\n\n先告诉我，题目已经明确给了你什么？';
  }

  if (givingSolution) {
    return `${grade === 'junior' ? '这个切入点可以。' : '这个方向可以。'}\n\n${getNextStepQuestionBySubject(subject, questionType, questionContent)}`;
  }

  if (userMessageCount === 1) {
    return grade === 'junior'
      ? `我们先不急着整题往下做。\n\n${getMockQuestionBySubject({
          subject,
          questionType,
          repeatedConfusion: false,
          geometryData,
          questionContent,
        })}`
      : `先做轻诊断。\n\n${getMockQuestionBySubject({
          subject,
          questionType,
          repeatedConfusion: false,
          geometryData,
          questionContent,
        })}`;
  }

  return `${grade === 'junior' ? '继续。' : '往前推进一小步。'}\n\n${getNextStepQuestionBySubject(subject, questionType, questionContent)}${questionContent ? `\n题目提醒：${questionContent}` : ''}`;
}
