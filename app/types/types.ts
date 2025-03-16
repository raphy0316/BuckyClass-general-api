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
