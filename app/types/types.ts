export interface Course {
    id: string;
    name: string;
    number: number;
}

export interface Review {
    course_id: string;
    user_id: string;
    rating: number;
    comment: string;
}

export interface Instructor {
    id: number;
    name: string;
}


export interface Section {
    id: string;
    number: number;
    sectionType: string; 
    courseOffering_id: string;
    start_Time: string | null;
    end_Time: string | null;
    days: string | null;
}
  

export interface VerifiedUser {
    course_id: string;
    user_id: string;
}

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    majors: string[];
    profile_picture?: string;
};

export interface Subject {
    code: string;
    name: string;
    abbreviation: string;
}

export type PostgresError = Error & { code?: string };

export interface TopAGradeCourse {
    course_id: string;
    course_name: string;
    a_per: number;
}
export interface ReviewWithCourse {
    course_id: string;
    course_name: string;
    user_id: string;
    rating: number;         
    comment: string;
    created_at: string;  
  }

  export interface TopViewedCourse {
    id: string;
    name: string;
    views: number;
}

export interface AverageRatingResult {
    average_rating: number | null;
  }


export interface Grade {
    course_id: string;
    total: number;
    a_per: number;
    ab_per: number;
    b_per: number;
    bc_per: number;
    c_per: number;
    d_per: number;
    f_per: number;
    other_per: number;
}

export interface SectionGrade {
    section_id: string;
    total: number;
    a_per: number;
    ab_per: number;
    b_per: number;
    bc_per: number;
    c_per: number;
    d_per: number;
    f_per: number;
    other_per: number;
}

export interface CourseOffering {
    id: string;
    course_id: string;
    semester: string;
}

export interface InstructorSection {
    section_id : string;
    instructor_id : number;
}

export interface InstructorCourseOffering {
    instructor_id: string;
    offering_id: string;
  }
  export interface CourseSubject {
    course_id: string;
    subject_abbreviation: string;
}

export interface DailyMessageCounts {
    [date: string]: number;
}

export interface ChatMessageCounts {
    [chatId: string]: {
    dailyCounts: DailyMessageCounts;
    createdBy: string; 
    type: string; 
    }
}