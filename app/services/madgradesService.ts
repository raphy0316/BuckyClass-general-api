import axios from "axios";
import { ENV } from "../config/env";
import { Course, Grade, CourseOffering, Instructor, InstructorCourseOffering, SectionGrade, Section  } from "../types/types";

const ENDPOINTS = {
    COURSES: "/courses",
    COURSE_DETAILS: (uuid: string) => `/courses/${uuid}`,
    COURSE_GRADES : (uuid: string) => `/courses/${uuid}/grades`,
    SUBJECTS: "/subjects",
    INSTRUCTORS: "/instructors"
};

export const fetchCourses = async (): Promise<Course[]> => {
    const response = await axios.get(`${ENV.MADGRADES_API_BASE_URL}${ENDPOINTS.COURSES}`, {
        headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
    });

    const courses = response.data.results || [];

    return courses.map((course: {uuid : string; name: string}) => ({
        id: course.uuid,
        name: course.name,
    }));
};

const calculatePercentage = (count: number, total: number): number => {
    return total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
};

export const fetchGrade = async (uuid: string): Promise<Grade | null> => {
    const response = await axios.get(`${ENV.MADGRADES_API_BASE_URL}${ENDPOINTS.COURSE_GRADES(uuid)}`, {
        headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
    });

    const grade = response.data;

    return {
        course_id: grade.courseUuid,
        total: grade.cumulative.total,
        a_per: calculatePercentage(grade.cumulative.aCount, grade.cumulative.total),
        ab_per: calculatePercentage(grade.cumulative.abCount, grade.cumulative.total),
        b_per: calculatePercentage(grade.cumulative.bCount, grade.cumulative.total),
        bc_per: calculatePercentage(grade.cumulative.bcCount, grade.cumulative.total),
        c_per: calculatePercentage(grade.cumulative.cCount, grade.cumulative.total),
        d_per: calculatePercentage(grade.cumulative.dCount, grade.cumulative.total),
        f_per: calculatePercentage(grade.cumulative.fCount, grade.cumulative.total),
        other_per: calculatePercentage(
            (grade.cumulative.otherCount || 0) +
            (grade.cumulative.sCount || 0) +
            (grade.cumulative.uCount || 0) +
            (grade.cumulative.crCount || 0) +
            (grade.cumulative.nCount || 0) +
            (grade.cumulative.pCount || 0) +
            (grade.cumulative.iCount || 0) +
            (grade.cumulative.nwCount || 0) +
            (grade.cumulative.nrCount || 0),
            grade.cumulative.total
        )
    };
};

export const fetchCoursesDetail = async (uuid: string) => {
    const courseResponse = await axios.get(`${ENV.MADGRADES_API_BASE_URL}${ENDPOINTS.COURSE_DETAILS(uuid)}`, {
        headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
    });

    const gradesResponse = await axios.get(`${ENV.MADGRADES_API_BASE_URL}${ENDPOINTS.COURSE_GRADES(uuid)}`, {
        headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
    });

    const course = courseResponse.data;

    const grades = gradesResponse.data;

    const cumulative = grades.cumulative || {};

    const sumGPA =
        ((cumulative.aCount * 4.0) +
            (cumulative.abCount * 3.5) +
            (cumulative.bCount * 3.0) +
            (cumulative.bcCount * 2.5) +
            (cumulative.cCount * 2.0) +
            (cumulative.dCount * 1.0) +
            (cumulative.fCount * 0.0));

    const total = cumulative.total || {};

    const avgGPA = total > 0 ? sumGPA / total : 0;

    const response = {
        name : course.name,
        names : course.names,
        subjects : course.subjects,
        courseOfferings : course.courseOfferings,
        avgGPA : avgGPA
    }

    return response;
};

export const fetchSubjects = async () => {
    const response = await axios.get(`${ENV.MADGRADES_API_BASE_URL}${ENDPOINTS.SUBJECTS}`, {
        headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
    });

    return response.data.results || [];
};

export const fetchInstructors = async () => {
    const response = await axios.get(`${ENV.MADGRADES_API_BASE_URL}${ENDPOINTS.INSTRUCTORS}`, {
        headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
    });

    return response.data.results || [];
};