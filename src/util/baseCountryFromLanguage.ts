//TODO: more universal solution

export const baseCountryFromLanguage = (language: string) => {
    switch (language) {
        case 'en':
            return 'VN';
        case 'de':
            return 'DE';
        case 'pl':
            return 'PL';
        default:
            return 'VN';
    }
};
