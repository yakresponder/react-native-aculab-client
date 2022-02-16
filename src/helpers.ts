import { Alert } from 'react-native';

/**
 * helper function - delete all white spaces in string
 * @param {string} stringIn string to be processed
 * @returns {string} string without any whitespace
 */
export const deleteSpaces = (stringIn: string): string => {
  let stringOut = stringIn.replace(/\s/g, '');
  return stringOut;
};

/**
 * Helper function for displaying alert message\
 * When called an alert message is displayed.
 * @param {string} title Alert title
 * @param {string} message Alert message
 * @returns {void}
 */
export const showAlert = (title: string, message: string): void => {
  Alert.alert(title, message, [{ text: 'OK', style: 'cancel' }]);
};
