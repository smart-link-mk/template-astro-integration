// this gets replaced by liquidjs with the actual context, during build with every key being replaced with {{context.key}}
// and in development with value defined in config
const json = `{{context | json}}`;

const everyValueIntoStringRecursively = (obj: any) => {
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      obj[key] = everyValueIntoStringRecursively(obj[key]);
    } else {
      obj[key] = obj[key].toString();
    }
  }
  return obj;
};

export const context: import("@SmartLinkTypes").Context = import.meta.env.DEV ? everyValueIntoStringRecursively(JSON.parse(json)) : JSON.parse(json);
