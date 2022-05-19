import { capitalizeFirstLetter } from "./capitalizeFirstLetter";

export const formatErrorMessage = (string) => {
    const errorMessage = capitalizeFirstLetter(string);
    return `${errorMessage}${errorMessage.endsWith('.') ? '' : '.'}`;
}
