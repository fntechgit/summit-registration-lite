export const formatCurrency = (value, { locale = 'en-US', ...options }) => {
    const defaultOptions = {
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    };

    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        ...defaultOptions,
        ...options
    });

    return formatter.format(value);
};
