export interface Course {
    id: string;
    name: string;
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

export interface Review {
    course_id: string;
    user_id: string;
    rating: number;
    comment: string;
}

export interface Instructor {
    id: string;
    name: string;
    courseOfferings?: { id: string }[];
}

export interface CourseOffering {
    id: string;
    course_id: string;
    term: string;
}


export interface InstructorCourseOffering {
    instructor_id: string;
    offering_id: string;
  }

export interface SectionGrade {
    section_id: string;
    offering_id: string;
    section_number: number;
    total: number;
    a_per: number;
    ab_per: number;
    b_per: number;
    bc_per: number;
    c_per: number;
    d_per: number;
    f_per: number;
    other_per: number;
    instructors: Instructor[];
    sectionType: string;
}
export interface Section {
    id: string;
    number: number;
    sectionType: string; 
  }
  
  export interface CourseOfferingSection {
    offering_id: string;
    section_id: string;
  }
export interface VerifiedUser {
    course_id: string;
    user_id: string;
}

export type UserProfile = {
    firebase_uid: string;
    name: string;
    email: string;
    profile_picture?: string;
};

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
  