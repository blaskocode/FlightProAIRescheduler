export interface Flight {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  lessonTitle: string | null;
  weatherOverride?: boolean;
  student: {
    firstName: string;
    lastName: string;
  };
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  aircraft: {
    tailNumber: string;
  };
}

