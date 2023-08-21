

# Simpatico: Rules

## Rule of Recapitulation
Be able to build and run your software starting with easily available commodities.

Corallary: Do not lock yourself into one provider or supplier of either code or service.



const processMarkdown = (markdown, defaultHeader = '<!DOCTYPE>\n<head>...</head>') => {
// Define the header pattern to look for
const headerPattern = /<!--(<!DOCTYPE>[\s\S]*?<head>[\s\S]*?<\/head>)-->/;

// Try to find the header in the input markdown
const headerMatch = markdown.match(headerPattern);

// If a header is found, extract it, and remove it from the markdown
if (headerMatch) {
const header = headerMatch[1];
const body = markdown.replace(headerPattern, '').trim();
return [header, body];
} else {
// If no header is found, use the default header
const header = defaultHeader;
const body = markdown.trim();
return [header, body];
}
};

// Test with input containing a header
const inputWithHeader = '<!--<!DOCTYPE>\n<head>...</head>--> # Welcome';
const [header1, body1] = processMarkdown(inputWithHeader);
console.log(`Header: ${header1}\nBody: ${body1}`);

// Test with input without a header
const inputWithoutHeader = '# Welcome';
const [header2, body2] = processMarkdown(inputWithoutHeader);
console.log(`\nHeader: ${header2}\nBody: ${body2}`);
