// @ts-check

/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
    // https://www.i18next.com/overview/configuration-options#logging
    // i18n: {
    //     defaultLocale: 'pl',
    //     locales: ['pl', 'de', 'cz'],
    //     returnObjects: true,
    //     fallbackLng: 'pl',
    // },
    i18n: {
        defaultLocale: 'vi',
        locales: ['vi'],
        returnObjects: true,
        fallbackLng: 'vi',
    },
    /** To avoid issues when deploying to some paas (vercel...) */
    localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',

    reloadOnPrerender: process.env.NODE_ENV === 'development',
};
