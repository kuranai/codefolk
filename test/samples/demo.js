const palette = Object.freeze({ accent: "#ef820c", secondary: "#80cbc4" });

export async function loadTheme(name = "codefolk") {
  const response = await fetch(`/themes/${name}.json`);
  if (!response.ok) throw new Error(`Theme ${name} was not found`);
  return { ...palette, ...(await response.json()) };
}
