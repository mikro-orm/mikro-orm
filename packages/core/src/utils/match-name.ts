export function matchName(name: string, nameToMatch: string | RegExp) {
  return typeof nameToMatch === 'string'
    ? name.toLocaleLowerCase() === nameToMatch.toLocaleLowerCase()
    : nameToMatch.test(name);
}
