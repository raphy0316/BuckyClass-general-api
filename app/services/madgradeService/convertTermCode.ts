export function convertTermCode(termCode: number): string {
    const termDigit = termCode % 10;
    const baseCode = termCode - termDigit;

    let termName: string;
    switch (termDigit) {
        case 2:
            termName = "Fall";
            break;
        case 4:
            termName = "Spring";
            break;
        case 6:
            termName = "Summer";
            break;
        default:
            termName = "Unknown Term";
    }

    const year = 2000 + Math.floor((baseCode - 1000) / 10);

    return `${termName} ${year}`;
}
