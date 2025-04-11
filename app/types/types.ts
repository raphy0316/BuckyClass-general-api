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
    instructors: any[];
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
