import { prisma } from '@/lib/prisma';

export interface LessonCompletionData {
  flightId?: string;
  objectivesMet: string[]; // Array of objective IDs or descriptions
  satisfactory: boolean;
  instructorNotes?: string;
  studentNotes?: string;
  needsReview?: boolean;
}

/**
 * Mark a lesson as complete for a student
 */
export async function completeLesson(
  studentId: string,
  lessonId: string,
  data: LessonCompletionData
) {
  // Get the lesson
  const lesson = await prisma.lessonSyllabus.findUnique({
    where: { id: lessonId },
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  // Get or create student progress record
  const existingProgress = await prisma.studentProgress.findUnique({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
  });

  const progress = await prisma.studentProgress.upsert({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
    create: {
      studentId,
      lessonId,
      status: data.satisfactory ? 'COMPLETED' : 'REPEAT_REQUIRED',
      attemptCount: 1,
      completedDate: data.satisfactory ? new Date() : null,
      flightId: data.flightId,
      objectivesMet: data.objectivesMet as any,
      instructorNotes: data.instructorNotes,
      studentNotes: data.studentNotes,
      satisfactory: data.satisfactory,
      needsReview: data.needsReview || false,
    },
    update: {
      status: data.satisfactory ? 'COMPLETED' : 'REPEAT_REQUIRED',
      attemptCount: { increment: 1 },
      completedDate: data.satisfactory ? new Date() : null,
      flightId: data.flightId,
      objectivesMet: data.objectivesMet as any,
      instructorNotes: data.instructorNotes,
      studentNotes: data.studentNotes,
      satisfactory: data.satisfactory,
      needsReview: data.needsReview || false,
    },
  });

  // If lesson is completed satisfactorily, update student's current lesson
  if (data.satisfactory && progress.status === 'COMPLETED') {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        progress: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            lesson: true,
          },
        },
      },
    });

    if (student) {
      // Find the highest completed lesson number
      const completedLessons = student.progress
        .map((p) => p.lesson.lessonNumber)
        .sort((a, b) => b - a);

      const highestCompleted = completedLessons[0] || 0;
      const nextLesson = highestCompleted + 1;

      // Update student's current lesson and stage if needed
      let currentStage = student.currentStage;
      let currentLesson = student.currentLesson;

      if (nextLesson > currentLesson) {
        currentLesson = nextLesson;

        // Determine stage based on lesson number
        if (nextLesson <= 15) {
          currentStage = 'STAGE_1_PRE_SOLO';
        } else if (nextLesson <= 30) {
          currentStage = 'STAGE_2_SOLO_XC';
        } else {
          currentStage = 'STAGE_3_CHECKRIDE_PREP';
        }

        await prisma.student.update({
          where: { id: studentId },
          data: {
            currentLesson: currentLesson,
            currentStage: currentStage,
          },
        });
      }
    }
  }

  return progress;
}

/**
 * Get the next recommended lesson for a student
 */
export async function getNextLesson(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      progress: {
        where: {
          status: 'COMPLETED',
        },
        include: {
          lesson: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Find the highest completed lesson number
  const completedLessonNumbers = student.progress
    .map((p) => p.lesson.lessonNumber)
    .sort((a, b) => b - a);

  const highestCompleted = completedLessonNumbers[0] || 0;
  const nextLessonNumber = highestCompleted + 1;

  // Get the next lesson from syllabus
  const nextLesson = await prisma.lessonSyllabus.findFirst({
    where: {
      lessonNumber: nextLessonNumber,
      stage: student.currentStage,
    },
  });

  if (!nextLesson) {
    // If no lesson found in current stage, look for first lesson in next stage
    let nextStage = student.currentStage;
    if (student.currentStage === 'STAGE_1_PRE_SOLO') {
      nextStage = 'STAGE_2_SOLO_XC';
    } else if (student.currentStage === 'STAGE_2_SOLO_XC') {
      nextStage = 'STAGE_3_CHECKRIDE_PREP';
    }

    const firstLessonInNextStage = await prisma.lessonSyllabus.findFirst({
      where: {
        stage: nextStage,
      },
      orderBy: {
        lessonNumber: 'asc',
      },
    });

    return {
      recommendedLesson: firstLessonInNextStage,
      reason: `Completed all lessons in ${student.currentStage}. Ready for ${nextStage}.`,
      currentProgress: {
        currentLesson: student.currentLesson,
        currentStage: student.currentStage,
        completedLessons: completedLessonNumbers.length,
      },
    };
  }

  // Check if student has any incomplete lessons that need review
  const incompleteLessons = await prisma.studentProgress.findMany({
    where: {
      studentId,
      status: { in: ['IN_PROGRESS', 'REPEAT_REQUIRED'] },
      needsReview: true,
    },
    include: {
      lesson: true,
    },
    orderBy: {
      lesson: {
        lessonNumber: 'asc',
      },
    },
  });

  if (incompleteLessons.length > 0) {
    return {
      recommendedLesson: incompleteLessons[0].lesson,
      reason: `Review needed for lesson ${incompleteLessons[0].lesson.lessonNumber}: ${incompleteLessons[0].lesson.title}`,
      currentProgress: {
        currentLesson: student.currentLesson,
        currentStage: student.currentStage,
        completedLessons: completedLessonNumbers.length,
      },
      needsReview: true,
    };
  }

  return {
    recommendedLesson: nextLesson,
    reason: `Next lesson in ${student.currentStage} progression`,
    currentProgress: {
      currentLesson: student.currentLesson,
      currentStage: student.currentStage,
      completedLessons: completedLessonNumbers.length,
    },
  };
}

/**
 * Calculate progress statistics for a student
 */
export async function getProgressStats(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      progress: {
        include: {
          lesson: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Get all lessons in syllabus
  const allLessons = await prisma.lessonSyllabus.findMany({
    orderBy: [
      { stage: 'asc' },
      { lessonNumber: 'asc' },
    ],
  });

  const totalLessons = allLessons.length;
  const completedLessons = student.progress.filter((p) => p.status === 'COMPLETED').length;
  const inProgressLessons = student.progress.filter((p) => p.status === 'IN_PROGRESS').length;
  const repeatRequired = student.progress.filter((p) => p.status === 'REPEAT_REQUIRED').length;

  // Calculate by stage
  const stage1Lessons = allLessons.filter((l) => l.stage === 'STAGE_1_PRE_SOLO');
  const stage2Lessons = allLessons.filter((l) => l.stage === 'STAGE_2_SOLO_XC');
  const stage3Lessons = allLessons.filter((l) => l.stage === 'STAGE_3_CHECKRIDE_PREP');

  const stage1Completed = student.progress.filter(
    (p) => p.status === 'COMPLETED' && p.lesson.stage === 'STAGE_1_PRE_SOLO'
  ).length;
  const stage2Completed = student.progress.filter(
    (p) => p.status === 'COMPLETED' && p.lesson.stage === 'STAGE_2_SOLO_XC'
  ).length;
  const stage3Completed = student.progress.filter(
    (p) => p.status === 'COMPLETED' && p.lesson.stage === 'STAGE_3_CHECKRIDE_PREP'
  ).length;

  return {
    overall: {
      total: totalLessons,
      completed: completedLessons,
      inProgress: inProgressLessons,
      repeatRequired,
      completionPercentage: Math.round((completedLessons / totalLessons) * 100),
    },
    byStage: {
      stage1: {
        total: stage1Lessons.length,
        completed: stage1Completed,
        percentage: Math.round((stage1Completed / stage1Lessons.length) * 100),
      },
      stage2: {
        total: stage2Lessons.length,
        completed: stage2Completed,
        percentage: Math.round((stage2Completed / stage2Lessons.length) * 100),
      },
      stage3: {
        total: stage3Lessons.length,
        completed: stage3Completed,
        percentage: Math.round((stage3Completed / stage3Lessons.length) * 100),
      },
    },
    hours: {
      total: student.totalFlightHours,
      solo: student.soloHours,
      crossCountry: student.crossCountryHours,
      night: student.nightHours,
      instrument: student.instrumentHours,
    },
    currentLesson: student.currentLesson,
    currentStage: student.currentStage,
  };
}

