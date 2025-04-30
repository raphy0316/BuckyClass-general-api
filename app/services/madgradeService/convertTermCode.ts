export function convertTermCode(termCode: number): string {
    const year = Math.floor(termCode / 10);
    const term = termCode % 10;

    let termName: string;
    switch (term) {
        case 2:
            termName = "Spring";
            break;
        case 4:
            termName = "Summer";
            break;
        case 6:
            termName = "Fall";
            break;
        default:
            termName = "Unknown Term";
    }

    return `${termName} ${year}`;
}
