import {
    saveCourses,
    saveGrades,
    saveCourseOfferings,
    saveSections,
    saveCourseOfferingSections,
    saveSectionGrades,
    saveInstructorsForSection,
  } from "@/app/services/postgreService";
  
  import {
    fetchCourses,
    fetchGrade,
    fetchCoursesDetail,
    fetchSectionsForOfferings,
    fetchCourseOfferingSectionMappings,
    fetchSectionGrades,
  } from "@/app/services/madgradesService";
  
  export async function GET() {
    try {
      console.log("[DEBUG] /api/getData/update - CALLED");
  
      const courses = await fetchCourses();
      const selectedCourses = courses.slice(0, 3);
      
  
      for (const course of selectedCourses) {
  
        await saveCourses([course]);
  
        const grade = await fetchGrade(course.id);
        if (!grade) {
          console.warn("No grade found for course:", course.id);
          continue;
        }
        await saveGrades(grade);

        const details = await fetchCoursesDetail(course.id);
        const enrichedOfferings = await fetchSectionsForOfferings(details.courseOfferings || []);
  
        const courseOfferingList = enrichedOfferings.map((offering) => ({
          id: offering.uuid,
          course_id: course.id,
          term: offering.termCode.toString(),
        }));
        await saveCourseOfferings(courseOfferingList);
  
        const courseOfferingMap = new Map(
          courseOfferingList.map((offering) => [offering.term, offering.id])
        );
  
        const sections = enrichedOfferings.flatMap((offering: any) =>
          offering.sections.map((section: any) => ({
            id: section.uuid,
            number: section.number,
            sectionType: section.sectionType || "",
          }))
        );
        await saveSections(sections);
  
        const sectionUuidMap = new Map<string, string>();
        enrichedOfferings.forEach((offering: any) => {
          const term = offering.termCode.toString();
          offering.sections.forEach((section: any) => {
            const key = `${term}-${section.number}`;
            sectionUuidMap.set(key, section.uuid);
          });
        });

        const courseOfferingSectionMappings = fetchCourseOfferingSectionMappings(
          enrichedOfferings,
          courseOfferingMap
        );
        await saveCourseOfferingSections(courseOfferingSectionMappings);
  
        const sectionGrades = await fetchSectionGrades(course.id, courseOfferingMap, sectionUuidMap);
  
        await saveSectionGrades(sectionGrades);

        await saveInstructorsForSection(sectionGrades);
      }
  
      return Response.json({ message: "Courses, grades, offerings, and instructors saved." });
    } catch (error) {
      console.error("updateAll failed:", error);
      return Response.json({ error: "Failed to update course data" }, { status: 500 });
    }
  }
  