import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { getToday, formatDate } from '../utils/helpers';

export interface AnswerQuestionInput {
  questionId: string;
  content: string;
}

// 预设问题库
const questionPool = [
  '如果可以拥有一种超能力，你会选择什么？',
  '童年最快乐的记忆是什么？',
  '如果可以和任何人共进晚餐，你会选择谁？',
  '你最珍视的家庭传统是什么？',
  '如果可以去任何地方旅行，你会去哪里？',
  '你最喜欢家里的哪个角落？',
  '最让你感动的一句话是什么？',
  '你觉得家的意义是什么？',
  '如果有一天可以重新来过，你会改变什么？',
  '你最想对家人说的话是什么？',
  '一首能代表我们家的歌是什么？',
  '你认为家人之间最重要的是什么？',
  '你最想和家人一起完成的事是什么？',
  '你最喜欢的家庭聚会方式是什么？',
  '如果用一种颜色形容我们家，会是什么颜色？',
];

class QuestionService {
  /**
   * 获取今日问题
   */
  async getTodayQuestion(familyId: string) {
    const today = getToday();

    // 查找今天的问题
    let question = await prisma.question.findUnique({
      where: {
        familyId_activeDate: {
          familyId,
          activeDate: today,
        },
      },
      include: {
        answers: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
    });

    // 如果没有，创建一个新问题
    if (!question) {
      // 随机选择一个问题
      const randomIndex = Math.floor(Math.random() * questionPool.length);
      const content = questionPool[randomIndex];

      question = await prisma.question.create({
        data: {
          content,
          activeDate: today,
          familyId,
        },
        include: {
          answers: {
            include: {
              user: { select: { id: true, nickname: true, avatar: true } },
            },
          },
        },
      });
    }

    // 获取家庭成员数量来判断是否全部回答
    const memberCount = await prisma.user.count({ where: { familyId } });
    const allAnswered = question.answers.length >= memberCount;

    return {
      id: question.id,
      content: question.content,
      activeDate: question.activeDate,
      answers: allAnswered
        ? question.answers.map((a) => ({
            id: a.id,
            content: a.content,
            user: a.user,
          }))
        : [],
      answeredUsers: question.answers.map((a) => a.user),
      allAnswered,
      totalMembers: memberCount,
      answeredCount: question.answers.length,
    };
  }

  /**
   * 回答问题
   */
  async answerQuestion(userId: string, input: AnswerQuestionInput) {
    const { questionId, content } = input;

    // 检查问题是否存在
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new AppError('问题不存在', 404);
    }

    // 检查用户是否属于该家庭
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.familyId !== question.familyId) {
      throw new AppError('您不属于该家庭', 403);
    }

    // 检查是否已经回答过
    const existingAnswer = await prisma.questionAnswer.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId,
        },
      },
    });

    if (existingAnswer) {
      throw new AppError('您已经回答过这个问题了', 400);
    }

    // 创建答案
    const answer = await prisma.questionAnswer.create({
      data: {
        content,
        questionId,
        userId,
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return answer;
  }

  /**
   * 检查用户是否已回答今日问题
   */
  async hasAnsweredToday(userId: string, familyId: string): Promise<boolean> {
    const today = getToday();

    const question = await prisma.question.findUnique({
      where: {
        familyId_activeDate: {
          familyId,
          activeDate: today,
        },
      },
    });

    if (!question) {
      return false;
    }

    const answer = await prisma.questionAnswer.findUnique({
      where: {
        questionId_userId: {
          questionId: question.id,
          userId,
        },
      },
    });

    return !!answer;
  }

  /**
   * 获取历史问题
   */
  async getQuestionHistory(familyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: { familyId },
        orderBy: { activeDate: 'desc' },
        skip,
        take: limit,
        include: {
          answers: {
            include: {
              user: { select: { id: true, nickname: true, avatar: true } },
            },
          },
        },
      }),
      prisma.question.count({ where: { familyId } }),
    ]);

    return {
      items: questions.map((q) => ({
        id: q.id,
        content: q.content,
        activeDate: q.activeDate,
        answers: q.answers.map((a) => ({
          id: a.id,
          content: a.content,
          user: a.user,
        })),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const questionService = new QuestionService();
