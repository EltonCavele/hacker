export function assertSafeObjectKey(key: string) {
  if (
    !key ||
    key.startsWith("/") ||
    key.split("/").some((part) => part === "." || part === "..")
  ) {
    throw new Error("Invalid storage object key");
  }
}
