export function debounce(func: (...args: any[]) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
