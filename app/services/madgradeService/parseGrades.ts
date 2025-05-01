import { Grade, SectionGrade } from "@/app/types/types";
import { MadgradesGradeResponse } from "@/app/types/madgradesTypes";

const calculatePercentage = (count: number, total: number): number => {
  return total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
};

const extractYearFromTermCode = (termCode: number): number => {
  const termDigit = termCode % 10;
  const baseCode = termCode - termDigit;
  return 2000 + Math.floor((baseCode - 1000) / 10);
};

export function parseGrades(
  madgradesData: MadgradesGradeResponse
): { grade: Grade; sectionGrades: SectionGrade[] } {
  const cumulative = madgradesData.cumulative;

  const grade: Grade = {
    course_id: madgradesData.courseUuid,
    total: cumulative.total,
    a_per: calculatePercentage(cumulative.aCount, cumulative.total),
    ab_per: calculatePercentage(cumulative.abCount, cumulative.total),
    b_per: calculatePercentage(cumulative.bCount, cumulative.total),
    bc_per: calculatePercentage(cumulative.bcCount, cumulative.total),
    c_per: calculatePercentage(cumulative.cCount, cumulative.total),
    d_per: calculatePercentage(cumulative.dCount, cumulative.total),
    f_per: calculatePercentage(cumulative.fCount, cumulative.total),
    other_per: calculatePercentage(
      (cumulative.otherCount || 0) +
      (cumulative.sCount || 0) +
      (cumulative.uCount || 0) +
      (cumulative.crCount || 0) +
      (cumulative.nCount || 0) +
      (cumulative.pCount || 0) +
      (cumulative.iCount || 0) +
      (cumulative.nwCount || 0) +
      (cumulative.nrCount || 0),
      cumulative.total
    )
  };

  const currentYear = new Date().getFullYear();
  const validYears = new Set<number>();
  for (let y = currentYear - 4; y <= currentYear; y++) {
    validYears.add(y);
  }

  const sectionGrades: SectionGrade[] = [];

  for (const offering of madgradesData.courseOfferings) {
    const year = extractYearFromTermCode(offering.termCode);
    if (!validYears.has(year)) continue;

    for (const section of offering.sections) {
      sectionGrades.push({
        section_id: section.sectionNumber.toString(),
        total: section.total,
        a_per: calculatePercentage(section.aCount, section.total),
        ab_per: calculatePercentage(section.abCount, section.total),
        b_per: calculatePercentage(section.bCount, section.total),
        bc_per: calculatePercentage(section.bcCount, section.total),
        c_per: calculatePercentage(section.cCount, section.total),
        d_per: calculatePercentage(section.dCount, section.total),
        f_per: calculatePercentage(section.fCount, section.total),
        other_per: calculatePercentage(
          (section.otherCount || 0) +
          (section.sCount || 0) +
          (section.uCount || 0) +
          (section.crCount || 0) +
          (section.nCount || 0) +
          (section.pCount || 0) +
          (section.iCount || 0) +
          (section.nwCount || 0) +
          (section.nrCount || 0),
          section.total
        )
      });
    }
  }

  return { grade, sectionGrades };
}
