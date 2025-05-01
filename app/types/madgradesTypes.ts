export interface MadgradesGradeResponse {
    courseUuid: string;
    cumulative: {
        total: number;
        aCount: number;
        abCount: number;
        bCount: number;
        bcCount: number;
        cCount: number;
        dCount: number;
        fCount: number;
        sCount?: number;
        uCount?: number;
        crCount?: number;
        nCount?: number;
        pCount?: number;
        iCount?: number;
        nwCount?: number;
        nrCount?: number;
        otherCount?: number;
    };
    courseOfferings: {
        termCode: number;
        cumulative: {
            total: number;
            aCount: number;
            abCount: number;
            bCount: number;
            bcCount: number;
            cCount: number;
            dCount: number;
            fCount: number;
            sCount?: number;
            uCount?: number;
            crCount?: number;
            nCount?: number;
            pCount?: number;
            iCount?: number;
            nwCount?: number;
            nrCount?: number;
            otherCount?: number;
        };
        sections: {
            sectionNumber: number;
            instructors: {
                id: number;
                name: string;
            }[];
            total: number;
            aCount: number;
            abCount: number;
            bCount: number;
            bcCount: number;
            cCount: number;
            dCount: number;
            fCount: number;
            sCount?: number;
            uCount?: number;
            crCount?: number;
            nCount?: number;
            pCount?: number;
            iCount?: number;
            nwCount?: number;
            nrCount?: number;
            otherCount?: number;
        }[];
    }[];
}
