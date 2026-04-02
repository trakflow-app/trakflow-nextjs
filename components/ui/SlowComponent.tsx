const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function SlowComponent() {
  await delay(3000); // Wait for 3 seconds
  return <div className="p-4 bg-green-100">Data finally loaded!</div>;
}
