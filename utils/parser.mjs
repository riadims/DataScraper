import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Extracts email addresses and phone numbers from the given content.
 *
 * @param {string} content - The content to extract data from.
 * @returns {Object} An object containing arrays of extracted emails and phone numbers.
 * @returns {string[]} returns.emails - An array of unique email addresses found in the content, limited to 4.
 * @returns {string[]} returns.phones - An array of unique phone numbers found in the content, limited to 4.
 */
export default function extractData(content) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let emails = content.match(emailRegex) || [];

  const blacklistedDomains = [
    'myemail.com',
    'email.com',
    'example.com',
    'domain.com',
    'test.com',
    'mail.com',
    'user.com',
    'temp.com',
    'fake.com',
    'placeholder.com'
  ];

  emails = emails.filter((email) => {
    const domain = email.split('@')[1].toLowerCase();
    return (
      !blacklistedDomains.includes(domain) &&
      !/\.(png|jpg|jpeg|gif|bmp|tiff|webp|webpack)$/i.test(email)
    );
  });

  emails = [...new Set(emails)];
  emails = emails.slice(0, 4);

  const phoneRegex = /(?:(?:\+|00)\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  let phones = content.match(phoneRegex) || [];

  phones = phones
    .map((phone) => {
      const phoneNumber = parsePhoneNumberFromString(phone);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.formatInternational();
      }
      return null;
    })
    .filter((phone) => phone !== null);

  const uniquePhones = [];
  const seenPhones = new Set();

  for (const phone of phones) {
    const normalizedPhone = phone.replace(/\D/g, '');

    if (!seenPhones.has(normalizedPhone)) {
      seenPhones.add(normalizedPhone);
      uniquePhones.push(phone);
    }
  }

  uniquePhones.sort((a, b) => (a.startsWith("+") ? -1 : 1));
  const finalPhones = uniquePhones.slice(0, 4);

  return { emails, phones: finalPhones };
}